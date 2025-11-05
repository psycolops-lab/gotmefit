// app/api/member/update_profile/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { height_cm, weight_kg, gender, goal, activity_level } = body;

    // Validate minimal requirements
        // ── NEW: Allow height OR weight (not both required) ──
    if (height_cm !== undefined && (typeof height_cm !== 'number' || height_cm < 100 || height_cm > 250)) {
      return NextResponse.json({ error: "Height must be 100–250 cm" }, { status: 400 });
    }
    if (weight_kg !== undefined && (typeof weight_kg !== 'number' || weight_kg < 30 || weight_kg > 200)) {
      return NextResponse.json({ error: "Weight must be 30–200 kg" }, { status: 400 });
    }
    if (height_cm === undefined && weight_kg === undefined) {
      return NextResponse.json({ error: "Send height_cm or weight_kg" }, { status: 400 });
    }

    

    // Get user from auth token
    const authHeader = (req.headers.get("authorization") || "").replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(authHeader);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }
    
    const userId = userData.user.id;
        
    const { data: current } = await supabaseAdmin
      .from("member_profiles")
      .select("height_cm, weight_kg")
      .eq("user_id", userId)
      .single();
          // ── SMART BMI: Use sent values OR existing ──
    const finalHeight = height_cm ?? current?.height_cm;
    const finalWeight = weight_kg ?? current?.weight_kg;

    let bmi: number | null = null;
    if (finalHeight && finalWeight) {
      const h_m = finalHeight / 100;
      bmi = Number((finalWeight / (h_m * h_m)).toFixed(2));
    }

    // Prepare upsert object for member_profiles
        // ── UPSERT: Only update what was sent ──
    const upsertObj: any = {
      user_id: userId,
      height_cm: finalHeight,
      weight_kg: finalWeight,
      bmi,
      updated_at: new Date().toISOString(),
    };

    // Preserve existing gender/goal/activity_level
    if (gender !== undefined) upsertObj.gender = gender;
    if (goal !== undefined) upsertObj.goal = goal;
    if (activity_level !== undefined) upsertObj.activity_level = activity_level;

    // Upsert member_profiles
    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("member_profiles")
      .upsert(upsertObj, { onConflict: "user_id" })
      .select()
      .single();
      
    if (upsertErr) {
      console.error("upsert member_profiles err:", upsertErr);
      return NextResponse.json({ 
        error: "Failed to update profile: " + upsertErr.message 
      }, { status: 500 });
    }

    // Fetch trainer name if assigned_trainer_id exists

    

    // Insert into weight_history
    const { error: histErr } = await supabaseAdmin.from("weight_history").insert({
      member_id: userId,
      weight_kg,
      bmi,
      recorded_at: new Date().toISOString(),
    });

    if (histErr) {
      console.error("weight_history insert err:", histErr);
      return NextResponse.json({ 
        profile: upserted, 
        bmi, 
        warning: "Profile updated but weight history failed to save" 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      profile: upserted, 
      bmi,
      success: true 
    }, { status: 200 });

  } catch (err: any) {
    console.error("update_profile route error:", err);
    return NextResponse.json({ 
      error: err.message ?? "Server error" 
    }, { status: 500 });
  }
}