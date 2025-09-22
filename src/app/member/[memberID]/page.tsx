"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Ruler,
  Scale,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

interface MemberProfile {
  height_cm?: number;
  weight_kg?: number;
  bmi?: number;
  age?: number;
  plan?: string;
  phone?: string;
  dob?: string;
  goal?: string;
  created_at?: string;
}

interface MemberMetrics {
  date: string;
  weight_kg: number;
  body_fat?: number;
  muscle_mass?: number;
  notes?: string;
}

interface MemberData {
  id: string;
  email: string;
  name?: string;
  role: string;
  profile?: MemberProfile;
  trainer?: {
    name: string;
    email: string;
  };
  nutritionist?: {
    name: string;
    email: string;
  };
  recentMetrics?: MemberMetrics[];
}

export default function MemberDashboard() {
  const params = useParams();
  const memberId = params.memberId as string;
  const [member, setMember] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<MemberMetrics[]>([]);
  const [showMetrics, setShowMetrics] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (memberId) {
      fetchMemberData();
    }
  }, [memberId]);

  async function fetchMemberData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        router.push("/login");
        return;
      }

      // Fetch member details
      const res = await fetch(`/api/member/${memberId}/profile`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        console.log(data);
        setMember(data.member);

        // Fetch recent metrics
        const metricsRes = await fetch(`/api/member/${memberId}/metrics`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setMetrics(metricsData.metrics || []);
        }
      }
    } catch (error) {
      console.error("Error fetching member data:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen pt-20 px-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Not Found</h2>
              <p className="text-gray-600">The member you&apos;re looking for doesn&apos;t exist.</p>
              <Button onClick={() => router.push('/admin/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const profile = member.profile || {};
  const latestWeight = metrics[0]?.weight_kg;
  const weightChange = latestWeight && profile.weight_kg 
    ? ((latestWeight - profile.weight_kg) * 100 / profile.weight_kg).toFixed(1)
    : 0;

  const bmiCategory = profile.bmi ? 
    (profile.bmi < 18.5 ? "Underweight" : 
     profile.bmi < 25 ? "Normal" : 
     profile.bmi < 30 ? "Overweight" : "Obese") : "Unknown";

  return (
    <div className="min-h-screen pt-20 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="flex items-center justify-between"
        >
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Avatar className="h-16 w-16">
                <AvatarFallback>{member.name?.substring(0, 2) || 'M'}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl font-bold">{member.name || "Member"}</h1>
                <p className="text-gray-600">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant={member.role === "member" ? "default" : "secondary"} className="bg-blue-600">
                Member
              </Badge>
              {profile.plan && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {profile.plan} Plan
                </Badge>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setEditingProfile(true)} variant="outline">
              Edit Profile
            </Button>
            <Button onClick={() => router.push('/admin/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
        </motion.div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Weight</CardTitle>
              <Scale className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.weight_kg || "—"}kg</div>
              {latestWeight && profile.weight_kg && (
                <p className={`text-sm ${String(weightChange).includes('-') ? 'text-green-600' : 'text-red-600'}`}>
                  {Number(weightChange) > 0 ? '+' : ''}{weightChange}% this month
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">BMI</CardTitle>
              <Ruler className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profile.bmi?.toFixed(1) || "—"}</div>
              <p className="text-sm text-muted-foreground capitalize">{bmiCategory}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.length > 0 ? `${((metrics.length / 12) * 100).toFixed(0)}%` : "0%"}
              </div>
              <p className="text-sm text-muted-foreground">{metrics.length} months tracked</p>
            </CardContent>
          </Card>
        </div>

        {/* Profile & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium">Email:</span>
                  <span>{member.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Phone:</span>
                    <span>{profile.phone}</span>
                  </div>
                )}
                {profile.dob && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium">Date of Birth:</span>
                    <span>{new Date(profile.dob).toLocaleDateString()}</span>
                  </div>
                )}
                {profile.goal && (
                  <div className="flex items-start gap-3 text-sm">
                    <Activity className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium">Goal:</span>
                      <p className="text-sm">{profile.goal}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Professional Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Professional Team
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Trainer</h4>
                {member.trainer ? (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold">{member.trainer.name}</p>
                    <p className="text-sm text-blue-700">{member.trainer.email}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No trainer assigned</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-medium mb-2">Nutritionist</h4>
                {member.nutritionist ? (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="font-semibold">{member.nutritionist.name}</p>
                    <p className="text-sm text-green-700">{member.nutritionist.email}</p>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg text-center">
                    <p className="text-sm text-gray-500">No nutritionist assigned</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Metrics */}
        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progress Tracking
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowMetrics(!showMetrics)}
            >
              {showMetrics ? "Hide Details" : "Show Details"}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Progress Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Weight Progress</h3>
                  <div className="space-y-2">
                    {metrics.length > 0 && (
                      <div className="flex justify-between text-sm">
                        <span>Target: {profile.weight_kg || metrics[0].weight_kg}kg</span>
                        <span>Current: {latestWeight}kg</span>
                      </div>
                    )}
                    <Progress 
                      value={metrics.length > 0 ? Math.min(100, ((metrics.length / 12) * 100)) : 0} 
                      className="h-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      {metrics.length} months of tracking • Goal: Maintain healthy weight
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics - Conditional */}
              {showMetrics && metrics.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Date</th>
                        <th className="text-left p-3">Weight (kg)</th>
                        <th className="text-left p-3">Body Fat %</th>
                        <th className="text-left p-3">Muscle Mass (kg)</th>
                        <th className="text-left p-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metrics.slice(0, 6).map((metric, index) => (
                        <tr key={index} className="border-b last:border-b-0 hover:bg-gray-50">
                          <td className="p-3 font-medium">
                            {new Date(metric.date).toLocaleDateString()}
                          </td>
                          <td className="p-3">
                            <span className={`font-medium ${index === 0 ? 'text-blue-600' : ''}`}>
                              {metric.weight_kg}kg
                            </span>
                          </td>
                          <td className="p-3">{metric.body_fat || "—"}</td>
                          <td className="p-3">{metric.muscle_mass || "—"}</td>
                          <td className="p-3 max-w-xs">
                            <span className="text-gray-500 truncate block" title={metric.notes}>
                              {metric.notes || "—"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {metrics.length > 6 && (
                    <div className="text-center mt-4 text-sm text-gray-500">
                      Showing 6 most recent entries • Total: {metrics.length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={editingProfile} onOpenChange={setEditingProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit {member.name}&apos; Profile</DialogTitle>
          </DialogHeader>
          <EditProfileForm 
            member={member} 
            onSuccess={() => {
              setEditingProfile(false);
              fetchMemberData();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ----------------- Edit Profile Form ----------------- */
function EditProfileForm({ member, onSuccess }: { 
  member: MemberData; 
  onSuccess: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: member.name || '',
    phone: member.profile?.phone || '',
    dob: member.profile?.dob || '',
    height_cm: member.profile?.height_cm || '',
    weight_kg: member.profile?.weight_kg || '',
    goal: member.profile?.goal || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`/api/member/${member.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      alert('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Full Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Phone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Height (cm)</label>
          <input
            type="number"
            value={formData.height_cm}
            onChange={(e) => setFormData({ ...formData, height_cm: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Weight (kg)</label>
          <input
            type="number"
            step="0.1"
            value={formData.weight_kg}
            onChange={(e) => setFormData({ ...formData, weight_kg: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Fitness Goal</label>
        <textarea
          value={formData.goal}
          onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
          rows={3}
          placeholder="Describe the member's fitness goals..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Updating...' : 'Update Profile'}
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => onSuccess()}
          disabled={loading}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}