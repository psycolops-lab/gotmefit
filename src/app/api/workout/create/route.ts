import { createClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  // Get Authorization header
  const authHeader = request.headers.get('Authorization');
  console.log('API /workout/create - Auth Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: { message: 'Missing or invalid Authorization header' },
      },
      { status: 401 }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  console.log('API /workout/create - Token:', token.slice(0, 10) + '...');

  // Validate token
  const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);
  console.log('API /workout/create - Token User:', user);
  console.log('API /workout/create - Token Error:', tokenError);

  if (tokenError || !user) {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: {
          tokenError: tokenError?.message || 'No token error',
          userExists: !!user,
        },
      },
      { status: 401 }
    );
  }

  // Fetch user role from users table
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  console.log('API /workout/create - User Profile:', userProfile);
  console.log('API /workout/create - Profile Error:', profileError);

  if (profileError || !userProfile || userProfile.role !== 'trainer') {
    return NextResponse.json(
      {
        error: 'Unauthorized',
        details: {
          profileError: profileError?.message || 'No profile error',
          role: userProfile?.role || 'none',
          userEmail: user.email,
        },
      },
      { status: 401 }
    );
  }

  const userEmail = user.email;
  const { assigned_to, plan } = await request.json();
  console.log('API /workout/create - Payload:', { assigned_to, plan });

  if (!assigned_to || !plan) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Validate assigned_to is a member
  const { data: member, error: memberError } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('email', assigned_to)
    .eq('role', 'member')
    .single();

  console.log('API /workout/create - Member:', member);
  console.log('API /workout/create - Member Error:', memberError);

  if (memberError || !member) {
    return NextResponse.json({ error: 'Invalid member email' }, { status: 400 });
  }

  // Insert workout using admin client
  const { data, error } = await supabaseAdmin
    .from('workout_plans')
    .insert({
      created_by: userEmail,
      assigned_to: member.email,
      plan,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  console.log('API /workout/create - Inserted Workout:', data);
  console.log('API /workout/create - Insert Error:', error);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workout: data });
}