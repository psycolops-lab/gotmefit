// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient"; // Import Supabase client

export async function POST(request: NextRequest) {
  try {
    // Sign out the user using Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase signOut error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Clear Supabase auth cookies
    const response = NextResponse.json({
      message: "LogOut Successfully!",
      success: true,
    });

    // Clear Supabase access and refresh tokens
    response.cookies.set("sb-access-token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    response.cookies.set("sb-refresh-token", "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });

    // Redirect to root path (/)
    return NextResponse.redirect(new URL("/", request.url));
  } catch (error: any) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}