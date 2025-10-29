"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Check, X, Dumbbell, Clock, Target, Play, Pause, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from 'react-hot-toast';

interface WorkoutTrackerProps {
  latestPlan: any;
  memberId: string;
}

export default function WorkoutTracker({ latestPlan, memberId }: WorkoutTrackerProps) {
  const [currentWorkout, setCurrentWorkout] = useState<any[]>([]);
  const [timers, setTimers] = useState<{[key: number]: {running: boolean, remaining: number}}>({});
  const intervalsRef = useRef<{[key: number]: NodeJS.Timeout | null}>({});
  const [loading, setLoading] = useState(false);
  const [isMember, setIsMember] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsMember(session.user.id === memberId);
      } else {
        setIsMember(false);
        toast.error('Session expired. Please log in again.');
      }
    };

    checkUserRole();
  }, [memberId]);

  useEffect(() => {
    const loadWorkoutData = async () => {
      if (!latestPlan?.plan) {
        console.log('No workout plan available');
        setCurrentWorkout([]);
        return;
      }
      
      let planData;
      try {
        if (typeof latestPlan.plan === 'string') {
          planData = JSON.parse(latestPlan.plan);
        } else {
          planData = latestPlan.plan;
        }
      } catch (error) {
        console.error('Error parsing plan data:', error);
        toast.error('Failed to parse workout plan');
        setCurrentWorkout([]);
        return;
      }
      
      const planArray = Array.isArray(planData) 
        ? planData 
        : planData?.exercises || [];
      
      const today = new Date().toISOString().split('T')[0];
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: todayHistory, error } = await supabase
          .from('workout_history')
          .select('id, workout')
          .eq('workout_plan_id', latestPlan.id)
          .eq('member_id', memberId)
          .eq('recorded_at', `${today}T00:00:00.000Z`)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching today history:', error);
          toast.error('Failed to load workout history');
          setCurrentWorkout([]);
          return;
        }

        if (todayHistory?.workout) {
          console.log('Loaded today history:', { id: todayHistory.id, workout: todayHistory.workout });
          // Merge history workout with plan, prioritizing history states
          const mergedWorkout = planArray.map((planEx: any) => {
            const historyEx = todayHistory.workout.find((ex: any) => ex.name === planEx.name);
            if (historyEx) {
              return {
                ...planEx,
                sets: planEx.sets && historyEx.sets ? planEx.sets.map((set: any, index: number) => ({
                  ...set,
                  completed: historyEx.sets[index]?.completed ?? false,
                  marked: historyEx.sets[index]?.marked ?? 0
                })) : undefined,
                completed: historyEx.completed ?? false,
                marked: historyEx.marked ?? 0
              };
            }
            // If no history for this exercise, initialize from plan
            return {
              ...planEx,
              sets: planEx.sets ? planEx.sets.map((set: any) => ({
                ...set,
                completed: false,
                marked: 0
              })) : undefined,
              completed: false,
              marked: 0
            };
          });
          console.log('Merged workout:', mergedWorkout);
          setCurrentWorkout(mergedWorkout);
        } else {
          console.log('No history for today, initializing from plan:', planArray);
          const initialized = planArray.map((ex: any) => ({
            ...ex,
            sets: ex.sets ? ex.sets.map((set: any) => ({
              ...set,
              completed: false,
              marked: 0
            })) : undefined,
            completed: false,
            marked: 0
          }));
          setCurrentWorkout(initialized);
        }
      } else {
        setCurrentWorkout([]);
      }
    };
    
    loadWorkoutData();
  }, [latestPlan, memberId]);

  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        if (interval) clearInterval(interval);
      });
    };
  }, []);

  const startTimer = (exerciseIndex: number, initialDuration: number) => {
    if (!isMember) return;
    const currentTimer = timers[exerciseIndex] ?? {};
    if (currentTimer.running) return;

    let remaining = currentTimer.remaining ?? initialDuration * 60;
    if (remaining <= 0) remaining = initialDuration * 60;

    setTimers(prev => ({ ...prev, [exerciseIndex]: { running: true, remaining } }));

    const interval = setInterval(() => {
      setTimers(prev => {
        const timer = prev[exerciseIndex];
        if (!timer) return prev;

        const newRemaining = timer.remaining - 1;
        if (newRemaining <= 0) {
          clearInterval(interval);
          intervalsRef.current[exerciseIndex] = null;
          toast.success(`${currentWorkout[exerciseIndex].name} timer completed!`);
          return { ...prev, [exerciseIndex]: { running: false, remaining: 0 } };
        }

        return { ...prev, [exerciseIndex]: { running: true, remaining: newRemaining } };
      });
    }, 1000);

    intervalsRef.current[exerciseIndex] = interval;
  };

  const pauseTimer = (exerciseIndex: number) => {
    if (!isMember) return;
    if (intervalsRef.current[exerciseIndex]) {
      clearInterval(intervalsRef.current[exerciseIndex]);
      intervalsRef.current[exerciseIndex] = null;
    }
    setTimers(prev => {
      const timer = prev[exerciseIndex];
      if (!timer) return prev;
      return { ...prev, [exerciseIndex]: { ...timer, running: false } };
    });
  };

  const resetTimer = (exerciseIndex: number) => {
    if (!isMember) return;
    if (intervalsRef.current[exerciseIndex]) {
      clearInterval(intervalsRef.current[exerciseIndex]);
      intervalsRef.current[exerciseIndex] = null;
    }
    setTimers(prev => {
      const timer = prev[exerciseIndex];
      if (!timer) return prev;
      return { ...prev, [exerciseIndex]: { running: false, remaining: currentWorkout[exerciseIndex].duration_minutes * 60 } };
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleMarkSet = async (exerciseIndex: number, setIndex: number, success: boolean) => {
    if (!isMember) {
      toast.error('Only members can modify workout progress.');
      return;
    }

    const updatedWorkout = currentWorkout.map((ex: any, exIdx: number) => {
      if (exIdx === exerciseIndex) {
        return {
          ...ex,
          sets: ex.sets.map((set: any, sIdx: number) => {
            if (sIdx === setIndex) {
              return { ...set, completed: success, marked: 1 };
            }
            return set;
          })
        };
      }
      return ex;
    });

    console.log('Marking set:', { exerciseIndex, setIndex, success, updatedWorkout });
    setCurrentWorkout(updatedWorkout);
    await saveWorkoutProgress(updatedWorkout);
  };

  const handleMarkExercise = async (exerciseIndex: number, success: boolean) => {
    if (!isMember) {
      toast.error('Only members can modify workout progress.');
      return;
    }

    const updatedWorkout = currentWorkout.map((ex: any, exIdx: number) => {
      if (exIdx === exerciseIndex) {
        return { ...ex, completed: success, marked: 1 };
      }
      return ex;
    });

    console.log('Marking exercise:', { exerciseIndex, success, updatedWorkout });
    pauseTimer(exerciseIndex);
    setCurrentWorkout(updatedWorkout);
    await saveWorkoutProgress(updatedWorkout);
  };

  const saveWorkoutProgress = async (workout: any[]) => {
    if (!latestPlan?.id || !isMember) return;

    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please log in again.');
        return;
      }

      console.log('Saving workout progress:', { workoutPlanId: latestPlan.id, workout });
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
        throw new Error(errorData.error || 'Failed to save progress');
      }

      toast.success('Progress saved!');
    } catch (error: any) {
      console.error('Save workout error:', error);
      toast.error(`Failed to save progress: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = () => {
    if (currentWorkout.length === 0) return 0;
    
    let totalItems = 0;
    let completedItems = 0;
    
    currentWorkout.forEach((exercise: any) => {
      if (exercise.sets && exercise.sets.length > 0) {
        totalItems += exercise.sets.length;
        completedItems += exercise.sets.filter((set: any) => set.completed === true).length;
      } else if (exercise.duration_minutes) {
        totalItems += 1;
        if (exercise.completed === true) completedItems += 1;
      }
    });
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  const getExerciseStatus = (exercise: any) => {
    if (exercise.sets && exercise.sets.length > 0) {
      const totalSets = exercise.sets.length;
      const completedSets = exercise.sets.filter((set: any) => set.completed === true).length;
      const failedSets = exercise.sets.filter((set: any) => set.marked === 1 && set.completed === false).length;
      const markedSets = exercise.sets.filter((set: any) => set.marked === 1).length;

      if (markedSets === 0) {
        return { status: 'pending', failedCount: 0 };
      }
      if (completedSets === totalSets) {
        return { status: 'completed', failedCount: 0 };
      }
      if (failedSets > 0) {
        return { status: 'missed', failedCount: failedSets };
      }
      return { status: 'pending', failedCount: 0 };
    } else if (exercise.duration_minutes) {
      if (exercise.marked === 1) {
        return { status: exercise.completed ? 'completed' : 'missed', failedCount: exercise.completed ? 0 : 1 };
      }
      return { status: 'pending', failedCount: 0 };
    }
    return { status: 'pending', failedCount: 0 };
  };

  const progress = calculateProgress();

  if (!latestPlan || currentWorkout.length === 0 || isMember === null) {
    return (
      <Card className="shadow-lg">
          <CardTitle className="flex items-center gap-2">
            Today&apos;s Workout
          </CardTitle>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {isMember === null ? 'Loading...' : 'No workout plan assigned yet.'}
            </p>
            {isMember !== null && (
              <p className="text-sm text-muted-foreground mt-2">Contact your trainer to get started!</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg w-full lg:w-[35%]">
      <CardHeader >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Today&apos;s Workout
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
          const timer = timers[exerciseIndex] || {};
          const initialRemaining = exercise.duration_minutes ? exercise.duration_minutes * 60 : 0;
          const currentRemaining = timer.remaining ?? initialRemaining;
          const isRunning = timer.running;
          const isPaused = currentRemaining > 0 && currentRemaining < initialRemaining && !isRunning;
          const isCompleted = currentRemaining === 0 && !isRunning;
          const { status, failedCount } = getExerciseStatus(exercise);

          return (
            <div 
              key={exerciseIndex} 
              className={`border rounded-xl p-4 transition-all duration-200 ${
                status === 'completed'
                  ? 'bg-green-50 border-green-200'
                  : status === 'missed'
                  ? 'bg-yellow-50 border-yellow-200'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 flex-1">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    {exercise.name}
                  </h3>
                  {exercise.duration_minutes && (
                    <span className="ml-4 text-sm text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {isRunning || isPaused || isCompleted 
                        ? `${formatTime(currentRemaining)} / ${exercise.duration_minutes} min`
                        : `${exercise.duration_minutes} minutes`}
                    </span>
                  )}
                </div>
                {(status === 'completed' || status === 'missed') && (
                  <Badge 
                    className={`${
                      status === 'completed'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {status === 'completed' ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {status === 'completed' ? 'Completed' : `Missed ${failedCount} ${exercise.sets ? 'sets' : 'exercise'}`}
                  </Badge>
                )}
              </div>
              
              {exercise.sets && exercise.sets.length > 0 ? (
                <div className="space-y-3">
                  {exercise.sets.map((set: any, setIndex: number) => {
                    const isSetMarked = set.marked === 1;
                    const isSetCompleted = set.completed === true;

                    return (
                      <div 
                        key={setIndex} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all duration-200 ${
                          isSetMarked
                            ? isSetCompleted
                              ? 'bg-green-50 border-green-200'
                              : 'bg-yellow-50 border-yellow-200'
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              isSetMarked
                                ? isSetCompleted
                                  ? 'bg-green-500 text-white'
                                  : 'bg-yellow-500 text-white'
                                : 'bg-gray-200 text-gray-600'
                            }`}
                          >
                            {setIndex + 1}
                          </div>
                          <span className="font-medium">
                            {set.reps} reps @ {set.weight} kg
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSetMarked ? (
                            isSetCompleted ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <X className="h-4 w-4 text-yellow-600" />
                            )
                          ) : isMember ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkSet(exerciseIndex, setIndex, true)}
                                disabled={loading}
                                className="hover:bg-green-50 border-green-200 hover:border-green-300"
                                title="Mark as completed"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleMarkSet(exerciseIndex, setIndex, false)}
                                disabled={loading}
                                className="hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                                title="Mark as missed"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : exercise.duration_minutes ? (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-white">
                  <div className="flex items-center gap-3">
                    {exercise.marked !== 1 && isMember && (
                      <>
                        {isRunning ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => pauseTimer(exerciseIndex)}
                            disabled={loading}
                            className="hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                            title="Pause timer"
                          >
                            <Pause className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (isPaused || isCompleted) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startTimer(exerciseIndex, exercise.duration_minutes)}
                            disabled={loading}
                            className="hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                            title="Resume timer"
                          >
                            <Play className="h-4 w-4 text-blue-600" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startTimer(exerciseIndex, exercise.duration_minutes)}
                            disabled={loading}
                            className="hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                            title="Start timer"
                          >
                            <Clock className="h-4 w-4 text-blue-600" />
                          </Button>
                        )}
                        {(isPaused || isCompleted) && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetTimer(exerciseIndex)}
                            disabled={loading}
                            className="hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                            title="Reset timer"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {exercise.marked === 1 ? (
                      exercise.completed ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-yellow-600" />
                      )
                    ) : isMember ? (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkExercise(exerciseIndex, true)}
                          disabled={loading}
                          className="hover:bg-green-50 border-green-200 hover:border-green-300"
                          title="Mark as completed"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkExercise(exerciseIndex, false)}
                          disabled={loading}
                          className="hover:bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                          title="Mark as missed"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
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