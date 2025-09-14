"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ModeToggle } from "@/components/mode-toggle";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Navbar() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Try to read session info once on mount but DO NOT redirect anywhere.
  // This only updates UI (show Login vs Logout in dropdown),
  // it will NOT change where Dashboard goes until user clicks Dashboard.
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
        if (!mounted) return;
        if (!user) {
          setRole(null);
          setUserEmail(null);
        } else {
        // fetch profile row
        const { data: profile } = await supabase
          .from("users")
          .select("role, email")
          .eq("id", user.id)
          .single();
        setRole(profile?.role ?? null);
        setUserEmail(profile?.email ?? user.email);
      }
      } catch (err) {
        setRole(null);
        setUserEmail(null);
      } finally {
        if (mounted) setLoaded(true);
      }
    }
    load();
        // 2) subscribe to auth changes so navbar updates live
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      const user = session?.user ?? null;
      if (!user) {
        setRole(null);
        setUserEmail(null);
      } else {
        const { data: profile } = await supabase.from("users").select("role, email").eq("id", user.id).single();
        setRole(profile?.role ?? null);
        setUserEmail(profile?.email ?? user.email);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

   // Dashboard button should use role (if any) to route, as we discussed earlier
  const handleDashboardClick = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return router.push("/dashboard");
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    const role = profile?.role;
    if (role === "superadmin") return router.push("/superadmin/dashboard");
    if (role === "admin") return router.push("/admin/dashboard");
    if (role === "member") return router.push("/member/dashboard");
    return router.push("/dashboard");
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/users/logout", { method: "POST" });
    } catch (err) {
      // ignore errors, just clear UI
      console.log(err)
    } finally {
      setRole(null);
      setUserEmail(null);
      router.push("/");
    }
  };

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b bg-background">
      {/* Left: logo + brand */}
      <div className="flex items-center gap-3">
        <img src="/gymlogo.png" alt="GotMeFit" className="h-8 w-8 rounded-md" />
        <span className="text-lg font-semibold">GotMeFit</span>
      </div>

      {/* Center: simple nav */}
      <div className="flex gap-6">
        <Link href="/" className="text-sm font-medium hover:text-primary">
          Home
        </Link>

        <button
          onClick={handleDashboardClick}
          className="text-sm font-medium hover:text-primary"
        >
          Dashboard
        </button>
      </div>

      {/* Right: theme toggle + profile dropdown */}
      <div className="flex items-center gap-4">
        <ModeToggle />

        {/* don't render dropdown until we at least attempted fetch (loaded) to avoid flicker */}
        {loaded ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="cursor-pointer">
                <AvatarImage src="/user-avatar.png" alt="profile" />
                <AvatarFallback>{role ? role[0].toUpperCase() : "?"}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              {role ? (
                <>
                  <DropdownMenuLabel>{userEmail ?? "Account"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboardClick}>
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuLabel>Not signed in</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/login")}>
                    Login
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          // small placeholder while we check session
          <div className="h-8 w-8 rounded-md bg-muted" />
        )}
      </div>
    </nav>
  );
}
