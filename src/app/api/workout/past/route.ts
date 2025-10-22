import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const assigned_to = url.searchParams.get('assigned_to');

    if (!assigned_to) {
      return NextResponse.json(
        { error: 'Missing assigned_to query parameter' },
        { status: 400 }
      );
    }

    // Case-insensitive search to match email
    const { data, error } = await supabase
      .from('workout_plans')
      .select('*')
      .ilike('assigned_to', assigned_to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log('assigned_to:', assigned_to);
    console.log('workouts:', data);

    return NextResponse.json({ workouts: data || [] });
  } catch (err: any) {
    console.error('Error fetching past workouts:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to fetch past workouts' },
      { status: 500 }
    );
  }
}
