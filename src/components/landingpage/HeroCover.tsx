"use client";

import React from "react";

export default function HeroCover() {
  return (
    <section className="w-full">
      <div className="relative w-full h-[40vh] sm:h-[55vh] md:h-[70vh] lg:h-[80vh] overflow-hidden">
        <img
          src="/GMF%20Wall%20page%20pic.webp"
          alt="GotMeFit cover"
          className="w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="px-6 sm:px-10 md:px-14 lg:px-20 py-8 text-white">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">GotMeFit</h1>
            <p className="mt-2 md:mt-4 max-w-3xl text-sm sm:text-base md:text-lg opacity-90">
              Authentic fitness journeys, certified expertise, and transformative results. Your trusted partner for personal, corporate, and group wellness.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
