"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SuperadminDashboard() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });

  async function loadGyms() {
    const res = await fetch("/api/gyms/list");
    const j = await res.json();
    if (res.ok) setGyms(j.gyms || []);
  }

  useEffect(() => {
    loadGyms();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/gyms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const j = await res.json();
    if (!res.ok) return alert(j.error || "Failed");
    alert("Gym + admin created");
    setForm({
      name: "",
      address: "",
      phone: "",
      adminEmail: "",
      adminPassword: "",
      adminName: "",
    });
    await loadGyms();
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Superadmin Dashboard
        </h1>

        {/* Create Gym Button */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus size={18} />
              Create Gym
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Gym</DialogTitle>
            </DialogHeader>

            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-2">
                <Label>Gym Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Enter gym name"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={form.address}
                  onChange={(e) =>
                    setForm({ ...form, address: e.target.value })
                  }
                  placeholder="Enter address"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="pt-2 space-y-2">
                <Label>Admin Name</Label>
                <Input
                  value={form.adminName}
                  onChange={(e) =>
                    setForm({ ...form, adminName: e.target.value })
                  }
                  placeholder="Admin full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Email</Label>
                <Input
                  type="email"
                  value={form.adminEmail}
                  onChange={(e) =>
                    setForm({ ...form, adminEmail: e.target.value })
                  }
                  placeholder="admin@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Admin Password</Label>
                <Input
                  type="password"
                  value={form.adminPassword}
                  onChange={(e) =>
                    setForm({ ...form, adminPassword: e.target.value })
                  }
                  placeholder="********"
                />
              </div>

              <Button type="submit" className="w-full">
                Create Gym
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Gyms */}
      <h1 className="text-2xl font-medium text-center underline">Registered Gyms</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
        
        {gyms.length === 0 ? (
          <p className="text-gray-500">No gyms yet</p>
        ) : (
          gyms.map((g) => (
            <Card key={g._id} className="shadow-md hover:shadow-lg transition">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>{g.name}</span>
                  <span className="text-sm text-muted-foreground">
                    Admin: {g.admin?.email || "—"}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-4">{g.address}</p>
                <div className="flex gap-3">
                  {/* Members card */}
                  <div className="flex-1 rounded-lg bg-blue-100 p-3 text-center">
                    <p className="text-lg font-bold text-blue-700">
                      {g.membersCount ?? 0}
                    </p>
                    <p className="text-xs text-blue-700">Members</p>
                  </div>
                  {/* Trainers card */}
                  <div className="flex-1 rounded-lg bg-purple-100 p-3 text-center">
                    <p className="text-lg font-bold text-purple-700">
                      {g.trainersCount ?? 0}
                    </p>
                    <p className="text-xs text-purple-700">Trainers</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
