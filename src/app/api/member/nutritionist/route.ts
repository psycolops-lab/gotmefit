// app/api/member/trainer/route.ts (New file - add this server-side route)
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  try {
    const nutritionistId = req.nextUrl.searchParams.get("nutritionist_id");

    if (!nutritionistId) {
      return NextResponse.json({ error: "trainer_id is required" }, { status: 400 });
    }

    // Fetch trainer full_name using admin client (bypasses RLS)
    const { data: nutritionistData, error: nutritionistErr } = await supabaseAdmin
      .from("nutritionists_profile")
      .select("full_name")
      .eq("user_id", nutritionistId)
      .single();

    if (nutritionistErr) {
      console.error("Trainer fetch error:", nutritionistErr);
      return NextResponse.json({ nutritionist_name: null }, { status: 200 });
    }

    return NextResponse.json({ 
      trainer_name: nutritionistData?.full_name || null 
    }, { status: 200 });

  } catch (err: any) {
    console.error("Trainer API error:", err);
    return NextResponse.json({ nutritionist_name: null }, { status: 200 });
  }
}