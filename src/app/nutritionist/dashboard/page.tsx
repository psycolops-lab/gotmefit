
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import { Loader2, User, Apple, AlertCircle, BarChart2, Eye } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
import toast, { Toaster } from "react-hot-toast";

type DietPlan = {
  id: string;
  user_email: string;
  diet_plan: { [key: string]: { [key: string]: string }[] };
  created_at: string;
  updated_at: string;
};

type DietHistory = {
  id: string;
  meal_plan_id: string;
  date: string;
  intake: { [key: string]: boolean };
  created_at: string;
};

type DietChartData = {
  date: string;
  completedMeals: number;
};

type Member = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  goal?: string | null;
  activity_level?: string | null;
  latest_diet_plan?: DietPlan | null;
  created_at: string;
};

type MealItem = {
  name: string;
  quantity: string;
};

type Meal = {
  name: string;
  items: MealItem[];
};

export default function NutritionistDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showDietModal, setShowDietModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newDietPlan, setNewDietPlan] = useState<Meal[]>([
    { name: "Meal 1", items: [{ name: "", quantity: "" }] },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [dietHistory, setDietHistory] = useState<DietHistory[]>([]);
  const [chartData, setChartData] = useState<DietChartData[]>([]);
  const memoizedMembers = useMemo(() => members, [members]);
  const router = useRouter();

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
        toast.error("Not authenticated. Please log in.");
        setLoading(false);
        return;
      }

      console.log("loadMembers: Session retrieved:", {
        userId: session.user.id,
        email: session.user.email,
      });

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
        toast.error("No members assigned to you.");
        setLoading(false);
        return;
      }

      const memberIds = memberProfiles.map(m => m.user_id);

      const { data: userDetails, error: userError } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", memberIds);

      if (userError) {
        console.error("loadMembers: users error:", userError);
        throw new Error(`Failed to fetch user details: ${userError.message}`);
      }

      console.log("loadMembers: userDetails:", userDetails);

      const { data: dietPlans, error: dietError } = await supabase
        .from("diet")
        .select("*")
        .in("user_email", userDetails?.map(u => u.email) || []);

      if (dietError) {
        console.error("loadMembers: diet error:", dietError);
        throw new Error(`Failed to fetch diet plans: ${dietError.message}`);
      }

      console.log("loadMembers: dietPlans:", dietPlans);

      const dietMap = new Map<string, DietPlan>();
      dietPlans?.forEach(dp => {
        const user = userDetails?.find(u => u.email === dp.user_email);
        if (user) {
          dietMap.set(user.id, dp);
        }
      });

      const mergedMembers: Member[] = memberProfiles.map(member => {
        const userDetail = userDetails?.find(u => u.id === member.user_id);
        const latestDietPlan = dietMap.get(member.user_id);

        return {
          id: member.id,
          user_id: member.user_id,
          name: userDetail?.name || "Unknown User",
          email: userDetail?.email,
          goal: member.goal,
          activity_level: member.activity_level,
          latest_diet_plan: latestDietPlan || null,
          created_at: member.created_at,
        };
      });

      console.log("loadMembers: mergedMembers:", mergedMembers);
      setMembers(mergedMembers);
    } catch (err: any) {
      console.error("loadMembers: Error:", err);
      setError(`Failed to load members: ${err.message}`);
      toast.error(`Failed to load members: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadDietHistory(memberId: string) {
    setDietHistory([]);
    setChartData([]);
    try {
      const { data: dietData, error: dietError } = await supabase
        .from("diet")
        .select("*")
        .eq("user_email", members.find(m => m.user_id === memberId)?.email)
        .maybeSingle();

      if (dietError) {
        console.error("loadDietHistory: diet error:", dietError);
        throw new Error(`Failed to fetch diet plan: ${dietError.message}`);
      }

      if (!dietData) {
        console.log("loadDietHistory: No diet plan found");
        return;
      }

      const { data: history, error } = await supabase
        .from("diet_history")
        .select("*")
        .eq("meal_plan_id", dietData.id)
        .order("date", { ascending: true });

      if (error) {
        console.error("loadDietHistory: Error:", error);
        throw new Error(`Failed to fetch diet history: ${error.message}`);
      }

      const chartData: DietChartData[] = (history || []).map(h => ({
        date: new Date(h.date).toLocaleDateString(),
        completedMeals: Object.values(h.intake).filter(Boolean).length,
      }));

      console.log("loadDietHistory: chartData:", chartData);
      setDietHistory(history || []);
      setChartData(chartData);
    } catch (err: any) {
      console.error("loadDietHistory: Error:", err);
      setError(`Failed to load diet history: ${err.message}`);
      toast.error(`Failed to load diet history: ${err.message}`);
    }
  }

  const addMeal = () => {
    setNewDietPlan(prev => [
      ...prev,
      { name: `Meal ${prev.length + 1}`, items: [{ name: "", quantity: "" }] },
    ]);
  };

  const removeMeal = (index: number) => {
    if (newDietPlan.length > 1) {
      setNewDietPlan(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateMealName = (index: number, name: string) => {
    setNewDietPlan(prev =>
      prev.map((meal, i) => (i === index ? { ...meal, name } : meal))
    );
  };

  const addMealItem = (mealIndex: number) => {
    setNewDietPlan(prev =>
      prev.map((meal, i) =>
        i === mealIndex
          ? { ...meal, items: [...meal.items, { name: "", quantity: "" }] }
          : meal
      )
    );
  };

  const updateMealItem = (mealIndex: number, itemIndex: number, field: "name" | "quantity", value: string) => {
    setNewDietPlan(prev =>
      prev.map((meal, i) =>
        i === mealIndex
          ? {
              ...meal,
              items: meal.items.map((item, j) =>
                j === itemIndex ? { ...item, [field]: value } : item
              ),
            }
          : meal
      )
    );
  };

  const removeMealItem = (mealIndex: number, itemIndex: number) => {
    setNewDietPlan(prev =>
      prev.map((meal, i) =>
        i === mealIndex
          ? { ...meal, items: meal.items.filter((_, j) => j !== itemIndex) }
          : meal
      )
    );
  };

  async function handleUpdateDietPlan() {
    const isValid = newDietPlan.every(
      meal =>
        meal.name.trim() &&
        meal.items.some(item => item.name.trim() && item.quantity.trim())
    );

    if (!selectedMember || !isValid) {
      setError("Please enter a meal name and at least one valid item for each meal");
      toast.error("Please enter a meal name and at least one valid item for each meal");
      return;
    }

    setUpdating(selectedMember.user_id);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required");
      }

      const dietPlan = newDietPlan.reduce((acc, meal) => {
        acc[meal.name] = meal.items
          .filter(item => item.name.trim() && item.quantity.trim())
          .map(item => ({ [item.name.trim()]: item.quantity.trim() }));
        return acc;
      }, {} as { [key: string]: { [key: string]: string }[] });

      const payload = {
        user_email: selectedMember.email,
        diet_plan: dietPlan,
      };

      console.log("handleUpdateDietPlan: Payload:", payload);

      const { data: existingDiet, error: fetchError } = await supabase
        .from("diet")
        .select("*")
        .eq("user_email", selectedMember.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("handleUpdateDietPlan: Fetch error:", fetchError);
        throw new Error(`Failed to check existing diet: ${fetchError.message}`);
      }

      let response;
      if (existingDiet) {
        response = await supabase
          .from("diet")
          .update({ diet_plan: dietPlan, updated_at: new Date().toISOString() })
          .eq("id", existingDiet.id);
      } else {
        response = await supabase
          .from("diet")
          .insert(payload);
      }

      if (response.error) {
        console.error("handleUpdateDietPlan: API error:", response.error);
        throw new Error(`Failed to update diet plan: ${response.error.message}`);
      }

      setMembers(prev =>
        prev.map(member =>
          member.user_id === selectedMember.user_id
            ? {
                ...member,
                latest_diet_plan: {
                  id: existingDiet?.id || "temp-" + Date.now(),
                  user_email: selectedMember.email!,
                  diet_plan: dietPlan,
                  created_at: existingDiet?.created_at || new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                },
              }
            : member
        )
      );

      setShowDietModal(false);
      setNewDietPlan([{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]);
      setSelectedMember(null);
      toast.success("Diet plan updated successfully!");
      loadMembers();
    } catch (err: any) {
      console.error("handleUpdateDietPlan: Error:", err);
      setError(`Failed to update diet plan: ${err.message}`);
      toast.error(`Failed to update diet plan: ${err.message}`);
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
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
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
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Latest Diet Plan</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{member.name}</div>
                          {member.email && (
                            <div className="text-sm text-gray-500">{member.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.latest_diet_plan ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {Object.entries(member.latest_diet_plan.diet_plan).map(([meal, items]) => (
                                  <div key={meal}>
                                    {meal}: {items.map(item => `${Object.keys(item)[0]}: ${Object.values(item)[0]}`).join(", ")}
                                  </div>
                                ))}
                              </div>
                              <div className="text-xs text-gray-500">
                                Updated {formatDistanceToNowStrict(new Date(member.latest_diet_plan.updated_at))} ago
                              </div>
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic">No diet plan assigned yet</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/member/${member.user_id}`)}
                          title="View Member Dashboard"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowChartModal(true);
                            loadDietHistory(member.user_id);
                          }}
                        >
                          <BarChart2 className="h-4 w-4 mr-2" />
                          History
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setNewDietPlan(
                              member.latest_diet_plan
                                ? Object.entries(member.latest_diet_plan.diet_plan).map(([meal, items]) => ({
                                    name: meal,
                                    items: items.map(item => ({
                                      name: Object.keys(item)[0],
                                      quantity: Object.values(item)[0],
                                    })),
                                  }))
                                : [{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]
                            );
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
                              {member.latest_diet_plan ? "Update Diet Plan" : "Assign Diet Plan"}
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

      <Dialog open={showDietModal} onOpenChange={(open) => {
        setShowDietModal(open);
        if (!open) {
          setNewDietPlan([{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]);
          setSelectedMember(null);
          setError(null);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.latest_diet_plan ? `Update Diet Plan for ${selectedMember.name}` : `Assign Diet Plan for ${selectedMember?.name}`}
            </DialogTitle>
            <DialogDescription>
              Enter meal names and items with quantities (e.g., Oats, 50g).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {newDietPlan.map((meal, mealIndex) => (
              <div key={mealIndex}>
                <div className="flex items-center space-x-2">
                  <Input
                    placeholder="Meal Name (e.g., Breakfast)"
                    value={meal.name}
                    onChange={(e) => updateMealName(mealIndex, e.target.value)}
                    className="flex-1"
                  />
                  {newDietPlan.length > 1 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeMeal(mealIndex)}
                    >
                      Remove Meal
                    </Button>
                  )}
                </div>
                {meal.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="flex items-center space-x-2 mt-2">
                    <Input
                      placeholder="Item (e.g., Oats)"
                      value={item.name}
                      onChange={(e) => updateMealItem(mealIndex, itemIndex, "name", e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Quantity (e.g., 50g)"
                      value={item.quantity}
                      onChange={(e) => updateMealItem(mealIndex, itemIndex, "quantity", e.target.value)}
                      className="flex-1"
                    />
                    {meal.items.length > 1 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeMealItem(mealIndex, itemIndex)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addMealItem(mealIndex)}
                  className="mt-2"
                >
                  Add Item
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addMeal}
              className="mt-4"
            >
              Add Meal
            </Button>
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
                  setNewDietPlan([{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]);
                  setSelectedMember(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateDietPlan} disabled={updating === selectedMember?.user_id}>
                {updating === selectedMember?.user_id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Submit Diet Plan"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            <DialogTitle>Diet Adherence for {selectedMember?.name}</DialogTitle>
            <DialogDescription>Track meal plan adherence over time.</DialogDescription>
          </DialogHeader>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: "Meals Completed", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completedMeals" stroke="#8884d8" name="Completed Meals" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8">
              No diet history available for this member.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
