import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: tokenError } = await supabaseAdmin.auth.getUser(token);

    if (tokenError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { workoutPlanId, workout } = body ?? {};

    if (!workoutPlanId || !workout) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch user email for assigned_to field
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Compute completion_percentage
    const { total, trues } = countBooleanLeaves(workout);
    const completion_percentage = total > 0 ? Math.round((trues / total) * 100) : 0;

    // Get today's date in UTC (YYYY-MM-DD)
    const today = new Date().toISOString().split('T')[0];

    // Log input for debugging
    console.log('Processing workout update:', {
      member_id: user.id,
      workout_plan_id: workoutPlanId,
      today,
      workout_length: workout.length,
      completion_percentage
    });

    // Upsert workout_history entry
    const { data, error } = await supabaseAdmin
      .from('workout_history')
      .upsert({
        member_id: user.id,
        workout_plan_id: workoutPlanId,
        workout,
        completion_percentage,
        recorded_at: `${today}T00:00:00.000Z`,
        updated_at: new Date().toISOString(),
        created_by: user.id,
        assigned_to: userData.email
      }, {
        onConflict: 'member_id,workout_plan_id,recorded_at'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Upsert error:', error);
      return NextResponse.json({ error: `Failed to save workout history: ${error.message}` }, { status: 500 });
    }

    console.log('Upsert result:', { workout_history_id: data.id });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Workout tracking error:', err);
    return NextResponse.json({ error: err.message ?? 'Server error' }, { status: 500 });
  }
}