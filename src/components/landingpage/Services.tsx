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
          Our mission is to transform 100,000 lives by making wellness accessible and achievable for everyone.
We're building a community rooted in health, balance, and positivity. Through personalized guidance, regular follow-ups, and educational support, we're ensuring wellntos is within reach for each individual, empowering them to achieve their best-physically, mentally, and emotionally.
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
