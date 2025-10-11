import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const memberId = req.nextUrl.searchParams.get('member_id');
    const range = req.nextUrl.searchParams.get('range') || 'all';

    if (!memberId) {
      return NextResponse.json({ error: 'member_id is required' }, { status: 400 });
    }

    // Get Authorization header from request
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }
    const accessToken = authHeader.split(' ')[1];

    // Create Supabase client with user token (for RLS)
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      }
    );

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    console.log('Authenticated User:', user.id, user.email);

    // Fetch workout history
    const { data, error } = await supabase
      .from('workout_history')
      .select('*')
      .eq('member_id', memberId)
      .order('recorded_at', { ascending: false });

    if (error) {
      console.error('Supabase fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Filter by range if provided
    let filteredData = data;
    if (range !== 'all') {
      let num = 0;
      let unit = '';
      const match = range.match(/^last_(\d+)_(\w+)$/);
      if (match) {
        num = parseInt(match[1]);
        unit = match[2];
      }
      if (num > 0 && unit) {
        const pastDate = new Date();
        if (unit === 'days') pastDate.setDate(pastDate.getDate() - num);
        else if (unit === 'weeks') pastDate.setDate(pastDate.getDate() - num * 7);
        else if (unit === 'months') pastDate.setMonth(pastDate.getMonth() - num);

        filteredData = data.filter(item => new Date(item.recorded_at) >= pastDate);
      }
    }

    console.log('Filtered Data:', filteredData);
    return NextResponse.json({ history: filteredData });
  } catch (err: any) {
    console.error('Workout history API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
