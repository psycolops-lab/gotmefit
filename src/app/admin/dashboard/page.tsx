"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        const all = data.users || [];
        setMembers(all.filter((u: any) => u.role === "member"));
        setTrainers(all.filter((u: any) => u.role === "trainer"));
        setNutritionists(all.filter((u: any) => u.role === "nutritionist"));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="min-h-screen ">
      <nav className=" shadow px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="space-x-4">
          <Link href="/admin/dashboard/create-user" className="px-4 py-2 bg-blue-600  rounded-lg">+ Create New User</Link>
          <Link href="/admin/dashboard/requests" className="px-4 py-2 bg-yellow-500  rounded-lg">Pending Requests</Link>
        </div>
      </nav>

      <main className="p-6 space-y-10">
        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <>
            <section>
              <h2 className="text-2xl font-semibold mb-4">Members</h2>
              <MemberTable users={members} />
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Trainers</h2>
              <SimpleUserTable users={trainers} />
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">Nutritionists</h2>
              <SimpleUserTable users={nutritionists} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}

/* Members table: show profile columns */
function MemberTable({ users }: { users: any[] }) {
  if (!users.length) return <p className="text-gray-500">No members found.</p>;

  return (
    <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead className=" text-gray-500">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Height (cm)</th>
            <th className="p-3">Weight (kg)</th>
            <th className="p-3">BMI</th>
            <th className="p-3">Health markers</th>
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const p = u.profile || {};
            const markers = Array.isArray(p.healthMarkers) ? p.healthMarkers.join(", ") : (p.healthMarkers || "");
            return (
              <tr key={u._id} className="dark:hover:bg-gray-500 hover:bg-blue-50">
                <td className="p-3 font-medium">{u.name || u.username || "—"}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{p.heightCm ?? "—"}</td>
                <td className="p-3">{p.weightKg ?? "—"}</td>
                <td className="p-3">{p.bmi ?? "—"}</td>
                <td className="p-3">{markers || "—"}</td>
                <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* Trainers & Nutritionists: fewer columns for now */
function SimpleUserTable({ users }: { users: any[] }) {
  if (!users.length) return <p className="text-gray-500">No users found.</p>;

  return (
    <div className="overflow-x-auto shadow rounded-lg border border-gray-200">
      <table className="w-full text-left">
        <thead className=" text-gray-700">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="dark:hover:bg-gray-500 hover:bg-blue-50">
              <td className="p-3 font-medium">{u.name || u.username ||  u.fullName || u.email.split("@")[0]}</td>
              <td className="p-3">{u.email}</td>
              <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
