"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { ModeToggle } from "@/components/mode-toggle";
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { User, Settings, BarChart3, LogOut } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  // 🔹 Fetch user session + profile once
  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const user = session?.user ?? null;
        if (!user) {
          resetUser();
        } else {
          const { data: profile } = await supabase
            .from("users")
            .select("role, email")
            .eq("id", user.id)
            .single();

          setRole(profile?.role ?? null);
          setUserEmail(profile?.email ?? user.email ?? null);

          const derivedName =
            (profile?.email ?? user.email)?.split("@")[0] ?? "User";
          setUserName(derivedName);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        resetUser();
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUser();

    // 🔹 Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;

      if (!session?.user) {
        resetUser();
      } else {
        loadUser();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const resetUser = () => {
    setRole(null);
    setUserEmail(null);
    setUserName(null);
  };

  const handleDashboardClick = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return router.push("/login");

    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile?.role;
    if (role === "superadmin") return router.push("/superadmin/dashboard");
    if (role === "admin") return router.push("/admin/dashboard");
    if (role === "member") return router.push(`/member/${user.id}`);
    if (role === "trainer") return router.push("/trainer/dashboard");
    if (role === "nutritionist") return router.push("/nutritionist/dashboard");

    return router.push("/");
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      resetUser();
      router.push("/login"); // ✅ always redirect to login
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur supports-[backdrop-filter]:bg-blue-400/30 dark:supports-[backdrop-filter]:bg-blue-900/40 border-b border-blue-500/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo */}
          <motion.div
            className="flex items-center space-x-2"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Image src="/logo.webp" alt="Logo" width={100} height={96} />
          </motion.div>

          {/* Right: Toggle + Profile/Login */}
          <motion.div
            className="flex items-center space-x-2 sm:space-x-4"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
          >
            <ModeToggle />

            {loading ? (
              <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
            ) : role ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer border border-border hover:shadow-sm transition-all duration-200">
                    <AvatarImage src={undefined} alt={userName ?? "User"} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userName ? userName.substring(0, 2).toUpperCase() : "?"}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <p className="text-sm font-medium">{userName}</p>
                    <p className="text-xs text-muted-foreground">{userEmail}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDashboardClick}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-700">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => router.push("/login")}
                className="transition-all duration-200 hover:shadow-sm"
              >
                Login
              </Button>
            )}
          </motion.div>
        </div>
      </div>
    </nav>
  );
}
