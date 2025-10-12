"use client";

import React, { useEffect, useMemo, useState } from "react";

type Props = {
  images: string[];
  intervalMs?: number;
  className?: string;
  heightClass?: string;
};

export default function WideCarousel({ images, intervalMs = 3000, className = "", heightClass = "h-64 sm:h-80 md:h-96" }: Props) {
  const safe = useMemo(() => images.filter(Boolean), [images]);
  const [i, setI] = useState(0);

  useEffect(() => {
    if (safe.length <= 1) return;
    const id = setInterval(() => setI((v) => (v + 1) % safe.length), intervalMs);
    return () => clearInterval(id);
  }, [safe.length, intervalMs]);

  if (!safe.length) return <div className={`w-full ${heightClass} bg-gray-100 ${className}`} />;

  return (
    <div className={`relative w-full ${heightClass} overflow-hidden ${className}`}>
      <img src={safe[i]} alt={`slide-${i + 1}`} className="w-full h-full object-cover" draggable={false} />
    </div>
  );
}
