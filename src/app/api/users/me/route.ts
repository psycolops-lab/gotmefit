// src/app/api/users/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getDataFromToken } from "@/helpers/getDataFromToken";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getDataFromToken(req);
    if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile, error } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role")
      .eq("id", authUser.id)
      .maybeSingle(); // Changed to .maybeSingle() to avoid 406

    if (error) {
      console.error("Profile fetch error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "No profile found for this user" }, { status: 404 });
    }

    return NextResponse.json({ user: profile });
  } catch (err: any) {
    console.error("GET /api/users/me error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}