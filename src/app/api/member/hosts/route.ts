// app/api/member/hosts/route.ts
import { createClient } from '@/lib/supabaseServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    
    let session;
    
    if (authHeader?.startsWith('Bearer ')) {
      // Client-side request with Bearer token
      const token = authHeader.substring(7);
      const { supabaseAdmin } = await import('@/lib/supabaseAdmin');
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      
      if (error || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      session = { user };
    } else {
      // SSR request with cookies
      const supabase = await createClient();
      const { data: { session: cookieSession }, error } = await supabase.auth.getSession();
      
      if (error || !cookieSession?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      session = cookieSession;
    }

    const user = session.user;

    // Get member profile (use service-role admin client)
    const { data: member, error: memErr } = await (await import('@/lib/supabaseAdmin')).supabaseAdmin
      .from('member_profiles')
      .select('assigned_trainer_id, assigned_nutritionist_id')
      .eq('user_id', user.id)
      .single();

    if (memErr || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const hosts: { label: string; email: string }[] = [];
    
    const ADMIN_EMAIL = process.env.DEFAULT_GYM_EMAIL;
if (ADMIN_EMAIL) {
  hosts.push({ label: "Admin", email: ADMIN_EMAIL });
}

    // Trainer
    if (member.assigned_trainer_id) {
      const trainerRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/member/trainer?trainer_id=${member.assigned_trainer_id}`
      );
      const { trainer_name } = await trainerRes.json();
      if (trainer_name) {
        const { data: tUser } = await (await import('@/lib/supabaseAdmin')).supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', member.assigned_trainer_id)
          .single();
        if (tUser?.email) {
          hosts.push({ label: `Trainer – ${trainer_name}`, email: tUser.email });
        }
      }
    }

    // Nutritionist
    if (member.assigned_nutritionist_id) {
      const nutRes = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/member/nutritionist?nutritionist_id=${member.assigned_nutritionist_id}`
      );
      const { nutritionist_name } = await nutRes.json();
      if (nutritionist_name) {
        const { data: nUser } = await (await import('@/lib/supabaseAdmin')).supabaseAdmin
          .from('users')
          .select('email')
          .eq('id', member.assigned_nutritionist_id)
          .single();
        if (nUser?.email) {
          hosts.push({ label: `Nutritionist – ${nutritionist_name}`, email: nUser.email });
        }
      }
    }

    return NextResponse.json({
      hosts,
      memberEmail: user.email!,
      memberName: user.user_metadata?.full_name || user.email!.split('@')[0],
    });
  } catch (err: any) {
    console.error('Hosts API error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
