// app/api/member/update_weight/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { weight_kg } = body;

    if (!weight_kg) {
      return NextResponse.json({ error: "weight_kg required" }, { status: 400 });
    }

    const authHeader = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(authHeader);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    const userId = userData.user.id;

    // Fetch current height from member_profiles (plural)
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("member_profiles")  // Changed from "members_profile"
      .select("height_cm")
      .eq("user_id", userId)
      .single();

    if (pErr || !profile?.height_cm) {
      return NextResponse.json({ error: "Profile not found or height missing" }, { status: 400 });
    }

    const h_m = Number(profile.height_cm) / 100;
    const bmi = h_m > 0 ? Number((Number(weight_kg) / (h_m * h_m)).toFixed(2)) : null;

    // Update member_profiles (plural)
    const { error: updateErr } = await supabaseAdmin
      .from("member_profiles")  // Changed from "members_profile"
      .update({
        weight_kg: Number(weight_kg),
        bmi,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateErr) {
      console.error("update member_profiles err:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Insert into weight_history
    const { error: histErr } = await supabaseAdmin.from("weight_history").insert({
      member_id: userId,
      weight_kg: Number(weight_kg),
      bmi,
      recorded_at: new Date().toISOString(),
    });

    if (histErr) {
      console.error("weight_history insert err:", histErr);
      return NextResponse.json({ warning: histErr.message }, { status: 200 });
    }

    return NextResponse.json({ success: true, bmi }, { status: 200 });
  } catch (err: any) {
    console.error("update_weight route error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}