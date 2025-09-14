// src/app/api/gyms/add-admin/route.ts
// (This seems unused in the provided code, but keeping it fixed for consistency)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getDataFromToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: curProfile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (!curProfile || curProfile.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { gymId, email, password, name } = await req.json();
    if (!gymId || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // create auth user
    const { data: authCreated, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

    // insert into users
    await supabaseAdmin.from("users").insert([{
      id: authCreated.user.id,
      email,
      name,
      role: "admin",
    }]);

    // link to gym
    await supabaseAdmin.from("gym_users").insert([{
      gym_id: gymId,
      user_id: authCreated.user.id,
      role: "admin",
    }]);

    // update gym record
    await supabaseAdmin.from("gyms").update({ admin_id: authCreated.user.id }).eq("id", gymId);

    return NextResponse.json({ message: "Admin added", adminId: authCreated.user.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}