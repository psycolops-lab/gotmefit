// app/api/member/update_profile/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { height_cm, weight_kg, gender, goal, activity_level } = body;

    // Validate minimal requirements
    if (typeof height_cm !== 'number' || typeof weight_kg !== 'number') {
      return NextResponse.json({ 
        error: "height_cm and weight_kg must be numbers" 
      }, { status: 400 });
    }

    if (height_cm < 100 || height_cm > 250) {
      return NextResponse.json({ 
        error: "Height must be between 100cm and 250cm" 
      }, { status: 400 });
    }

    if (weight_kg < 30 || weight_kg > 200) {
      return NextResponse.json({ 
        error: "Weight must be between 30kg and 200kg" 
      }, { status: 400 });
    }

    // Compute BMI server-side
    const h_m = height_cm / 100;
    const bmi = h_m > 0 ? Number((weight_kg / (h_m * h_m)).toFixed(2)) : null;

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

    // Prepare upsert object for member_profiles
    const upsertObj = {
      user_id: userId,
      height_cm,
      weight_kg,
      bmi,
      gender: gender || null,
      goal: goal || null,
      activity_level: activity_level || null,
      updated_at: new Date().toISOString(),
    };

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