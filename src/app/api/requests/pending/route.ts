// src/app/api/requests/pending/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function GET(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // find admin's gyms (where admin is admin in gym_users)
    const { data: adminRecord } = await supabaseAdmin.from("users").select("role").eq("id", cur.id).single();
    if (!adminRecord) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (adminRecord.role === "superadmin") {
      const { data, error } = await supabaseAdmin.from("requests").select("*").eq("status","pending").order("created_at",{ascending:false});
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ requests: data });
    }

    if (adminRecord.role === "admin") {
      // get gyms where this user is admin
      const { data: gyms } = await supabaseAdmin.from("gym_users").select("gym_id").eq("user_id", cur.id).eq("role","admin");
      const gymIds = (gyms || []).map((g:any) => g.gym_id);
      const { data, error } = await supabaseAdmin.from("requests").select("*").in("gym_id", gymIds).eq("status","pending").order("created_at",{ascending:false});
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ requests: data });
    }

    return NextResponse.json({ requests: [] });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
