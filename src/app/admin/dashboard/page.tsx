"use client";

import { useEffect, useState, useCallback } from "react";
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
  Mail,
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import SearchAndSort from "@/components/SearchAndSort";
import { Toaster, toast } from "react-hot-toast";
import AppointmentBadge from "@/components/appointments/AppointmentBadge";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/* ====================== TYPES ====================== */
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
  member_profile_id?: string;
}

interface Appointment {
  id: string;
  member_id: string;
  host_id: string;
  host_type: string;
  start_time: string;
  end_time: string;
  title: string;
  meeting_type: "online" | "offline";
  meet_link?: string | null;
  appointment_notes?: { notes: string }[];
}

/* ====================== MAIN COMPONENT ====================== */
export default function AdminDashboard() {
  const [members, setMembers] = useState<User[]>([]);
  const [trainers, setTrainers] = useState<User[]>([]);
  const [nutritionists, setNutritionists] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [trainerAssignmentMember, setTrainerAssignmentMember] = useState<User | null>(null);
  const [nutritionistAssignmentMember, setNutritionistAssignmentMember] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [visibleMembersCount, setVisibleMembersCount] = useState(4);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalTrainers: 0,
    totalNutritionists: 0,
    monthlyRevenue: 0,
  });
  const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);
  const [isTrainerDialogOpen, setIsTrainerDialogOpen] = useState(false);
  const [isNutritionistDialogOpen, setIsNutritionistDialogOpen] = useState(false);

  const router = useRouter();

  /* ------------------- FETCH USERS ------------------- */
  const fetchUsers = useCallback(async () => {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast.error("Session expired. Please log in again.");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) throw new Error(`Failed to fetch users: ${await res.text()}`);

      const { users = [] } = await res.json();

      const membersList = users.filter((u: User) => u.role === "member");
      const trainersList = users.filter((u: User) => u.role === "trainer");
      const nutritionistsList = users.filter((u: User) => u.role === "nutritionist");

      const membersWithProfile = await Promise.all(
        membersList.map(async (m: any) => {
          const { data } = await supabase
            .from("member_profiles")
            .select("id")
            .eq("user_id", m.id)
            .single();
          return { ...m, member_profile_id: data?.id ?? null };
        })
      );

      setMembers(membersWithProfile);
      setTrainers(trainersList);
      setNutritionists(nutritionistsList);

      setStats({
        totalMembers: membersList.length,
        totalTrainers: trainersList.length,
        totalNutritionists: nutritionistsList.length,
        monthlyRevenue: 0,
      });
    } catch (err: any) {
      toast.error("Failed to load users.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  /* ------------------- FETCH APPOINTMENTS ------------------- */
  const fetchAppointments = useCallback(async () => {
    const { data, error } = await supabase
      .from("appointments")
      .select("*, appointment_notes(notes)")
      .order("start_time", { ascending: false });

    if (!error) setAppointments(data ?? []);
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAppointments();
  }, [fetchUsers, fetchAppointments]);

  /* ------------------- REALTIME ------------------- */
  useEffect(() => {
    const channel = supabase
      .channel("admin-appts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        fetchAppointments
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_notes" },
        fetchAppointments
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const handleLoadMoreMembers = () => setVisibleMembersCount(members.length);
  const handleViewMemberProfile = (member: User) => setSelectedMember(member);
  const handleAssignTrainerNutritionist = (member: User, role: "trainer" | "nutritionist") => {
    if (role === "trainer") setTrainerAssignmentMember(member);
    else setNutritionistAssignmentMember(member);
  };
  const getMemberAppointment = (member: User): Appointment | undefined => {
    if (!member.member_profile_id) return undefined;
    return appointments.find((a) => a.member_id === member.member_profile_id);
  };

  /* ------------------- RENDER ------------------- */
  return (
    <div className="min-h-screen pt-16 px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <div className="max-w-full sm:max-w-4xl lg:max-w-7xl mx-auto">
        <motion.h1
          className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-5"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Admin Dashboard
        </motion.h1>
        <motion.p
          className="text-sm sm:text-base text-gray-600 dark:text-gray-300"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Manage members, trainers, nutritionists and analytics.
        </motion.p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card className="animate-scale-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalMembers}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: "0.1s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Trainers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalTrainers}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: "0.2s" }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Nutritionists</CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats.totalNutritionists}</div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <p className="text-sm sm:text-base text-gray-500">Loading users...</p>
      ) : (
        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 sticky top-0 z-10 bg-white dark:bg-gray-800 mb-15 sm:mb-0">
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="trainers">Trainers</TabsTrigger>
            <TabsTrigger value="nutritionists">Nutritionists</TabsTrigger>
          </TabsList>

          {/* === MEMBERS TAB === */}
          <TabsContent value="members" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base sm:text-lg">Members Overview</CardTitle>
                <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">+ Add Member</Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-full sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New Member</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm
                      role="member"
                      trainers={trainers}
                      nutritionists={nutritionists}
                      onSuccess={() => {
                        fetchUsers();
                        setIsMemberDialogOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>

              <CardContent>
                <SearchAndSort
                  id="members"
                  data={members}
                  searchField="name"
                  sortField="created_at"
                  placeholder="Search members by name..."
                  className="mb-4"
                  render={(filtered) => (
                    <>
                      <div className="overflow-x-auto">
                        {/* HEADER */}
                        <div className="grid grid-cols-7 gap-2 sm:gap-4 px-1 sm:px-2 py-2 font-semibold text-gray-700 bg-gray-200 rounded-md mb-2 min-w-[700px]">
                          <span className="text-xs sm:text-sm truncate">Member</span>
                          <span className="text-xs sm:text-sm truncate">Trainer</span>
                          <span className="text-xs sm:text-sm truncate">Nutritionist</span>
                          <span className="text-xs sm:text-sm truncate">Status</span>
                          <span className="text-xs sm:text-sm truncate">Appointment</span>
                          <span className="text-xs sm:text-sm truncate"></span>
                          <span className="text-xs sm:text-sm truncate"></span>
                        </div>

                        {/* ROWS */}
                        <div className="space-y-4">
                          {filtered.length === 0 ? (
                            <p className="text-sm sm:text-base text-gray-500">No members found.</p>
                          ) : (
                            filtered.slice(0, visibleMembersCount).map((member, index) => {
                              const appt = getMemberAppointment(member);
                              return (
                                <div
                                  key={member.id}
                                  className="grid grid-cols-7 items-center p-2 sm:p-3 dark:bg-gray-300 dark:hover:bg-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer min-w-[700px]"
                                  style={{ animationDelay: `${index * 0.1}s` }}
                                  onClick={() => router.push(`/member/${member.id}`)}
                                >
                                  {/* Member */}
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                                      <AvatarImage
                                        src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`}
                                      />
                                      <AvatarFallback className="text-xs sm:text-sm">
                                        {member.name?.substring(0, 2) || "M"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-semibold text-black text-xs sm:text-sm truncate">
                                      {member.name || "—"}
                                    </span>
                                  </div>

                                  {/* Trainer */}
                                  <span className="text-xs sm:text-sm text-gray-700 truncate">
                                    {member.trainer?.name || "Not assigned"}
                                  </span>

                                  {/* Nutritionist */}
                                  <span className="text-xs sm:text-sm text-gray-700 truncate">
                                    {member.nutritionist?.name || "Not assigned"}
                                  </span>

                                  {/* Status */}
                                  <Badge variant="default" className="bg-green-600 text-xs sm:text-sm">
                                    Active
                                  </Badge>

                                  {/* Appointment */}
                                  <div className="flex justify-center">
                                    {appt ? (
                                      <AppointmentBadge appointment={appt} onAddNotes={() => {}} />
                                    ) : (
                                      <span className="text-xs text-gray-400">—</span>
                                    )}
                                  </div>

                                  {/* View */}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    title="View member info"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleViewMemberProfile(member);
                                    }}
                                    className="h-7 w-7 sm:h-8 sm:w-8"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>

                                  {/* Assign */}
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        title="Assign trainer or nutritionist"
                                        className="h-7 w-7 sm:h-8 sm:w-8"
                                      >
                                        <UserPlus className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAssignTrainerNutritionist(member, "trainer");
                                        }}
                                      >
                                        Assign Trainer
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAssignTrainerNutritionist(member, "nutritionist");
                                        }}
                                      >
                                        Assign Nutritionist
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {filtered.length > 4 && visibleMembersCount < filtered.length && (
                        <div className="flex justify-center mt-4 sm:mt-6">
                          <Button variant="outline" onClick={handleLoadMoreMembers} className="text-sm sm:text-base">
                            Load More Members
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* === TRAINERS TAB (unchanged) === */}
          <TabsContent value="trainers" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base sm:text-lg">Trainers Overview</CardTitle>
                <Dialog open={isTrainerDialogOpen} onOpenChange={setIsTrainerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">+ Add Trainer</Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-full sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New Trainer</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm
                      role="trainer"
                      onSuccess={() => {
                        fetchUsers();
                        setIsTrainerDialogOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <SearchAndSort
                  id="trainers"
                  data={trainers}
                  searchField="name"
                  sortField="created_at"
                  placeholder="Search trainers by name..."
                  className="mb-4"
                  render={(filtered) => (
                    <div className="space-y-4">
                      {filtered.length === 0 ? (
                        <p className="text-sm sm:text-base text-gray-500">No trainers found.</p>
                      ) : (
                        filtered.map((trainer, index) => (
                          <div
                            key={trainer.id}
                            className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                <AvatarImage
                                  src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`}
                                />
                                <AvatarFallback className="text-sm">
                                  {trainer.name?.substring(0, 2) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-black text-sm sm:text-base">
                                  {trainer.name || "—"}
                                </h3>
                                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{trainer.email}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-2 sm:space-x-6 text-black mt-3 sm:mt-0">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm">
                                  <Users className="h-3 w-3" />
                                  <span className="font-medium">18</span>
                                </div>
                                <p className="text-xs text-gray-600">Clients</p>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">4.8</span>
                                </div>
                                <p className="text-xs text-gray-600">Rating</p>
                              </div>

                              <div className="text-center">
                                <p className="text-xs sm:text-sm font-medium">5 years</p>
                                <p className="text-xs text-gray-600">Experience</p>
                              </div>

                              <div className="text-center sm:text-right">
                                <Badge variant="default" className="bg-green-600 text-xs sm:text-sm">
                                  Active
                                </Badge>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Joined:{" "}
                                  {trainer.created_at
                                    ? new Date(trainer.created_at).toLocaleDateString()
                                    : "—"}
                                </p>
                              </div>

                              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* === NUTRITIONISTS TAB (unchanged) === */}
          <TabsContent value="nutritionists" className="space-y-4">
            <Card className="animate-slide-up">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base sm:text-lg">Nutritionists Overview</CardTitle>
                <Dialog open={isNutritionistDialogOpen} onOpenChange={setIsNutritionistDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">+ Add Nutritionist</Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-full sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-base sm:text-lg">Create New Nutritionist</DialogTitle>
                    </DialogHeader>
                    <CreateUserForm
                      role="nutritionist"
                      onSuccess={() => {
                        fetchUsers();
                        setIsNutritionistDialogOpen(false);
                      }}
                    />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <SearchAndSort
                  id="nutritionists"
                  data={nutritionists}
                  searchField="name"
                  sortField="created_at"
                  placeholder="Search nutritionists by name..."
                  className="mb-4"
                  render={(filtered) => (
                    <div className="space-y-4">
                      {filtered.length === 0 ? (
                        <p className="text-sm sm:text-base text-gray-500">No nutritionists found.</p>
                      ) : (
                        filtered.map((nutritionist, index) => (
                          <div
                            key={nutritionist.id}
                            className="flex flex-col sm:flex-row items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                              <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                                <AvatarImage
                                  src={`https://images.pexels.com/photos/${1200000 + index}/pexels-photo-${1200000 + index}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`}
                                />
                                <AvatarFallback className="text-sm">
                                  {nutritionist.name?.substring(0, 2) || "N"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h3 className="font-semibold text-black text-sm sm:text-base">
                                  {nutritionist.name || "—"}
                                </h3>
                                <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600">
                                  <div className="flex items-center space-x-1">
                                    <Mail className="h-3 w-3" />
                                    <span>{nutritionist.email}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end space-x-2 sm:space-x-6 text-black mt-3 sm:mt-0">
                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm">
                                  <Users className="h-3 w-3" />
                                  <span className="font-medium">15</span>
                                </div>
                                <p className="text-xs text-gray-600">Clients</p>
                              </div>

                              <div className="text-center">
                                <div className="flex items-center justify-center space-x-1 text-xs sm:text-sm">
                                  <Star className="h-3 w-3 text-yellow-500" />
                                  <span className="font-medium">4.9</span>
                                </div>
                                <p className="text-xs text-gray-600">Rating</p>
                              </div>

                              <div className="text-center">
                                <p className="text-xs sm:text-sm font-medium">4 years</p>
                                <p className="text-xs text-gray-600">Experience</p>
                              </div>

                              <div className="text-center sm:text-right">
                                <Badge variant="default" className="bg-green-600 text-xs sm:text-sm">
                                  Active
                                </Badge>
                                <p className="text-xs sm:text-sm text-gray-600">
                                  Joined:{" "}
                                  {nutritionist.created_at
                                    ? new Date(nutritionist.created_at).toLocaleDateString()
                                    : "—"}
                                </p>
                              </div>

                              <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* === DIALOGS === */}
      <Dialog open={!!selectedMember} onOpenChange={() => setSelectedMember(null)}>
        <DialogContent className="w-full max-w-full sm:max-w-lg md:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              Member Profile - {selectedMember?.name || selectedMember?.email}
            </DialogTitle>
          </DialogHeader>
          {selectedMember && <MemberProfileView member={selectedMember} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!trainerAssignmentMember} onOpenChange={() => setTrainerAssignmentMember(null)}>
        <DialogContent className="w-full max-w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Assign Trainer</DialogTitle>
          </DialogHeader>
          {trainerAssignmentMember && (
            <AssignmentForm
              member={trainerAssignmentMember}
              trainers={trainers}
              nutritionists={[]}
              onSuccess={() => {
                fetchUsers();
                setTrainerAssignmentMember(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!nutritionistAssignmentMember} onOpenChange={() => setNutritionistAssignmentMember(null)}>
        <DialogContent className="w-full max-w-full sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Assign Nutritionist</DialogTitle>
          </DialogHeader>
          {nutritionistAssignmentMember && (
            <AssignmentForm
              member={nutritionistAssignmentMember}
              trainers={[]}
              nutritionists={nutritionists}
              onSuccess={() => {
                fetchUsers();
                setNutritionistAssignmentMember(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ====================== CREATE USER FORM – FIXED & ENHANCED ====================== */
const memberSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().optional(),
  height_cm: z.coerce.number().positive().optional(),
  weight_kg: z.coerce.number().positive().optional(),
  plan: z.enum(["none", "yearly", "half-yearly", "quarterly"]).optional(),
  dob: z.string().optional(),
  gender: z.enum(["none", "male", "female", "other"]).optional(),
  trainer_id: z.string().optional(),
  nutritionist_id: z.string().optional(),
});

const staffSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type MemberFormValues = z.infer<typeof memberSchema>;
type StaffFormValues = z.infer<typeof staffSchema>;

interface CreateUserFormProps {
  role: "member" | "trainer" | "nutritionist";
  trainers?: User[];
  nutritionists?: User[];
  onSuccess?: () => void;
}

function CreateUserForm({ role, trainers = [], nutritionists = [], onSuccess }: CreateUserFormProps) {
  const isMember = role === "member";
  const schema = isMember ? memberSchema : staffSchema;

  const form = useForm<MemberFormValues | StaffFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      height_cm: undefined,
      weight_kg: undefined,
      plan: "none",
      dob: "",
      gender: "none",
      trainer_id: "none",     // Use "none" instead of ""
      nutritionist_id: "none", // Use "none" instead of ""
    },
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (values: any) => {
    setLoading(true);
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast.error("Session expired.");
        return;
      }

      const payload: any = {
        email: values.email,
        password: values.password,
        name: values.name || null,
        role,
        ...(isMember && {
          height_cm: values.height_cm ?? null,
          weight_kg: values.weight_kg ?? null,
          plan: values.plan === "none" ? null : values.plan,
          dob: values.dob ?? null,
          gender: values.gender === "none" ? null : values.gender,
          phone: values.phone ?? null,
          trainer_id: values.trainer_id === "none" ? null : values.trainer_id,
          nutritionist_id: values.nutritionist_id === "none" ? null : values.nutritionist_id,
        }),
      };

      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? "Failed to create user");
        return;
      }

      toast.success(`${role} created!`);
      onSuccess?.();
    } catch (e: any) {
      toast.error(e.message ?? "Unexpected error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          {/* LEFT COLUMN */}
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password *</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isMember && (
              <>
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 234 567 890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="height_cm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Height (cm)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="170" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="70" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
          </div>

          {/* RIGHT COLUMN – ONLY FOR MEMBERS */}
          {isMember && (
            <div className="space-y-4">
              {/* PLAN */}
              <FormField
                control={form.control}
                name="plan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="half-yearly">Half-Yearly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* DOB */}
              <FormField
                control={form.control}
                name="dob"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* GENDER */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* TRAINER – FIXED: value="none" */}
              <FormField
                control={form.control}
                name="trainer_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Trainer (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select trainer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No trainer</SelectItem>
                        {trainers.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name ?? t.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* NUTRITIONIST – FIXED: value="none" */}
              <FormField
                control={form.control}
                name="nutritionist_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Nutritionist (optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select nutritionist" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No nutritionist</SelectItem>
                        {nutritionists.map((n) => (
                          <SelectItem key={n.id} value={n.id}>
                            {n.name ?? n.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? `Creating ${role}…` : `Create ${role}`}
        </Button>
      </form>
    </Form>
  );
}

/* ====================== MEMBER PROFILE VIEW (unchanged) ====================== */
function MemberProfileView({ member }: { member: User }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-center space-x-0 sm:space-x-4 space-y-3 sm:space-y-0">
        <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
          <AvatarImage src={`https://images.pexels.com/photos/1200000/pexels-photo-1200000.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop`} />
          <AvatarFallback className="text-base sm:text-lg">{member.name?.substring(0, 2) || "M"}</AvatarFallback>
        </Avatar>
        <div className="text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold">{member.name || "Name not provided"}</h2>
          <p className="text-sm sm:text-base text-gray-600">{member.email}</p>
          <Badge className="mt-1 bg-green-600 text-xs sm:text-sm">Active Member</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div>
          <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">Personal Information</h3>
          <div className="space-y-2 text-xs sm:text-sm">
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
          <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">Physical Stats</h3>
          <div className="space-y-2 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Height:</span>
              <span>{member.profile?.height_cm ? `${member.profile?.height_cm} cm` : "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Weight:</span>
              <span>{member.profile?.weight_kg ? `${member.profile?.weight_kg} kg` : "Not provided"}</span>
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
        <h3 className="font-semibold mb-2 sm:mb-3 text-base sm:text-lg">Assigned Staff</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-3 sm:p-4 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center text-sm sm:text-base">
              <UserCheck className="h-4 w-4 mr-2" />
              Trainer
            </h4>
            {member.trainer ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{member.trainer.name?.substring(0, 2) || "T"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-xs sm:text-sm">{member.trainer.name || "Unnamed Trainer"}</p>
                  <p className="text-xs text-gray-600">{member.trainer.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">No trainer assigned</p>
            )}
          </div>

          <div className="p-3 sm:p-5 border rounded-lg">
            <h4 className="font-medium mb-2 flex items-center text-sm sm:text-base">
              <Utensils className="h-4 w-4 mr-2" />
              Nutritionist
            </h4>
            {member.nutritionist ? (
              <div className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{member.nutritionist.name?.substring(0, 2) || "N"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-xs sm:text-sm">{member.nutritionist.name || "Unnamed Nutritionist"}</p>
                  <p className="text-xs text-gray-600">{member.nutritionist.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-gray-500">No nutritionist assigned</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3 sm:pt-4 border-t">
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          <Edit3 className="h-4 w-4 mr-2" />
          Edit Profile
        </Button>
        <Button variant="outline" size="sm" className="text-xs sm:text-sm">
          Send Message
        </Button>
      </div>
    </div>
  );
}

/* ====================== ASSIGNMENT FORM (unchanged) ====================== */
function AssignmentForm({
  member,
  trainers,
  nutritionists,
  onSuccess,
}: {
  member: User;
  trainers: User[];
  nutritionists: User[];
  onSuccess: () => void;
}) {
  const [selectedTrainer, setSelectedTrainer] = useState<string>(member.trainer_id || "");
  const [selectedNutritionist, setSelectedNutritionist] = useState<string>(member.nutritionist_id || "");
  const [loading, setLoading] = useState(false);

  const isTrainerForm = trainers.length > 0;
  const isNutritionistForm = nutritionists.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const body: any = { member_id: member.id };
      if (isTrainerForm) {
        body.trainer_id = selectedTrainer && selectedTrainer !== "none" ? selectedTrainer : null;
      }
      if (isNutritionistForm) {
        body.nutritionist_id = selectedNutritionist && selectedNutritionist !== "none" ? selectedNutritionist : null;
      }

      const res = await fetch(`/api/users/assign`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(`${isTrainerForm ? "Trainer" : "Nutritionist"} assigned successfully!`);
        onSuccess();
      } else {
        const errorData = await res.json();
        toast.error(`Failed to update assignment: ${errorData.error || "Unknown error"}`);
      }
    } catch (err: any) {
      toast.error(`Failed to update assignment: ${err.message || "Unexpected error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="mb-4">
        <h4 className="font-medium mb-2 text-sm sm:text-base">Member: {member.name || member.email}</h4>
        <p className="text-xs sm:text-sm text-gray-600">
          Update {isTrainerForm ? "trainer" : "nutritionist"} assignment
        </p>
      </div>

      {isTrainerForm && (
        <div>
          <Label className="text-sm sm:text-base">Assign Trainer</Label>
          <Select value={selectedTrainer} onValueChange={setSelectedTrainer}>
            <SelectTrigger className="text-sm sm:text-base">
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
      )}

      {isNutritionistForm && (
        <div>
          <Label className="text-sm sm:text-base">Assign Nutritionist</Label>
          <Select value={selectedNutritionist} onValueChange={setSelectedNutritionist}>
            <SelectTrigger className="text-sm sm:text-base">
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
      )}

      <div className="flex justify-end space-x-2 pt-3 sm:pt-4">
        <Button type="submit" disabled={loading} className="text-sm sm:text-base">
          {loading ? "Updating..." : `Update ${isTrainerForm ? "Trainer" : "Nutritionist"}`}
        </Button>
      </div>
    </form>
  );
}