'use client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, Phone, Mail } from 'lucide-react';

export default function CTASection() {
    const router = useRouter();
  return (
    
    <section className="py-20 gradient-bg dark:gradient-bg-dark relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-32 -translate-y-32"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-48 translate-y-48"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="animate-slide-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Life?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
            Join thousands of members who have already started their fitness journey with GotMeFit. 
            Your transformation begins today!
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <Button 
              onClick={() => router.push('/')}
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              className="border-white text-blue-600 dark:text-white hover:text-white hover:bg-blue-600 dark:hover:bg-white dark:hover:text-blue-600 text-lg px-8 py-3 rounded-full transition-all duration-300"
            >
              Schedule Tour
            </Button>
          </div>

          {/* Pricing Highlight */}
          <div className="flex items-center justify-center mb-8 space-x-2">
            
            <span className="text-white font-medium">Starting from ₹2,999/quarter • No hidden fees</span>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 text-white">
              <Phone className="h-5 w-5" />
              <span>+91 98765 43210</span>
            </div>
            <div className="flex items-center justify-center space-x-3 text-white">
              <Mail className="h-5 w-5" />
              <span>Gotmefit@gmail.com</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}