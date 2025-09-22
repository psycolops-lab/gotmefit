// app/api/member/trainer/route.ts (New file - add this server-side route)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const trainerId = req.nextUrl.searchParams.get("trainer_id");

    if (!trainerId) {
      return NextResponse.json({ error: "trainer_id is required" }, { status: 400 });
    }

    // Fetch trainer full_name using admin client (bypasses RLS)
    const { data: trainerData, error: trainerErr } = await supabaseAdmin
      .from("trainers_profile")
      .select("full_name")
      .eq("user_id", trainerId)
      .single();

    if (trainerErr) {
      console.error("Trainer fetch error:", trainerErr);
      return NextResponse.json({ trainer_name: null }, { status: 200 });
    }

    return NextResponse.json({ 
      trainer_name: trainerData?.full_name || null 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trainer API error:", err);
    return NextResponse.json({ trainer_name: null }, { status: 200 });
  }
}