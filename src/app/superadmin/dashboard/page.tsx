"use client";
import { useEffect, useState } from "react";

export default function SuperadminDashboard() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", address: "", phone: "", adminEmail: "", adminPassword: "", adminName: "" });

  async function loadGyms() {
    const res = await fetch("/api/gyms/list");
    const j = await res.json();
    if (res.ok) setGyms(j.gyms || []);
  }

  useEffect(()=> { loadGyms(); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/gyms", {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify(form)
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed");
    alert("Gym + admin created");
    setForm({ name: "", address: "", phone: "", adminEmail: "", adminPassword: "", adminName: "" });
    await loadGyms();
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Superadmin Dashboard</h1>
      <div className="grid md:grid-rows-2 gap-6">
        <form onSubmit={submit} className=" p-4 rounded shadow text-center flex flex-col justify-center items-center gap-2">
          <h2 className="font-semibold mb-2  ">Create Gym </h2>
          <input value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-1/2 p-2 border rounded mb-2" placeholder="Gym name" />
          <input value={form.address} onChange={e=>setForm({...form, address:e.target.value})} className="w-1/2  p-2 border rounded mb-2" placeholder="Address" />
          <input value={form.phone} onChange={e=>setForm({...form, phone:e.target.value})} className="w-1/2  p-2 border rounded mb-2" placeholder="Phone" />
          <hr className="my-2" />
          <h2 className="font-semibold mb-2  ">Admin </h2>
          <input value={form.adminName} onChange={e=>setForm({...form, adminName:e.target.value})} className="w-1/2  p-2 border rounded mb-2" placeholder="Admin name" />
          <input value={form.adminEmail} onChange={e=>setForm({...form, adminEmail:e.target.value})} className="w-1/2  p-2 border rounded mb-2" placeholder="Admin email" />
          <input value={form.adminPassword} onChange={e=>setForm({...form, adminPassword:e.target.value})} className="w-1/2  p-2 border rounded mb-2" placeholder="Admin password" type="password" />
          <button className="px-4 py-2 bg-blue-600 text-white rounded">Create</button>
        </form>

        <div className=" p-4 rounded shadow">
          <h2 className="font-semibold mb-2">Existing Gyms</h2>
          {gyms.length===0 ? <p>No gyms yet</p> : (
            <ul className="space-y-2">
              {gyms.map(g => (
                <li key={g._id} className="border p-2 rounded">
                  <div className="font-semibold">{g.name}</div>
                  <div className="text-sm text-slate-400">{g.address}</div>
                  <div className="text-sm text-slate-400">Admin: {g.admin?.email || "—"}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
