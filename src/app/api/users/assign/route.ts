import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // ✅ use admin client

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

    const { data, error } = await supabaseAdmin
      .from("member_profiles")
      .update({
        assigned_trainer_id: trainer_id || null,
        assigned_nutritionist_id: nutritionist_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", member_id) // ✅ use `id` column
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
      { message: "Assignments updated successfully", member: data[0] },
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
