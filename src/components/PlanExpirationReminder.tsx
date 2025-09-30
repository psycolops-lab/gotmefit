
"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { addDays, differenceInDays, formatDistanceToNowStrict, isAfter, parseISO } from "date-fns";
import { motion } from "framer-motion";

interface PlanExpirationReminderProps {
  plan: string | null | undefined;
  planStart: string | null | undefined;
  memberName?: string; // Optional for Admin dashboard to show member-specific info
}

const planDurations: Record<string, number> = {
  Basic: 90, // 3 months
  Standard: 180, // 6 months
  Premium: 365, // 12 months
};

export default function PlanExpirationReminder({ plan, planStart, memberName }: PlanExpirationReminderProps) {
  const [daysUntilExpiration, setDaysUntilExpiration] = useState<number | null>(null);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);

  useEffect(() => {
    if (!plan || !planStart || !planDurations[plan]) {
      setDaysUntilExpiration(null);
      setExpirationDate(null);
      return;
    }

    try {
      const startDate = parseISO(planStart);
      const durationDays = planDurations[plan] || 365; // Default to 1 year if plan not found
      const expiryDate = addDays(startDate, durationDays);
      const daysLeft = differenceInDays(expiryDate, new Date());

      if (daysLeft <= 30 && isAfter(expiryDate, new Date())) {
        setDaysUntilExpiration(daysLeft);
        setExpirationDate(expiryDate);
      } else {
        setDaysUntilExpiration(null);
        setExpirationDate(null);
      }
    } catch (error) {
      console.error("Error calculating plan expiration:", error);
      setDaysUntilExpiration(null);
      setExpirationDate(null);
    }
  }, [plan, planStart]);

  if (!daysUntilExpiration || !expirationDate) {
    return null; // Don't show if not within 30 days or invalid data
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="shadow-lg rounded-xl overflow-hidden border-l-4 border-yellow-400">
        <CardHeader className="bg-gradient-to-r from-yellow-100 to-yellow-200">
          <CardTitle className="flex items-center text-lg">
            <AlertTriangle className="mr-2 text-yellow-600" />
            Plan Expiration Reminder
            {memberName && <span className="ml-2 text-sm">for {memberName}</span>}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-gray-700">
            Your <span className="font-semibold">{plan}</span> plan{" "}
            {memberName ? `for ${memberName} ` : ""}will expire in{" "}
            <span className="font-bold text-yellow-600">
              {formatDistanceToNowStrict(expirationDate, { addSuffix: false })}
            </span>{" "}
            on <span className="font-semibold">{expirationDate.toLocaleDateString()}</span>.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Please renew your plan to continue enjoying your benefits.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
