// src/app/api/users/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (cur.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { name, email, password, role, height_cm, weight_kg, bmi, dob, plan } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["member", "trainer", "nutritionist"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authUserData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: name || null },
    });

    if (authError) {
      console.error("Create auth user error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const newUserId = authUserData.user.id;

    // Insert user in users table
    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: newUserId,
        email,
        name: name || null,
        role,
        gym_id: cur.gym_id,
        created_at: new Date().toISOString(),
      });

    if (userError) {
      console.error("Insert user error:", userError);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    // Insert member profile if role is member
   if (role === "member") {
  const { error: profileError } = await supabaseAdmin
    .from("member_profiles")
    .insert({
      user_id: newUserId,
      height_cm: height_cm ? parseFloat(height_cm) : null,
      weight_kg: weight_kg ? parseFloat(weight_kg) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      plan: plan || null,
      dob: dob || null,  // ✅ this now gives 18, 19, 20 etc
    });


  if (profileError) {
    console.error("Insert member profile error:", profileError);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }
}


    return NextResponse.json({ message: `${role} created successfully` });
  } catch (err: any) {
    console.error("POST /api/users/create error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}



