"use client";
import Image from 'next/image';
import { cn } from "@/lib/utils";
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle,  DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import { Loader2, Scale, Ruler, Target, Activity, User, Apple, BarChart2, Upload, Image as ImageIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNowStrict, addDays, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useParams, useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import PlanExpirationReminder from "@/components/PlanExpirationReminder";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { ScrollArea } from '@/components/ui/scroll-area';
import DonutChart from '@/components/DonutChart';
import AnimatedDonutChart from '@/components/AnimatedDonutChart';

import WorkoutTracker from '@/components/WorkoutTracker';

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

type MealItem = {
  name: string;
  quantity: string;
};

type Meal = {
  name: string;
  items: MealItem[];
};

// type DietChartData = {
//   date: string;
//   completedMeals: number;
// };
interface WorkoutPlan {
  id: string;
  assigned_to: string;
  created_at: string;
  created_by: string;
  plan: string;
}


export default function MemberDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const memberId = params.memberID as string;
  // const [selectedPhoto, setSelectedPhoto] = useState(null);
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
  const [showDietUpdateModal, setShowDietUpdateModal] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [currentStep, setCurrentStep] = useState(0);
  const [workouts, setWorkouts] = useState<WorkoutPlan[]>([]);
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
  const [userRole, setUserRole] = useState<'member' | 'trainer' | 'nutritionist' | 'admin' | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
// const [timeRange, setTimeRange] = useState<string>('7_days');
// const [customValue, setCustomValue] = useState<string>('');
const [customUnit, setCustomUnit] = useState<string>('days');
  const [newDietPlan, setNewDietPlan] = useState<Meal[]>([
    { name: "Meal 1", items: [{ name: "", quantity: "" }] },
  ]);
  const [updatingDietPlan, setUpdatingDietPlan] = useState(false);
  const [selectedRange, setSelectedRange] = useState('last_7_days');
const [customNumber, setCustomNumber] = useState('1');
const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
const [latestPlan, setLatestPlan] = useState<any>(null);
const [isAssignedTrainer, setIsAssignedTrainer] = useState(false);
const rangeOptions = [
  { value: 'last_1_days', label: 'Last 1 day' },
  { value: 'last_3_days', label: 'Last 3 days' },
  { value: 'last_7_days', label: 'Last 7 days' },
  { value: 'last_2_weeks', label: 'Last 2 weeks' },
  { value: 'last_4_weeks', label: 'Last 4 weeks' },
  { value: 'last_3_months', label: 'Last 3 months' },
  { value: 'last_6_months', label: 'Last 6 months' },
  { value: 'custom', label: 'Custom' },
];
const handleRangeChange = (value: string) => {
  setSelectedRange(value);
};
  const getExerciseNames = (workout: any[]) => {
    if (!workout || !Array.isArray(workout)) return 'No exercises recorded';
    const names = workout.map(ex => ex.name).filter(name => name);
    return names.length > 0 ? names.join(', ') : 'No exercises recorded';
  };
    const calculateOverallProgress = () => {
    if (workoutHistory.length === 0) return 0;
    const totalPercentage = workoutHistory.reduce((sum, item) => sum + item.completion_percentage, 0);
    return Math.round(totalPercentage / workoutHistory.length);
  };
  const overallProgress = calculateOverallProgress();

  const goalOptions = [
    "Lose Weight",
    "Gain Muscle",
    "Build Strength",
    "Improve Endurance",
    "Increase Flexibility",
    "Increase Weight",
    "Maintain Weight",
    "Tone Body",
    "Prepare for Event",
    "Rehabilitation",
    "General Fitness",
    "Weight Management",
    "Muscle Definition",
  ];

  const activityOptions = ["Basic", "Intermediate", "Advanced"];

  // Dynamic meal image mapping
const mealImageMap: { [key: string]: string } = {
    breakfast: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75', // Healthy bowl with fruit, seeds, and yogurt
    lunch: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',   // Fresh salad with vegetables and protein
    dinner: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',   // Plate with salmon and vegetables
    snack: 'https://images.unsplash.com/photo-1496412705862-e0088f16f791?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',    // Fresh fruit and nuts/seeds
    'meal 1': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',   // Meal prep container with balanced meal
    'meal 2': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',   // Healthy chicken and vegetables
    'meal 3': 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75',   // Clean eating bowl with grains and greens
  };
  const getMealName = (mealKey: any) => {
    if (!mealKey || typeof mealKey !== 'string') {
      console.warn('Invalid mealKey:', mealKey);
      return 'Unknown Meal';
    }
    const mealNames: { [key: string]: string } = {
      Meal_1: 'Breakfast',
      Meal_2: 'Lunch',
      Meal_3: 'Dinner',
    };
    const sanitizedKey = mealKey.trim().replace(/[_-]/g, ' ').toLowerCase();
    return mealNames[mealKey] || sanitizedKey.charAt(0).toUpperCase() + sanitizedKey.slice(1);
  };

  const getMealImage = (mealKey: any) => {
    const name = getMealName(mealKey).toLowerCase();
    return mealImageMap[name] || mealImageMap['meal 1'] || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300&q=75';
  };

  // Define steps dynamically based on missing profile fields
  const getDynamicSteps = (profile: MemberProfile | null) => {
    const steps = [];
    if (!profile?.gender) {
      steps.push({
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
      });
    }
    if (!profile?.height_cm) {
      steps.push({
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
      });
    }
    if (!profile?.weight_kg) {
      steps.push({
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
      });
    }
    if (!profile?.goal) {
      steps.push({
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
      });
    }
    if (!profile?.activity_level) {
      steps.push({
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
      });
    }
    return steps;
  };

useEffect(() => {
  let mounted = true;

  async function load() {
    setLoading(true);
    setError(null);
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        setError('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      const loggedInUserId = session.user.id;
      setIsOwnProfile(memberId === loggedInUserId);

      // Fetch member profile
      const { data: mp, error: mpErr } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('user_id', memberId)
        .maybeSingle();
      if (mpErr) throw new Error(`Profile fetch error: ${mpErr.message}`);
      if (!mp) {
        setError('Member profile not found.');
        return;
      }
      setProfile(mp);

      // Determine viewer role
      let viewerRole: 'member' | 'trainer' | 'nutritionist' | 'admin' = 'admin';
      if (loggedInUserId === memberId) {
        viewerRole = 'member';
      } else if (mp.assigned_trainer_id === loggedInUserId) {
        viewerRole = 'trainer';
      } else if (mp.assigned_nutritionist_id === loggedInUserId) {
        viewerRole = 'nutritionist';
      }
      setUserRole(viewerRole);

      // Fetch weight history
      let wh: WeightHistory[] = [];
      if (['member', 'admin', 'trainer', 'nutritionist'].includes(viewerRole)) {
        const { data: whData, error: whErr } = await supabase
          .from('weight_history')
          .select('*')
          .eq('member_id', memberId)
          .order('recorded_at', { ascending: true });
        if (whErr) throw new Error(`Weight history fetch error: ${whErr.message}`);
        wh = whData as WeightHistory[];
      }
      setWeightHistory(wh);

      // Fetch gallery photos
      let gp: GalleryPhoto[] = [];
      if (viewerRole === 'member' || viewerRole === 'admin') {
        const { data: gpData, error: gpErr } = await supabase
          .from('gallery')
          .select('id, date, photo')
          .eq('user_id', memberId)
          .order('date', { ascending: false });
        if (gpErr) throw new Error(`Gallery fetch error: ${gpErr.message}`);
        gp = gpData as GalleryPhoto[];
      }
      setGalleryPhotos(gp);

      // Fetch diet plan and history
      let dp: DietPlan | null = null;
      let dh: DietHistory[] = [];
      let todayHistory: { intake: { [key: string]: boolean } } | null = null;
      if (['member', 'admin', 'nutritionist'].includes(viewerRole)) {
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('email')
          .eq('id', memberId)
          .single();
        if (userErr) throw new Error(`User fetch error: ${userErr.message}`);

        const { data: dpData, error: dpErr } = await supabase
          .from('diet')
          .select('*')
          .eq('user_email', userData.email)
          .maybeSingle();
        if (dpErr && dpErr.code !== 'PGRST116') {
          throw new Error(`Diet plan fetch error: ${dpErr.message}`);
        }
        dp = dpData as DietPlan;

        if (dp?.id) {
          const { data: dhData, error: dhErr } = await supabase
            .from('diet_history')
            .select('*')
            .eq('meal_plan_id', dp.id)
            .order('date', { ascending: false });
          if (dhErr) throw new Error(`Diet history fetch error: ${dhErr.message}`);
          dh = dhData as DietHistory[];

          const today = new Date().toISOString().split('T')[0];
          const { data: todayHistoryData, error: todayErr } = await supabase
            .from('diet_history')
            .select('intake')
            .eq('meal_plan_id', dp.id)
            .eq('date', today)
            .maybeSingle();
          if (todayErr && todayErr.code !== 'PGRST116') {
            throw new Error(`Today's history fetch error: ${todayErr.message}`);
          }
          todayHistory = todayHistoryData;
        }
      }
      setDietPlan(dp);
      setDietHistory(dh);
      setTodayMealStatus(todayHistory?.intake || {});

      // Fetch workout plans and history
      let wp: any[] = [];
      if (['member', 'trainer', 'admin'].includes(viewerRole)) {
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('email')
          .eq('id', memberId)
          .single();
        if (userErr) {
          console.error('User Fetch Error:', userErr);
          throw new Error(`User fetch error: ${userErr.message}`);
        }

        const { data: wpData, error: wpErr } = await supabase
          .from('workout_plans')
          .select('id, assigned_to, created_at, plan')
          .eq('assigned_to', userData.email)
          .order('created_at', { ascending: false });
        if (wpErr) {
          console.error('Workouts Fetch Error:', wpErr);
          throw new Error(`Workouts fetch error: ${wpErr.message}`);
        }
        wp = wpData || [];
        setWorkouts(wp);
        console.log('Fetched workouts:', wp);
        if (wp.length > 0) {
          setLatestPlan(wp[0]);
        }

        // Fetch workout history
        try {
          console.log('Workout History Fetch - Starting:', { memberId, range: selectedRange, viewerRole });
          const response = await fetch(`/api/workout/history?member_id=${memberId}`,
            {
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
            }
          );

          console.log('Workout History Fetch - Response:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Workout History Fetch Error:', {
              status: response.status,
              error: errorData.error || 'Unknown error',
              details: errorData.details || 'No details',
            });
            toast.error(`Failed to load workout history: ${errorData.error || 'Unknown error'}`);
            setWorkoutHistory([]);
            return;
          }

          const { history } = await response.json();
          console.log('Fetched workout history:', history);
          if (!history || history.length === 0) {
            console.warn('Workout History Fetch Warning: Empty history returned', { memberId, range: selectedRange });
          }
          setWorkoutHistory(history || []);
        } catch (err: any) {
          console.error('Workout History Fetch Failed:', {
            message: err.message,
            stack: err.stack,
          });
          toast.error(`Failed to load workout history: ${err.message}`);
          setWorkoutHistory([]);
        }
      }

      // Check upload eligibility
      if (loggedInUserId === memberId) {
        const latestPhoto = gp[0];
        const canUpload = !latestPhoto || isAfter(new Date(), addDays(new Date(latestPhoto.date), 7));
        setCanUploadPhoto(canUpload);
      }

      // Fetch trainer
      if (mp?.assigned_trainer_id) {
        const res = await fetch(`/api/member/trainer?trainer_id=${mp.assigned_trainer_id}`);
        const json = await res.json();
        if (json.trainer_name) {
          setTrainer({ full_name: json.trainer_name });
        }
      }

      // Fetch nutritionist
      if (mp?.assigned_nutritionist_id) {
        const res = await fetch(`/api/member/nutritionist?nutritionist_id=${mp.assigned_nutritionist_id}`);
        const json = await res.json();
        if (json.nutritionist_name) {
          setNutritionist({ full_name: json.nutritionist_name });
        }
      }

      // Show setup modal
      if (
        loggedInUserId === memberId &&
        (!mp?.height_cm || !mp?.weight_kg || !mp?.bmi || !mp?.gender || !mp?.goal || !mp?.activity_level)
      ) {
        setShowSetupModal(true);
      }
    } catch (err: any) {
      console.error('Error loading member dashboard:', {
        message: err.message,
        stack: err.stack,
      });
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

useEffect(() => {
  if (latestPlan && workoutHistory) {
    console.log('Initializing currentWorkout:', {
      latestPlanId: latestPlan.id,
      plan: latestPlan.plan,
      planType: typeof latestPlan.plan,
      isArray: Array.isArray(latestPlan.plan),
    });

    const today = new Date().toISOString().split('T')[0];
    const todayHistory = workoutHistory.find(
      (h: any) =>
        new Date(h.recorded_at).toISOString().split('T')[0] === today &&
        h.workout_plan_id === latestPlan.id
    );

    if (todayHistory && todayHistory.workout) {
      console.log('Using existing workout history for today:', todayHistory.workout);
      setCurrentWorkout(todayHistory.workout);
    } else {
      // Handle cases where plan is not an array
      const planArray = Array.isArray(latestPlan.plan)
        ? latestPlan.plan
        : latestPlan.plan?.exercises
        ? latestPlan.plan.exercises
        : [];
      const initialized = planArray.map((ex: any) => ({
        ...ex,
        sets: ex.sets ? ex.sets.map((set: any) => ({ ...set, completed: false })) : [],
      }));
      console.log('Initialized currentWorkout:', initialized);
      setCurrentWorkout(initialized);
    }
  }
}, [latestPlan, workoutHistory]);
useEffect(() => {
  if (userRole === 'member' || userRole === 'trainer' || userRole === 'admin') {  // Adjust based on your allowed roles
    const rangeToFetch = selectedRange === 'custom' ? `last_${customNumber}_${customUnit}` : selectedRange;
    fetchWorkoutHistory(rangeToFetch);
  }
}, [selectedRange, customNumber, customUnit, userRole, memberId]);

useEffect(() => {
  const checkIfAssignedTrainer = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data, error } = await supabase
        .from('member_profiles')
        .select('assigned_trainer_id')
        .eq('user_id', memberId)
        .single();

      if (!error && data && data.assigned_trainer_id === session.user.id) {
        setIsAssignedTrainer(true);
      }
    }
  };

  if (!isOwnProfile) {  // Only check if not own profile
    checkIfAssignedTrainer();
  }
}, [memberId, isOwnProfile]);


  // Modified weight extraction to use member_profiles when weight_history is empty
  const lastWeight = useMemo(() => {
    if (weightHistory.length > 0) {
      return weightHistory[weightHistory.length - 1];
    }
    if (profile?.weight_kg) {
      return { weight_kg: profile.weight_kg, recorded_at: profile.plan_start || new Date().toISOString() };
    }
    return null;
  }, [weightHistory, profile]);

  const weightUpdatedAgo = lastWeight ? formatDistanceToNowStrict(new Date(lastWeight.recorded_at)) : null;
  const isStale = !lastWeight || (Date.now() - new Date(lastWeight.recorded_at).getTime()) > 24 * 3600 * 1000;

  const dietChartData = useMemo(() => {
    return dietHistory.map(h => ({
      date: new Date(h.date).toLocaleDateString(),
      completedMeals: Object.values(h.intake).filter(Boolean).length,
    }));
  }, [dietHistory]);

  async function refreshData() {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const { data: mp, error: mpErr } = await supabase.from("member_profiles").select("*").eq("user_id", memberId).maybeSingle();
      if (mpErr) throw new Error(`Profile fetch error: ${mpErr.message}`);

      let wh: WeightHistory[] = [];
      if (userRole === 'member' || userRole === 'admin' || userRole === 'trainer' || userRole === 'nutritionist') {
        const { data: whData, error: whErr } = await supabase.from("weight_history").select("*").eq("member_id", memberId).order("recorded_at", { ascending: true });
        if (whErr) {
          console.error('Weight history fetch error:', whErr);
          throw new Error(`Weight history fetch error: ${whErr.message}`);
        }
        console.log('Weight history data:', whData);
        wh = whData as WeightHistory[];
      }

      let gp: GalleryPhoto[] = [];
      if (userRole === 'member' || userRole === 'admin') {
        const { data: gpData, error: gpErr } = await supabase.from("gallery").select("id, date, photo").eq("user_id", memberId).order("date", { ascending: false });
        if (gpErr) throw new Error(`Gallery fetch error: ${gpErr.message}`);
        gp = gpData as GalleryPhoto[];
      }

      let dp: DietPlan | null = null;
      let dh: DietHistory[] = [];
      let todayHistory: { intake: { [key: string]: boolean } } | null = null;
      if (userRole === 'member' || userRole === 'admin' || userRole === 'nutritionist') {
        const { data: userData, error: userErr } = await supabase
          .from("users")
          .select("email")
          .eq("id", memberId)
          .single();
        if (userErr) throw new Error(`User fetch error: ${userErr.message}`);

        const { data: dpData, error: dpErr } = await supabase
          .from("diet")
          .select("*")
          .eq("user_email", userData.email)
          .maybeSingle();
        if (dpErr && dpErr.code !== "PGRST116") throw new Error(`Diet plan fetch error: ${dpErr.message}`);
        dp = dpData as DietPlan;

        if (dp?.id) {
          const { data: dhData, error: dhErr } = await supabase
            .from("diet_history")
            .select("*")
            .eq("meal_plan_id", dp.id)
            .order("date", { ascending: false });
          if (dhErr) throw new Error(`Diet history fetch error: ${dhErr.message}`);
          dh = dhData as DietHistory[];

          const today = new Date().toISOString().split("T")[0];
          const { data: todayHistoryData, error: todayErr } = await supabase
            .from("diet_history")
            .select("intake")
            .eq("meal_plan_id", dp.id)
            .eq("date", today)
            .maybeSingle();
          if (todayErr && todayErr.code !== "PGRST116") throw new Error(`Today's history fetch error: ${todayErr.message}`);
          todayHistory = todayHistoryData;
        }
      }

      setProfile(mp ?? null);
      setWeightHistory(wh ?? []);
      setGalleryPhotos(gp ?? []);
      setDietPlan(dp ?? null);
      setDietHistory(dh ?? []);
      setTodayMealStatus(todayHistory?.intake || {});
            // Fetch workouts for member
            // Fetch workouts for member if viewer is member, trainer, or admin
      if (userRole === 'member' || userRole === 'trainer' || userRole === 'admin') {
        const { data: userData, error: userErr } = await supabase
          .from('users')
          .select('email')
          .eq('id', memberId)
          .single();
        if (userErr) {
          console.log('User Fetch Error:', userErr);
          throw new Error(`User fetch error: ${userErr.message}`);
        }

        const { data: wpData, error: wpErr } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('assigned_to', userData.email)
          .order('created_at', { ascending: false });
        if (wpErr) {
          console.log('Workouts Fetch Error:', wpErr);
          throw new Error(`Workouts fetch error: ${wpErr.message}`);
        }
        setWorkouts(wpData || []);
        console.log('Fetched workouts:', wpData);
      }
      

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
    const steps = getDynamicSteps(profile);
    if (!steps[currentStep].isValid()) {
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
          height_cm: formData.height_cm || profile?.height_cm,
          weight_kg: formData.weight_kg || profile?.weight_kg,
          gender: formData.gender || profile?.gender,
          goal: formData.goal || profile?.goal,
          activity_level: formData.activity_level || profile?.activity_level,
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

    if (!isValid) {
      setError("Please enter a meal name and at least one valid item for each meal");
      toast.error("Please enter a meal name and at least one valid item for each meal");
      return;
    }

    setUpdatingDietPlan(true);
    setError(null);

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required");
      }

      const dietPlanData = newDietPlan.reduce((acc, meal) => {
        acc[meal.name] = meal.items
          .filter(item => item.name.trim() && item.quantity.trim())
          .map(item => ({ [item.name.trim()]: item.quantity.trim() }));
        return acc;
      }, {} as { [key: string]: { [key: string]: string }[] });

      const { data: userData, error: userErr } = await supabase
        .from("users")
        .select("email")
        .eq("id", memberId)
        .single();
      if (userErr) throw new Error(`User fetch error: ${userErr.message}`);

      const payload = {
        user_email: userData.email,
        diet_plan: dietPlanData,
      };

      const { data: existingDiet, error: fetchError } = await supabase
        .from("diet")
        .select("*")
        .eq("user_email", userData.email)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        throw new Error(`Failed to check existing diet: ${fetchError.message}`);
      }

      let response;
      if (existingDiet) {
        response = await supabase
          .from("diet")
          .update({ diet_plan: dietPlanData, updated_at: new Date().toISOString() })
          .eq("id", existingDiet.id);
      } else {
        response = await supabase
          .from("diet")
          .insert(payload);
      }

      if (response.error) {
        throw new Error(`Failed to update diet plan: ${response.error.message}`);
      }

      setShowDietUpdateModal(false);
      setNewDietPlan([{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]);
      await refreshData();
      toast.success("Diet plan updated successfully!");
    } catch (err: any) {
      console.error("handleUpdateDietPlan: Error:", err);
      setError(`Failed to update diet plan: ${err.message}`);
      toast.error(`Failed to update diet plan: ${err.message}`);
    } finally {
      setUpdatingDietPlan(false);
    }
  }

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

  const showWeightSection = userRole === 'member' || userRole === 'admin' || userRole === 'trainer' || userRole === 'nutritionist';
  const showDietSection = userRole === 'member' || userRole === 'admin' || userRole === 'nutritionist';
  const showPlanSection = userRole === 'member' || userRole === 'admin' || userRole === 'trainer' || userRole === 'nutritionist';
  const showPhotoGallery = userRole === 'member' || userRole === 'admin';

  // Get dynamic steps for the setup modal
  const steps = getDynamicSteps(profile);

  if (error) {
    return (
      <div className="flex h-[60vh] items-center justify-center flex-col gap-4">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => router.push("/login")}>Go to Login</Button>
        <Button onClick={refreshData}>Retry</Button>
      </div>
    );
  }
const fetchWorkoutHistory = async (range: string) => {
  try {
    console.log('fetchWorkoutHistory - Starting:', { memberId, range });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('fetchWorkoutHistory - Session:', {
      user: session?.user?.email,
      userId: session?.user?.id,
      token: session?.access_token?.slice(0, 10) + '...'
    });

    if (sessionError || !session) {
      console.warn('fetchWorkoutHistory - Warning: Session expired');
      toast.error('Session expired. Please log in again.');
      setWorkoutHistory([]);
      return;
    }

    const response = await fetch(
      `/api/workout/history?member_id=${memberId}&range=${range}`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    console.log('fetchWorkoutHistory - Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('fetchWorkoutHistory - Error:', {
        status: response.status,
        error: errorData.error || 'Unknown error',
        details: errorData.details || 'No details',
      });
      toast.error(`Failed to load workout history: ${errorData.error || 'Unknown error'}`);
      setWorkoutHistory([]);
      return;
    }

    const { history } = await response.json();
    console.log('fetchWorkoutHistory - Fetched:', history);
    if (!history || history.length === 0) {
      console.warn('fetchWorkoutHistory - Warning: Empty history returned', { memberId, range });
    }
    setWorkoutHistory(history || []);
  } catch (error: any) {
    console.error('fetchWorkoutHistory - Failed:', {
      message: error.message,
      stack: error.stack,
    });
    toast.error(`Failed to load workout history: ${error.message}`);
    setWorkoutHistory([]);
  }
};
const handleToggleCompletion = async (exerciseIndex: number, setIndex: number) => {
  const updatedWorkout = currentWorkout.map((ex: any, exIdx: number) => {
    if (exIdx === exerciseIndex) {
      return {
        ...ex,
        sets: ex.sets.map((set: any, setIdx: number) => {
          if (setIdx === setIndex) {
            return { ...set, completed: !set.completed };
          }
          return set;
        }),
      };
    }
    return ex;
  });

  setCurrentWorkout(updatedWorkout);

  // Calculate completion percentage
  const completedSets = updatedWorkout.reduce((acc: number, ex: any) => acc + ex.sets.filter((s: any) => s.completed).length, 0);
  const totalSets = updatedWorkout.reduce((acc: number, ex: any) => acc + ex.sets.length, 0);
  const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

  // Save to API
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('Session expired. Please log in again.');
      return;
    }

    const response = await fetch('/api/workout/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        memberId,
        workoutPlanId: latestPlan.id,
        workout: updatedWorkout,
        completionPercentage: percentage,
      }),
    });

if (!response.ok) {
      const errorData = await response.json();
      toast.error(`Failed to save progress: ${errorData.error || 'Unknown error'}`);
      return;
    }

    // Refresh history to reflect updated record
    await fetchWorkoutHistory('last_1_days');
  } catch (error: any) {
    toast.error(`Failed to save progress: ${error.message}`);
  }
};

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6 p-6 mt-15 min-h-screen"
    >
      <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      <div className="mb-4 flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (userRole === 'member') {
              router.push(`/member/${memberId}`);
            } else if (userRole === 'trainer') {
              router.push('/trainer/dashboard');
            } else if (userRole === 'nutritionist') {
              router.push('/nutritionist/dashboard');
            } else {
              router.push('/admin/dashboard');
            }
          }}
          className="flex items-center gap-2"
        >
          &#8592; Back to {userRole === 'member' ? 'Member' : userRole === 'trainer' ? 'Trainer' : userRole === 'nutritionist' ? 'Nutritionist' : 'Admin'} Dashboard
        </Button>
        {/* {isOwnProfile && (
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setFormData({
                gender: profile?.gender || "",
                height_cm: profile?.height_cm || 170,
                weight_kg: profile?.weight_kg || 70,
                goal: profile?.goal || "",
                activity_level: profile?.activity_level || "",
              });
              setShowSetupModal(true);
            }}
          >
            Update Profile Details
          </Button>
        )} */}
      </div>
      

      <Dialog open={showSetupModal} onOpenChange={(open) => {
        if (!open) {
          setShowSetupModal(false);
          setCurrentStep(0);
          refreshData();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{steps[currentStep]?.title || "Complete Your Profile"}</DialogTitle>
          </DialogHeader>
          <AnimatePresence mode="wait">
            {steps.length > 0 && (
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 50 }}
                transition={{ duration: 0.3 }}
              >
                {steps[currentStep]?.content}
              </motion.div>
            )}
          </AnimatePresence>
          <div className="flex justify-between mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowSetupModal(false);
                setCurrentStep(0);
                refreshData();
              }}
            >
              Close
            </Button>
            {steps.length > 0 && (
              <>
                {currentStep > 0 && (
                  <Button variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                    Back
                  </Button>
                )}
                <Button
                  disabled={!steps[currentStep]?.isValid() || loading}
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
              </>
            )}
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

      <Dialog open={showDietUpdateModal && userRole === 'nutritionist'} onOpenChange={setShowDietUpdateModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Update Diet Plan</DialogTitle>
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
                  setShowDietUpdateModal(false);
                  setNewDietPlan([{ name: "Meal 1", items: [{ name: "", quantity: "" }] }]);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateDietPlan} disabled={updatingDietPlan}>
                {updatingDietPlan ? (
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {showPlanSection && (
          <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
            <Card className="shadow-lg rounded-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-blue-200 to-blue-300">
                <CardTitle className="flex items-center pt-1"><Target className="mr-2" /> Plan</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Selected plan</div>
                <PlanExpirationReminder plan={profile?.plan} planStart={profile?.plan_start} />
                <div className="mt-2 font-semibold text-lg">{profile?.plan ?? "No plan assigned"}</div>
                {profile?.plan_start && (
                  <Badge variant="secondary" className="mt-2">
                    Started: {new Date(profile.plan_start).toLocaleDateString()}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {showWeightSection && (
          <>
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
                      {(isOwnProfile || userRole === 'trainer') && (
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
                    <div className="flex items-center space-x-3">
                      <div className="font-semibold text-lg">
                        {profile?.bmi != null && !Number.isNaN(Number(profile.bmi))
                          ? Number(profile.bmi).toFixed(1)
                          : "—"}
                      </div>
                      {profile?.bmi != null && !Number.isNaN(Number(profile.bmi)) && (
                        (() => {
                          const bmi = Number(profile.bmi);
                          let label = "—";
                          let colorClass = "bg-gray-100 text-gray-800";
                          if (bmi < 18.5) {
                            label = "Underweight";
                            colorClass = "bg-yellow-100 text-yellow-800";
                          } else if (bmi < 25) {
                            label = "Healthy weight";
                            colorClass = "bg-green-100 text-green-800";
                          } else if (bmi < 30) {
                            label = "Overweight";
                            colorClass = "bg-orange-100 text-orange-800";
                          } else {
                            label = "Obesity";
                            colorClass = "bg-red-100 text-red-800";
                          }
                          return (
                            <span
                              aria-label={`BMI category: ${label}`}
                              className={`text-xs font-medium px-2 py-0.5 rounded-full ${colorClass}`}
                            >
                              {label}
                            </span>
                          );
                        })()
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground items-center flex">
                      <Activity className="mr-1" size={14} /> {profile?.activity_level ?? "—"}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

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

      {showWeightSection && userRole !== 'nutritionist' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-200 to-orange-300">
              <CardTitle className="flex items-center"><BarChart2 className="mr-2" /> Weight Tracking</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {weightHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={weightHistory.map((d) => ({ 
                    date: new Date(d.recorded_at).toLocaleDateString(), 
                    weight: d.weight_kg,
                    bmi: d.bmi 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#f97316" 
                      strokeWidth={3}
                      activeDot={{ r: 8, fill: '#f97316' }} 
                      name="Weight (kg)"
                    />
                    {weightHistory.some(d => d.bmi) && (
                      <Line 
                        type="monotone" 
                        dataKey="bmi" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        activeDot={{ r: 6, fill: '#3b82f6' }} 
                        name="BMI"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-8">
                  <BarChart2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground text-lg">No weight history available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {lastWeight ? `Last recorded: ${lastWeight.weight_kg}kg` : 'Start tracking your weight to see progress!'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showDietSection && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="shadow-lg rounded-xl overflow-hidden">
            <CardHeader className="bg-teal-100">
              <CardTitle className="flex items-center pt-2"><Apple className="mr-2" /> Meal Plan</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex items-center justify-end mb-4 text-sm text-gray-600">
                Assigned Nutritionist: <span className="font-medium ml-1">{nutritionist?.full_name ?? "Not assigned"}</span>
              </div>
              {dietPlan && dietPlan.diet_plan && Object.keys(dietPlan.diet_plan).length > 0 ? (
                <motion.div className={cn(
                  "grid gap-4",
                  Object.keys(dietPlan.diet_plan).length === 1 ? "grid-cols-1" :
                  Object.keys(dietPlan.diet_plan).length === 2 ? "grid-cols-1 sm:grid-cols-2" :
                  Object.keys(dietPlan.diet_plan).length === 3 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" :
                  "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                )}>
                  {Object.entries(dietPlan.diet_plan)
                    .filter(([meal]) => todayMealStatus[meal] === undefined)
                    .map(([meal, items], index) => (
                      <motion.div
                        key={meal}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="rounded-xl overflow-hidden shadow-md bg-white flex flex-col"
                      >
                        <div className="relative w-full h-45">
                          <Image
                            src={getMealImage(meal)}
                            alt={`${getMealName(meal)} image`}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            className="object-cover"
                            priority={index < 4}
                          />
                        </div>
                        <div className="p-4 flex-1">
                          <div className="text-xs bg-teal-50 px-2 py-1 rounded-md mb-2 inline-block">
                            {getMealName(meal)}
                          </div>
                          <div className="text-sm text-gray-700">
                            {Array.isArray(items) && items.length > 0
                              ? items.map(item => {
                                  const key = Object.keys(item)[0];
                                  const value = Object.values(item)[0];
                                  return key && value ? `${key}: ${value}` : 'Unknown Item';
                                }).join(", ")
                              : 'No items specified'}
                          </div>
                          {isOwnProfile && (
                            <div className="mt-4 flex justify-end space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMealIntake(meal, true)}
                                disabled={updatingMeal === meal}
                                className="text-green-600 hover:bg-green-50"
                              >
                                {updatingMeal === meal ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMealIntake(meal, false)}
                                disabled={updatingMeal === meal}
                                className="text-red-600 hover:bg-red-50"
                              >
                                {updatingMeal === meal ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                </motion.div>
              ) : (
                <div className="text-sm text-muted-foreground italic text-center py-8">
                  No diet plan assigned yet
                  {userRole === 'nutritionist' && (
                    <Button
                      variant="default"
                      onClick={() => setShowDietUpdateModal(true)}
                      className="ml-4"
                    >
                      Assign Diet Plan
                    </Button>
                  )}
                </div>
              )}
              {dietPlan && dietPlan.diet_plan && Object.keys(dietPlan.diet_plan).length > 0 && (
                <>
                  {userRole === 'nutritionist' && (
                    <Button
                      variant="default"
                      onClick={() => {
                        setNewDietPlan(
                          Object.entries(dietPlan.diet_plan).map(([meal, items]) => ({
                            name: meal,
                            items: items.map(item => ({
                              name: Object.keys(item)[0],
                              quantity: Object.values(item)[0],
                            })),
                          }))
                        );
                        setShowDietUpdateModal(true);
                      }}
                      className="mt-4"
                    >
                      Update Diet Plan
                    </Button>
                  )}
                  {Object.keys(todayMealStatus).length === Object.keys(dietPlan.diet_plan).length ? (
                    <p className="text-muted-foreground text-center mt-4">All meals for today have been marked.</p>
                  ) : (
                    <div className="text-xs text-gray-500 mt-4 text-right">
                      Updated {formatDistanceToNowStrict(new Date(dietPlan.updated_at))} ago
                    </div>
                  )}
                </>
              )}
              <div className="mt-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    <BarChart2 className="mr-2 h-5 w-5 text-teal-600" /> Track your diet
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMissedDietModal(true)}
                  >
                    View Missed Meals
                  </Button>
                </div>
                {dietHistory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No diet history available.</p>
                ) : (
                  <Accordion type="single" collapsible className="w-full mt-4">
                    {dietHistory.map(history => (
                      <AccordionItem key={history.id} value={history.id}>
                        <AccordionTrigger className="text-sm font-semibold">
                          {new Date(history.date).toLocaleDateString()}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm text-gray-600">
                            {Object.entries(history.intake).map(([meal, taken]) => (
                              <div key={meal} className="flex items-center">
                                <span className="font-medium">{getMealName(meal)}:</span>
                                <span className="ml-2 flex items-center">
                                  {taken ? <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> : <XCircle className="h-4 w-4 text-red-500 mr-1" />}
                                  {dietPlan?.diet_plan[meal]?.map(item => {
                                    const key = Object.keys(item)[0];
                                    const value = Object.values(item)[0];
                                    return key && value ? `${key}: ${value}` : 'Unknown Item';
                                  }).join(", ") || 'No items'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {showPhotoGallery && (
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
                      <img src={photo.photo} alt="Gallery photo" className="h-48 rounded-lg" />
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
      )}
<div className="  space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            {/* <Dumbbell className="h-6 w-6 text-blue-600" /> */}
            Member Dashboard
          </CardTitle>
          <p className="text-muted-foreground">Track your workout progress and history</p>
        </CardHeader>
        <CardContent>
          <WorkoutTracker latestPlan={latestPlan} memberId={memberId || ''} />
        </CardContent>
      </Card>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Workout Progress History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center mb-4">
            <Select value={selectedRange} onValueChange={handleRangeChange}>
              <SelectTrigger className="w-[180px] border-blue-200 focus:ring-blue-500">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                {rangeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedRange === 'custom' && (
              <div className="ml-4 flex items-center gap-2">
                <Input
                  type="number"
                  value={customNumber}
                  onChange={e => setCustomNumber(e.target.value)}
                  className="w-20 border-blue-200 focus:ring-blue-500"
                  min="1"
                />
                <Select value={customUnit} onValueChange={setCustomUnit}>
                  <SelectTrigger className="w-[120px] border-blue-200 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="days">Days</SelectItem>
                    <SelectItem value="weeks">Weeks</SelectItem>
                    <SelectItem value="months">Months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          {loading ? (
            <p className="text-center text-gray-500">Loading...</p>
          ) : workoutHistory.length === 0 ? (
            <p className="text-center text-gray-500">No workout history available for the selected range.</p>
          ) : (
            <div className="flex gap-6">
              {/* Left Half: Workout History Table */}
              <div className="w-1/2">
                <ScrollArea className="h-[300px] w-full rounded-md border border-gray-200">
                  <Table>
                    <TableHeader className="sticky top-0 bg-white shadow-sm">
                      <TableRow>
                        <TableHead className="w-[60px]">#</TableHead>
                        <TableHead>Workout</TableHead>
                        <TableHead>Progress</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {workoutHistory.map((item: any, index: number) => (
                        <TableRow key={item.id} className="hover:bg-gray-50">
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="max-w-[150px] truncate">{getExerciseNames(item.workout)}</TableCell>
                          <TableCell>
                            <DonutChart percentage={item.completion_percentage} />
                          </TableCell>
                          <TableCell>{new Date(item.recorded_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
              {/* Right Half: Overall Progress Donut Chart */}
              <div className="w-1/2 flex flex-col items-center justify-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Progress</h3>
                <AnimatedDonutChart percentage={overallProgress} />
                <p className="mt-4 text-sm text-gray-500">
                  Average completion: {overallProgress}%
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>


      
    </motion.div>
  );
}




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



