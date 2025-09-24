// "use client";

// import React, { useEffect, useMemo, useState } from "react";
// import { supabase } from "@/lib/supabaseClient";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Slider } from "@/components/ui/slider";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import { Badge } from "@/components/ui/badge";
// import { Loader2, Scale, Ruler, Target, Activity, User, Apple, BarChart2 } from "lucide-react";
// import { formatDistanceToNowStrict } from "date-fns";
// import { motion, AnimatePresence } from "framer-motion";
// import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
// import { useParams, useRouter } from "next/navigation";

// type MemberProfile = {
//   user_id: string;
//   height_cm?: number | null;
//   weight_kg?: number | null;
//   bmi?: number | null;
//   gender?: string | null;
//   goal?: string | null;
//   activity_level?: string | null;
//   plan?: string | null;
//   plan_start?: string | null;
//   assigned_trainer_id?: string | null;
//   assigned_nutritionist_id?: string | null;
// };

// type WeightHistory = {
//   id: string;
//   member_id: string;
//   weight_kg: number;
//   bmi?: number | null;
//   recorded_at: string;
// };

// type Staff = {
//   full_name: string;
// };

// export default function MemberDashboardPage() {
//   const params = useParams();
//   const router = useRouter();
//   const memberId = params.id as string; // Get ID from URL

//   const [profile, setProfile] = useState<MemberProfile | null>(null);
//   const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
//   const [trainer, setTrainer] = useState<Staff | null>(null);
//   const [nutritionist, setNutritionist] = useState<Staff | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [showSetupModal, setShowSetupModal] = useState(false);
//   const [showWeightUpdateModal, setShowWeightUpdateModal] = useState(false);
//   const [newWeight, setNewWeight] = useState("");
//   const [currentStep, setCurrentStep] = useState(0);
//   const [formData, setFormData] = useState({
//     gender: "",
//     height_cm: 170,
//     weight_kg: 70,
//     goal: "",
//     activity_level: "",
//   });

//   const goalOptions = [
//     "Lose Weight",
//     "Gain Muscle",
//     "Build Strength",
//     "Improve Endurance",
//     "Increase Flexibility",
//     "Maintain Weight",
//     "Tone Body",
//     "Prepare for Event",
//     "Rehabilitation",
//     "General Fitness",
//     "Weight Management",
//     "Muscle Definition",
//   ];

//   const activityOptions = ["Basic", "Intermediate", "Advanced"];

//   const steps = [
//     {
//       title: "Tell us about yourself",
//       content: (
//         <div className="space-y-4">
//           <ToggleGroup type="single" value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
//             <ToggleGroupItem value="male" className="flex-1">
//               <User className="mr-2" /> Male
//             </ToggleGroupItem>
//             <ToggleGroupItem value="female" className="flex-1">
//               <User className="mr-2" /> Female
//             </ToggleGroupItem>
//           </ToggleGroup>
//         </div>
//       ),
//       isValid: () => !!formData.gender,
//     },
//     {
//       title: "What is your height?",
//       content: (
//         <div className="space-y-4">
//           <Slider
//             min={100}
//             max={250}
//             step={1}
//             value={[formData.height_cm]}
//             onValueChange={(v) => setFormData({ ...formData, height_cm: v[0] })}
//           />
//           <div className="text-center font-semibold">{formData.height_cm} cm</div>
//         </div>
//       ),
//       isValid: () => formData.height_cm > 0,
//     },
//     {
//       title: "What is your weight?",
//       content: (
//         <div className="space-y-4">
//           <Slider
//             min={30}
//             max={150}
//             step={0.1}
//             value={[formData.weight_kg]}
//             onValueChange={(v) => setFormData({ ...formData, weight_kg: v[0] })}
//           />
//           <div className="text-center font-semibold">{formData.weight_kg.toFixed(1)} kg</div>
//         </div>
//       ),
//       isValid: () => formData.weight_kg > 0,
//     },
//     {
//       title: "What is your goal?",
//       content: (
//         <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select goal" />
//           </SelectTrigger>
//           <SelectContent>
//             {goalOptions.map((opt) => (
//               <SelectItem key={opt} value={opt}>
//                 {opt}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       ),
//       isValid: () => !!formData.goal,
//     },
//     {
//       title: "What is your physical activity level?",
//       content: (
//         <Select value={formData.activity_level} onValueChange={(v) => setFormData({ ...formData, activity_level: v })}>
//           <SelectTrigger>
//             <SelectValue placeholder="Select level" />
//           </SelectTrigger>
//           <SelectContent>
//             {activityOptions.map((opt) => (
//               <SelectItem key={opt} value={opt}>
//                 {opt}
//               </SelectItem>
//             ))}
//           </SelectContent>
//         </Select>
//       ),
//       isValid: () => !!formData.activity_level,
//     },
//   ];

//   useEffect(() => {
//     let mounted = true;
//     async function load() {
//       setLoading(true);
//       const { data: { session } } = await supabase.auth.getSession();
//       const user = session?.user;
//       if (!user) {
//         setLoading(false);
//         return;
//       }

      

//       const { data: mp } = await supabase
//         .from("member_profiles")
//         .select("*")
//         .eq("user_id", user.id)
//         .maybeSingle();

//       const { data: wh } = await supabase
//         .from("weight_history")
//         .select("*")
//         .eq("member_id", user.id)
//         .order("recorded_at", { ascending: true });

//       if (!mounted) return;
//       setProfile(mp ?? null);
//       setWeightHistory((wh as WeightHistory[]) ?? []);

//       // Fetch trainer and nutritionist names if assigned
//       if (mp?.assigned_trainer_id) {
//   const res = await fetch(`/api/member/trainer?trainer_id=${mp.assigned_trainer_id}`);
//   const json = await res.json();
//   if (json.trainer_name) {
//     setTrainer({ full_name: json.trainer_name });
//   }
// }
//       if (mp?.assigned_nutritionist_id) {
//   const res = await fetch(`/api/member/nutritionist?nutritionist_id=${mp.assigned_nutritionist_id}`);
//   const json = await res.json();
//   if (json.nutritionist_name) {
//     setNutritionist({ full_name: json.nutritionist_name });
//   }
// }

//       // Show modal if any required field is missing
//       if (!mp?.height_cm || !mp?.weight_kg || !mp?.bmi || !mp?.gender || !mp?.goal || !mp?.activity_level) {
//         setShowSetupModal(true);
//       }

//       setLoading(false);
//     }

//     load();
//     return () => { mounted = false; };
//   }, [memberId, router]);

//   const lastWeight = useMemo(() => {
//     if (weightHistory.length === 0) return null;
//     return weightHistory[weightHistory.length - 1];
//   }, [weightHistory]);

//   const weightUpdatedAgo = lastWeight ? formatDistanceToNowStrict(new Date(lastWeight.recorded_at)) : null;
//   const isStale = !lastWeight || (Date.now() - new Date(lastWeight.recorded_at).getTime()) > 24 * 3600 * 1000;

//   async function refreshData() {
//     setLoading(true);
//     const { data: { session } } = await supabase.auth.getSession();
//     const user = session?.user;
//     if (!user) {
//       setLoading(false);
//       return;
//     }
//     const { data: mp } = await supabase.from("member_profiles").select("*").eq("user_id", user.id).maybeSingle();
//     const { data: wh } = await supabase.from("weight_history").select("*").eq("member_id", user.id).order("recorded_at", { ascending: true });
//     setProfile(mp ?? null);
//     setWeightHistory((wh as WeightHistory[]) ?? []);

//     if (mp?.assigned_trainer_id) {
//       const { data: tr } = await supabase.from("trainers_profile").select("full_name").eq("user_id", mp.assigned_trainer_id).single();
//       setTrainer(tr);
//     }
//     if (mp?.assigned_nutritionist_id) {
//       const { data: nu } = await supabase.from("nutritionists_profile").select("full_name").eq("user_id", mp.assigned_nutritionist_id).single();
//       setNutritionist(nu);
//     }

//     setLoading(false);
//   }

// // Updated handleSetupSubmit function in app/member/dashboard/page.tsx
// async function handleSetupSubmit() {
//   // Validate all required fields
//   if (!formData.gender || !formData.height_cm || !formData.weight_kg || !formData.goal || !formData.activity_level) {
//     alert("Please complete all required fields");
//     return;
//   }

//   if (formData.height_cm < 100 || formData.height_cm > 250) {
//     alert("Height must be between 100cm and 250cm");
//     return;
//   }

//   if (formData.weight_kg < 30 || formData.weight_kg > 200) {
//     alert("Weight must be between 30kg and 200kg");
//     return;
//   }

//   setLoading(true);
  
//   try {
//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session?.access_token) {
//       alert("Authentication required");
//       setLoading(false);
//       return;
//     }

//     const response = await fetch("/api/member/update_profile", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${session.access_token}`,
//       },
//       body: JSON.stringify({
//         height_cm: Number(formData.height_cm),
//         weight_kg: Number(formData.weight_kg),
//         gender: formData.gender,
//         goal: formData.goal,
//         activity_level: formData.activity_level,
//       }),
//     });

//     const result = await response.json();

//     if (response.ok) {
//       setShowSetupModal(false);
//       setCurrentStep(0);
//       // Reset form data
//       setFormData({
//         gender: "",
//         height_cm: 170,
//         weight_kg: 70,
//         goal: "",
//         activity_level: "",
//       });
//       await refreshData();
//       // Optional: Show success message
//       alert("Profile updated successfully!");
//     } else {
//       console.error("Setup submit error:", result);
//       alert(`Error: ${result.error || "Failed to update profile"}`);
//     }
//   } catch (error) {
//     console.error("Setup submit error:", error);
//     alert("An unexpected error occurred. Please try again.");
//   } finally {
//     setLoading(false);
//   }
// }

//   async function handleWeightUpdate() {
//     if (!newWeight || isNaN(Number(newWeight))) return;

//     const { data: { session } } = await supabase.auth.getSession();
//     if (!session?.access_token) return;

//     const response = await fetch("/api/member/update_weight", {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//         Authorization: `Bearer ${session.access_token}`,
//       },
//       body: JSON.stringify({ weight_kg: Number(newWeight) }),
//     });

//     if (response.ok) {
//       setShowWeightUpdateModal(false);
//       setNewWeight("");
//       refreshData();
//     } else {
//       console.error("Weight update error");
//     }
//   }

//   if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="space-y-6 p-6 mt-15 min-h-screen"
//     >
//       {/* Setup Modal */}
//       <Dialog open={showSetupModal} onOpenChange={(open) => !open && refreshData()}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>{steps[currentStep].title}</DialogTitle>
//           </DialogHeader>
//           <AnimatePresence mode="wait">
//             <motion.div
//               key={currentStep}
//               initial={{ opacity: 0, x: 50 }}
//               animate={{ opacity: 1, x: 0 }}
//               exit={{ opacity: 0, x: -50 }}
//               transition={{ duration: 0.3 }}
//             >
//               {steps[currentStep].content}
//             </motion.div>
//           </AnimatePresence>
//           <div className="flex justify-between mt-6">
//             {currentStep > 0 && (
//               <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
//                 Back
//               </Button>
//             )}
            
//             <Button
//               disabled={!steps[currentStep].isValid() || loading}
//               onClick={() => {
//                   if (currentStep < steps.length - 1) {
//                   setCurrentStep(currentStep + 1);
//                   } else {
//                   handleSetupSubmit();
//                   }
//               }}
//               className="mt-2"
//             >
//               {loading ? (
//                   <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   {currentStep < steps.length - 1 ? "Loading..." : "Saving..."}
//                   </>
//               ) : (
//                   currentStep < steps.length - 1 ? "Next" : "Submit"
//               )}
//             </Button>
//           </div>
//         </DialogContent>
//       </Dialog>

//       {/* Weight Update Modal */}
//       <Dialog open={showWeightUpdateModal} onOpenChange={setShowWeightUpdateModal}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>Update Today`s Weight</DialogTitle>
//           </DialogHeader>
//           <div className="space-y-4">
//             <Label htmlFor="new-weight">Enter your current weight (kg)</Label>
//             <Input
//               id="new-weight"
//               type="number"
//               value={newWeight}
//               onChange={(e) => setNewWeight(e.target.value)}
//               step="0.1"
//             />
//           </div>
//           <Button onClick={handleWeightUpdate} disabled={!newWeight || isNaN(Number(newWeight))}>
//             Submit
//           </Button>
//         </DialogContent>
//       </Dialog>

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//         <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
//           <Card className=" shadow-lg rounded-xl overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300 ">
//               <CardTitle className="flex items-center pt-1"><Target className="mr-2" /> Plan</CardTitle>
//             </CardHeader>
//             <CardContent className="pt-4">
//               <div className="text-sm text-muted-foreground">Selected plan</div>
//               <div className="mt-2 font-semibold text-lg">{profile?.plan ?? "No plan assigned"}</div>
//               {profile?.plan_start && (
//                 <Badge variant="secondary" className="mt-2">
//                   Started: {new Date(profile.plan_start).toLocaleDateString()}
//                 </Badge>
//               )}
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
//           <Card className=" shadow-lg rounded-xl overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-green-200 to-green-300 ">
//               <CardTitle className="flex items-center pt-1"><Scale className="mr-2" /> Weight</CardTitle>
//             </CardHeader>
//             <CardContent className="pt-4">
//               <div className="text-sm text-muted-foreground">Latest</div>
//               <div className="mt-2 text-2xl font-bold">{lastWeight ? `${lastWeight.weight_kg} kg` : "No data"}</div>
//               <div className="text-xs text-muted-foreground mt-1">{weightUpdatedAgo ? `Updated ${weightUpdatedAgo} ago` : "-"}</div>
//               <div className="mt-3 flex gap-2">
//                 {isStale && (
//                   <Button variant="default" onClick={() => setShowWeightUpdateModal(true)}>
//                     Update Today`s Weight
//                   </Button>
//                 )}
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
//           <Card className=" shadow-lg rounded-xl overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300 ">
//               <CardTitle className="flex items-center"><Ruler className="mr-2" /> Height & BMI</CardTitle>
//             </CardHeader>
//             <CardContent className="pt-4">
//               <div className="text-sm text-muted-foreground">Height</div>
//               <div className="mt-2 font-semibold">{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</div>
//               <div className="text-sm text-muted-foreground mt-3">BMI</div>
//               <div className="mt-2 font-semibold">{profile?.bmi ?? "—"}</div>
//               <div className="text-xs text-muted-foreground mt-2 flex items-center">
//                 <Activity className="mr-1" size={14} /> Level: {profile?.activity_level ?? "—"}
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>
//       </div>

//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
//         <Card className=" shadow-lg rounded-xl overflow-hidden">
//           <CardHeader className="bg-gradient-to-r from-orange-200 to-orange-300 ">
//             <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> Weight Tracking</CardTitle>
//           </CardHeader>
//           <CardContent className="pt-4">
//             <ResponsiveContainer width="100%" height={300}>
//               <LineChart data={weightHistory.map((d) => ({ date: new Date(d.recorded_at).toLocaleDateString(), weight: d.weight_kg }))}>
//                 <CartesianGrid strokeDasharray="3 3" />
//                 <XAxis dataKey="date" />
//                 <YAxis />
//                 <Tooltip />
//                 <Legend />
//                 <Line type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </CardContent>
//         </Card>
//       </motion.div>

//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
//         <Card className=" shadow-lg rounded-xl overflow-hidden">
//           <CardHeader className="bg-gradient-to-r from-teal-200 to-teal-300 ">
//             <CardTitle className="flex items-center pt-2 "><User className="mr-2 " /> Assigned Staff</CardTitle>
//           </CardHeader>
//           <CardContent className="pt-4 space-y-2">
//             <div className="flex items-center">
//               <Apple className="mr-2 text-teal-600" /> Nutritionist: {nutritionist?.full_name ?? "Not assigned"}
//             </div>
//             <div className="flex items-center">
//               <User className="mr-2 text-teal-600" /> Trainer: {trainer?.full_name ?? "Not assigned"}
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>
//     </motion.div>
//   );
//}


"use client";

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, Ruler, Target, Activity, User, Apple, BarChart2 } from "lucide-react";
import { formatDistanceToNowStrict } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParams, useRouter } from "next/navigation";

type MemberProfile = {
  user_id: string;
  height_cm?: number | null;
  weight_kg?: number | null;
  bmi?: number | null;
  gender?: string | null;
  goal?: string | null;
  activity_level?: string | null;
  plan?: string | null;
  plan_start?: string | null;
  assigned_trainer_id?: string | null;
  assigned_nutritionist_id?: string | null;
};

type WeightHistory = {
  id: string;
  member_id: string;
  weight_kg: number;
  bmi?: number | null;
  recorded_at: string;
};

type Staff = {
  full_name: string;
};

export default function MemberDashboardPage() {
  
  const router = useRouter();
  const params = useParams();
const memberId = params.memberID as string;  

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [trainer, setTrainer] = useState<Staff | null>(null);
  const [nutritionist, setNutritionist] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showWeightUpdateModal, setShowWeightUpdateModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    gender: "",
    height_cm: 170,
    weight_kg: 70,
    goal: "",
    activity_level: "",
  });
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  const goalOptions = [
    "Lose Weight",
    "Gain Muscle",
    "Build Strength",
    "Improve Endurance",
    "Increase Flexibility",
    "Maintain Weight",
    "Tone Body",
    "Prepare for Event",
    "Rehabilitation",
    "General Fitness",
    "Weight Management",
    "Muscle Definition",
  ];

  const activityOptions = ["Basic", "Intermediate", "Advanced"];

  const steps = [
    {
      title: "Tell us about yourself",
      content: (
        <div className="space-y-4">
          <ToggleGroup type="single" value={formData.gender} onValueChange={(v) => setFormData({ ...formData, gender: v })}>
            <ToggleGroupItem value="male" className="flex-1">
              <User className="mr-2" /> Male
            </ToggleGroupItem>
            <ToggleGroupItem value="female" className="flex-1">
              <User className="mr-2" /> Female
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      ),
      isValid: () => !!formData.gender,
    },
    {
      title: "What is your height?",
      content: (
        <div className="space-y-4">
          <Slider
            min={100}
            max={250}
            step={1}
            value={[formData.height_cm]}
            onValueChange={(v) => setFormData({ ...formData, height_cm: v[0] })}
          />
          <div className="text-center font-semibold">{formData.height_cm} cm</div>
        </div>
      ),
      isValid: () => formData.height_cm > 0,
    },
    {
      title: "What is your weight?",
      content: (
        <div className="space-y-4">
          <Slider
            min={30}
            max={150}
            step={0.1}
            value={[formData.weight_kg]}
            onValueChange={(v) => setFormData({ ...formData, weight_kg: v[0] })}
          />
          <div className="text-center font-semibold">{formData.weight_kg.toFixed(1)} kg</div>
        </div>
      ),
      isValid: () => formData.weight_kg > 0,
    },
    {
      title: "What is your goal?",
      content: (
        <Select value={formData.goal} onValueChange={(v) => setFormData({ ...formData, goal: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select goal" />
          </SelectTrigger>
          <SelectContent>
            {goalOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      isValid: () => !!formData.goal,
    },
    {
      title: "What is your physical activity level?",
      content: (
        <Select value={formData.activity_level} onValueChange={(v) => setFormData({ ...formData, activity_level: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            {activityOptions.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
      isValid: () => !!formData.activity_level,
    },
  ];

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const loggedInUserId = session?.user?.id ?? null;
        setIsOwnProfile(memberId === loggedInUserId);

        // Fetch member profile for memberId from URL
        const { data: mp, error: mpErr } = await supabase
          .from("member_profiles")
          .select("*")
          .eq("user_id", memberId)
          .maybeSingle();

        if (mpErr) throw mpErr;

        // Fetch weight history
        const { data: wh, error: whErr } = await supabase
          .from("weight_history")
          .select("*")
          .eq("member_id", memberId)
          .order("recorded_at", { ascending: true });

        if (whErr) throw whErr;

        if (!mounted) return;

        setProfile(mp ?? null);
        setWeightHistory((wh as WeightHistory[]) ?? []);

             if (mp?.assigned_trainer_id) {
  const res = await fetch(`/api/member/trainer?trainer_id=${mp.assigned_trainer_id}`);
  const json = await res.json();
  if (json.trainer_name) {
    setTrainer({ full_name: json.trainer_name });
  }
}
      if (mp?.assigned_nutritionist_id) {
  const res = await fetch(`/api/member/nutritionist?nutritionist_id=${mp.assigned_nutritionist_id}`);
  const json = await res.json();
  if (json.nutritionist_name) {
    setNutritionist({ full_name: json.nutritionist_name });
  }
}

        // Show setup modal **only if the logged-in user is viewing their own dashboard**
        const requiredMissing =
          mp?.height_cm == null ||
          mp?.weight_kg == null ||
          mp?.gender == null ||
          mp?.goal == null ||
          mp?.activity_level == null;

        if (mounted && requiredMissing && isOwnProfile) {
          setShowSetupModal(true);
        }
      } catch (err) {
        console.error("Error loading member dashboard:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [memberId]);

  const lastWeight = useMemo(() => {
    if (weightHistory.length === 0) return null;
    return weightHistory[weightHistory.length - 1];
  }, [weightHistory]);

  const weightUpdatedAgo = lastWeight ? formatDistanceToNowStrict(new Date(lastWeight.recorded_at)) : null;
  const isStale = !lastWeight || (Date.now() - new Date(lastWeight.recorded_at).getTime()) > 24 * 3600 * 1000;

  async function refreshData() {
    setLoading(true);
    try {
      const { data: mp } = await supabase.from("member_profiles").select("*").eq("user_id", memberId).maybeSingle();
      const { data: wh } = await supabase.from("weight_history").select("*").eq("member_id", memberId).order("recorded_at", { ascending: true });
      setProfile(mp ?? null);
      setWeightHistory((wh as WeightHistory[]) ?? []);

      if (mp?.assigned_trainer_id) {
        const { data: tr } = await supabase.from("trainers_profile").select("full_name").eq("user_id", mp.assigned_trainer_id).single();
        setTrainer(tr ? { full_name: tr.full_name } : null);
      }
      if (mp?.assigned_nutritionist_id) {
        const { data: nu } = await supabase.from("nutritionists_profile").select("full_name").eq("user_id", mp.assigned_nutritionist_id).single();
        setNutritionist(nu ?? null);
      }
    } finally {
      setLoading(false);
    }
  }

  // Updated handleSetupSubmit function in app/member/dashboard/page.tsx
  async function handleSetupSubmit() {
    // Validate all required fields
    if (!formData.gender || !formData.height_cm || !formData.weight_kg || !formData.goal || !formData.activity_level) {
      alert("Please complete all required fields");
      return;
    }

    if (formData.height_cm < 100 || formData.height_cm > 250) {
      alert("Height must be between 100cm and 250cm");
      return;
    }

    if (formData.weight_kg < 30 || formData.weight_kg > 200) {
      alert("Weight must be between 30kg and 200kg");
      return;
    }

    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Authentication required");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/member/update_profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          height_cm: Number(formData.height_cm),
          weight_kg: Number(formData.weight_kg),
          gender: formData.gender,
          goal: formData.goal,
          activity_level: formData.activity_level,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setShowSetupModal(false);
        setCurrentStep(0);
        // Reset form data
        setFormData({
          gender: "",
          height_cm: 170,
          weight_kg: 70,
          goal: "",
          activity_level: "",
        });
        await refreshData();
        // Optional: Show success message
        alert("Profile updated successfully!");
      } else {
        console.error("Setup submit error:", result);
        alert(`Error: ${result.error || "Failed to update profile"}`);
      }
    } catch (error) {
      console.error("Setup submit error:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWeightUpdate() {
    if (!newWeight || isNaN(Number(newWeight))) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    const response = await fetch("/api/member/update_weight", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ weight_kg: Number(newWeight) }),
    });

    if (response.ok) {
      setShowWeightUpdateModal(false);
      setNewWeight("");
      refreshData();
    } else {
      const result = await response.json();
      console.error("Weight update error:", result.error);
      alert(result.error || "Failed to update weight");
    }
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 mt-15 min-h-screen"
    >
      {/* Setup Modal */}
      <Dialog open={showSetupModal} onOpenChange={(open) => !open && refreshData()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{steps[currentStep].title}</DialogTitle>
          </DialogHeader>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 50 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].content}
            </motion.div>
          </AnimatePresence>
          <div className="flex justify-between mt-6">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                Back
              </Button>
            )}
            
            <Button
              disabled={!steps[currentStep].isValid() || loading}
              onClick={() => {
                  if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1);
                  } else {
                  handleSetupSubmit();
                  }
              }}
              className="mt-2"
            >
              {loading ? (
                  <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep < steps.length - 1 ? "Loading..." : "Saving..."}
                  </>
              ) : (
                  currentStep < steps.length - 1 ? "Next" : "Submit"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Update Modal */}
      <Dialog open={showWeightUpdateModal} onOpenChange={setShowWeightUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Today`s Weight</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label htmlFor="new-weight">Enter your current weight (kg)</Label>
            <Input
              id="new-weight"
              type="number"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              step="0.1"
            />
          </div>
          <Button onClick={handleWeightUpdate} disabled={!newWeight || isNaN(Number(newWeight))}>
            Submit
          </Button>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className=" shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300 ">
              <CardTitle className="flex items-center pt-1"><Target className="mr-2" /> Plan</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Selected plan</div>
              <div className="mt-2 font-semibold text-lg">{profile?.plan ?? "No plan assigned"}</div>
              {profile?.plan_start && (
                <Badge variant="secondary" className="mt-2">
                  Started: {new Date(profile.plan_start).toLocaleDateString()}
                </Badge>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.1 }}>
          <Card className=" shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-200 to-green-300 ">
              <CardTitle className="flex items-center pt-1"><Scale className="mr-2" /> Weight</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Latest</div>
              <div className="mt-2 text-2xl font-bold">{lastWeight ? `${lastWeight.weight_kg} kg` : "No data"}</div>
              <div className="text-xs text-muted-foreground mt-1">{weightUpdatedAgo ? `Updated ${weightUpdatedAgo} ago` : "-"}</div>
              <div className="mt-3 flex gap-2">
                {isStale && (
                  <Button variant="default" onClick={() => setShowWeightUpdateModal(true)}>
                    Update Today`s Weight
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className=" shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300 ">
              <CardTitle className="flex items-center"><Ruler className="mr-2" /> Height & BMI</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Height</div>
              <div className="mt-2 font-semibold">{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</div>
              <div className="text-sm text-muted-foreground mt-3">BMI</div>
              <div className="mt-2 font-semibold">{profile?.bmi ?? "—"}</div>
              <div className="text-xs text-muted-foreground mt-2 flex items-center">
                <Activity className="mr-1" size={14} /> Level: {profile?.activity_level ?? "—"}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card className=" shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-200 to-orange-300 ">
            <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> Weight Tracking</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightHistory.map((d) => ({ date: new Date(d.recorded_at).toLocaleDateString(), weight: d.weight_kg }))}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className=" shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-200 to-teal-300 ">
            <CardTitle className="flex items-center pt-2 "><User className="mr-2 " /> Assigned Staff</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center">
              <Apple className="mr-2 text-teal-600" /> Nutritionist: {nutritionist?.full_name ?? "Not assigned"}
            </div>
            <div className="flex items-center">
              <User className="mr-2 text-teal-600" /> Trainer: {trainer?.full_name ?? "Not assigned"}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}