'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

export default function MembershipSection() {
  const plans = [
    {
      name: 'Basic',
      price: '₹2,999',
      period: 'quarterly',
      originalPrice: '₹3,599',
      discount: '17% OFF',
      description: 'Perfect for getting started on your fitness journey',
      features: [
        'Gym access during off-peak hours',
        'Basic workout equipment',
        'Locker room access',
        'Mobile app access',
        'Free fitness assessment',
      ],
      popular: false,
    },
    {
      name: 'Premium',
      price: '₹8,999',
      period: 'half-yearly',
      originalPrice: '₹11,999',
      discount: '25% OFF',
      description: 'Most popular choice for serious fitness enthusiasts',
      features: [
        '24/7 gym access',
        'All equipment access',
        'Group fitness classes',
        'Personal trainer consultation',
        'Nutrition guidance',
        'Guest passes (4/month)',
        'Free protein supplements',
      ],
      popular: true,
    },
    {
      name: 'Elite',
      price: '₹15,999',
      period: 'yearly',
      originalPrice: '₹23,999',
      discount: '33% OFF',
      description: 'Ultimate fitness experience with premium perks',
      features: [
        'Everything in Premium',
        'Unlimited personal training',
        'Nutrition meal planning',
        'Recovery and wellness services',
        'Priority class booking',
        'Unlimited guest passes',
        'Exclusive member events',
        'Free supplements & gear',
      ],
      popular: false,
    },
  ];

  return (
    <section id="membership" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Choose Your Plan</h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Select the membership that fits your lifestyle and fitness goals. 
            All plans include access to our world-class facilities and expert support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <Card 
              key={index}
              className={`animate-slide-up hover:shadow-xl transition-all duration-300 hover:-translate-y-2 ${
                plan.popular ? 'border-blue-600 border-2 relative ring-2 ring-blue-600 ring-opacity-20' : 'border-blue-200 dark:border-blue-800'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 hover:bg-blue-700">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white">{plan.name}</CardTitle>
                
                {/* Pricing */}
                <div className="mt-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <span className="text-lg text-gray-500 dark:text-gray-400 line-through">{plan.originalPrice}</span>
                    <Badge variant="destructive" className="text-xs">
                      {plan.discount}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-600 dark:text-gray-300 ml-2">/{plan.period}</span>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-gray-600 dark:text-gray-300 mb-4">All memberships include a 7-day free trial</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">No setup fees • Cancel anytime • Money-back guarantee</p>
          <div className="flex items-center justify-center mt-4 space-x-2">
          </div>
        </div>
      </div>
    </section>
  );
}