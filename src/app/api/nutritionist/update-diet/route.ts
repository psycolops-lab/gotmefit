// app/api/nutritionist/update-diet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const profile = await getDataFromToken(req);
    if (!profile || profile.role !== "nutritionist") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { member_user_id, diet_entry, calories, protein, carbs, fats } = await req.json();

    if (!member_user_id || !diet_entry || !calories) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify assignment
    const { data: memberProfile } = await supabaseAdmin
      .from("member_profiles")
      .select("assigned_nutritionist_id")
      .eq("user_id", member_user_id)
      .single();

    if (!memberProfile || memberProfile.assigned_nutritionist_id !== profile.id) {
      return NextResponse.json({ error: "Member not assigned to you" }, { status: 403 });
    }

    // Insert into diet_history
    const { error } = await supabaseAdmin
      .from("diet_history")
      .insert({
        member_id: member_user_id,
        diet_entry,
        calories: Number(calories),
        protein: Number(protein || 0),
        carbs: Number(carbs || 0),
        fats: Number(fats || 0),
        recorded_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Diet insert error:", error);
      return NextResponse.json({ error: "Failed to update diet" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: any) {
    console.error("Update diet error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}