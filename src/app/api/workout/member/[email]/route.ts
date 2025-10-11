   import { supabaseAdmin } from '@/lib/supabaseAdmin';
   import { supabase } from '@/lib/supabaseClient';
   import { NextResponse } from 'next/server';

   export async function GET(request: Request, { params }: { params: { email: string } }) {
     const { data: { session }, error: sessionError } = await supabase.auth.getSession();

     if (sessionError || !session?.user) {
       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
     }

     const fetchEmail = params.email === 'me' ? session.user.email : params.email;

     const { data, error } = await supabaseAdmin
       .from('workout_plans')
       .select('*')
       .eq('assigned_to', fetchEmail)
       .order('created_at', { ascending: false });

     if (error) {
       return NextResponse.json({ error: error.message }, { status: 500 });
     }

     return NextResponse.json({ workouts: data });
   }