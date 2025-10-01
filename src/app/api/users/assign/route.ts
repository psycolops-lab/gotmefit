import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log("PATCH body:", body);

    const { member_id, trainer_id, nutritionist_id } = body;

    if (!member_id) {
      return NextResponse.json(
        { error: "member_id is required" },
        { status: 400 }
      );
    }

    // Dynamically build the update object to only include provided fields
    const updateData: { assigned_trainer_id?: string | null; assigned_nutritionist_id?: string | null; updated_at: string } = {
      updated_at: new Date().toISOString(),
    };
    if (trainer_id !== undefined) {
      updateData.assigned_trainer_id = trainer_id || null;
    }
    if (nutritionist_id !== undefined) {
      updateData.assigned_nutritionist_id = nutritionist_id || null;
    }

    const { data, error } = await supabaseAdmin
      .from("member_profiles")
      .update(updateData)
      .eq("user_id", member_id)
      .select("*");

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "No member found with that id" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Assignment updated successfully", member: data[0] },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Unexpected server error", details: err.message },
      { status: 500 }
    );
  }
}