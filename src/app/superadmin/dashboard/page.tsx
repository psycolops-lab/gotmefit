"use client";
import { Building2, Users, MapPin,  BarChart3 } from 'lucide-react';
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
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
import { Loader2, Plus } from "lucide-react";

/**
 * Superadmin Dashboard page
 * - loads /api/gyms/list with current session token (preferred)
 * - falls back to a client-side supabase query if the API call fails
 * - normalizes common field name variations so UI doesn't show zeros if names differ
 * - adds top padding so navbar doesn't overlap the content
 */

export default function SuperadminDashboard() {
  const [gyms, setGyms] = useState<any[]>([]);
  const [fetching, setFetching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    location: "",
    phone: "",
    adminEmail: "",
    adminPassword: "",
    adminName: "",
  });

  // Normalizer to handle multiple possible field shapes
  function normalizeGym(g: any) {
    return {
      id: g.id ?? g._id ?? g.ID,
      name: g.name ?? g.title ?? "—",
      location: g.location ?? g.address ?? g.addr ?? "",
      phone: g.phone ?? g.phone_number ?? null,
      // admin information might come from different joins
      admin_name:
        (g.admin_name as string) ||
        g.admin?.name ||
        g.users?.full_name ||
        g.users?.name ||
        null,
      admin_email:
        (g.admin_email as string) ||
        g.admin?.email ||
        g.users?.email ||
        null,
      // counts: handle snake_case or camelCase or simple `members` fields
      membersCount:
        Number(g.members_count ?? g.membersCount ?? g.members ?? 0) || 0,
      trainersCount:
        Number(g.trainers_count ?? g.trainersCount ?? g.trainers ?? 0) || 0,
      revenue: Number(g.revenue ?? g.revenue_amount ?? 0) || 0,
      status: g.status ?? "active",
      raw: g, // keep raw for debugging
    };
  }

  async function loadGyms() {
    setFetching(true);
    setError(null);
    try {
      // try to get session token first (preferred)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      // If we have a token call your server api (recommended, avoids RLS problems)
      if (token) {
        const res = await fetch("/api/gyms/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const j = await res.json();
        if (!res.ok) {
          // API returned non-ok — log and fall back to client query
          console.warn("/api/gyms/list returned non-ok:", res.status, j);
          throw new Error(j?.error || `API /api/gyms/list failed (${res.status})`);
        }
        const rawGyms = j.gyms ?? j.data ?? [];
        setGyms((rawGyms || []).map(normalizeGym));
        return;
      }

      // No session token: try anonymous client query as a fallback.
      // If your Supabase tables use RLS and anonymous role cannot read gyms,
      // you'll get an error here (that's expected). Prefer server API route.
      const { data, error: clientError } = await supabase
        .from("gyms")
        .select(
          // select admin via foreign table if you configured it:
          // "*, admin:users(name,email), members_count, trainers_count, revenue, status"
          // but keep generic to avoid errors
          "id, name, location, phone, admin_id, members_count, trainers_count, revenue, status"
        )
        .order("created_at", { ascending: false });

      if (clientError) {
        throw clientError;
      }
      setGyms((data || []).map(normalizeGym));
    } catch (err: any) {
      console.error("loadGyms error:", err);
      setError(err?.message ?? String(err));
      // keep gyms as-is (empty)
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    loadGyms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Create gym + admin (calls your server route /api/gyms)
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      // require current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("You must be logged in as superadmin to create gyms");
      }

      const res = await fetch("/api/gyms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          location: form.location,
          phone: form.phone,
          adminEmail: form.adminEmail,
          adminPassword: form.adminPassword,
          adminName: form.adminName,
        }),
      });

      const j = await res.json();
      if (!res.ok) {
        console.error("create gym failed:", res.status, j);
        throw new Error(j?.error || "Failed to create gym");
      }

      // success: reload gyms, reset form and auto-close dialog
      await loadGyms();
      setCreateDialogOpen(false);
      setForm({
        name: "",
        location: "",
        phone: "",
        adminEmail: "",
        adminPassword: "",
        adminName: "",
      });
    } catch (err: any) {
      console.error("handleCreate error:", err);
      setError(err?.message ?? String(err));
      // show alert (replace with toast in your app)
      alert("Create failed: " + (err?.message ?? String(err)));
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="pt-24 p-8 space-y-6"> {/* pt-24 pushes content below fixed navbar - adjust if your navbar height differs */}
      <div className="flex items-center justify-between">
        <div >
        <h1 className="text-3xl font-bold p-5">SuperAdmin Dashboard</h1>
          <span className="text-gray-600 p-5">Welcome Back!</span>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-center">Register New Gym</DialogTitle>
            </DialogHeader>
        
        <form onSubmit={handleCreate} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="gymName">Gym Name *</Label>
              <Input
                id="gymName"
                name="gymName"
                placeholder="Enter gym name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                placeholder="City, State"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin Name *</Label>
              <Input
                id="adminName"
                name="adminName"
                placeholder="Enter admin name"
                value={form.adminName}
                onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin Email *</Label>
              <Input
                id="adminEmail"
                name="adminEmail"
                type="email"
                placeholder="admin@example.com"
                value={form.adminEmail}
                onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="(555) 123-4567"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Admin Password</Label>
            <Input
              id="password"
              name="password"
              type='password'
              placeholder="Enter Admin Password"
              value={form.adminPassword}
              onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            
            <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700" disabled={creating}>
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" /> Registering...
                  </>
                ) : (
                  "Register Gym"
                )}
              </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          Error: {error}. Check server logs and network tab (console).
        </div>
      )}

      {/* Stats (small) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="animate-scale-in border-blue-200 dark:border-blue-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gyms</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fetching ? "…" : gyms.length}</div>
            
          </CardContent>
        </Card>

        <Card className="animate-scale-in border-blue-200 dark:border-blue-800" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fetching ? "…" : gyms.reduce((s, g) => s + (g.membersCount ?? 0), 0)}</div>
            
          </CardContent>
        </Card>

        <Card className="animate-scale-in border-blue-200 dark:border-blue-800" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trainers</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fetching ? "…" : gyms.reduce((s, g) => s + (g.trainersCount ?? 0), 0)}</div>
            
          </CardContent>
          {/* Revenue sample card */}
          {/* No idea of implementation yet so it is static for now */}
        </Card>
        {/* <Card className="animate-scale-in border-blue-200 dark:border-blue-800" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">$16,630,00</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="sm:text-2xl text-lg font-bold text-gray-900 dark:text-white">Registered Gyms</h2>
        <Button 
          onClick={() => setCreateDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          Register New Gym
        </Button>
      </div>

      {/* Gyms grid */}
      {fetching ? (
        <div className="text-center py-8">Loading gyms…</div>
      ) : gyms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No gyms found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
          {gyms.map((raw) => {
            const g = normalizeGym(raw.raw ?? raw);
            return (
              <Card key={g.id} className="shadow hover:shadow-lg transition">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>{g.name}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${g.status === "active" ? "bg-green-600 text-white" : "bg-gray-400 text-white"}`}>
                      {g.status}
                    </span>
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  <div className="text-sm text-muted-foreground mb-2">{g.location || "—"}</div>
                  <div className="text-sm mb-3">Admin: {g.admin_name ?? g.admin_email ?? "—"}</div>

                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 rounded bg-blue-50 p-3 text-center">
                      <div className="text-lg font-semibold text-blue-700">{g.membersCount}</div>
                      <div className="text-xs text-blue-700">Members</div>
                    </div>

                    <div className="flex-1 rounded bg-purple-50 p-3 text-center">
                      <div className="text-lg font-semibold text-purple-700">{g.trainersCount}</div>
                      <div className="text-xs text-purple-700">Trainers</div>
                    </div>
                  </div>

                  {/* <div className="flex justify-between items-center border-t pt-2 text-sm">
                    <div>Revenue</div>
                    <div className="font-semibold text-green-600">₹{(g.revenue || 0).toLocaleString()}</div>
                  </div> */}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
