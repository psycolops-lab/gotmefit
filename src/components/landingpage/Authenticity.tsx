import React, { useEffect, useState } from 'react';
import SquareCarousel from './SquareCarousel';

async function fetchImages(dir: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/landing/images?dir=${encodeURIComponent(dir)}`);
    const data = await res.json();
    return Array.isArray(data.images) ? data.images : [];
  } catch (error) {
    console.error('Error fetching images:', error);
    return [];
  }
}

const Authenticity: React.FC = () => {
  const [transformations, setTransformations] = useState<string[]>([]);
  const [testimonials, setTestimonials] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const [transformationsData, testimonialsData] = await Promise.all([
          fetchImages('landingpage/authenticity/transformations'),
          fetchImages('landingpage/authenticity/testimonials')
        ]);
        setTransformations(transformationsData);
        setTestimonials(testimonialsData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Format items with proper typing
  const testimonialItems = testimonials.map(item => ({
    src: item,
    type: (item.endsWith('.mp4') ? 'video' : 'image') as 'video' | 'image',
    alt: 'Customer testimonial'
  }));

  const transformationItems = transformations.map(item => ({
    src: item,
    type: 'image' as const,
    alt: 'Transformation result'
  }));

  if (isLoading) {
    return (
      <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-6">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-200 rounded w-1/3 mx-auto"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="aspect-square bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Real Results, Real Stories
          </h2>
          <div className="w-20 h-1 bg-blue-500 mx-auto rounded-full"></div>
          <p className="mt-6 text-lg text-gray-600 max-w-3xl mx-auto">
            See the transformations and hear from people who&apos;ve experienced our program firsthand.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 max-w-4xl mx-auto">
          {/* Transformations Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Transformations</h3>
              <p className="text-sm text-gray-600 mb-3">Real progress from our community</p>
              <div className="aspect-w-1 aspect-h-1">
                <SquareCarousel 
                  items={transformationItems}
                  ariaLabel="Transformations carousel"
                  showDots={true}
                  showArrows={true}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          </div>

          {/* Testimonials Card */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
            <div className="p-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Testimonials</h3>
              <p className="text-sm text-gray-600 mb-3">Hear success stories from members</p>
              <div className="aspect-w-1 aspect-h-1">
                <SquareCarousel 
                  items={testimonialItems}
                  ariaLabel="Testimonials carousel"
                  intervalMs={10000}
                  showDots={true}
                  showArrows={true}
                  className="max-w-md mx-auto"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <button 
            className="px-8 py-3 bg-blue-500 text-white rounded-full font-medium hover:bg-blue-600 transition-colors duration-300 shadow-md hover:shadow-lg"
            onClick={() => {
              // Scroll to top or navigate to signup
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            Start Your Journey Today
          </button>
        </div>
      </div>
    </section>
  );
};

export default Authenticity;