
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
  Eye,
  UserPlus,
  Edit3,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name?: string;
  role: string;
  created_at: string;
  profile?: {
    height_cm?: number;
    weight_kg?: number;
    bmi?: number;
    age?: number;
    plan?: string;
    phone?: string;
    dob?: string;
  };
  trainer_id?: string;
  nutritionist_id?: string;
  trainer?: User;
  nutritionist?: User;
}

export default function AdminDashboard() {
  const [members, setMembers] = useState<User[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [nutritionists, setNutritionists] = useState<User[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [assignmentMember, setAssignmentMember] = useState<User | null>(null);
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
    fetchUsers();
  }, [router]);

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
      const membersList = all.filter((u: User) => u.role === "member");
      const trainersList = all.filter((u: User) => u.role === "trainer");
      const nutritionistsList = all.filter((u: User) => u.role === "nutritionist");
      
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

  const handleLoadMoreMembers = () => {
    setVisibleMembersCount(members.length);
  };

  const handleViewMemberProfile = (member: User) => {
    setSelectedMember(member);
  };

  const handleAssignTrainerNutritionist = (member: User) => {
    setAssignmentMember(member);
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

      {/* Stats Cards */}
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
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nutritionists</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalNutritionists}</div>
          </CardContent>
        </Card>
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
                    <Button size="sm">+ Add Member</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New Member</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm 
                      role="member" 
                      trainers={trainers} 
                      nutritionists={nutritionists}
                      onSuccess={fetchUsers}
                    />
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
                        <div className="flex items-center space-x-4">
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
                            </div>
                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                              <span>Trainer: {member.trainer?.name || "Not assigned"}</span>
                              <span>•</span>
                              <span>Nutritionist: {member.nutritionist?.name || "Not assigned"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6 text-black">
                          <div className="text-center">
                            <p className="text-sm font-medium">{member.profile?.height_cm || "—"} cm</p>
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
                          
                          {/* Action Buttons */}
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleViewMemberProfile(member)}
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleAssignTrainerNutritionist(member)}>
                                  <UserPlus className="h-4 w-4 mr-2" />
                                  Assign/Update Trainer & Nutritionist
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                          if (!(e.target as HTMLElement).closest('button')) {
                            router.push(`/member/${member.id}`); // ← Added dynamic routing
                          }
                        }}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Full Profile
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
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
                    <Button size="sm">+ Add Trainer</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Trainer</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm role="trainer" onSuccess={fetchUsers} />
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
                        <div className="flex items-center space-x-4">
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nutritionists" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Nutritionists Overview</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">+ Add Nutritionist</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Nutritionist</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm role="nutritionist" onSuccess={fetchUsers} />
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Member Profile Modal */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Member Profile - {selectedMember?.name || selectedMember?.email}</DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberProfileView member={selectedMember} />}
        </DialogContent>
      </Dialog>

      {/* Assign Trainer/Nutritionist Modal */}
      <Dialog open={!!assignmentMember} onOpenChange={() => setAssignmentMember(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Trainer & Nutritionist</DialogTitle>
          </DialogHeader>
          {assignmentMember && (
            <AssignmentForm
              member={assignmentMember}
              trainers={trainers}
              nutritionists={nutritionists}
              onSuccess={() => {
                setAssignmentMember(null);
                fetchUsers();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------- Create User Form ------------------- */
interface CreateUserFormProps {
  role: string;
  trainers?: User[];
  nutritionists?: User[];
  onSuccess?: () => void;
}

function CreateUserForm({ role, trainers = [], nutritionists = [], onSuccess }: CreateUserFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState<string>("");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>("");

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setLoading(true);

  const formData = new FormData(e.currentTarget as HTMLFormElement);
  const body = Object.fromEntries(formData.entries());

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      alert("Session expired. Please log in again.");
      return;
    }

    // Step 1: create user in API
    const res = await fetch("/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
        name: body.name || null,
        role,
        height_cm: body.height_cm || null,
        weight_kg: body.weight_kg || null,
        plan: body.plan || null,
        dob: body.dob || null,
        gender: body.gender || null,
        
        trainer_id: selectedTrainer && selectedTrainer !== "none" ? selectedTrainer : null,
        nutritionist_id: selectedNutritionist && selectedNutritionist !== "none" ? selectedNutritionist : null,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      alert(`Failed to create user: ${errorData.error || "Unknown error"}`);
      return;
    }

    alert(`${role} created successfully!`);
    onSuccess?.();
  } catch (err: any) {
    alert(`Failed to create user: ${err.message || "Unexpected error"}`);
  } finally {
    setLoading(false);
  }
}


  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name (Optional)</Label>
        <Input name="name" placeholder="Full Name" />
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input type="email" name="email" placeholder="you@example.com" required />
      </div>
      <div>
        <Label htmlFor="password">Password *</Label>
        <Input type="password" name="password" placeholder="••••••••" required />
      </div>

      {role === "member" && (
        <>
          <div>
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input name="phone" placeholder="Phone Number" />
          </div>
          <div>
      <Label htmlFor="height_cm">Height (cm)</Label>
      <Input type="number" name="height_cm" id="height_cm" className="input" />
    </div>

    <div>
      <Label htmlFor="weight_kg">Weight (kg)</Label>
      <Input type="number" name="weight_kg" id="weight_kg" className="input" />
    </div>

    <div>
      <Label htmlFor="plan">Plan</Label>
      <select
              name="plan"
              id="plan"
              
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">Select Plan</option>
              <option value="yearly">Yearly</option>
              <option value="half-yearly">Half-Yearly</option>
              <option value="quarterly">Quarterly</option>
            </select>
    </div>

    <div>
      <Label htmlFor="dob">Date of Birth</Label>
      <Input type="date" name="dob" id="dob" className="input" />
    </div>

    <div>
      <Label htmlFor="gender">Gender</Label>
      <select
              name="gender"
              id="gender"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
    </div>

    

   

          <div className="space-y-4">

            <div>
              <Label>Assign Trainer</Label>
              <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trainer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No trainer</SelectItem>
                  {trainers.map((trainer) => (
                    <SelectItem key={trainer.id} value={trainer.id}>
                      {trainer.name || trainer.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Assign Nutritionist</Label>
              <Select value={selectedNutritionist} onValueChange={setSelectedNutritionist}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a nutritionist (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No nutritionist</SelectItem>
                  {nutritionists.map((nutritionist) => (
                    <SelectItem key={nutritionist.id} value={nutritionist.id}>
                      {nutritionist.name || nutritionist.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? `Creating ${role}...` : `Create ${role}`}
      </Button>
    </form>
  );
}


/* ------------------- Member Profile View ------------------- */
function MemberProfileView({ member }: { member: User }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={`https://images.pexels.com/photos/1200000/pexels-photo-1200000.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`} />
          <AvatarFallback className="text-lg">{member.name?.substring(0, 2) || 'M'}</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-2xl font-bold">{member.name || "Name not provided"}</h2>
          <p className="text-gray-600">{member.email}</p>
          <Badge className="mt-1 bg-green-600">Active Member</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-3 text-lg">Personal Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span>{member.profile?.phone || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date of Birth:</span>
              <span>{member.profile?.dob ? new Date(member.profile.dob).toLocaleDateString() : "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Age:</span>
              <span>{member.profile?.age || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span>{new Date(member.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-3 text-lg">Physical Stats</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Height:</span>
              <span>{member.profile?.height_cm  ? `${member.profile?.height_cm } cm` : "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span>{member.profile?.weight_kg ? `${member.profile.weight_kg} kg` : "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">BMI:</span>
              <span>{member.profile?.bmi || "Not calculated"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span>{member.profile?.plan || "No plan assigned"}</span>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3 text-lg">Assigned Staff</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <UserCheck className="h-4 w-4 mr-2" />
              Trainer
            </h4>
            {member.trainer ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {member.trainer.name?.substring(0, 2) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.trainer.name || "Unnamed Trainer"}</p>
                  <p className="text-xs text-gray-600">{member.trainer.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No trainer assigned</p>
            )}
          </div>

          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Utensils className="h-4 w-4 mr-2" />
              Nutritionist
            </h4>
            {member.nutritionist ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {member.nutritionist.name?.substring(0, 2) || 'N'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{member.nutritionist.name || "Unnamed Nutritionist"}</p>
                  <p className="text-xs text-gray-600">{member.nutritionist.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No nutritionist assigned</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button variant="outline" size="sm">
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        <Button variant="outline" size="sm">
          Send Message
        </Button>
      </div>
    </div>
  );
}

/* ------------------- Assignment Form ------------------- */
function AssignmentForm({ 
  member, 
  trainers, 
  nutritionists, 
  onSuccess 
}: { 
  member: User; 
  trainers: User[]; 
  nutritionists: User[]; 
  onSuccess: () => void; 
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<string>(member.trainer_id || "");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>(member.nutritionist_id || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        alert("Session expired. Please log in again.");
        return;
      }

      const res = await fetch(`/api/users/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          member_id: member.id,   // must always be a real uuid
          trainer_id: selectedTrainer && selectedTrainer !== "none" ? selectedTrainer : null,
          nutritionist_id: selectedNutritionist && selectedNutritionist !== "none" ? selectedNutritionist : null,
        }),
      });

      if (res.ok) {
        alert("Assignments updated successfully!");
        onSuccess();
      } else {
        const errorData = await res.json();
        alert(`Failed to update assignments: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      alert(`Failed to update assignments: ${err.message || "Unexpected error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <h4 className="font-medium mb-2">Member: {member.name || member.email}</h4>
        <p className="text-sm text-gray-600">Update trainer and nutritionist assignments</p>
      </div>

      <div>
        <Label>Assign Trainer</Label>
        <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
          <SelectTrigger>
            <SelectValue placeholder="Select a trainer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No trainer</SelectItem>
            {trainers.map((trainer) => (
              <SelectItem key={trainer.id} value={trainer.id}>
                {trainer.name || trainer.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Assign Nutritionist</Label>
        <Select value={selectedNutritionist} onValueChange={setSelectedNutritionist}>
          <SelectTrigger>
            <SelectValue placeholder="Select a nutritionist" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No nutritionist</SelectItem>
            {nutritionists.map((nutritionist) => (
              <SelectItem key={nutritionist.id} value={nutritionist.id}>
                {nutritionist.name || nutritionist.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={loading}>
  {loading ? "Updating..." : "Update Assignments"}
</Button>

      </div>
    </form>
  );
}