"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Login failed");
    // try to fetch /api/users/me to know role and redirect
    const me = await fetch("/api/users/me");
    const mj = await me.json();
    const role = mj.user?.role;
    if (role === "superadmin") return router.push("/superadmin/dashboard");
    if (role === "admin") return router.push("/admin/dashboard");
    // other roles go to profile
    router.push("/profile");
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md  p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Login</h2>
        <input className="w-full p-2 border rounded mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-2 border rounded mb-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white py-2 rounded">Login</button>
        <div className="mt-4 text-sm text-slate-600">
          New user? <a className="text-blue-600" href="/signup">Request account</a>
        </div>
      </form>
    </div>
  );
}
