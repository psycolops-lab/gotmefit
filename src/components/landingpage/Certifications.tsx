"use client";

import React, { useEffect, useState } from "react";

const sampleBadges = [
  { label: "ACE", color: "bg-blue-600" },
  { label: "NASM", color: "bg-emerald-600" },
  { label: "ISSA", color: "bg-purple-600" },
  { label: "CPR/AED", color: "bg-rose-600" },
  { label: "Nutrition", color: "bg-amber-600" },
];

export default function Certifications() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % sampleBadges.length), 2500);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="w-full py-10 bg-white">
      <div className="px-6 sm:px-10 md:px-14 lg:px-20">
        <h2 className="text-2xl md:text-3xl font-semibold mb-6">Certifications & Achievements</h2>
        <div className="relative overflow-hidden">
          <div
            className="flex items-center gap-4 transition-transform"
            style={{ transform: `translateX(-${index * 20}%)` }}
          >
            {[...Array(3)].flatMap(() => sampleBadges).map((b, i) => (
              <div
                key={i}
                className={`shrink-0 ${b.color} text-white rounded-full px-4 py-2 text-sm md:text-base`}
              >
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
