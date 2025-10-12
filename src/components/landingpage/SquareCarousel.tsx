"use client";

import React, { useEffect, useMemo, useState } from "react";

type Props = {
  images: string[];
  ariaLabel?: string;
  intervalMs?: number;
  className?: string;
};

export default function SquareCarousel({ images, ariaLabel, intervalMs = 3000, className = "" }: Props) {
  const safeImages = useMemo(() => images.filter(Boolean), [images]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (safeImages.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % safeImages.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [safeImages.length, intervalMs]);

  const prev = () => {
    setIndex((i) => (i - 1 + safeImages.length) % safeImages.length);
  };
  const next = () => {
    setIndex((i) => (i + 1) % safeImages.length);
  };

  if (!safeImages.length) {
    return (
      <div className={`relative group w-full max-w-md aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 ${className}`}>
        <span>No images</span>
      </div>
    );
  }

  return (
    <div className={`relative group w-full max-w-md aspect-square rounded-lg overflow-hidden ${className}`} aria-label={ariaLabel}>
      <img
        src={safeImages[index]}
        alt={`slide-${index + 1}`}
        className="w-full h-full object-cover select-none"
        draggable={false}
      />
      <button
        type="button"
        onClick={prev}
        aria-label="Previous"
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {"<"}
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next"
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {">"}
      </button>
    </div>
  );
}
