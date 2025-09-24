//src/app/api/trainer/options/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No auth token provided" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: uErr } = await supabaseAdmin.auth.getUser(token);
    if (uErr || !userData?.user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch trainers with names from users table
    const { data: trainers, error: trainerErr } = await supabaseAdmin
      .from("trainers_profile")
      .select("user_id");

    if (trainerErr) throw trainerErr;

    const trainerIds = trainers?.map(t => t.user_id) || [];
    let trainerOptions: any[] = [];

    if (trainerIds.length > 0) {
      const { data: userDetails, error: userErr } = await supabaseAdmin
        .from("users")
        .select("user_id, name")
        .in("user_id", trainerIds);

      if (userErr) throw userErr;

      trainerOptions = trainers.map((trainer: any) => {
        const userDetail = userDetails?.find(u => u.user_id === trainer.user_id);
        return {
          user_id: trainer.user_id,
          name: userDetail?.name ||  "Unknown Trainer",
        };
      });
    }

    return NextResponse.json({ trainers: trainerOptions }, { status: 200 });

  } catch (err: any) {
    console.error("Trainer options route error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}