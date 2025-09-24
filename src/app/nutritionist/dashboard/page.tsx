
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, User, Apple, AlertCircle, BarChart2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DietHistory = {
  id: string;
  member_id: string;
  nutritionist_id: string;
  diet_entry: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  recorded_at: string;
};

type DietChartData = {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Member = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  goal?: string | null;
  activity_level?: string | null;
  latest_diet?: DietHistory | null;
  created_at: string;
};

export default function NutritionistDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newDiet, setNewDiet] = useState({
    diet_entry: "",
    calories: "",
    protein: "",
    carbs: "",
    fats: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [dietHistory, setDietHistory] = useState<DietHistory[]>([]);
  const [chartData, setChartData] = useState<DietChartData[]>([]);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.user?.id) {
        console.error("loadMembers: Session error:", { message: sessionError?.message });
        setError("Not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      console.log("loadMembers: Session retrieved:", {
        userId: session.user.id,
        email: session.user.email,
      });

      // Fetch assigned members
      const { data: memberProfiles, error: mpError } = await supabase
        .from("member_profiles")
        .select(`
          id,
          user_id,
          goal,
          activity_level,
          created_at,
          assigned_nutritionist_id
        `)
        .eq("assigned_nutritionist_id", session.user.id)
        .order("created_at", { ascending: true });

      if (mpError) {
        console.error("loadMembers: member_profiles error:", mpError);
        throw new Error(`Failed to fetch member profiles: ${mpError.message}`);
      }

      console.log("loadMembers: member_profiles:", memberProfiles);

      if (!memberProfiles || memberProfiles.length === 0) {
        console.log("loadMembers: No members assigned");
        setMembers([]);
        setError("No members assigned to you.");
        setLoading(false);
        return;
      }

      const memberIds = memberProfiles.map(m => m.user_id);

      // Fetch member details from users
      const { data: userDetails, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", memberIds);

      if (userError) {
        console.error("loadMembers: users error:", userError);
        throw new Error(`Failed to fetch user details: ${userError.message}`);
      }

      console.log("loadMembers: userDetails:", userDetails);

      // Fetch latest diet history
      const { data: allDietHistory, error: dietError } = await supabase
        .from("diet_history")
        .select("*")
        .in("member_id", memberIds)
        .order("recorded_at", { ascending: false });

      if (dietError) {
        console.error("loadMembers: diet_history error:", dietError);
        throw new Error(`Failed to fetch diet history: ${dietError.message}`);
      }

      console.log("loadMembers: allDietHistory:", allDietHistory);

      const dietMap = new Map<string, DietHistory>();
      allDietHistory?.forEach(dh => {
        if (!dietMap.has(dh.member_id)) {
          dietMap.set(dh.member_id, dh);
        }
      });

      const mergedMembers: Member[] = memberProfiles.map(member => {
        const userDetail = userDetails?.find(u => u.id === member.user_id);
        const latestDiet = dietMap.get(member.user_id);

        return {
          id: member.id,
          user_id: member.user_id,
          name: userDetail?.name || "Unknown User",
          email: userDetail?.email,
          goal: member.goal,
          activity_level: member.activity_level,
          latest_diet: latestDiet || null,
          created_at: member.created_at,
        };
      });

      console.log("loadMembers: mergedMembers:", mergedMembers);
      setMembers(mergedMembers);
    } catch (err: any) {
      console.error("loadMembers: Error:", err);
      setError(`Failed to load members: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadDietHistory(memberId: string) {
    try {
      const { data: history, error } = await supabase
        .from("diet_history")
        .select("*")
        .eq("member_id", memberId)
        .order("recorded_at", { ascending: true });

      if (error) {
        console.error("loadDietHistory: Error:", error);
        throw new Error(`Failed to fetch diet history: ${error.message}`);
      }

      const chartData: DietChartData[] = (history || []).map(h => ({
        date: new Date(h.recorded_at).toLocaleDateString(),
        calories: h.calories,
        protein: h.protein,
        carbs: h.carbs,
        fats: h.fats,
      }));

      console.log("loadDietHistory: chartData:", chartData);
      setDietHistory(history || []);
      setChartData(chartData);
    } catch (err: any) {
      console.error("loadDietHistory: Error:", err);
      setError(`Failed to load diet history: ${err.message}`);
    }
  }

  async function handleUpdateDiet() {
    if (!selectedMember || !newDiet.diet_entry || !newDiet.calories) {
      setError("Please enter diet entry and calories");
      return;
    }

    setUpdating(selectedMember.user_id);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required");
      }

      const payload = {
        member_user_id: selectedMember.user_id,
        diet_entry: newDiet.diet_entry.trim(),
        calories: Number(newDiet.calories),
        protein: Number(newDiet.protein || 0),
        carbs: Number(newDiet.carbs || 0),
        fats: Number(newDiet.fats || 0),
      };

      console.log("handleUpdateDiet: Payload:", payload);

      const response = await fetch("/api/nutritionist/update-diet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error("handleUpdateDiet: API error:", result);
        throw new Error(result.error || "Failed to update diet");
      }

      setMembers(prev =>
        prev.map(member =>
          member.user_id === selectedMember.user_id
            ? {
                ...member,
                latest_diet: {
                  id: "temp-" + Date.now(),
                  member_id: member.user_id,
                  nutritionist_id: session.user.id,
                  ...payload,
                  recorded_at: new Date().toISOString(),
                },
              }
            : member
        )
      );

      setShowDietModal(false);
      setNewDiet({
        diet_entry: "",
        calories: "",
        protein: "",
        carbs: "",
        fats: "",
      });
      setSelectedMember(null);
      alert("Diet updated successfully!");
      loadMembers();
    } catch (err: any) {
      console.error("handleUpdateDiet: Error:", err);
      setError(`Failed to update diet: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-green-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 min-h-screen mt-16"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nutritionist Dashboard</h1>
          <p className="text-gray-600 dark:text-white">Manage your assigned members ({members.length})</p>
        </div>
        <Button onClick={loadMembers} variant="outline">Refresh</Button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 border border-red-200 rounded-lg flex items-center"
        >
          <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      <AnimatePresence>
        {members.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No members assigned</h3>
            <p className="text-gray-500 dark:text-white">You don&apos;t have any members assigned to you yet. Contact admin to get assignments.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="">
                    <TableHead>Member</TableHead>
                    
                    {/* <TableHead>Activity Level</TableHead> */}
                    <TableHead>Latest Diet</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id} className="border-b ">
                      <TableCell className="font-medium">
                        
                          <div className="font-semibold">{member.name}</div>
                          {member.email && (
                            <div className="text-sm text-gray-500">{member.email}</div>
                          )}
                        </TableCell>
                      
                      {/* <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {member.activity_level ?? "—"}
                        </Badge>
                      </TableCell> */}
                      <TableCell>
                        <div className="space-y-1">
                          {member.latest_diet ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {member.latest_diet.diet_entry.length > 60
                                  ? `${member.latest_diet.diet_entry.substring(0, 60)}...`
                                  : member.latest_diet.diet_entry}
                              </div>
                              <div className="text-xs text-gray-500">
                                Updated {formatDistanceToNowStrict(new Date(member.latest_diet.recorded_at))} ago
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic">No diet assigned yet</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowChartModal(true);
                            loadDietHistory(member.user_id);
                          }}
                        >
                          <BarChart2 className="h-4 w-4 mr-2" />
                          Chart
                        </Button> */}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setNewDiet({
                              diet_entry: member.latest_diet?.diet_entry || "",
                              calories: member.latest_diet?.calories.toString() || "",
                              protein: member.latest_diet?.protein.toString() || "",
                              carbs: member.latest_diet?.carbs.toString() || "",
                              fats: member.latest_diet?.fats.toString() || "",
                            });
                            setShowDietModal(true);
                          }}
                          disabled={updating === member.user_id}
                        >
                          {updating === member.user_id ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Apple className="h-4 w-4 mr-2" />
                              {member.latest_diet ? "Update Diet" : "Assign Diet"}
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diet Update Modal */}
      <Dialog open={showDietModal} onOpenChange={(open) => {
        setShowDietModal(open);
        if (!open) {
          setNewDiet({ diet_entry: "", calories: "", protein: "", carbs: "", fats: "" });
          setSelectedMember(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.latest_diet ? `Update Diet for ${selectedMember.name}` : `Assign Diet for ${selectedMember?.name}`}
            </DialogTitle>
            <DialogDescription>
              Enter the diet details including daily meal plan and macronutrient breakdown.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="diet_entry">Diet Plan Details</Label>
              <Input
                id="diet_entry"
                value={newDiet.diet_entry}
                onChange={(e) => setNewDiet({ ...newDiet, diet_entry: e.target.value })}
                placeholder="e.g., Breakfast: Oatmeal with berries, Lunch: Grilled chicken salad..."
                className="mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="calories">Calories (kcal)</Label>
                <Input
                  id="calories"
                  type="number"
                  value={newDiet.calories}
                  onChange={(e) => setNewDiet({ ...newDiet, calories: e.target.value })}
                  placeholder="e.g., 2000"
                  className="mt-1"
                  required
                />
              </div>
              <div>
                <Label htmlFor="protein">Protein (g)</Label>
                <Input
                  id="protein"
                  type="number"
                  value={newDiet.protein}
                  onChange={(e) => setNewDiet({ ...newDiet, protein: e.target.value })}
                  placeholder="e.g., 150"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="carbs">Carbs (g)</Label>
                <Input
                  id="carbs"
                  type="number"
                  value={newDiet.carbs}
                  onChange={(e) => setNewDiet({ ...newDiet, carbs: e.target.value })}
                  placeholder="e.g., 200"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="fats">Fats (g)</Label>
                <Input
                  id="fats"
                  type="number"
                  value={newDiet.fats}
                  onChange={(e) => setNewDiet({ ...newDiet, fats: e.target.value })}
                  placeholder="e.g., 70"
                  className="mt-1"
                />
              </div>
            </div>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDietModal(false);
                  setNewDiet({ diet_entry: "", calories: "", protein: "", carbs: "", fats: "" });
                  setSelectedMember(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateDiet} disabled={updating === selectedMember?.user_id}>
                {updating === selectedMember?.user_id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Submit Diet"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chart Modal */}
      <Dialog open={showChartModal} onOpenChange={(open) => {
        setShowChartModal(open);
        if (!open) {
          setDietHistory([]);
          setChartData([]);
          setSelectedMember(null);
        }
      }}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Diet Progress for {selectedMember?.name}</DialogTitle>
            <DialogDescription>Track macronutrient and calorie intake over time.</DialogDescription>
          </DialogHeader>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="calories" stroke="#8884d8" name="Calories (kcal)" />
                <Line type="monotone" dataKey="protein" stroke="#82ca9d" name="Protein (g)" />
                <Line type="monotone" dataKey="carbs" stroke="#ffc658" name="Carbs (g)" />
                <Line type="monotone" dataKey="fats" stroke="#ff7300" name="Fats (g)" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 ">
              No diet history available for this member.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
