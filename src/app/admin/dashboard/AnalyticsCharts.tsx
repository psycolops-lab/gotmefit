'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function AnalyticsCharts() {
  const memberGrowthData = [
    { month: 'Jan 2023', members: 320 },
    { month: 'Feb 2023', members: 342 },
    { month: 'Mar 2023', members: 385 },
    { month: 'Apr 2023', members: 398 },
    { month: 'May 2023', members: 415 },
    { month: 'Jun 2023', members: 432 },
    { month: 'Jul 2023', members: 445 },
    { month: 'Aug 2023', members: 458 },
    { month: 'Sep 2023', members: 467 },
    { month: 'Oct 2023', members: 478 },
    { month: 'Nov 2023', members: 485 },
    { month: 'Dec 2023', members: 492 },
    { month: 'Jan 2024', members: 456 },
  ];

  const subscriptionData = [
    { plan: 'Basic (Quarterly)', members: 156, percentage: 34.2 },
    { plan: 'Premium (Half-yearly)', members: 198, percentage: 43.4 },
    { plan: 'Elite (Yearly)', members: 102, percentage: 22.4 },
  ];

  const COLORS = ['#2563eb', '#1d4ed8', '#1e40af'];

  return (
    <div className="space-y-6">
      {/* First Row: LineChart + PieChart */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* Member Growth (70%) */}
        <div className="lg:col-span-7">
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle>Member Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={memberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="members"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart (30%) */}
        <div className="lg:col-span-3">
          <Card className="shadow-none border-none">
            <CardHeader>
              <CardTitle>Membership Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="members"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Key Performance Metrics (Full width) */}
      <Card className="animate-slide-up border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle>Key Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                98%
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Member Retention Rate
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                4.8
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Average Rating
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                85%
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Class Attendance Rate
              </p>
            </div>
            <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                15
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Avg. Workouts/Month
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Recent Achievements</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
              <li>• Reached 450+ active members milestone</li>
              <li>• Launched new HIIT class program</li>
              <li>• Added 3 new certified trainers</li>
              <li>• Implemented nutrition consultation service</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
