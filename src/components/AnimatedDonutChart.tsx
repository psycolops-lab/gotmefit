"use client";

import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AnimatedDonutChartProps {
  percentage: number;
}

export default function AnimatedDonutChart({ percentage }: AnimatedDonutChartProps) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative flex items-center justify-center">
            <svg width="160" height="160" viewBox="0 0 160 160" className="drop-shadow-md">
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="20"
              />
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="20"
                strokeDasharray={circumference}
                strokeDashoffset={circumference}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
                className="transition-colors hover:stroke-blue-500"
              />
            </svg>
            <motion.div
              className="absolute text-lg font-semibold text-gray-800"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {percentage}%
            </motion.div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-blue-600 text-white border-none">
          <p>{percentage}% Complete</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}