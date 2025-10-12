"use client";

import React, { useEffect, useState } from "react";
import WideCarousel from "./WideCarousel";

async function fetchImages(dir: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/landing/images?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    return Array.isArray(data.images) ? data.images : [];
  } catch {
    return [];
  }
}

export default function EventsWorkshops() {
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    fetchImages("landingpage/events").then(setImages);
  }, []);

  return (
    <section className="w-full py-12 bg-white">
      <div className="px-6 sm:px-10 md:px-14 lg:px-20">
        <h2 className="text-2xl md:text-3xl font-semibold mb-4">Events & Workshops</h2>
      </div>
      <WideCarousel images={images} className="mt-2" heightClass="h-64 sm:h-96" />
    </section>
  );
}
