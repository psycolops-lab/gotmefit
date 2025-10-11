'use client';

import { toast } from 'sonner';
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  User,
  Scale,
  AlertCircle,
  Ruler,
  TrendingUp,
  TrendingDown,
  Eye,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useRouter } from 'next/navigation';
import { WorkoutCreationForm } from '@/components/WorkoutCreationForm';

type Member = {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  weight_kg?: number | null;
  bmi?: number | null;
  gender?: string | null;
  goal?: string | null;
  height_cm?: number | null;
  updated_at?: string | null;
  created_at: string;
  latest_weight?: number | null;
  latest_bmi?: number | null;
  latest_updated?: string | null;
};

type WeightHistory = {
  id: string;
  member_id: string;
  weight_kg: number;
  bmi?: number | null;
  recorded_at: string;
};

type WeightChartData = {
  date: string;
  weight: number;
  bmi?: number;
};

export default function TrainerDashboardPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showChartModal, setShowChartModal] = useState(false);
  const [showWorkoutModal, setShowWorkoutModal] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [newWeight, setNewWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightHistory[]>([]);
  const [chartData, setChartData] = useState<WeightChartData[]>([]);
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
        setError('Not authenticated');
        setLoading(false);
        router.push('/login');
        return;
      }

      const trainerId = session.user.id;

      const { data: memberProfiles, error: mpError } = await supabase
        .from('member_profiles')
        .select(`
          id,
          user_id,
          weight_kg,
          bmi,
          gender,
          goal,
          height_cm,
          updated_at,
          created_at,
          assigned_trainer_id,
          users!inner (
            id,
            name,
            email
          )
        `)
        .eq('assigned_trainer_id', trainerId)
        .order('created_at', { ascending: true });

      if (mpError) {
        setError(`Failed to load members: ${mpError.message}`);
        setLoading(false);
        return;
      }

      if (!memberProfiles || memberProfiles.length === 0) {
        setMembers([]);
        setLoading(false);
        return;
      }

      const memberIds = memberProfiles.map(m => m.user_id);

      const { data: userDetails, error: userError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', memberIds);

      if (userError) {
        setError(`Failed to load member details: ${userError.message}`);
        setLoading(false);
        return;
      }

      let latestWeights: WeightHistory[] = [];
      const { data: allWeightHistory, error: whError } = await supabase
        .from('weight_history')
        .select('id, member_id, weight_kg, bmi, recorded_at')
        .in('member_id', memberIds)
        .order('recorded_at', { ascending: false });

      if (whError) {
        // Handle error silently or log
      } else {
        const weightMap = new Map<string, WeightHistory>();
        allWeightHistory?.forEach(wh => {
          if (!weightMap.has(wh.member_id)) {
            weightMap.set(wh.member_id, wh);
          }
        });
        latestWeights = Array.from(weightMap.values());
      }

      const mergedMembers: Member[] = memberProfiles.map(member => {
        const userDetail = userDetails?.find(u => u.id === member.user_id);
        const latestWeight = latestWeights.find(wh => wh.member_id === member.user_id);

        return {
          id: member.id,
          user_id: member.user_id,
          name: userDetail?.name || 'Unknown User',
          email: userDetail?.email,
          weight_kg: member.weight_kg,
          bmi: member.bmi,
          gender: member.gender,
          goal: member.goal,
          height_cm: member.height_cm,
          updated_at: member.updated_at,
          created_at: member.created_at,
          latest_weight: latestWeight?.weight_kg ?? member.weight_kg,
          latest_bmi: latestWeight?.bmi ?? member.bmi,
          latest_updated: latestWeight?.recorded_at ?? member.updated_at,
        };
      });

      setMembers(mergedMembers);
    } catch (err: any) {
      setError('Failed to load members: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateWorkout = async (plan: any, assignedTo: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    console.log('TrainerDashboard - Session for API call:', session);
    if (!session) {
      toast.error('Not authenticated. Please log in.');
      router.push('/login');
      return;
    }

    const response = await fetch('/api/workout/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ assigned_to: assignedTo, plan }),
    });

    if (!response.ok) {
      const { error } = await response.json();
      throw new Error(error);
    }

    toast.success('Workout assigned successfully');
    setShowWorkoutModal(null);
  } catch (error: any) {
    toast.error(`Failed to assign workout: ${error.message}`);
  }
};

  async function loadWeightHistory(memberId: string) {
    try {
      setError(null);
      const { data: history, error } = await supabase
        .from('weight_history')
        .select('id, member_id, weight_kg, bmi, recorded_at')
        .eq('member_id', memberId)
        .order('recorded_at', { ascending: true });

      if (error) {
        throw error;
      }

      const chartData: WeightChartData[] = (history || []).map(h => ({
        date: new Date(h.recorded_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: h.weight_kg,
        bmi: h.bmi || undefined,
      })).slice(-12);

      setWeightHistory(history || []);
      setChartData(chartData);
    } catch (err: any) {
      setError('Failed to load weight history: ' + err.message);
    }
  }

  async function handleUpdateWeight() {
    if (!selectedMember || !newWeight) {
      setError('Please enter a weight');
      return;
    }

    setUpdating(selectedMember.user_id);
    setError(null);

    try {
      const weightNum = parseFloat(newWeight);
      if (isNaN(weightNum) || weightNum < 30 || weightNum > 200) {
        setError('Please enter a valid weight between 30-200 kg');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/trainer/update-weight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          member_user_id: selectedMember.user_id,
          weight_kg: weightNum,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update weight');
      }

      setMembers(prev =>
        prev.map(member =>
          member.user_id === selectedMember.user_id
            ? {
                ...member,
                weight_kg: weightNum,
                bmi: result.bmi,
                updated_at: new Date().toISOString(),
                latest_weight: result.weight_kg,
                latest_bmi: result.bmi,
                latest_updated: new Date().toISOString(),
              }
            : member
        )
      );

      setShowWeightModal(false);
      setNewWeight('');
      setSelectedMember(null);
      toast.success('Weight updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update weight');
    } finally {
      setUpdating(null);
    }
  }

  const openWeightModal = (member: Member) => {
    setSelectedMember(member);
    setNewWeight((member.latest_weight ?? member.weight_kg ?? '').toString());
    setShowWeightModal(true);
    setError(null);
  };

  const openChartModal = async (member: Member) => {
    setSelectedMember(member);
    await loadWeightHistory(member.user_id);
    setShowChartModal(true);
  };

  const openWorkoutModal = (member: Member) => {
    if (!member.email) {
      toast.error('No email found for this member');
      return;
    }
    setSelectedMember(member);
    setShowWorkoutModal(member.user_id);
  };

  const closeModals = () => {
    setShowWeightModal(false);
    setShowChartModal(false);
    setShowWorkoutModal(null);
    setNewWeight('');
    setSelectedMember(null);
    setError(null);
    setWeightHistory([]);
    setChartData([]);
  };

  const getWeightChange = (member: Member) => {
    if (!member.latest_weight || !member.weight_kg) return null;
    const change = member.latest_weight - member.weight_kg;
    return change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="h-8 w-8 text-blue-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen mt-16"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainer Dashboard</h1>
          <p className="text-gray-600">
            Manage your assigned members ({members.length})
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
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No members assigned</h3>
            <p className="text-gray-500">You don`t have any members assigned to you yet.</p>
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
                    <TableHead className="w-[200px]">Member</TableHead>
                    <TableHead>Latest Weight</TableHead>
                    <TableHead>BMI</TableHead>
                    <TableHead>Height</TableHead>
                    <TableHead>Goal</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => {
                    const weightChange = getWeightChange(member);
                    const changeValue = weightChange ? parseFloat(weightChange) : 0;

                    return (
                      <TableRow key={member.id} className="border-b hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div>
                            <div className="font-semibold">{member.name}</div>
                            {member.email && (
                              <div className="text-sm text-gray-500">{member.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <Scale className="h-4 w-4 mr-2 text-gray-400" />
                              <span className="font-semibold">
                                {member.latest_weight ?? member.weight_kg ?? '—'} kg
                              </span>
                            </div>
                            {weightChange !== null && (
                              <Badge
                                variant="secondary"
                                className={`text-xs ${
                                  changeValue >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}
                              >
                                {changeValue >= 0 ? (
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                ) : (
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                )}
                                {weightChange} kg
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={member.latest_bmi ? 'default' : 'secondary'}
                            className={member.latest_bmi ? 'bg-blue-100 text-blue-800' : ''}
                          >
                            {member.latest_bmi ?? member.bmi ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Ruler className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-sm">
                              {member.height_cm ? `${member.height_cm} cm` : '—'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize max-w-[120px] truncate">
                            {member.goal ?? '—'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {member.latest_updated
                              ? formatDistanceToNowStrict(new Date(member.latest_updated)) + ' ago'
                              : 'Never'}
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
                          <Dialog
                            open={showChartModal && selectedMember?.user_id === member.user_id}
                            onOpenChange={(open) => {
                              if (!open) closeModals();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => openChartModal(member)}>
                                Chart
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl max-h-[80vh] w-full">
                              <DialogHeader>
                                <DialogTitle>Weight Progress - {member.name}</DialogTitle>
                                <DialogDescription>
                                  Track {member.name}`s weight and BMI progress over time.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {chartData.length > 0 ? (
                                  <div className="h-[400px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" stroke="#888" fontSize={12} />
                                        <YAxis stroke="#888" fontSize={12} domain={['dataMin', 'dataMax']} />
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
                                          stroke="#3b82f6"
                                          strokeWidth={3}
                                          name="Weight (kg)"
                                          dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                                        />
                                        {chartData.some(d => d.bmi) && (
                                          <Line
                                            type="monotone"
                                            dataKey="bmi"
                                            stroke="#10b981"
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            name="BMI"
                                            dot={{ fill: '#10b981', strokeWidth: 2 }}
                                          />
                                        )}
                                      </LineChart>
                                    </ResponsiveContainer>
                                  </div>
                                ) : (
                                  <div className="text-center py-8 text-gray-500">
                                    <Scale className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                                    <p>No weight history data available yet.</p>
                                    <p className="text-sm text-gray-400 mt-1">
                                      Start tracking {member.name}`s progress by updating their weight.
                                    </p>
                                  </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="font-medium text-gray-900">Total Records</div>
                                    <div className="text-2xl font-bold text-blue-600">{weightHistory.length}</div>
                                  </div>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <div className="font-medium text-gray-900">Current Weight</div>
                                    <div className="text-2xl font-bold text-green-600">
                                      {selectedMember?.latest_weight ?? '—'} kg
                                    </div>
                                  </div>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button type="button" variant="outline" onClick={closeModals}>
                                    Close
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={showWeightModal && selectedMember?.user_id === member.user_id}
                            onOpenChange={(open) => {
                              if (!open) closeModals();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => openWeightModal(member)}
                                disabled={updating === member.user_id}
                              >
                                {updating === member.user_id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  'Update'
                                )}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Weight for {member.name}</DialogTitle>
                                <DialogDescription>
                                  Enter the member`s current weight measurement. This will be recorded in their weight history and update their profile.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="weight">Current Weight (kg)</Label>
                                  <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    min="30"
                                    max="200"
                                    value={newWeight}
                                    onChange={(e) => {
                                      setNewWeight(e.target.value);
                                      setError(null);
                                    }}
                                    placeholder="e.g., 70.5"
                                    className="mt-1"
                                  />
                                  <div className="text-xs text-gray-500 mt-1">
                                    Enter weight between 30-200 kg
                                  </div>
                                </div>
                                {selectedMember?.height_cm && (
                                  <div className="p-3 bg-blue-50 rounded-md border">
                                    <div className="text-sm text-blue-800 mb-1">
                                      <strong>Height:</strong> {selectedMember.height_cm} cm
                                    </div>
                                    {newWeight && (
                                      <div className="text-sm text-blue-800">
                                        <strong>Estimated BMI:</strong>
                                        {(() => {
                                          const weightNum = parseFloat(newWeight);
                                          if (!isNaN(weightNum) && selectedMember.height_cm) {
                                            const h_m = selectedMember.height_cm / 100;
                                            const calculatedBmi = Number((weightNum / (h_m * h_m)).toFixed(2));
                                            return ` ${calculatedBmi}`;
                                          }
                                          return ' —';
                                        })()}
                                      </div>
                                    )}
                                  </div>
                                )}
                                {error && (
                                  <div className="text-red-600 text-sm p-2 bg-red-50 rounded-md border">
                                    {error}
                                  </div>
                                )}
                                <div className="flex justify-end space-x-2 pt-4">
                                  <Button type="button" variant="outline" onClick={closeModals} disabled={!!updating}>
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleUpdateWeight}
                                    disabled={!newWeight || updating === selectedMember?.user_id}
                                  >
                                    {updating === selectedMember?.user_id ? (
                                      <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Saving...
                                      </>
                                    ) : (
                                      'Update Weight'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog
                            open={showWorkoutModal === member.user_id}
                            onOpenChange={(open) => {
                              if (!open) closeModals();
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" onClick={() => openWorkoutModal(member)}>
                                Assign Workout
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Assign New Workout to {member.name}</DialogTitle>
                                <DialogDescription>Create and assign a workout plan to this member.</DialogDescription>
                              </DialogHeader>
                              <WorkoutCreationForm onSubmit={handleCreateWorkout} assignedTo={member.email ?? ''} onClose={() => setShowWorkoutModal(null)} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}