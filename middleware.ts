// middleware.ts
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Get the current session from cookies
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = req.nextUrl.pathname;

  // If no session → force login
  if (!session) {
    if (pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    return res;
  }

  // Get user role from your DB
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = profile?.role;

  // Role-based dashboard redirects
  if (pathname === "/" || pathname === "/login") {
    if (role === "superadmin") return NextResponse.redirect(new URL("/superadmin/dashboard", req.url));
    if (role === "admin") return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    if (role === "trainer") return NextResponse.redirect(new URL("/trainer/dashboard", req.url));
    if (role === "nutritionist") return NextResponse.redirect(new URL("/nutritionist/dashboard", req.url));
    if (role === "member") return NextResponse.redirect(new URL("/member/dashboard", req.url));
  }

  // Example: block a member from accessing admin dashboard
  if (pathname.startsWith("/dashboard/admin") && role !== "admin" && role !== "superadmin") {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/",              // root
    "/login",         // login page
    "/:path*/dashboard", // all dashboards
  ],
};
