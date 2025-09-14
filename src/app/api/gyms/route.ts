// src/app/api/gyms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (cur.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, address, phone, adminEmail, adminPassword, adminName } = body;

    if (!name) return NextResponse.json({ error: "Missing gym name" }, { status: 400 });

    const { data: foundGym } = await supabaseAdmin.from("gyms").select("id").ilike("name", name).limit(1);
    if (foundGym && foundGym.length > 0) return NextResponse.json({ error: "Gym with same name exists" }, { status: 409 });

    const { data: gym, error: gymErr } = await supabaseAdmin
      .from("gyms")
      .insert([{ name, location: address || null, phone: phone || null }])
      .select()
      .single();

    if (gymErr) {
      console.error("create gym error:", gymErr);
      return NextResponse.json({ error: gymErr.message }, { status: 500 });
    }

    if (adminEmail && adminPassword) {
      const { data: authUserData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { name: adminName || null },
      });

      if (createErr) {
        console.error("create auth user error:", createErr);
        return NextResponse.json({ error: createErr.message }, { status: 500 });
      }

      const newUserId = authUserData.user.id;

      const { error: usrErr } = await supabaseAdmin
        .from("users")
        .insert([{ id: newUserId, email: adminEmail, name: adminName || null, role: "admin", gym_id: gym.id }]);
      if (usrErr) {
        console.error("insert app user error:", usrErr);
        return NextResponse.json({ error: usrErr.message }, { status: 500 });
      }

      await supabaseAdmin.from("gyms").update({ admin_id: newUserId }).eq("id", gym.id);
    }

    return NextResponse.json({ message: "Gym created", gym });
  } catch (err: any) {
    console.error("POST /api/gyms error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}