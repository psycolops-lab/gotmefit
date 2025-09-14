// src/helpers/getDataFromToken.ts
import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function getDataFromToken(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    let token = "";
    if (authHeader.toLowerCase().startsWith("bearer ")) {
      token = authHeader.slice(7).trim();
    }

    if (!token) {
      token = req.cookies.get("sb-access-token")?.value || req.cookies.get("supabase-auth-token")?.value || "";
    }

    if (!token) {
      console.warn("No token found in request");
      return null;
    }

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data?.user) {
      console.warn("Auth user fetch failed:", error?.message);
      return null;
    }
    const authUser = data.user;

    const { data: profile, error: pErr } = await supabaseAdmin
      .from("users")
      .select("id, email, name, role, gym_id")
      .eq("id", authUser.id)
      .maybeSingle(); // Changed to .maybeSingle() to avoid 406

    if (pErr) {
      console.error("Profile fetch error:", pErr.message);
      return null;
    }

    if (!profile) {
      console.warn("No profile found for user ID:", authUser.id);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      gym_id: profile.gym_id,
    };
  } catch (err) {
    console.error("getDataFromToken error:", err);
    return null;
  }
}