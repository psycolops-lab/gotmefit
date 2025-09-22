import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_user_id, weight_kg } = body;

    // Validate input
    if (!member_user_id || typeof weight_kg !== 'number') {
      return NextResponse.json({ 
        error: "member_user_id and valid weight_kg required" 
      }, { status: 400 });
    }

    if (weight_kg < 30 || weight_kg > 200) {
      return NextResponse.json({ 
        error: "Weight must be between 30kg and 200kg" 
      }, { status: 400 });
    }

    // Get trainer from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const trainerId = userData.user.id;

    // Verify trainer is assigned to this member
    const { data: assignment, error: assignErr } = await supabaseAdmin
      .from("member_profiles")
      .select("assigned_trainer_id")
      .eq("user_id", member_user_id)
      .single();

    if (assignErr || !assignment || assignment.assigned_trainer_id !== trainerId) {
      return NextResponse.json({ 
        error: "Not authorized to update this member's weight" 
      }, { status: 403 });
    }

    // Fetch member's height for BMI calculation
    const { data: profile, error: pErr } = await supabaseAdmin
      .from("member_profiles")
      .select("height_cm")
      .eq("user_id", member_user_id)
      .single();

    if (pErr || !profile?.height_cm) {
      return NextResponse.json({ 
        error: "Member profile not found or height missing" 
      }, { status: 400 });
    }

    const h_m = Number(profile.height_cm) / 100;
    const bmi = h_m > 0 ? Number((weight_kg / (h_m * h_m)).toFixed(2)) : null;

    // Update member_profiles
    const { error: updateErr } = await supabaseAdmin
      .from("member_profiles")
      .update({
        weight_kg,
        bmi,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", member_user_id);

    if (updateErr) {
      console.error("Update member_profiles error:", updateErr);
      return NextResponse.json({ 
        error: "Failed to update profile: " + updateErr.message 
      }, { status: 500 });
    }

    // Insert into weight_history
    const { error: histErr } = await supabaseAdmin.from("weight_history").insert({
      member_id: member_user_id,
      weight_kg,
      bmi,
      recorded_at: new Date().toISOString(),
      updated_by: trainerId, // Track who updated
    });

    if (histErr) {
      console.error("Weight history insert error:", histErr);
      // Don't fail the whole request, but log warning
      return NextResponse.json({ 
        success: true, 
        bmi, 
        warning: "Profile updated, but history insert failed" 
      }, { status: 200 });
    }

    return NextResponse.json({ 
      success: true, 
      bmi,
      weight_kg 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trainer update-weight route error:", err);
    return NextResponse.json({ 
      error: err.message ?? "Server error" 
    }, { status: 500 });
  }
}