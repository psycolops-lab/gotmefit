import React, { useEffect, useState, useRef, useCallback } from 'react';

type MediaType = 'image' | 'video';

interface MediaItem {
  src: string;
  type: MediaType;
  alt?: string;
}

type CarouselItem = string | MediaItem;

interface SquareCarouselProps {
  items: CarouselItem[];
  ariaLabel?: string;
  intervalMs?: number;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
  autoPlay?: boolean;
  onItemClick?: (item: CarouselItem, index: number) => void;
}

const SquareCarousel: React.FC<SquareCarouselProps> = ({
  items,
  ariaLabel,
  intervalMs = 5000,
  className = '',
  showDots = true,
  showArrows = true,
  autoPlay = true,
  onItemClick,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);

  const safeItems = items.filter(Boolean) as CarouselItem[];
  const currentItem = safeItems[currentIndex];
  const isVideo = currentItem && typeof currentItem !== 'string' && currentItem.type === 'video';

  // Intersection Observer for autoplay
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
        if (entry.isIntersecting && isVideo && autoPlay) {
          videoRef.current?.play().catch(console.error);
          setIsPlaying(true);
        } else if (!entry.isIntersecting) {
          videoRef.current?.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [isVideo, autoPlay]);

  // Auto-advance logic
  useEffect(() => {
    if (!autoPlay || safeItems.length <= 1 || isHovered || !isInView) return;
    
    const timer = setInterval(() => {
      if (!isVideo || !videoRef.current?.paused) {
        setCurrentIndex((prev) => (prev + 1) % safeItems.length);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoPlay, intervalMs, isHovered, isVideo, safeItems.length, isInView]);

  const goToIndex = useCallback((newIndex: number) => {
    setCurrentIndex((prevIndex) => {
      if (newIndex >= safeItems.length) return 0;
      if (newIndex < 0) return safeItems.length - 1;
      return newIndex;
    });
  }, [safeItems.length]);

  const next = useCallback(() => goToIndex(currentIndex + 1), [currentIndex, goToIndex]);
  const prev = useCallback(() => goToIndex(currentIndex - 1), [currentIndex, goToIndex]);

  const handleVideoClick = useCallback(() => {
    if (!videoRef.current) return;
    
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(console.error);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleItemClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(currentItem, currentIndex);
    }
  }, [currentItem, currentIndex, onItemClick]);

  if (!safeItems.length) {
    return (
      <div 
        className={`relative w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 ${className}`}
        aria-label={ariaLabel}
      >
        <div className="text-center p-4">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No media available</p>
        </div>
      </div>
    );
  }

  const renderMedia = () => {
    if (!currentItem) return null;

    const src = typeof currentItem === 'string' ? currentItem : currentItem.src;
    const alt = typeof currentItem === 'string' 
      ? `Carousel item ${currentIndex + 1}` 
      : currentItem.alt || `Carousel item ${currentIndex + 1}`;

    if (isVideo) {
      return (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={src}
            className="w-full h-full object-cover rounded-lg"
            onClick={handleVideoClick}
            loop
            muted
            playsInline
            onLoadedData={() => setIsLoading(false)}
            aria-label={alt}
          />
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
              <button 
                className="bg-white/80 hover:bg-white text-blue-600 rounded-full p-3 transition-all duration-300 transform hover:scale-110"
                onClick={(e) => {
                  e.stopPropagation();
                  handleVideoClick();
                }}
                aria-label="Play video"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover rounded-lg transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        draggable={false}
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-square group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={ariaLabel}
    >
      {/* Media content */}
      <div className="w-full h-full rounded-xl overflow-hidden">
        {renderMedia()}
      </div>

      {/* Navigation Arrows - Always visible with better contrast */}
      {showArrows && safeItems.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center transition-all z-10 shadow-lg"
            aria-label="Previous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black text-white rounded-full w-10 h-10 flex items-center justify-center transition-all z-10 shadow-lg"
            aria-label="Next"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Dots indicator */}
      {showDots && safeItems.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-2 z-10">
          {safeItems.map((_, i) => (
            <button
              key={i}
              onClick={() => goToIndex(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === currentIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to item ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SquareCarousel;