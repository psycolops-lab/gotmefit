// app/api/trainer/update-weight/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    // Verify trainer authentication
    const profile = await getDataFromToken(req);
    if (!profile || profile.role !== "trainer") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { member_user_id, weight_kg } = await req.json();
    if (!member_user_id || !weight_kg) {
      return NextResponse.json({ error: "member_user_id and weight_kg are required" }, { status: 400 });
    }

    const weightNum = parseFloat(weight_kg);
    if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
      return NextResponse.json({ error: "Invalid weight value (30-200 kg)" }, { status: 400 });
    }

    // Verify member is assigned to this trainer
    const { data: memberProfile, error: profileError } = await supabaseAdmin
      .from("member_profiles")
      .select("height_cm, weight_kg, bmi, assigned_trainer_id")
      .eq("user_id", member_user_id)
      .single();

    if (profileError || !memberProfile) {
      console.error("Profile fetch error:", profileError?.message || "No profile found");
      return NextResponse.json({ error: "Member profile not found" }, { status: 404 });
    }

    if (memberProfile.assigned_trainer_id !== profile.id) {
      return NextResponse.json({ error: "Member not assigned to you" }, { status: 403 });
    }

    // Calculate BMI if height is available
    let bmi: number | null = null;
    if (memberProfile.height_cm && memberProfile.height_cm > 0) {
      const h_m = memberProfile.height_cm / 100;
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
      .eq("user_id", member_user_id);

    if (updateError) {
      console.error("Profile update error:", updateError.message);
      return NextResponse.json({ error: "Failed to update member profile", details: updateError.message }, { status: 500 });
    }

    // Insert into weight history
    const { error: historyError } = await supabaseAdmin
      .from("weight_history")
      .insert({
        member_id: member_user_id,
        weight_kg: weightNum,
        bmi,
        recorded_at: new Date().toISOString(),
        
      });

    if (historyError) {
      console.error("History insert error:", historyError.message);
      // Rollback profile update to maintain consistency
      await supabaseAdmin
        .from("member_profiles")
        .update({ weight_kg: memberProfile.weight_kg, bmi: memberProfile.bmi })
        .eq("user_id", member_user_id);
      return NextResponse.json({
        success: false,
        error: "Failed to insert weight history",
        details: historyError.message,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      weight_kg: weightNum,
      bmi,
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trainer update weight error:", err.message, err.stack);
    return NextResponse.json({
      success: false,
      error: err.message || "Server error",
      details: err.details || "No additional details",
    }, { status: 500 });
  }
}