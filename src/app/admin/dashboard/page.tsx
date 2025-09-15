// src/app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Users,
  UserCheck,
  Utensils,
  TrendingUp,
  Mail,
  Phone,
  Star,
  MoreHorizontal,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import AnalyticsCharts from "./AnalyticsCharts";

export default function AdminDashboard() {
  const [members, setMembers] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [nutritionists, setNutritionists] = useState<any[]>([]);
  const [roleToCreate, setRoleToCreate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleMembersCount, setVisibleMembersCount] = useState(4);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    totalNutritionists: 0,
    monthlyRevenue: 0,
  });
  const router = useRouter();

  useEffect(() => {
    async function fetchUsers() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session?.access_token) {
          console.error("fetchUsers: Session error:", {
            message: sessionError?.message,
            code: sessionError?.code,
            session: session ? { userId: session.user?.id, email: session.user?.email } : null,
          });
          alert("Session expired. Please log in again.");
          router.push("/login");
          return;
        }

        console.log("fetchUsers: Session retrieved:", {
          userId: session.user.id,
          email: session.user.email,
          token: session.access_token.slice(0, 10) + "...",
        });

        const res = await fetch("/api/users", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!res.ok) {
          const errorData = await res.json();
          console.error("fetchUsers: API error:", { status: res.status, error: errorData });
          throw new Error(`Failed to fetch users: ${errorData.error || res.statusText}`);
        }
        const data = await res.json();
        console.log("fetchUsers: Received data:", {
          userCount: data.users?.length,
          users: data.users?.map((u: any) => ({ id: u.id, email: u.email, role: u.role })),
        });
        const all = data.users || [];
        const membersList = all.filter((u: any) => u.role === "member");
        const trainersList = all.filter((u: any) => u.role === "trainer");
        const nutritionistsList = all.filter((u: any) => u.role === "nutritionist");
        setMembers(membersList);
        setTrainers(trainersList);
        setNutritionists(nutritionistsList);

        // Update stats dynamically
        setStats({
          totalMembers: membersList.length,
          totalTrainers: trainersList.length,
          totalNutritionists: nutritionistsList.length,
          monthlyRevenue: 0, // Can be calculated if data available
        });
      } catch (err: any) {
        console.error("Fetch users error:", err.message);
        alert("Failed to load users. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, [router]);
  const handleLoadMoreMembers = () => {
    setVisibleMembersCount(members.length); // Show all members
  };
  return (
    <div className="min-h-screen pt-20 px-6 space-y-10">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          className="text-3xl font-bold mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Admin Dashboard
        </motion.h1>
        <motion.p
          className="text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Manage members, trainers, nutritionists and analytics.
        </motion.p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trainers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalTrainers}</div>
            {/* <p className="text-xs text-muted-foreground">+2 from last month</p> */}
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutritionists</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalNutritionists}</div>
            {/* <p className="text-xs text-muted-foreground">+1 from last month</p> */}
          </CardContent>
        </Card>
      </div>
      <div className="mb-8">
        <AnalyticsCharts />
      </div>
      {loading ? (
        <p className="text-gray-500">Loading users...</p>
      ) : (
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
            <TabsTrigger value="nutritionists">Nutritionists</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Members Overview</CardTitle>
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
                <div className="space-y-4">
                  {members.length === 0 ? (
                    <p className="text-gray-500">No members found.</p>
                  ) : (
                    members.slice(0, visibleMembersCount).map((member, index) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 dark:bg-gray-300 dark:hover:bg-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-4 ">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`} />
                            <AvatarFallback>{member.name?.substring(0, 2) || 'M'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-black">{member.name || "—"}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {/* <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{member.phone || "—"}</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-black">
                          <div className="text-center ">
                            <p className="text-sm font-medium ">{member.profile?.height_cm|| "—"} cm</p>
                            <p className="text-xs text-gray-600">Height</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{member.profile?.weight_kg || "—"} kg</p>
                            <p className="text-xs text-gray-600">Weight</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">{member.profile?.bmi || "—"}</p>
                            <p className="text-xs text-gray-600">BMI</p>
                          </div>
                          {/* <div className="text-center">
                            <p className="text-sm font-medium">{member.profile?.age || "—"}</p>
                            <p className="text-xs text-gray-600">Age</p>
                          </div> */}
                          <div className="text-center">
                            <p className="text-sm font-medium">{member.profile?.plan || "—"}</p>
                            <p className="text-xs text-gray-600">Plan</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                            <p className="text-sm text-gray-600">
                              Joined: {member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {members.length > 4 && visibleMembersCount < members.length && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={handleLoadMoreMembers}>
                      Load More Members
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trainers" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Trainers Overview</CardTitle>
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
                <div className="space-y-4">
                  {trainers.length === 0 ? (
                    <p className="text-gray-500">No trainers found.</p>
                  ) : (
                    trainers.map((trainer, index) => (
                      <div
                        key={trainer.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-4 ">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`} />
                            <AvatarFallback>{trainer.name?.substring(0, 2) || 'T'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-black">{trainer.name || "—"}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{trainer.email}</span>
                              </div>
                              {/* <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{trainer.phone || "—"}</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-black">
                          <div className="text-center">
                            <div className="flex items-center space-x-1 text-sm">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">18</span>
                            </div>
                            <p className="text-xs text-gray-600">Clients</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center space-x-1 text-sm">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="font-medium">4.8</span>
                            </div>
                            <p className="text-xs text-gray-600">Rating</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">5 years</p>
                            <p className="text-xs text-gray-600">Experience</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                            <p className="text-sm text-gray-600">
                              Joined: {trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {trainers.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline">Load More Trainers</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutritionists" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Nutritionists Overview</CardTitle>
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
                <div className="space-y-4">
                  {nutritionists.length === 0 ? (
                    <p className="text-gray-500">No nutritionists found.</p>
                  ) : (
                    nutritionists.map((nutritionist, index) => (
                      <div
                        key={nutritionist.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`} />
                            <AvatarFallback>{nutritionist.name?.substring(0, 2) || 'N'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-black">{nutritionist.name || "—"}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <Mail className="h-3 w-3" />
                                <span>{nutritionist.email}</span>
                              </div>
                              {/* <div className="flex items-center space-x-1">
                                <Phone className="h-3 w-3" />
                                <span>{nutritionist.phone || "—"}</span>
                              </div> */}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-black">
                          <div className="text-center">
                            <div className="flex items-center space-x-1 text-sm">
                              <Users className="h-3 w-3" />
                              <span className="font-medium">15</span>
                            </div>
                            <p className="text-xs text-gray-600">Clients</p>
                          </div>
                          <div className="text-center">
                            <div className="flex items-center space-x-1 text-sm">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="font-medium">4.9</span>
                            </div>
                            <p className="text-xs text-gray-600">Rating</p>
                          </div>
                          <div className="text-center">
                            <p className="text-sm font-medium">4 years</p>
                            <p className="text-xs text-gray-600">Experience</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="default" className="bg-green-600">Active</Badge>
                            <p className="text-sm text-gray-600">
                              Joined: {nutritionist.created_at ? new Date(nutritionist.created_at).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <Button variant="outline" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                {nutritionists.length > 0 && (
                  <div className="flex justify-center mt-6">
                    <Button variant="outline">Load More Nutritionists</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

/* ------------------- Create User Form ------------------- */
function CreateUserForm({ role }: { role: string }) {
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const body = Object.fromEntries(formData.entries());

    try {
      // Get Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        console.error("CreateUserForm: Session error:", sessionError?.message || "No session");
        alert("Session expired. Please log in again.");
        window.location.href = "/login";
        return;
      }

      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ ...body, role }),
      });
      setLoading(false);

      if (res.ok) {
        alert(`${role} created successfully!`);
        location.reload();
      } else {
        const errorData = await res.json();
        alert(`Failed to create user: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      console.error("CreateUserForm: Error:", err.message);
      alert(`Failed to create user: ${err.message || "Unexpected error"}`);
      setLoading(false);
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
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input name="phone" placeholder="Phone Number" />
      </div>
      {role === "member" && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="height_cm">Height (cm)</Label>
            <Input type="number" name="height_cm" />
          </div>
          <div>
            <Label htmlFor="weight_kg">Weight (kg)</Label>
            <Input type="number" name="weight_kg" />
          </div>
          <div>
            <Label htmlFor="bmi">BMI</Label>
            <Input type="number" name="bmi" />
          </div>
          <div>
            <Label htmlFor="dob">Date of Birth</Label>
            <Input type="date" name="dob" />
          </div>
          <div className="col-span-2">
            <Label htmlFor="plan">Plan</Label>
            <Input name="plan" placeholder="Plan" />
          </div>
        </div>
      )}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? `Creating ${role}...` : `Create ${role}`}
      </Button>
    </form>
  );
}