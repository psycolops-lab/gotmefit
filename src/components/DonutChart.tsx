"use client";

import { Progress } from '@/components/ui/progress';

interface MiniDonutChartProps {
  percentage: number;
}

export default function MiniDonutChart({ percentage }: MiniDonutChartProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-10 h-10">
        <Progress
          value={percentage}
          className="w-10 h-10 rounded-full"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 bg-white rounded-full" />
        </div>
      </div>
      <span className="text-sm font-medium text-gray-700">{percentage}%</span>
    </div>
  );
}