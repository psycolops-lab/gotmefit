"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [role, setRole] = useState<string|null>(null);

  useEffect(()=>{
    fetch("/api/users/me").then(async r => {
      if (r.ok) {
        const j = await r.json();
        setRole(j.user?.role || null);
      }
    });
  }, []);

  return (
    <nav className="flex items-center justify-between p-4 border-b ">
      <div className="text-xl font-semibold">GymPortal</div>
      <div className="flex items-center gap-3">
        <Link href="/" className="text-sm">Home</Link>
        <Link href="/login" className="text-sm">Login</Link>
        <Link href="/signup" className="text-sm">Sign up</Link>
        {role==="admin" && <Link href="/admin/dashboard" className="px-3 py-1 bg-blue-600 text-white rounded">Admin</Link>}
        {role==="superadmin" && <Link href="/superadmin/dashboard" className="px-3 py-1 bg-green-600 text-white rounded">Superadmin</Link>}
      </div>
    </nav>
  );
}
