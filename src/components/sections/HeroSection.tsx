'use client';

import { Button } from '@/components/ui/button';
import { Play, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Import the Image component

export default function HeroSection() {
  const router = useRouter();

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with next/image */}
      <div className="absolute inset-0 z-0 ">
        <Image
          src="/gymbg.jpg"
          alt="Gym Background"
          fill 
          className="object-cover" 
        />
        <div className="absolute inset-0 backdrop-blur-xs "></div>
        
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-slide-up">
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
            Transform Your
            <span className="block text-blue-400">Body & Mind</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Join GotMeFit today and unlock your potential with state-of-the-art equipment, 
            expert trainers, and a supportive community that will help you achieve your fitness goals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Button 
              onClick={() => router.push('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Get Started Now
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              className="border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-lg px-8 py-3 rounded-full transition-all duration-300"
            >
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mt-16 max-w-4xl mx-auto">
            <div className="animate-scale-in">
              <div className="text-3xl sm:text-4xl font-bold text-blue-400">500+</div>
              <div className="text-gray-300">Active Members</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
              <div className="text-3xl sm:text-4xl font-bold text-blue-400">50+</div>
              <div className="text-gray-300">Expert Trainers</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
              <div className="text-3xl sm:text-4xl font-bold text-blue-400">10+</div>
              <div className="text-gray-300">Years Experience</div>
            </div>
            <div className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
              <div className="text-3xl sm:text-4xl font-bold text-blue-400">12/7</div>
              <div className="text-gray-300">Access</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}