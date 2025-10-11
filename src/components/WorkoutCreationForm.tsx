'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {  Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';

interface WorkoutCreationFormProps {
  onSubmit: (plan: any, assignedTo: string) => Promise<void>;
  assignedTo: string;  // Pre-selected member email
  onClose: () => void;
}

export function WorkoutCreationForm({ onSubmit, assignedTo, onClose }: WorkoutCreationFormProps) {
  const [tab, setTab] = useState('weight');
  const [exercises, setExercises] = useState<any[]>([]);
  const [currentExercise, setCurrentExercise] = useState('');
  const [sets, setSets] = useState<{ reps: number; weight: number }[]>([]);
  const [duration, setDuration] = useState(0);

  const addSet = () => {
    setSets([...sets, { reps: 0, weight: 0 }]);
  };

  const updateSet = (index: number, field: 'reps' | 'weight', value: number) => {
    const newSets = [...sets];
    newSets[index][field] = Number(value);
    setSets(newSets);
  };

  const addExercise = () => {
    if (!currentExercise.trim()) {
      toast.error('Please enter an exercise name');
      return;
    }
    let newExercise;
    if (tab === 'weight') {
      if (sets.length === 0 || sets.some(s => s.reps <= 0 || s.weight <= 0)) {
        toast.error('Add at least one valid set with reps and weight');
        return;
      }
      newExercise = { name: currentExercise.trim(), sets: [...sets] };
    } else {
      if (duration <= 0) {
        toast.error('Please enter a valid duration');
        return;
      }
      newExercise = { name: currentExercise.trim(), duration_minutes: duration };
    }
    setExercises([...exercises, newExercise]);
    setCurrentExercise('');
    setSets([]);
    setDuration(0);
    toast.success('Exercise added to plan');
  };

  const handleSubmit = async () => {
    if (exercises.length === 0) {
      toast.error('Add at least one exercise');
      return;
    }
    const plan = { type: tab === 'weight' ? 'weight_training' : 'cardio', exercises };
    try {
      await onSubmit(plan, assignedTo);
      setExercises([]);
      toast.success(`Workout assigned successfully to ${assignedTo}`);
      onClose(); // Close the dialog
    } catch (error: any) {
      toast.error(`Failed to assign workout: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="weight">Weight Training</TabsTrigger>
          <TabsTrigger value="cardio">Cardio</TabsTrigger>
        </TabsList>
        <TabsContent value="weight" className="space-y-4">
          <div>
            <Label htmlFor="exercise-name">Exercise Name</Label>
            <Input
              id="exercise-name"
              placeholder="e.g., Bench Press"
              value={currentExercise}
              onChange={(e) => setCurrentExercise(e.target.value)}
            />
          </div>
          {sets.map((set, index) => (
            <div key={index} className="flex space-x-2">
              <div>
                <Label htmlFor={`reps-${index}`}>Reps</Label>
                <Input
                  id={`reps-${index}`}
                  type="number"
                  min="1"
                  value={set.reps}
                  onChange={(e) => updateSet(index, 'reps', Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor={`weight-${index}`}>Weight (kg)</Label>
                <Input
                  id={`weight-${index}`}
                  type="number"
                  min="0"
                  step="0.1"
                  value={set.weight}
                  onChange={(e) => updateSet(index, 'weight', Number(e.target.value))}
                />
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={addSet}>
            Add Set
          </Button>
        </TabsContent>
        <TabsContent value="cardio" className="space-y-4">
          <div>
            <Label htmlFor="cardio-exercise">Exercise Name</Label>
            <Input
              id="cardio-exercise"
              placeholder="e.g., Running"
              value={currentExercise}
              onChange={(e) => setCurrentExercise(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </TabsContent>
      </Tabs>
      <Button onClick={addExercise}>Add Exercise to Plan</Button>
      {exercises.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="plan-preview">
            <AccordionTrigger>View Added Exercises ({exercises.length})</AccordionTrigger>
            <AccordionContent>
              {exercises.map((ex, i) => (
                <div key={i} className="mb-4 border-b pb-2">
                  <h4 className="font-semibold">{ex.name}</h4>
                  {ex.sets ? (
                    <ul className="list-disc ml-4">
                      {ex.sets.map((set: any, j: number) => (
                        <li key={j}>Set {j + 1}: {set.reps} reps @ {set.weight} kg</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Duration: {ex.duration_minutes} minutes</p>
                  )}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      {exercises.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit}>Done</Button>
        </div>
      )}
    </div>
  );
}