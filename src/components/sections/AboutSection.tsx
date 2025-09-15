'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Target, Users, Trophy, Clock } from 'lucide-react';
import Image from 'next/image'; 
export default function AboutSection() {
  const features = [
    {
      icon: Target,
      title: 'Goal-Oriented Training',
      description: 'Personalized workout plans designed to help you reach your specific fitness goals faster and more effectively.',
    },
    {
      icon: Users,
      title: 'Expert Community',
      description: 'Train alongside like-minded individuals with guidance from certified trainers and nutrition experts.',
    },
    {
      icon: Trophy,
      title: 'Proven Results',
      description: 'Our members achieve measurable results with our science-backed training methods and nutrition programs.',
    },
    {
      icon: Clock,
      title: '24/7 Availability',
      description: 'Access our facilities anytime that fits your schedule with our round-the-clock gym access.',
    },
  ];

  return (
    <section id="about" className="py-20 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Why Choose Us?</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            We are more than just a gym. We are a community dedicated to helping you achieve 
            your fitness goals with cutting-edge equipment, expert guidance, and unwavering support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="animate-slide-up hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-blue-200 dark:border-blue-800"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-20 items-center">
          <div className="animate-slide-up">
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              State-of-the-Art Facilities
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
              Our modern facility features the latest fitness equipment, spacious workout areas, 
              group fitness studios, and recovery zones designed to optimize your training experience.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                Premium cardio and strength equipment
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                Group fitness studios and classes
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                Recovery and wellness amenities
              </li>
              <li className="flex items-center text-gray-700 dark:text-gray-300">
                <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                Nutrition consultation services
              </li>
            </ul>
          </div>
          <div className="animate-scale-in">
            <Image
                src="/about.jpg"
                alt="Modern Gym Interior"
                className="rounded-lg shadow-lg  object-cover"
                width={10000}
                height={960}
            />
          </div>
        </div>
      </div>
    </section>
  );
}