// src/app/api/requests/handle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requestId, action, setPassword } = await req.json(); // action: 'approve'|'reject'
    if (!requestId || !["approve","reject"].includes(action)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const { data: reqDoc, error: rErr } = await supabaseAdmin.from("requests").select("*").eq("id", requestId).single();
    if (rErr || !reqDoc) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    // verify admin privileges for that gym
    const { data: curProfile } = await supabaseAdmin.from("users").select("role").eq("id", cur.id).single();
    if (!curProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // if approve -> create auth user + insert into users + gym_users
    if (action === "approve") {
      if (!setPassword) return NextResponse.json({ error: "Password required to approve" }, { status: 400 });

      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email: reqDoc.email,
        password: setPassword,
        email_confirm: true,
      });
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });

      await supabaseAdmin.from("users").insert([{ id: authUser.user.id, email: reqDoc.email, name: reqDoc.name, role: reqDoc.role }]);
      if (reqDoc.gym_id) {
        await supabaseAdmin.from("gym_users").insert([{ gym_id: reqDoc.gym_id, user_id: authUser.user.id, role: reqDoc.role }]);
      }

      await supabaseAdmin.from("requests").update({ status: "approved" }).eq("id", requestId);
      return NextResponse.json({ message: "Request approved" });
    } else {
      await supabaseAdmin.from("requests").update({ status: "rejected" }).eq("id", requestId);
      return NextResponse.json({ message: "Request rejected" });
    }
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
