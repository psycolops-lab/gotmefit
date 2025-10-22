import { createClient } from '@/lib/supabaseServer';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = await createClient();

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: tokenError } = await supabase.auth.getUser(token);

  if (tokenError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Ensure trainer role
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'trainer') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userEmail = user.email;

  const { assigned_to, plan } = await request.json();
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
    .select(); // fetch inserted rows

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ workout: data[0] });
}
