"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Dumbbell, Clock, Target } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';

interface WorkoutTrackerProps {
  latestPlan: any;
  memberId: string;
}

export default function WorkoutTracker({ latestPlan, memberId }: WorkoutTrackerProps) {
  const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!latestPlan?.plan) return;
      
      console.log('WorkoutTracker - latestPlan:', latestPlan);
      
      // Parse the plan data - handle both string and object formats
      let planData;
      try {
        if (typeof latestPlan.plan === 'string') {
          planData = JSON.parse(latestPlan.plan);
        } else {
          planData = latestPlan.plan;
        }
      } catch (error) {
        console.error('Error parsing plan data:', error);
        return;
      }
      
      console.log('WorkoutTracker - parsed planData:', planData);
      
      const planArray = Array.isArray(planData) 
        ? planData 
        : planData?.exercises || [];
      
      console.log('WorkoutTracker - planArray:', planArray);
      
      // Check if there's existing workout history for today
      const today = new Date().toISOString().split('T')[0];
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: todayHistory } = await supabase
          .from('workout_history')
          .select('workout')
          .eq('workout_plan_id', latestPlan.id)
          .eq('member_id', session.user.id)
          .gte('recorded_at', `${today}T00:00:00.000Z`)
          .lt('recorded_at', `${today}T23:59:59.999Z`)
          .maybeSingle();
        
        if (todayHistory?.workout) {
          console.log('WorkoutTracker - using existing history:', todayHistory.workout);
          setCurrentWorkout(todayHistory.workout);
        } else {
          const initialized = planArray.map((ex: any) => ({
            ...ex,
            sets: ex.sets ? ex.sets.map((set: any) => ({ ...set, completed: false })) : []
          }));
          console.log('WorkoutTracker - initialized workout:', initialized);
          setCurrentWorkout(initialized);
        }
      }
    };
    
    loadWorkoutData();
  }, [latestPlan]);

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
          })
        };
      }
      return ex;
    });

    setCurrentWorkout(updatedWorkout);
    await saveWorkoutProgress(updatedWorkout);
  };

  const saveWorkoutProgress = async (workout: any[]) => {
    if (!latestPlan?.id) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      const response = await fetch('/api/workout/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          workoutPlanId: latestPlan.id,
          workout
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(`Failed to save progress: ${errorData.error || 'Unknown error'}`);
      } else {
        toast.success('Progress saved!');
      }
    } catch (error: any) {
      toast.error(`Failed to save progress: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Calculate workout progress
  const calculateProgress = () => {
    if (currentWorkout.length === 0) return 0;
    
    let totalSets = 0;
    let completedSets = 0;
    
    currentWorkout.forEach((exercise: any) => {
      if (exercise.sets && exercise.sets.length > 0) {
        totalSets += exercise.sets.length;
        completedSets += exercise.sets.filter((set: any) => set.completed).length;
      } else if (exercise.duration_minutes) {
        totalSets += 1;
        if (exercise.completed) completedSets += 1;
      }
    });
    
    return totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  };

  const progress = calculateProgress();

  if (!latestPlan || currentWorkout.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            Today's Workout
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No workout plan assigned yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Contact your trainer to get started!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            Today's Workout
          </CardTitle>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {progress}% Complete
          </Badge>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {currentWorkout.map((exercise: any, exerciseIndex: number) => {
          const exerciseCompleted = exercise.sets 
            ? exercise.sets.every((set: any) => set.completed)
            : exercise.completed;
          
          return (
            <div key={exerciseIndex} className="border rounded-xl p-4 bg-gradient-to-r from-gray-50 to-gray-100/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  {exercise.name}
                </h3>
                {exerciseCompleted && (
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <Check className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
              
              {exercise.sets && exercise.sets.length > 0 ? (
                <div className="space-y-3">
                  {exercise.sets.map((set: any, setIndex: number) => (
                    <div key={setIndex} className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                      set.completed 
                        ? 'bg-green-50 border-green-200 shadow-sm' 
                        : 'bg-white border-gray-200 hover:border-blue-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                          set.completed 
                            ? 'bg-green-500 text-white' 
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {setIndex + 1}
                        </div>
                        <span className="font-medium">
                          {set.reps} reps @ {set.weight} kg
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={set.completed ? "default" : "outline"}
                          onClick={() => handleToggleCompletion(exerciseIndex, setIndex)}
                          disabled={loading}
                          className={`transition-all duration-200 ${
                            set.completed 
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-sm" 
                              : "hover:bg-green-50 border-green-200 hover:border-green-300"
                          }`}
                          title={set.completed ? "Mark as incomplete" : "Mark as completed"}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : exercise.duration_minutes ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-3">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">
                      Duration: {exercise.duration_minutes} minutes
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={exercise.completed ? "default" : "outline"}
                    onClick={() => {
                      const updatedWorkout = currentWorkout.map((ex: any, exIdx: number) => {
                        if (exIdx === exerciseIndex) {
                          return { ...ex, completed: !ex.completed };
                        }
                        return ex;
                      });
                      setCurrentWorkout(updatedWorkout);
                      saveWorkoutProgress(updatedWorkout);
                    }}
                    disabled={loading}
                    className={exercise.completed 
                      ? "bg-green-500 hover:bg-green-600 text-white" 
                      : "hover:bg-green-50 border-green-200"
                    }
                  >
                    {exercise.completed ? <Check className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded-lg">
                  No specific sets or duration defined
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}