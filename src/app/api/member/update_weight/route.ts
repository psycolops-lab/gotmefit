// app/api/member/update_weight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;
    const { weight_id, weight_kg, updated_at } = await req.json();

    if (!weight_id || !weight_kg || !updated_at) {
      return NextResponse.json({ error: "weight_id, weight_kg, and updated_at required" }, { status: 400 });
    }

    const weightNum = parseFloat(weight_kg);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      return NextResponse.json({ error: "Invalid weight value (30-200 kg)" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("member_profiles")
      .select("height_cm")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let bmi: number | null = null;
    if (profile.height_cm && profile.height_cm > 0) {
      const h_m = profile.height_cm / 100;
      bmi = Number((weightNum / (h_m * h_m)).toFixed(2));
    }

    const { error: updateError } = await supabaseAdmin
      .from("member_profiles")
      .update({
        weight_kg: weightNum,
        bmi,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    const { error: historyError } = await supabaseAdmin
      .from("weight_history")
      .update({
        weight_kg: weightNum,
        bmi,
        updated_at,
      })
      .eq("id", weight_id)
      .eq("member_id", userId);

    if (historyError) {
      console.error("History update error:", historyError);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to update weight history",
        warning: "Profile updated but history failed" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      weight_kg: weightNum,
      bmi
    }, { status: 200 });
  } catch (err: any) {
    console.error("Member update weight error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const { data: userData, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !userData.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = userData.user.id;

    const { weight_kg } = await req.json();

    if (!weight_kg) {
      return NextResponse.json({ error: "weight_kg required" }, { status: 400 });
    }

    const weightNum = parseFloat(weight_kg);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      return NextResponse.json({ error: "Invalid weight value (30-200 kg)" }, { status: 400 });
    }

    // Fetch member's height for BMI calculation
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("member_profiles")
      .select("height_cm")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Calculate BMI if height available
    let bmi: number | null = null;
    if (profile.height_cm && profile.height_cm > 0) {
      const h_m = profile.height_cm / 100;
      bmi = Number((weightNum / (h_m * h_m)).toFixed(2));
    }

    // Update member profile
    const { error: updateError } = await supabaseAdmin
      .from("member_profiles")
      .update({
        weight_kg: weightNum,
        bmi,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Profile update error:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    // Insert into weight history
    const { error: historyError } = await supabaseAdmin
      .from("weight_history")
      .insert({
        member_id: userId,
        weight_kg: weightNum,
        bmi,
        recorded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error("History insert error:", historyError);
      return NextResponse.json({ 
        success: false, 
        error: "Failed to insert weight history",
        warning: "Profile updated but history failed" 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      weight_kg: weightNum,
      bmi
    }, { status: 200 });

  } catch (err: any) {
    console.error("Member update weight error:", err);
    return NextResponse.json({ 
      success: false,
      error: err.message || "Server error" 
    }, { status: 500 });
  }
}