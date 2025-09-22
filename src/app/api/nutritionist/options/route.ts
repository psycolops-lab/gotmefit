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

    // Fetch nutritionists with names from users table
    const { data: nutritionists, error: nutritionistErr } = await supabaseAdmin
      .from("nutritionists_profile")
      .select("user_id");

    if (nutritionistErr) throw nutritionistErr;

    const nutritionistIds = nutritionists?.map(n => n.user_id) || [];
    let nutritionistOptions: any[] = [];

    if (nutritionistIds.length > 0) {
      const { data: userDetails, error: userErr } = await supabaseAdmin
        .from("users")
        .select("user_id, name")
        .in("user_id", nutritionistIds);

      if (userErr) throw userErr;

      nutritionistOptions = nutritionists.map((nutritionist: any) => {
        const userDetail = userDetails?.find(u => u.user_id === nutritionist.user_id);
        return {
          user_id: nutritionist.user_id,
          name: userDetail?.name || "Unknown Nutritionist",
        };
      });
    }

    return NextResponse.json({ nutritionists: nutritionistOptions }, { status: 200 });

  } catch (err: any) {
    console.error("Nutritionist options route error:", err);
    return NextResponse.json({ error: err.message ?? "Server error" }, { status: 500 });
  }
}