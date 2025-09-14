import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function POST(req: NextRequest) {
  try {
    const cur = await getDataFromToken(req);
    if (!cur) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { userId, height, weight, bmi, goal } = await req.json();

    // allow self or admin of same gym: you can expand checks here
    if (cur.id !== userId) {
      // additional checks (is admin of same gym) should be done here
    }

    const { data, error } = await supabaseAdmin.from("member_profiles").upsert({
      user_id: userId,
      height,
      weight,
      bmi,
      goal
    }, { onConflict: "user_id" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data?.[0] });
  } catch (err:any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
