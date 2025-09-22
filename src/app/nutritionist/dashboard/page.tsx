"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  format, 
  formatDistanceToNowStrict 
} from "date-fns";
import { 
  CalendarIcon, 
  User, 
  FileText, 
  Loader2, 
  AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type Member = {
  id: string;
  user_id: string;
  name: string; // Changed from full_name to name
  email?: string;
  gender?: string | null;
  goal?: string | null;
  weight_kg?: number | null;
  current_diet?: string | null;
  latest_diet_date?: string | null;
};

type DietPlan = {
  id: string;
  member_id: string;
  nutritionist_id: string;
  diet_details: string;
  start_date?: string | null;
  end_date?: string | null;
  created_at: string;
  updated_at: string;
};

export default function NutritionistDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [showDietModal, setShowDietModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [dietForm, setDietForm] = useState({
    details: "",
    startDate: new Date(),
    endDate: new Date(),
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      // Step 1: Fetch assigned members from member_profiles
      const { data: memberProfiles, error: mpError } = await supabase
        .from("member_profiles")
        .select(`
          id,
          user_id,
          gender,
          goal,
          weight_kg
        `)
        .eq("assigned_nutritionist_id", session.user.id)
        .order("created_at", { ascending: true });

      if (mpError) throw mpError;

      if (!memberProfiles || memberProfiles.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      // Step 2: Extract member user_ids
      const memberIds = memberProfiles.map(m => m.user_id);

      // Step 3: Fetch member details (name, email) from users table
      const { data: userDetails, error: userError } = await supabase
        .from("users")
        .select("user_id, name, email") // Changed full_name to name
        .in("user_id", memberIds);

      if (userError) throw userError;

      // Step 4: Fetch latest diet plans
      let latestDiets: DietPlan[] = [];
      const { data: diets, error: dietError } = await supabase
        .from("diet_plans")
        .select("*")
        .in("member_id", memberIds)
        .order("created_at", { ascending: false });

      if (dietError) throw dietError;
      latestDiets = diets || [];

      // Step 5: Get latest diet for each member
      const dietMap = new Map<string, DietPlan>();
      latestDiets.forEach(diet => {
        if (!dietMap.has(diet.member_id)) {
          dietMap.set(diet.member_id, diet);
        }
      });

      // Step 6: Merge all data
      const mergedMembers: Member[] = memberProfiles.map(member => {
        // Find user details
        const userDetail = userDetails?.find(u => u.user_id === member.user_id);
        
        // Find latest diet
        const latestDiet = dietMap.get(member.user_id);
        
        return {
          ...member,
          name: userDetail?.name || "Unknown User", // Changed from full_name to name
          email: userDetail?.email,
          current_diet: latestDiet?.diet_details || null,
          latest_diet_date: latestDiet?.created_at,
        };
      });

      setMembers(mergedMembers);
    } catch (err: any) {
      console.error("Error loading members:", err);
      setError("Failed to load members: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleAssignDiet() {
    if (!selectedMember || !dietForm.details.trim()) {
      setError("Please enter diet details");
      return;
    }

    setSaving(selectedMember.user_id);
    setError(null);

    try {
      // Get session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      // Call the backend API route
      const response = await fetch("/api/nutritionist/assign-diet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          member_user_id: selectedMember.user_id,
          diet_details: dietForm.details.trim(),
          start_date: dietForm.startDate.toISOString(),
          end_date: dietForm.endDate.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to assign diet");
      }

      // Update local state immediately for better UX
      setMembers(prev => prev.map(member => 
        member.user_id === selectedMember.user_id
          ? {
              ...member,
              current_diet: dietForm.details,
              latest_diet_date: new Date().toISOString(),
            }
          : member
      ));

      // Reset modal
      setShowDietModal(false);
      setDietForm({ details: "", startDate: new Date(), endDate: new Date() });
      setSelectedMember(null);
      setError(null);
      
      // Show success and refresh data
      setTimeout(() => {
        alert("Diet plan assigned successfully!");
        loadMembers(); // Refresh to get server timestamps and ensure consistency
      }, 100);

    } catch (err: any) {
      console.error("Error assigning diet:", err);
      setError("Failed to assign diet: " + err.message);
    } finally {
      setSaving(null);
    }
  }

  const DietModal = () => (
    <Dialog open={showDietModal} onOpenChange={setShowDietModal}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Diet Plan</DialogTitle>
          <DialogDescription>
            Create a personalized diet plan for {selectedMember?.name}. This will be visible in their member dashboard. {/* Changed from full_name */}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="diet-details">Diet Plan Details</Label>
            <Textarea
              id="diet-details"
              value={dietForm.details}
              onChange={(e) => setDietForm({ ...dietForm, details: e.target.value })}
              placeholder="Enter detailed diet plan including:
- Breakfast, lunch, dinner, and snacks
- Calorie breakdown
- Macronutrient ratios
- Special instructions
- Hydration goals
- Any restrictions or preferences..."
              className="min-h-[120px] mt-1"
              rows={8}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !dietForm.startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dietForm.startDate ? format(dietForm.startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dietForm.startDate}
                    onSelect={(date) => date && setDietForm({ ...dietForm, startDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !dietForm.endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dietForm.endDate ? format(dietForm.endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dietForm.endDate}
                    onSelect={(date) => date && setDietForm({ ...dietForm, endDate: date })}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {selectedMember?.weight_kg && (
            <div className="p-3 bg-blue-50 rounded-md border">
              <div className="text-sm text-blue-800">
                <strong>Member Info:</strong> {selectedMember.name} • {selectedMember.weight_kg}kg {/* Changed from full_name */}
                {selectedMember.goal && (
                  <span className="ml-2">• Goal: {selectedMember.goal}</span>
                )}
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700 text-sm"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              {error}
            </motion.div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowDietModal(false);
                setDietForm({ details: "", startDate: new Date(), endDate: new Date() });
                setSelectedMember(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAssignDiet}
              disabled={!dietForm.details.trim() || saving === selectedMember?.user_id}
            >
              {saving === selectedMember?.user_id ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Assign Diet Plan"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
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
      className="space-y-6 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 min-h-screen mt-16"
    >
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nutritionist Dashboard</h1>
          <p className="text-gray-600">
            Manage personalized diet plans for your assigned members ({members.length})
          </p>
        </div>
        <Button onClick={loadMembers} variant="outline">
          Refresh
        </Button>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center"
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
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members assigned</h3>
            <p className="text-gray-500">You don&apos;t have any members assigned to you yet. Contact admin to get assignments.</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[250px]">Member</TableHead>
                    <TableHead>Current Weight</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead className="max-w-[300px]">Current Diet Plan</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{member.name}</div> {/* Changed from full_name */}
                          {member.email && (
                            <div className="text-sm text-gray-500">{member.email}</div>
                          )}
                          {member.gender && (
                            <div className="text-xs text-gray-400 capitalize">{member.gender}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-sm">
                          {member.weight_kg ? `${member.weight_kg.toFixed(1)} kg` : "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {member.goal ?? "General Fitness"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        <div className="space-y-1">
                          {member.current_diet ? (
                            <>
                              <div className="text-sm font-medium text-gray-900">
                                {member.current_diet.length > 60 
                                  ? `${member.current_diet.substring(0, 60)}...` 
                                  : member.current_diet
                                }
                              </div>
                              {member.latest_diet_date && (
                                <div className="text-xs text-gray-500">
                                  Updated {formatDistanceToNowStrict(new Date(member.latest_diet_date))} ago
                                </div>
                              )}
                            </>
                          ) : (
                            <span className="text-sm text-gray-500 italic">No diet plan assigned yet</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {member.latest_diet_date ? 
                            formatDistanceToNowStrict(new Date(member.latest_diet_date)) + " ago" : 
                            "Never"
                          }
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedMember(member);
                                setDietForm({
                                  details: member.current_diet ?? "",
                                  startDate: new Date(),
                                  endDate: new Date(),
                                });
                                setShowDietModal(true);
                              }}
                              disabled={saving === member.user_id}
                            >
                              {saving === member.user_id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  {member.current_diet ? "Update Diet" : "Assign Diet"}
                                </>
                              )}
                            </Button>
                          </DialogTrigger>
                          <DietModal />
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}