import { createClient } from '@supabase/supabase-js';
import { NextApiRequest, NextApiResponse } from 'next';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: false },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { member_id, workout_plan_id, workout, completion_percentage } = req.body;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }

  if (user.id !== member_id) {
    return res.status(403).json({ error: 'Forbidden: Can only modify own workout history' });
  }

  try {
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
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({ message: 'Workout history updated' });
  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}