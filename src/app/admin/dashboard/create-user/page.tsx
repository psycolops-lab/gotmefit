"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUser() {
  const [role, setRole] = useState<"member" | "trainer" | "nutritionist">("member");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState("");
  const [healthMarkers, setHealthMarkers] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    // get gymId from /api/users/me response (admin's gym)
    const meR = await fetch("/api/users/me");
    const meJ = await meR.json();
    const gymId = meJ.user?.gym;
    if (!gymId) return alert("Gym not available");

    const profile = role === "member" ? {
      heightCm: height ? Number(height) : null,
      weightKg: weight ? Number(weight) : null,
      bmi: bmi ? Number(bmi) : null,
      healthMarkers: healthMarkers ? healthMarkers.split(",").map(s=>s.trim()) : []
    } : {};

    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email, password, username: undefined, name, role, gymId, profile
      })
    });

    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed");
    alert("User created");
    router.push("/admin/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <form onSubmit={submit} className=" p-8 rounded shadow w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Create New User</h1>

        <label className="block text-sm mb-1">Role</label>
        <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full p-2 border rounded mb-3">
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
          <option value="nutritionist">Nutritionist</option>
        </select>

        <input className="w-full p-2 border rounded mb-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)} required />
        <input className="w-full p-2 border rounded mb-3" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <input className="w-full p-2 border rounded mb-3" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required />

        {role === "member" && (
          <>
            <input className="w-full p-2 border rounded mb-3" placeholder="Height (cm)" value={height} onChange={e=>setHeight(e.target.value)} />
            <input className="w-full p-2 border rounded mb-3" placeholder="Weight (kg)" value={weight} onChange={e=>setWeight(e.target.value)} />
            <input className="w-full p-2 border rounded mb-3" placeholder="BMI" value={bmi} onChange={e=>setBmi(e.target.value)} />
            <input className="w-full p-2 border rounded mb-3" placeholder="Health markers (comma separated)" value={healthMarkers} onChange={e=>setHealthMarkers(e.target.value)} />
          </>
        )}

        <button className="w-full bg-blue-600 text-white py-2 rounded">Create</button>
      </form>
    </div>
  );
}
