"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SignupRequest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member"|"trainer"|"nutritionist">("member");
  const [password, setPassword] = useState("");
  const [gymId, setGymId] = useState<string | "">("");
  const [gyms, setGyms] = useState<any[]>([]);
  const router = useRouter();
  const [height, setHeight] = useState("");
const [weight, setWeight] = useState("");
const [bmi, setBmi] = useState("");
const [healthMarkers, setHealthMarkers] = useState("");


  useEffect(()=> {
    fetch("/api/gyms/public").then(async r=>{
      if (r.ok) {
        const j = await r.json();
        setGyms(j.gyms || []);
      }
    });
  }, []);

  async function submit(e: React.FormEvent) {
  e.preventDefault();

  const body: any = { name, email, password, role, gymId: gymId || undefined };

  if (role === "member") {
    body.height = height;
    body.weight = weight;
    body.bmi = bmi;
    body.healthMarkers = healthMarkers;
  }

  const res = await fetch("/api/users/request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const j = await res.json();
  if (!res.ok) return alert(j.error || "Request failed");

  alert("Request submitted. Admin will review.");
  router.push("/login");
}


  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16">
      <form onSubmit={submit} className="w-full max-w-md  p-8 rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Request Access</h2>
        <input className="w-full p-2 border rounded mb-3" placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} />
        <input className="w-full p-2 border rounded mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full p-2 border rounded mb-3" placeholder="Password (optional)" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label className="text-sm">Role</label>
        <select className="w-full p-2 border rounded mb-3" value={role} onChange={e=>setRole(e.target.value as any)}>
          <option value="member">Member</option>
          <option value="trainer">Trainer</option>
          <option value="nutritionist">Nutritionist</option>
        </select>
        {role === "member" && (
  <>
    <input
      className="w-full p-2 border rounded mb-3"
      placeholder="Height (cm)"
      value={height}
      onChange={(e) => setHeight(e.target.value)}
    />
    <input
      className="w-full p-2 border rounded mb-3"
      placeholder="Weight (kg)"
      value={weight}
      onChange={(e) => setWeight(e.target.value)}
    />
    <input
      className="w-full p-2 border rounded mb-3"
      placeholder="BMI"
      value={bmi}
      onChange={(e) => setBmi(e.target.value)}
    />
    <textarea
      className="w-full p-2 border rounded mb-3"
      placeholder="Health markers (optional)"
      value={healthMarkers}
      onChange={(e) => setHealthMarkers(e.target.value)}
    />
  </>
)}


        <label className="text-sm">Gym (select the gym you want to join)</label>
          <select
            className="w-full p-2 border rounded mb-3"
            value={gymId}
            onChange={e => setGymId(e.target.value)}
            required
          >
            <option value="">-- Select gym --</option>
            <option value="68bc8edb4cc559dae5c96331">GotMeFit</option>

            {gyms.map(g => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>


        <button className="w-full bg-blue-600 text-white py-2 rounded">Submit request</button>
      </form>
    </div>
  );
}
