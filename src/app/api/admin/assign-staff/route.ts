import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { member_user_id, assigned_trainer_id, assigned_nutritionist_id } = body;

    // Validate input
    if (!member_user_id) {
      return NextResponse.json({ error: "member_user_id required" }, { status: 400 });
    }

    // Get admin from JWT
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Verify member exists
    const { data: member, error: memberErr } = await supabaseAdmin
      .from("member_profiles")
      .select("user_id")
      .eq("user_id", member_user_id)
      .single();

    if (memberErr || !member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Update member profile with staff assignments
    const updateData = {
      updated_at: new Date().toISOString(),
      ...(assigned_trainer_id && { assigned_trainer_id }),
      ...(assigned_nutritionist_id && { assigned_nutritionist_id }),
    };

    const { error: updateErr } = await supabaseAdmin
      .from("member_profiles")
      .update(updateData)
      .eq("user_id", member_user_id);

    if (updateErr) {
      console.error("Update member_profiles error:", updateErr);
      return NextResponse.json({ 
        error: "Failed to update assignments: " + updateErr.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: "Staff assigned successfully",
      assigned_trainer_id,
      assigned_nutritionist_id 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Admin assign-staff route error:", err);
    return NextResponse.json({ 
      error: err.message ?? "Server error" 
    }, { status: 500 });
  }
}