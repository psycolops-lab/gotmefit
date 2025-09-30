


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
  
//   const router = useRouter();
//   const params = useParams();
// const memberId = params.memberID as string;  

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
//   const [isOwnProfile, setIsOwnProfile] = useState(false);

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
//       try {
//         const { data: { session } } = await supabase.auth.getSession();
//         const loggedInUserId = session?.user?.id ?? null;
//         setIsOwnProfile(memberId === loggedInUserId);

//         // Fetch member profile for memberId from URL
//         const { data: mp, error: mpErr } = await supabase
//           .from("member_profiles")
//           .select("*")
//           .eq("user_id", memberId)
//           .maybeSingle();

//         if (mpErr) throw mpErr;

//         // Fetch weight history
//         const { data: wh, error: whErr } = await supabase
//           .from("weight_history")
//           .select("*")
//           .eq("member_id", memberId)
//           .order("recorded_at", { ascending: true });

//         if (whErr) throw whErr;

//         if (!mounted) return;

//         setProfile(mp ?? null);
//         setWeightHistory((wh as WeightHistory[]) ?? []);

//              if (mp?.assigned_trainer_id) {
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

//         // Show setup modal **only if the logged-in user is viewing their own dashboard**
//         if (!mp?.height_cm || !mp?.weight_kg || !mp?.bmi || !mp?.gender || !mp?.goal || !mp?.activity_level) {
//         setShowSetupModal(true);
//       }
     
//       } catch (err) {
//         console.error("Error loading member dashboard:", err);
//       } finally {
//         if (mounted) setLoading(false);
//       }
//     }

//     load();

//     return () => {
//       mounted = false;
//     };
//   }, [memberId]);

//   const lastWeight = useMemo(() => {
//     if (weightHistory.length === 0) return null;
//     return weightHistory[weightHistory.length - 1];
//   }, [weightHistory]);

//   const weightUpdatedAgo = lastWeight ? formatDistanceToNowStrict(new Date(lastWeight.recorded_at)) : null;
//   const isStale = !lastWeight || (Date.now() - new Date(lastWeight.recorded_at).getTime()) > 24 * 3600 * 1000;

//   async function refreshData() {
//     setLoading(true);
//     try {
//       const { data: mp } = await supabase.from("member_profiles").select("*").eq("user_id", memberId).maybeSingle();
//       const { data: wh } = await supabase.from("weight_history").select("*").eq("member_id", memberId).order("recorded_at", { ascending: true });
//       setProfile(mp ?? null);
//       setWeightHistory((wh as WeightHistory[]) ?? []);

//       if (mp?.assigned_trainer_id) {
//         const { data: tr } = await supabase.from("trainers_profile").select("full_name").eq("user_id", mp.assigned_trainer_id).single();
//         setTrainer(tr ? { full_name: tr.full_name } : null);
//       }
//       if (mp?.assigned_nutritionist_id) {
//         const { data: nu } = await supabase.from("nutritionists_profile").select("full_name").eq("user_id", mp.assigned_nutritionist_id).single();
//         setNutritionist(nu ?? null);
//       }
//     } finally {
//       setLoading(false);
//     }
//   }

//   // Updated handleSetupSubmit function in app/member/dashboard/page.tsx
//   async function handleSetupSubmit() {
//     // Validate all required fields
//     if (!formData.gender || !formData.height_cm || !formData.weight_kg || !formData.goal || !formData.activity_level) {
//       alert("Please complete all required fields");
//       return;
//     }

//     if (formData.height_cm < 100 || formData.height_cm > 250) {
//       alert("Height must be between 100cm and 250cm");
//       return;
//     }

//     if (formData.weight_kg < 30 || formData.weight_kg > 200) {
//       alert("Weight must be between 30kg and 200kg");
//       return;
//     }

//     setLoading(true);
    
//     try {
//       const { data: { session } } = await supabase.auth.getSession();
//       if (!session?.access_token) {
//         alert("Authentication required");
//         setLoading(false);
//         return;
//       }

//       const response = await fetch("/api/member/update_profile", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${session.access_token}`,
//         },
//         body: JSON.stringify({
//           height_cm: Number(formData.height_cm),
//           weight_kg: Number(formData.weight_kg),
//           gender: formData.gender,
//           goal: formData.goal,
//           activity_level: formData.activity_level,
//         }),
//       });

//       const result = await response.json();

//       if (response.ok) {
//         setShowSetupModal(false);
//         setCurrentStep(0);
//         // Reset form data
//         setFormData({
//           gender: "",
//           height_cm: 170,
//           weight_kg: 70,
//           goal: "",
//           activity_level: "",
//         });
//         await refreshData();
//         // Optional: Show success message
//         alert("Profile updated successfully!");
//       } else {
//         console.error("Setup submit error:", result);
//         alert(`Error: ${result.error || "Failed to update profile"}`);
//       }
//     } catch (error) {
//       console.error("Setup submit error:", error);
//       alert("An unexpected error occurred. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   }

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
//       const result = await response.json();
//       console.error("Weight update error:", result.error);
//       alert(result.error || "Failed to update weight");
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
//       {/* Back to Dashboard Button */}
//       <div className="mb-4">
//         <Button
//           variant="outline"
//           size="sm"
//           onClick={() => router.push('/admin/dashboard')}
//           className="flex items-center gap-2"
//         >
//           {/* You can use an icon here if desired */}
//           &#8592; Back to Dashboard
//         </Button>
//       </div>
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
//               exit={{ opacity: 0, x: 50 }}
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
//             <DialogTitle>Track</DialogTitle>
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

//       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
//               <div className="flex justify-between items-center text-sm ">
//               <div className="mt-2 text-lg font-bold">{lastWeight ? `${lastWeight.weight_kg} kg` : "No data"}</div>
//               <div className="text-xs text-muted-foreground  items-center flex">{weightUpdatedAgo ? `Updated ${weightUpdatedAgo} ago` : "-"}</div>
//               <div className="mt-2 flex">
//                 {isStale && (
//                   <Button variant="default" onClick={() => setShowWeightUpdateModal(true)}>
//                     Track
//                   </Button>
//                 )}
//               </div>
//               </div>
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
//           <Card className=" shadow-lg rounded-xl overflow-hidden">
//             <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300 ">
//               <CardTitle className="flex items-center"><Ruler className="mr-2" /> Height </CardTitle>
//             </CardHeader>
//             <CardContent className="pt-4">
//               <div className="text-sm text-muted-foreground mt-1">Height</div>
//               <div className="mt-3 font-semibold">{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</div>
              
              
//             </CardContent>
//           </Card>
//         </motion.div>

//         <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
//   <Card className=" shadow-lg rounded-xl overflow-hidden">
//     <CardHeader className="bg-gradient-to-r from-red-200 to-red-300 ">
//       <CardTitle className="flex items-center"><Ruler className="mr-2" /> BMI</CardTitle>
//     </CardHeader>
//     <CardContent className="pt-4">
//       <div className="text-sm text-muted-foreground mt-1">
//         BMI
//       </div>
//       <div className="flex justify-between items-center text-sm mt-2">
//         <div className="font-semibold text-lg">{profile?.bmi ?? "—"}</div>
//         <div className="text-xs text-muted-foreground items-center flex">
//           <Activity className="mr-1" size={14} /> {profile?.activity_level ?? "—"}
//         </div>
//       </div>
      
//     </CardContent>
//   </Card>
// </motion.div>
//       </div>
// <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
//         <Card className=" shadow-lg rounded-xl overflow-hidden">
//           <CardHeader className="bg-gradient-to-r from-teal-200 to-teal-300 ">
//             <CardTitle className="flex items-center pt-2 "><User className="mr-2 " /> Assigned Nutritionist</CardTitle>
//           </CardHeader>
//           <CardContent className="pt-4 space-y-2">
//             <div className="flex items-center">
//               <Apple className="mr-2 text-teal-600" /> Nutritionist: {nutritionist?.full_name ?? "Not assigned"}
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>
//       <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
//         <Card className=" shadow-lg rounded-xl overflow-hidden">
//           <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200 ">
//             <CardTitle className="flex items-center pt-2 "><User className="mr-2 " /> Assigned Trainer</CardTitle>
//           </CardHeader>
//           <CardContent className="pt-4 space-y-2">
//             <div className="flex items-center">
//               <User className="mr-2 text-yellow-400" /> Trainer: {trainer?.full_name ?? "Not assigned"}
//             </div>
//           </CardContent>
//         </Card>
//       </motion.div>
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

      
//     </motion.div>
//   );
// }






"use client";
import { cn } from "@/lib/utils" 
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
import { Loader2, Scale, Ruler, Target, Activity, User, Apple, BarChart2, Upload, Image as ImageIcon, CheckCircle, XCircle } from "lucide-react";
import { formatDistanceToNowStrict, addDays, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

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

type GalleryPhoto = {
  id: string;
  date: string;
  photo: string;
};

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

type Staff = {
  full_name: string;
};

export default function MemberDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberID as string;

  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [galleryPhotos, setGalleryPhotos] = useState<GalleryPhoto[]>([]);
  const [dietPlan, setDietPlan] = useState<DietPlan | null>(null);
  const [dietHistory, setDietHistory] = useState<DietHistory[]>([]);
  const [trainer, setTrainer] = useState<Staff | null>(null);
  const [nutritionist, setNutritionist] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showWeightUpdateModal, setShowWeightUpdateModal] = useState(false);
  const [showMissedDietModal, setShowMissedDietModal] = useState(false);
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
  const [uploading, setUploading] = useState(false);
  const [canUploadPhoto, setCanUploadPhoto] = useState(true);
  const [updatingMeal, setUpdatingMeal] = useState<string | null>(null);
  const [todayMealStatus, setTodayMealStatus] = useState<{ [key: string]: boolean }>({});

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
      setError(null);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          setError("Session expired. Please log in again.");
          router.push("/login");
          return;
        }

        const loggedInUserId = session.user.id;
        setIsOwnProfile(memberId === loggedInUserId);
        console.log("Session:", { userId: session?.user?.id, email: session?.user?.email, error: sessionError });
        console.log("isOwnProfile:", memberId === loggedInUserId, { memberId, loggedInUserId });

        // Fetch member profile
        const { data: mp, error: mpErr } = await supabase
          .from("member_profiles")
          .select("*")
          .eq("user_id", memberId)
          .maybeSingle();
        if (mpErr) throw new Error(`Profile fetch error: ${mpErr.message}`);

        // Fetch weight history
        const { data: wh, error: whErr } = await supabase
          .from("weight_history")
          .select("*")
          .eq("member_id", memberId)
          .order("recorded_at", { ascending: true });
        if (whErr) throw new Error(`Weight history fetch error: ${whErr.message}`);

        // Fetch gallery photos
        const { data: gp, error: gpErr } = await supabase
          .from("gallery")
          .select("id, date, photo")
          .eq("user_id", memberId)
          .order("date", { ascending: false });
        if (gpErr) throw new Error(`Gallery fetch error: ${gpErr.message}`);

        // Fetch diet plan
        const { data: dp, error: dpErr } = await supabase
          .from("diet")
          .select("*")
          .eq("user_id", memberId)
          .maybeSingle();
        if (dpErr && dpErr.code !== "PGRST116") {
          throw new Error(`Diet plan fetch error: ${dpErr.message}`);
        }

        let dh: DietHistory[] = [];
        let todayHistory: { intake: { [key: string]: boolean } } | null = null;

        // Only fetch diet history if a diet plan exists
        if (dp?.id) {
          // Fetch diet history
          const { data: dhData, error: dhErr } = await supabase
            .from("diet_history")
            .select("*")
            .eq("meal_plan_id", dp.id)
            .order("date", { ascending: false });
          if (dhErr) {
            throw new Error(`Diet history fetch error: ${dhErr.message}`);
          }
          dh = dhData as DietHistory[];

          // Fetch today's meal status
          const today = new Date().toISOString().split("T")[0];
          const { data: todayHistoryData, error: todayErr } = await supabase
            .from("diet_history")
            .select("intake")
            .eq("meal_plan_id", dp.id)
            .eq("date", today)
            .maybeSingle();
          if (todayErr && todayErr.code !== "PGRST116") {
            throw new Error(`Today's history fetch error: ${todayErr.message}`);
          }
          todayHistory = todayHistoryData;
        }

        if (!mounted) return;

        setProfile(mp ?? null);
        setWeightHistory((wh as WeightHistory[]) ?? []);
        setGalleryPhotos((gp as GalleryPhoto[]) ?? []);
        setDietPlan(dp ?? null);
        setDietHistory(dh ?? []);
        setTodayMealStatus(todayHistory?.intake || {});

        // Check upload eligibility for own profile
        if (loggedInUserId === memberId) {
          const latestPhoto = gp?.[0];
          const canUpload = !latestPhoto || isAfter(new Date(), addDays(new Date(latestPhoto.date), 7));
          setCanUploadPhoto(canUpload);
          console.log("canUploadPhoto:", canUpload, { latestPhoto, galleryPhotosLength: gp?.length });
        }

        // Fetch trainer
        if (mp?.assigned_trainer_id) {
          try {
            const res = await fetch(`/api/member/trainer?trainer_id=${mp.assigned_trainer_id}`);
            const json = await res.json();
            if (json.trainer_name) {
              setTrainer({ full_name: json.trainer_name });
            }
          } catch (err) {
            console.warn("Trainer fetch error:", err);
            setTrainer(null);
          }
        }

        // Fetch nutritionist
        if (mp?.assigned_nutritionist_id) {
          try {
            const res = await fetch(`/api/member/nutritionist?nutritionist_id=${mp.assigned_nutritionist_id}`);
            const json = await res.json();
            if (json.nutritionist_name) {
              setNutritionist({ full_name: json.nutritionist_name });
            }
          } catch (err) {
            console.warn("Nutritionist fetch error:", err);
            setNutritionist(null);
          }
        }

        // Show setup modal for own profile if incomplete
        if (loggedInUserId === memberId && (!mp?.height_cm || !mp?.weight_kg || !mp?.bmi || !mp?.gender || !mp?.goal || !mp?.activity_level)) {
          setShowSetupModal(true);
        }
      } catch (err: any) {
        console.error("Error loading member dashboard:", err.message);
        setError(`Failed to load dashboard data: ${err.message}`);
        toast.error(`Failed to load dashboard data: ${err.message}`);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [memberId, router]);

  const lastWeight = useMemo(() => {
    if (weightHistory.length === 0) return null;
    return weightHistory[weightHistory.length - 1];
  }, [weightHistory]);

  const weightUpdatedAgo = lastWeight ? formatDistanceToNowStrict(new Date(lastWeight.recorded_at)) : null;
  const isStale = !lastWeight || (Date.now() - new Date(lastWeight.recorded_at).getTime()) > 24 * 3600 * 1000;

  async function refreshData() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: mp, error: mpErr } = await supabase.from("member_profiles").select("*").eq("user_id", memberId).maybeSingle();
      if (mpErr) throw new Error(`Profile fetch error: ${mpErr.message}`);

      const { data: wh, error: whErr } = await supabase.from("weight_history").select("*").eq("member_id", memberId).order("recorded_at", { ascending: true });
      if (whErr) throw new Error(`Weight history fetch error: ${whErr.message}`);

      const { data: gp, error: gpErr } = await supabase.from("gallery").select("id, date, photo").eq("user_id", memberId).order("date", { ascending: false });
      if (gpErr) throw new Error(`Gallery fetch error: ${gpErr.message}`);

      const { data: dp, error: dpErr } = await supabase
        .from("diet")
        .select("*")
        .eq("user_id", memberId)
        .maybeSingle();
      if (dpErr && dpErr.code !== "PGRST116") throw new Error(`Diet plan fetch error: ${dpErr.message}`);

      let dh: DietHistory[] = [];
      let todayHistory: { intake: { [key: string]: boolean } } | null = null;

      // Only fetch diet history if a diet plan exists
      if (dp && dp.id) {
        // Fetch diet history
        const { data: dhData, error: dhErr } = await supabase
          .from("diet_history")
          .select("*")
          .eq("meal_plan_id", dp.id)
          .order("date", { ascending: false });
        if (dhErr) {
          throw new Error(`Diet history fetch error: ${dhErr.message}`);
        }
        dh = dhData as DietHistory[];

        // Fetch today's meal status
        const today = new Date().toISOString().split("T")[0];
        const { data: todayHistoryData, error: todayErr } = await supabase
          .from("diet_history")
          .select("intake")
          .eq("meal_plan_id", dp.id)
          .eq("date", today)
          .maybeSingle();
        if (todayErr && todayErr.code !== "PGRST116") {
          throw new Error(`Today's history fetch error: ${todayErr.message}`);
        }
        todayHistory = todayHistoryData;
      }

      setProfile(mp ?? null);
      setWeightHistory((wh as WeightHistory[]) ?? []);
      setGalleryPhotos((gp as GalleryPhoto[]) ?? []);
      setDietPlan(dp ?? null);
      setDietHistory(dh ?? []);
      setTodayMealStatus(todayHistory?.intake || {});

      if (mp?.assigned_trainer_id) {
        try {
          const { data: tr, error: trErr } = await supabase.from("trainers_profile").select("full_name").eq("user_id", mp.assigned_trainer_id).maybeSingle();
          if (trErr) throw new Error(`Trainer fetch error: ${trErr.message}`);
          setTrainer(tr ? { full_name: tr.full_name } : null);
        } catch {
          setTrainer(null);
        }
      }
      if (mp?.assigned_nutritionist_id) {
        try {
          const { data: nu, error: nuErr } = await supabase.from("nutritionists_profile").select("full_name").eq("user_id", mp.assigned_nutritionist_id).maybeSingle();
          if (nuErr) throw new Error(`Nutritionist fetch error: ${nuErr.message}`);
          setNutritionist(nu ? { full_name: nu.full_name } : null);
        } catch {
          setNutritionist(null);
        }
      }

      if (session.user.id === memberId) {
        const latestPhoto = gp?.[0];
        const canUpload = !latestPhoto || isAfter(new Date(), addDays(new Date(latestPhoto.date), 7));
        setCanUploadPhoto(canUpload);
      }
    } catch (err: any) {
      console.error("Refresh data error:", err.message);
      setError(`Failed to refresh dashboard data: ${err.message}`);
      toast.error(`Failed to refresh dashboard data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupSubmit() {
    if (!formData.gender || !formData.height_cm || !formData.weight_kg || !formData.goal || !formData.activity_level) {
      setError("Please complete all required fields");
      toast.error("Please complete all required fields");
      return;
    }

    if (formData.height_cm < 100 || formData.height_cm > 250) {
      setError("Height must be between 100cm and 250cm");
      toast.error("Height must be between 100cm and 250cm");
      return;
    }

    if (formData.weight_kg < 30 || formData.weight_kg > 200) {
      setError("Weight must be between 30kg and 200kg");
      toast.error("Weight must be between 30kg and 200kg");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Authentication required");
        toast.error("Authentication required");
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
        setFormData({
          gender: "",
          height_cm: 170,
          weight_kg: 70,
          goal: "",
          activity_level: "",
        });
        await refreshData();
        setError(null);
        toast.success("Profile updated successfully!");
      } else {
        console.error("Setup submit error:", result);
        setError(`Error: ${result.error || "Failed to update profile"}`);
        toast.error(`Error: ${result.error || "Failed to update profile"}`);
      }
    } catch (error) {
      console.error("Setup submit error:", error);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWeightUpdate() {
    if (!newWeight || isNaN(Number(newWeight))) {
      setError("Please enter a valid weight");
      toast.error("Please enter a valid weight");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setError("Authentication required");
        toast.error("Authentication required");
        return;
      }

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
        await refreshData();
        toast.success("Weight updated successfully!");
      } else {
        const result = await response.json();
        console.error("Weight update error:", result.error);
        setError(result.error || "Failed to update weight");
        toast.error(result.error || "Failed to update weight");
      }
    } catch (error) {
      console.error("Weight update error:", error);
      setError("An unexpected error occurred. Please try again.");
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(file: File) {
    if (!file || !isOwnProfile) {
      setError("Invalid file or unauthorized action");
      toast.error("Invalid file or unauthorized action");
      return;
    }

    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
      setError("Only JPEG or PNG files are allowed");
      toast.error("Only JPEG or PNG files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      toast.error("File size must be less than 5MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication failed. Please log in again.");
        toast.error("Authentication failed. Please log in again.");
        router.push("/login");
        return;
      }
      if (memberId !== session.user.id) {
        throw new Error("Unauthorized: memberId does not match authenticated user");
      }

      console.log("Upload attempt:", {
        memberId,
        userId: session.user.id,
        email: session.user.email,
        accessToken: session.access_token.substring(0, 10) + "...",
      });

      const { count, error: countError } = await supabase
        .from("gallery")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .gt("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (countError) {
        setError(`Upload check failed: ${countError.message}`);
        toast.error(`Upload check failed: ${countError.message}`);
        return;
      }
      if (count && count > 0) {
        setError("You can only upload one photo every 7 days.");
        toast.error("You can only upload one photo every 7 days.");
        return;
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${session.user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("gallery")
        .upload(filePath, file, {
          contentType: file.type,
        });

      if (uploadError) {
        console.error("Storage upload error details:", uploadError);
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from("gallery").getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Failed to get public URL for uploaded file");

      const { error: insertError } = await supabase
        .from("gallery")
        .insert({
          photo: publicUrl,
          user_email: session.user.email,
          user_id: session.user.id,
        });

      if (insertError) throw new Error(`Database insert failed: ${insertError.message}`);

      await refreshData();
      setCanUploadPhoto(false);
      toast.success("Photo uploaded successfully!");
    } catch (error: any) {
      console.error("Photo upload error:", error.message);
      setError(`Failed to upload photo: ${error.message}`);
      toast.error(`Failed to upload photo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleMealIntake(meal: string, taken: boolean) {
    if (!dietPlan || !isOwnProfile) {
      setError("No diet plan or unauthorized action");
      toast.error("No diet plan or unauthorized action");
      return;
    }

    setUpdatingMeal(meal);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError("Authentication failed. Please log in again.");
        toast.error("Authentication failed. Please log in again.");
        router.push("/login");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { data: existingHistory, error: fetchError } = await supabase
        .from("diet_history")
        .select("*")
        .eq("meal_plan_id", dietPlan.id)
        .eq("date", today)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new Error(`Failed to check existing history: ${fetchError.message}`);
      }

      const intake = existingHistory ? { ...existingHistory.intake, [meal]: taken } : { [meal]: taken };

      let response;
      if (existingHistory) {
        response = await supabase
          .from("diet_history")
          .update({ intake, updated_at: new Date().toISOString() })
          .eq("id", existingHistory.id);
      } else {
        response = await supabase
          .from("diet_history")
          .insert({
            meal_plan_id: dietPlan.id,
            date: today,
            intake,
          });
      }

      if (response.error) {
        throw new Error(`Failed to update diet history: ${response.error.message}`);
      }

      // Update local state to remove meal from daily plan
      setTodayMealStatus(prev => ({ ...prev, [meal]: taken }));
      await refreshData();
      toast.success(`Meal ${meal} marked as ${taken ? "taken" : "not taken"}`);
    } catch (error: any) {
      console.error("Meal intake error:", error.message);
      setError(`Failed to update meal intake: ${error.message}`);
      toast.error(`Failed to update meal intake: ${error.message}`);
    } finally {
      setUpdatingMeal(null);
    }
  }

  // Filter missed meals for the Missed Diet dialog
  const missedMeals = useMemo(() => {
    return dietHistory.flatMap(history =>
      Object.entries(history.intake)
        .filter(([_, taken]) => !taken)
        .map(([meal]) => ({
          date: history.date,
          meal,
          items: dietPlan?.diet_plan[meal] || [],
        }))
    );
  }, [dietHistory, dietPlan]);

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
        <Button onClick={refreshData}>Retry</Button>
      </div>
    );
  }

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 mt-15 min-h-screen"
    >
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push('/admin/dashboard')}
          className="flex items-center gap-2"
        >
          &#8592; Back to Dashboard
        </Button>
      </div>

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

      <Dialog open={showWeightUpdateModal} onOpenChange={setShowWeightUpdateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track Weight</DialogTitle>
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
          <Button onClick={handleWeightUpdate} disabled={!newWeight || isNaN(Number(newWeight)) || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={showMissedDietModal} onOpenChange={setShowMissedDietModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Missed Diet History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {missedMeals.length === 0 ? (
              <p className="text-muted-foreground">No missed meals recorded.</p>
            ) : (
              missedMeals.map((entry, index) => (
                <div key={index} className="border-b pb-2">
                  <div className="text-sm font-semibold">
                    {new Date(entry.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {entry.meal}: {entry.items.map(item => `${Object.keys(item)[0]}: ${Object.values(item)[0]}`).join(", ")}
                    <XCircle className="inline h-4 w-4 text-red-500 ml-2" />
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300">
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
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-200 to-green-300">
              <CardTitle className="flex items-center pt-1"><Scale className="mr-2" /> Weight</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Latest</div>
              <div className="flex justify-between items-center text-sm">
                <div className="mt-2 text-lg font-bold">{lastWeight ? `${lastWeight.weight_kg} kg` : "No data"}</div>
                <div className="text-xs text-muted-foreground items-center flex">{weightUpdatedAgo ? `Updated ${weightUpdatedAgo} ago` : "-"}</div>
                <div className="mt-2 flex">
                  {isStale && isOwnProfile && (
                    <Button variant="default" onClick={() => setShowWeightUpdateModal(true)}>
                      Track
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-200 to-purple-300">
              <CardTitle className="flex items-center"><Ruler className="mr-2" /> Height</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mt-1">Height</div>
              <div className="mt-3 font-semibold">{profile?.height_cm ? `${profile.height_cm} cm` : "—"}</div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3, delay: 0.2 }}>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-red-200 to-red-300">
              <CardTitle className="flex items-center"><Ruler className="mr-2" /> BMI</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground mt-1">BMI</div>
              <div className="flex justify-between items-center text-sm mt-2">
                <div className="font-semibold text-lg">{profile?.bmi ?? "—"}</div>
                <div className="text-xs text-muted-foreground items-center flex">
                  <Activity className="mr-1" size={14} /> {profile?.activity_level ?? "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-teal-200 to-teal-300">
            <CardTitle className="flex items-center pt-2"><User className="mr-2" /> Assigned Nutritionist</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center">
              <Apple className="mr-2 text-teal-600" /> Nutritionist: {nutritionist?.full_name ?? "Not assigned"}
            </div>
          </CardContent>
        </Card>
      </motion.div> */}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200">
            <CardTitle className="flex items-center pt-2"><User className="mr-2" /> Assigned Trainer</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-2">
            <div className="flex items-center">
              <User className="mr-2 text-yellow-400" /> Trainer: {trainer?.full_name ?? "Not assigned"}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-orange-200 to-orange-300">
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
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-200 to-green-300">
            <CardTitle className="flex items-center"><Apple className="mr-2" /> Meal Plan</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-end mb-4 text-sm text-gray-600">
              Assigned Nutritionist: {nutritionist?.full_name ?? "Not assigned"}
            </div>
            {dietPlan ? (
              <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(dietPlan.diet_plan)
                  .filter(([meal]) => todayMealStatus[meal] === undefined)
                  .map(([meal, items], index) => (
                    <motion.div
                      key={meal}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "rounded-xl overflow-hidden shadow-md",
                        "bg-gradient-to-r from-pink-200 to-purple-300 p-4" // Neon shade example
                      )}
                    >
                      <div className="flex">
                        <img
                          src={
                            meal === "Meal_1" ? "https://images.unsplash.com/photo-1525351484163-53cc0b727e8f" : // Breakfast
                            meal === "Meal_2" ? "https://images.unsplash.com/photo-1563379091339-03c6d06acebd" : // Lunch
                            "https://images.unsplash.com/photo-1606857521015-7f9fcf423740" // Dinner
                          }
                          alt={`${meal} image`}
                          className="w-24 h-24 object-cover rounded-lg mr-4"
                        />
                        <div className="flex-1">
                          <div className="text-xs bg-white px-2 py-1 rounded-md mb-2 inline-block">
                            {meal === "Meal_1" ? "Breakfast" : meal === "Meal_2" ? "Lunch" : "Dinner"}
                          </div>
                          <div className="text-sm text-gray-700">
                            {items.map(item => `${Object.keys(item)[0]}: ${Object.values(item)[0]}`).join(", ")}
                          </div>
                          {isOwnProfile && (
                            <div className="mt-2 space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMealIntake(meal, true)}
                                disabled={updatingMeal === meal}
                              >
                                {updatingMeal === meal ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMealIntake(meal, false)}
                                disabled={updatingMeal === meal}
                              >
                                {updatingMeal === meal ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                {Object.keys(todayMealStatus).length === Object.keys(dietPlan.diet_plan).length ? (
                  <p className="text-muted-foreground">All meals for today have been marked.</p>
                ) : (
                  <div className="text-xs text-gray-500 mt-4">
                    Updated {formatDistanceToNowStrict(new Date(dietPlan.updated_at))} ago
                  </div>
                )}
              </motion.div>
            ) : (
              <p className="text-muted-foreground">No meal plan assigned yet.</p>
            )}
            <div className="mt-8">
              <h2 className="text-lg font-bold mb-4">Track your diet:</h2>
              {dietHistory.length === 0 ? (
                <p className="text-muted-foreground">No diet history available.</p>
              ) : (
                <div className="space-y-4">
                  {dietHistory.map(history => (
                    <div key={history.id} className="border-b pb-2">
                      <div className="text-sm font-semibold">
                        {new Date(history.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {Object.entries(history.intake).map(([meal, taken]) => (
                          <div key={meal}>
                            {meal}: {taken ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-red-500" />}
                            <span className="ml-2">
                              {dietPlan?.diet_plan[meal]?.map(item => `${Object.keys(item)[0]}: ${Object.values(item)[0]}`).join(", ")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <BarChart2 className="mr-2" /> Diet History
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMissedDietModal(true)}
              >
                View Missed Meals
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {dietHistory.length === 0 ? (
              <p className="text-muted-foreground">No diet history available.</p>
            ) : (
              <div className="space-y-4">
                {dietHistory.map(history => (
                  <div key={history.id} className="border-b pb-2">
                    <div className="text-sm font-semibold">
                      {new Date(history.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {Object.entries(history.intake).map(([meal, taken]) => (
                        <div key={meal}>
                          {meal}: {taken ? <CheckCircle className="inline h-4 w-4 text-green-500" /> : <XCircle className="inline h-4 w-4 text-red-500" />}
                          <span className="ml-2">
                            {dietPlan?.diet_plan[meal]?.map(item => `${Object.keys(item)[0]}: ${Object.values(item)[0]}`).join(", ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div> */}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.5 }}>
        <Card className="shadow-lg rounded-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-indigo-200 to-indigo-300">
            <CardTitle className="flex items-center"><ImageIcon className="mr-2" /> Photo Gallery</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {galleryPhotos.length === 0 ? (
              <p className="text-muted-foreground">No photos uploaded yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {galleryPhotos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img src={photo.photo} alt="Gallery photo" className=" h-48  rounded-lg" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNowStrict(new Date(photo.date))} ago
                    </p>
                  </div>
                ))}
              </div>
            )}
            {isOwnProfile && canUploadPhoto && (
              <div className="mt-4">
                <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button variant="default" disabled={uploading} asChild>
                    <label htmlFor="photo-upload">
                      {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                      {uploading ? "Uploading..." : "Upload New Photo"}
                    </label>
                  </Button>
                </Label>
                <Input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])}
                />
              </div>
            )}
            {isOwnProfile && !canUploadPhoto && galleryPhotos[0] && (
              <p className="mt-4 text-sm text-muted-foreground">
                Next upload available {formatDistanceToNowStrict(addDays(new Date(galleryPhotos[0].date), 7), { addSuffix: true })}.
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
