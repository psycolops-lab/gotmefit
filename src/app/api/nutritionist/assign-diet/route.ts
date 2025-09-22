import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      member_user_id, 
      diet_details, 
      start_date, 
      end_date 
    } = body;

    // Validate input
    if (!member_user_id || !diet_details || typeof diet_details !== 'string' || diet_details.trim().length < 10) {
      return NextResponse.json({ 
        error: "member_user_id and detailed diet_details (min 10 chars) required" 
      }, { status: 400 });
    }

    if (!start_date || !end_date) {
      return NextResponse.json({ 
        error: "start_date and end_date required" 
      }, { status: 400 });
    }

    // Get nutritionist from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const nutritionistId = userData.user.id;

    // Verify nutritionist is assigned to this member
    const { data: assignment, error: assignErr } = await supabaseAdmin
      .from("member_profiles")
      .select("assigned_nutritionist_id")
      .eq("user_id", member_user_id)
      .single();

    if (assignErr || !assignment || assignment.assigned_nutritionist_id !== nutritionistId) {
      return NextResponse.json({ 
        error: "Not authorized to assign diet to this member" 
      }, { status: 403 });
    }

    // Insert into diet_plans
    const dietData = {
      member_id: member_user_id,
      nutritionist_id: nutritionistId,
      diet_details: diet_details.trim(),
      start_date: new Date(start_date).toISOString(),
      end_date: new Date(end_date).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from("diet_plans")
      .insert(dietData)
      .select()
      .single();

    if (insertErr) {
      console.error("Diet insert error:", insertErr);
      return NextResponse.json({ 
        error: "Failed to assign diet: " + insertErr.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      diet_id: inserted.id,
      message: "Diet plan assigned successfully" 
    }, { status: 201 });

  } catch (err: any) {
    console.error("Nutritionist assign-diet route error:", err);
    return NextResponse.json({ 
      error: err.message ?? "Server error" 
    }, { status: 500 });
  }
}