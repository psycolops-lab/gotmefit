// src/app/api/gyms/list/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function GET(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (cur.role !== "superadmin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { data: gymsRaw, error: gErr } = await supabaseAdmin
      .from("gyms")
      .select("id, name, location, phone, admin_id, created_at");

    if (gErr) {
      console.error("list gyms error:", gErr);
      return NextResponse.json({ error: gErr.message }, { status: 500 });
    }

    const gyms = await Promise.all(
      (gymsRaw || []).map(async (g: any) => {
        let admin = null;
        if (g.admin_id) {
          const { data: a } = await supabaseAdmin.from("users").select("id,email,name").eq("id", g.admin_id).maybeSingle();
          admin = a || null;
        }

        const { count: membersCount } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("gym_id", g.id)
          .eq("role", "member");
        const { count: trainersCount } = await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("gym_id", g.id)
          .eq("role", "trainer");

        return {
          ...g,
          address: g.location,
          admin,
          membersCount: membersCount || 0,
          trainersCount: trainersCount || 0,
        };
      })
    );

    return NextResponse.json({ gyms });
  } catch (err: any) {
    console.error("GET /api/gyms/list error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}