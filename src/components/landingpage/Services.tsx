"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function Services() {
  const router = useRouter();
  return (
    <section className="w-full py-12 bg-gray-50">
      <div className="px-6 sm:px-10 md:px-14 lg:px-20">
        <h2 className="text-2xl md:text-3xl font-semibold">Services</h2>
        <p className="mt-3 max-w-3xl text-gray-600">
          Personalized diet consultation, goal-oriented meal planning, habit coaching,
          and ongoing accountability. Options for personal, corporate, and group wellness.
        </p>
        <div className="mt-6">
          <button
            onClick={() => router.push("/book")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Appointment
          </button>
        </div>
      </div>
    </section>
  );
}
