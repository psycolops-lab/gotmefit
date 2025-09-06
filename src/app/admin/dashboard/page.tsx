"use client";
import { useEffect, useState } from "react";

function CreateUser({ gymId, onDone }: { gymId: string, onDone: ()=>void }) {
  const [role, setRole] = useState<"member"|"trainer"|"nutritionist">("member");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const profile = role === "member" ? { heightCm: Number(height), weightKg: Number(weight) } : undefined;
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ email, password: pass, username: name, role, gymId, profile })
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed");
    alert("User created");
    onDone();
  }

  return (
    <form onSubmit={submit} className=" p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Create User</h3>
      <select value={role} onChange={e=>setRole(e.target.value as any)} className="w-full p-2 border rounded mb-2">
        <option value="member">Member</option>
        <option value="trainer">Trainer</option>
        <option value="nutritionist">Nutritionist</option>
      </select>
      <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Name" />
      <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Email" />
      <input value={pass} onChange={e=>setPass(e.target.value)} className="w-full p-2 border rounded mb-2" placeholder="Password" type="password"/>
      {role==="member" && (
        <div className="grid grid-cols-2 gap-2">
          <input value={height} onChange={e=>setHeight(e.target.value)} placeholder="Height cm" className="p-2 border rounded"/>
          <input value={weight} onChange={e=>setWeight(e.target.value)} placeholder="Weight kg" className="p-2 border rounded"/>
        </div>
      )}
      <button className="mt-3 w-full bg-green-600 text-white py-2 rounded">Create</button>
    </form>
  );
}

function PendingRequests({ onDone }: { onDone: ()=>void }) {
  const [list, setList] = useState<any[]>([]);
  async function load() {
    const res = await fetch("/api/requests/pending");
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed to load");
    setList(j.requests || []);
  }
  useEffect(()=>{ load(); }, []);

  async function handle(id: string, action: "approve"|"reject") {
    const body: any = { requestId: id, action };
    if (action === "approve") {
      const setPassword = prompt("Set password for user (leave blank to use provided password):");
      if (setPassword) body.setPassword = setPassword;
    }
    const res = await fetch("/api/requests/handle", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(body)
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed");
    alert(j.message || "Done");
    await load();
    onDone();
  }

  return (
    <div className=" p-4 rounded shadow">
      <h3 className="font-semibold mb-2">Pending Requests</h3>
      {list.length===0 ? <p>No pending requests</p> : <ul className="space-y-2">
        {list.map(r => (
          <li key={r._id} className="border p-2 rounded flex justify-between">
            <div>
              <div className="font-medium">{r.name || r.email} <span className="text-sm text-slate-500">({r.role})</span></div>
              <div className="text-sm text-slate-500">{r.email}</div>
            </div>
            <div className="flex flex-col gap-2">
              <button onClick={()=>handle(r._id, "approve")} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
              <button onClick={()=>handle(r._id, "reject")} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
            </div>
          </li>
        ))}
      </ul>}
    </div>
  );
}

export default function AdminDashboard() {
  const [gymId, setGymId] = useState<string>("");
  const [reloadKey, setReloadKey] = useState(0);

  async function loadMe() {
    const res = await fetch("/api/users/me");
    if (!res.ok) { window.location.href = "/login"; return; }
    const j = await res.json();
    setGymId(j.user?.gym || "");
  }

  useEffect(()=>{ loadMe(); }, [reloadKey]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <CreateUser gymId={gymId} onDone={()=>setReloadKey(k=>k+1)} />
        <PendingRequests onDone={()=>setReloadKey(k=>k+1)} />
      </div>
    </div>
  );
}
