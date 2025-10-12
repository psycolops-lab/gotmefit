"use client";

import React, { useEffect, useState } from "react";
import SquareCarousel from "./SquareCarousel";
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

export default function Authenticity() {
  const [transformations, setTransformations] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<string[]>([]);
  const [reviews, setReviews] = useState<string[]>([]);

  useEffect(() => {
    fetchImages("landingpage/autenticity/transformations").then(setTransformations);
    fetchImages("landingpage/autenticity/testimonials").then(setTestimonials);
    fetchImages("landingpage/autenticity/reviews").then(setReviews);
  }, []);

  return (
    <section className="w-full py-12 bg-gray-50">

      <div className="mt-8 px-6 sm:px-10 md:px-14 lg:px-20 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="mb-3 font-medium text-gray-800">Transformations</h3>
          <SquareCarousel images={transformations} ariaLabel="transformations" className="w-full" />
        </div>
        <div>
          <h3 className="mb-3 font-medium text-gray-800">Testimonials</h3>
          <SquareCarousel images={testimonials} ariaLabel="testimonials" className="w-full" />
        </div>
      </div>
    </section>
  );
}
