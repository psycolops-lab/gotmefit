// app/page.tsx
'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // ✅ If logged in → get role and send to correct dashboard
        const { data: profile } = await supabase
          .from("users")
          .select("role")
          .eq("id", session.user.id)
          .single();

        const role = profile?.role;

        if (role === "superadmin") return router.replace("/superadmin/dashboard");
        if (role === "admin") return router.replace("/admin/dashboard");
        if (role === "trainer") return router.replace("/trainer/dashboard");
        if (role === "nutritionist") return router.replace("/nutritionist/dashboard");
        if (role === "member") return router.replace("/member/dashboard");

        return router.replace("/dashboard"); // fallback
      } else {
        // ❌ Not logged in → redirect to /login
        router.replace("/login");
      }
    };

    checkSession();
  }, [router]);

  return null; // nothing rendered because we always redirect
}
