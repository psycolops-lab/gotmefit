import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: false },
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { member_id, workout_plan_id, workout, completion_percentage } = body;

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    if (user.id !== member_id) {
      return NextResponse.json({ error: 'Forbidden: Can only modify own workout history' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: existingHistory } = await supabase
      .from('workout_history')
      .select('id, workout')
      .eq('member_id', member_id)
      .eq('workout_plan_id', workout_plan_id)
      .eq('recorded_at', today)
      .maybeSingle();

    let historyPayload = workout;
    if (existingHistory && existingHistory.workout) {
      historyPayload = [...existingHistory.workout, ...workout];
    }

    const { error } = await supabase
      .from('workout_history')
      .upsert({
        id: existingHistory?.id || crypto.randomUUID(),
        member_id,
        workout_plan_id,
        workout: historyPayload,
        completion_percentage,
        recorded_at: today,
        updated_at: new Date().toISOString(),
        created_by: user.id,
        assigned_to: 'b@gym.com', // Adjust based on your logic
      });

    if (error) {
      console.error('Supabase Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: 'Workout history updated' }, { status: 200 });
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
