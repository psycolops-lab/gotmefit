"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleToCreate, setRoleToCreate] = useState<string | null>(null);

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
    <div className="min-h-screen p-6 space-y-10">
      <motion.h1
        className="text-3xl font-bold mb-8"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        Admin Dashboard
      </motion.h1>

      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <>
          {/* Members */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Members</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setRoleToCreate("member")}>+ Add Member</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Member</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm role="member" />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <UserTable role="member" users={members} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Trainers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Trainers</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setRoleToCreate("trainer")}>+ Add Trainer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Trainer</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm role="trainer" />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <UserTable role="trainer" users={trainers} />
              </CardContent>
            </Card>
          </motion.div>

          {/* Nutritionists */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <Card>
              <CardHeader className="flex justify-between items-center">
                <CardTitle>Nutritionists</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm" onClick={() => setRoleToCreate("nutritionist")}>+ Add Nutritionist</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Nutritionist</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm role="nutritionist" />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <UserTable role="nutritionist" users={nutritionists} />
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </div>
  );
}

/* ------------------- User Table ------------------- */
function UserTable({ users, role }: { users: any[]; role: string }) {
  if (!users.length) return <p className="text-gray-500">No {role}s found.</p>;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Email</th>
            {role === "member" && (
              <>
                <th className="p-3">Height</th>
                <th className="p-3">Weight</th>
                <th className="p-3">BMI</th>
                <th className="p-3">Age</th>
              </>
            )}
            <th className="p-3">Joined</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id} className="border-t hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="p-3 font-medium">{u.name || u.username ||  "—"}</td>
              <td className="p-3">{u.email}</td>
              {role === "member" && (
                <>
                  <td className="p-3">{u.profile?.heightCm ?? "—"}</td>
                  <td className="p-3">{u.profile?.weightKg ?? "—"}</td>
                  <td className="p-3">{u.profile?.bmi ?? "—"}</td>
                  <td className="p-3">{u.profile?.age ?? "—"}</td>
                </>
              )}
              <td className="p-3">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------- Create User Form ------------------- */
function CreateUserForm({ role }: { role: string }) {
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const body = Object.fromEntries(formData.entries());

    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, role }),
    });

    if (res.ok) {
      alert(`${role} created successfully!`);
      location.reload();
    } else {
      alert("Failed to create user");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input name="name" placeholder="Full Name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input type="email" name="email" placeholder="you@example.com" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input type="password" name="password" placeholder="••••••••" required />
      </div>

      {role === "member" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="heightCm">Height (cm)</Label>
            <Input type="number" name="heightCm" />
          </div>
          <div>
            <Label htmlFor="weightKg">Weight (kg)</Label>
            <Input type="number" name="weightKg" />
          </div>
          <div>
            <Label htmlFor="weightKg">BMI</Label>
            <Input type="number" name="weightKg" />
          </div>
          <div>
            <Label htmlFor="date">Date of Birth</Label>
            <Input type="date"  />
          </div>
        </div>
      )}

      <Button type="submit" className="w-full">Create {role}</Button>
    </form>
  );
}
