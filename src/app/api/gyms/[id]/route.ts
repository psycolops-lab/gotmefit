// src/app/api/gyms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur || cur.role !== "superadmin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await supabaseAdmin.from("users").delete().eq("gym_id", params.id);

    const { error } = await supabaseAdmin.from("gyms").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: "Gym deleted" });
  } catch (err: any) {
    console.error("DELETE /api/gyms/[id] error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}