'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Activity, Apple, Dumbbell } from 'lucide-react';

export default function StepSuccessSection() {
  const steps = [
    {
      number: '01',
      icon: Users,
      title: 'FREE CONSULTATION',
      description: 'We start by understanding your unique fitness goals, lifestyle, and challenges. Our expert consultants work with you to map out a personalized journey that aligns with your aspirations and sets you up for long-term success.',
      color: 'from-blue-500 to-blue-600',
      delay: '0s'
    },
    {
      number: '02',
      icon: Activity,
      title: 'HEALTH & FITNESS TESTING',
      description: 'Through comprehensive data-driven assessments, we establish your baseline fitness levels, body composition, and health metrics. This scientific approach ensures your tailored plan is built on accurate, measurable data.',
      color: 'from-blue-600 to-blue-700',
      delay: '0.1s'
    },
    {
      number: '03',
      icon: Apple,
      title: 'NUTRITIONAL ANALYSIS & PLAN',
      description: 'Forget restrictive diets. We create a personalized, sustainable nutrition plan that fuels your workouts and supports your lifestyle. Our approach focuses on nourishing your body for optimal performance and lasting results.',
      color: 'from-blue-700 to-blue-800',
      delay: '0.2s'
    },
    {
      number: '04',
      icon: Dumbbell,
      title: 'ONE-TO-ONE EXERCISE',
      description: 'Experience the power of expert, personalized training sessions. Our certified trainers ensure proper form, maximize your progress, and adapt your workouts as you grow stronger, keeping you motivated every step of the way.',
      color: 'from-blue-800 to-blue-900',
      delay: '0.3s'
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16 animate-slide-up">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            STEP SUCCESS SYSTEM
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-700 mx-auto mb-8"></div>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed">
            At Gotmefit, we believe lasting results come from a structured process. That&apos;s why we&apos;ve designed our Step Success System—a proven 4-step journey to help you achieve your fitness goals with confidence and clarity.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="group relative overflow-hidden animate-slide-up hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm"
              style={{ animationDelay: step.delay }}
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.color} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}></div>
              
              {/* Step Number */}
              <div className="absolute top-4 right-4">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                  {step.number}
                </div>
              </div>

              <CardContent className="p-8 relative z-10">
                {/* Icon */}
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Progress Indicator */}
                <div className="mt-6 flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">
                    Step {step.number} Complete
                  </span>
                </div>
              </CardContent>

              {/* Hover Effect Border */}
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-blue-200 dark:group-hover:border-blue-800 rounded-lg transition-colors duration-300"></div>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        {/* <div className="text-center mt-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CheckCircle className="h-5 w-5" />
            <span className="font-semibold">Ready to Start Your Success Journey?</span>
          </div>
        </div> */}
      </div>
    </section>
  );
}