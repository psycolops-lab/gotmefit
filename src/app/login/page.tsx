// src/app/login/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { motion } from "framer-motion";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      console.log("Starting login for:", email);
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        console.error("Sign-in error:", signInError);
        throw new Error(signInError.message || "Login failed");
      }

      const userId = signInData.user?.id;
      if (!userId) {
        console.error("No user ID found after sign-in");
        throw new Error("User not found after login");
      }

      console.log("Fetching profile for user ID:", userId);
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role, gym_id")
        .eq("id", userId)
        .maybeSingle();

      console.log("Fetched profile:", profile);
      if (profileError) {
        console.error("Profile fetch error:", profileError);
        throw new Error(profileError.message || "Error fetching profile");
      }

      if (!profile) {
        console.error("No profile found for user ID:", userId);
        throw new Error("No profile found. Please contact support or create profile.");
      }

      const role = profile.role;
      console.log("User role:", role);
      if (role === "superadmin") {
        console.log("Redirecting to /superadmin/dashboard");
        router.push("/superadmin/dashboard");
      } else if (role === "admin") {
        console.log("Redirecting to /admin/dashboard");
        router.push("/admin/dashboard");
      }else if (role === "member") {
        console.log("Redirecting to /member/dashboard");
        router.push("/member/dashboard");
      }else if (role === "trainer") {
        console.log("Redirecting to /trainer/dashboard");
        router.push("/trainer/dashboard");
      }else if (role === "nutritionist") {
        console.log("Redirecting to /nutritionist/dashboard");
        router.push("/nutritionist/dashboard");
      } else {
        console.log("Redirecting to /profile");
        router.push("/profile");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "Something went wrong");
    } finally {
      console.log("Resetting loading state");
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-[url('/background.jpg')] bg-cover bg-center">
      <div className="border border-gray-300 dark:border-gray-700 shadow-lg bg-black/30 rounded-lg w-full max-w-6xl mx-4">
        <main className="px-6 py-12 flex items-center justify-center flex-1">
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Welcome back</CardTitle>
                <CardDescription>
                  Login to manage your gym or access your dashboard.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <Button className="w-full" disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
                <div className="mt-4">
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/">Go to Home</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center p-4 rounded-lg shadow-sm dark:opacity-90 min-h-[24rem]"
            >
              <div className="text-center min-h-[22rem] bg-background/10 dark:bg-background/20 p-4 rounded-lg font-serif">
                <motion.h2
                  className="text-2xl font-bold dark:text-foreground text-white mb-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  A smarter way to run your gym
                </motion.h2>
                <motion.p
                  className="text-base mb-4 text-white p-4 font-serif"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  Track members, workouts, diet plans, mindfulness, photos, and
                  more — all in one place.
                </motion.p>
                <motion.ul
                  className="space-y-2 text-white text-base"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <li className="flex items-center justify-center">
                    <span className="mr-2 text-white">•</span> Member progress &
                    photo tracker
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="mr-2 text-white">•</span> Trainer-assigned
                    workouts & logs
                  </li>
                  <li className="flex items-center justify-center">
                    <span className="mr-2 text-white">•</span> Requests & admin
                    approvals
                  </li>
                </motion.ul>
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}