// workout/track/route.ts (POST)
import { createClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

function countBooleanLeaves(obj: any) {
  let total = 0;
  let trues = 0;

  function walk(v: any) {
    if (typeof v === 'boolean') {
      total++;
      if (v) trues++;
    } else if (Array.isArray(v)) {
      for (const item of v) walk(item);
    } else if (v && typeof v === 'object') {
      for (const k of Object.keys(v)) walk(v[k]);
    }
  }

  walk(obj);
  return { total, trues };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: getUserData, error: tokenError } = await supabase.auth.getUser(token);

  if (tokenError || !getUserData?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const user = getUserData.user;

  const body = await request.json();
  const { workoutPlanId, workout } = body ?? {};

  if (!workoutPlanId || !workout) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // fetch assigned_to email (and sanity-check user exists in users table)
  const { data: userData, error: userError } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('id', user.id)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Compute completion_percentage from workout JSON
    const { total, trues } = countBooleanLeaves(workout);
    const completion_percentage = total > 0 ? Math.round((trues / total) * 100) : 0;

    // Build today's UTC range (you can adjust if you want local-timeday)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD (UTC)
    const startIso = `${today}T00:00:00.000Z`;
    const endIso = `${today}T23:59:59.999Z`;

    // Check for existing record for this member+plan for today
    const { data: existingRecord, error: fetchError } = await supabaseAdmin
      .from('workout_history')
      .select('*')
      .eq('member_id', user.id)
      .eq('workout_plan_id', workoutPlanId)
      .gte('recorded_at', startIso)
      .lt('recorded_at', endIso)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "No rows found" for some clients, but keep defensive checks
      throw new Error(`Failed to check existing record: ${fetchError.message}`);
    }

    if (existingRecord) {
      // Update existing record (first record of the day already created)
      const { error: updateError } = await supabaseAdmin
        .from('workout_history')
        .update({
          workout,
          completion_percentage,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingRecord.id);

      if (updateError) {
        throw new Error(`Failed to update workout history: ${updateError.message}`);
      }
    } else {
      // Insert new record (first tracking for this plan today)
      const { error: insertError } = await supabaseAdmin
        .from('workout_history')
        .insert({
          member_id: user.id,
          workout_plan_id: workoutPlanId,
          workout,
          completion_percentage,
          created_by: user.id,
          assigned_to: userData.email,
          recorded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (insertError) {
        throw new Error(`Failed to create workout history: ${insertError.message}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Workout tracking error:', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}
