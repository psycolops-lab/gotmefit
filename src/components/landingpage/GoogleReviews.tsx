"use client";

import React, { useState, useEffect } from "react";

type Review = {
  id: number;
  name: string;
  rating: number;
  text: string;
  date: string;
  link: string;
};

const reviewsData: Review[] = [
  {
    id: 1,
    name: "Ankush Kumar",
    rating: 5,
    text: `Got Me Fit Gym is hands down one of the best gyms of Raipur The owner is genuinely dedicated and passionate about fitness, and it really shows in how the gym is run. The staff is highly skilled, well-trained, and always ready to guide you with the right techniques and workout plans.

The gym is fully equipped with everything you need—whether you're focused on building muscle or burning fat, you'll find the right machines, free weights, and functional training areas. The vibe here is super motivating and positive. It’s clean, well-maintained, and has a great energy that keeps you coming back.

I absolutely loved it`,
    date: "5 months ago",
    link: "https://share.google/uUZzK0T63SPqnbH8V"
  },
  {
    id: 2,
    name: "Nanuha Ram Sahu",
    rating: 5,
    text: `I’ve thoroughly enjoyed my experience at your gym. The trainers are highly skilled, approachable, and always ready to guide members with patience and expertise. The equipment is modern, well-maintained, and easily accessible, ensuring a smooth workout experience. I would like to express special thanks to my trainer, Anuranjan Sahu Sir, whose professional guidance, constant encouragement, and in-depth knowledge have been instrumental in achieving my fitness goals. The gym’s cleanliness, organization, and positive environment make every session both productive and enjoyable. Keep up the excellent work!`,
    date: "2 months ago",
    link: "https://share.google/3Nk8JvbRchSOa9Ww0"
  },
  {
    id: 3,
    name: "Jaspreet Kalla",
    rating: 5,
    text: `If you really want to transform your fitness journey then Gotmefit is the place to reach out. The trainers are super supportive and motivates you to reach your fitness goal. You get personalised training, tailored diet plan and constant reminders to keep moving. The place is no nonsense zone perfect for gym enthusiast. They not just train you but inform and teach you about right postures. Trainers are excellent in their job and we have been trained by Komal sir and he is doing a wonderful job and assisting us dedicatedly. Would highly recommend this place to anyone who is looking for real transformation.`,
    date: "2 months ago",
    link: "https://share.google/KvmwvniXHfM4nGaYu"
  },
  {
    id: 4,
    name: "Abhishek Agrawal",
    rating: 5,
    text: `I've been to many gyms over the years. But this gym is special. The management, staff and trainers are all super friendly. Such a supportive environment in the gym is very helpful in achieving any goal that a trainee may have. I highly recommend this gym to anyone, trying to improve their physique/health.

Big shoutout to my amazing and always smiling trainer Bhanu Pratap sir who has been pushing me to get better by the day.`,
    date: "2 months ago",
    link: "https://share.google/UsSN4RBHhPjgNfUT2"
  },
  {
    id: 5,
    name: "Monika Sachdev",
    rating: 5,
    text: "I absolutely love this gym! The ambiance is fantastic, and it's always super clean and hygienic. My personal trainer, Komal Maheshwari, is incredibly dedicated and gives me the perfect amount of attention and guidance. I'm seeing amazing results! Plus, the owner is not only friendly and supportive, but also extremely knowledgeable about fitness and nutrition, which makes a huge difference. And the at the reception staff is also very helpful!",
    date: "3 months ago",
    link: "https://share.google/8eq1QldExSUdrLcEq"
  }
];

const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg
    className={`w-5 h-5 ${filled ? "text-yellow-400" : "text-gray-300"}`}
    fill="currentColor"
    viewBox="0 0 20 20"
  >
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function GoogleReviews() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered) {
        setCurrentIndex((prev) => (prev + 1) % reviewsData.length);
      }
    }, 6000);

    return () => clearInterval(timer);
  }, [isHovered]);

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviewsData.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviewsData.length) % reviewsData.length);
  };

  const currentReview = reviewsData[currentIndex];
  const averageRating = (reviewsData.reduce((sum, review) => sum + review.rating, 0) / reviewsData.length).toFixed(1);

  return (
    <section className="w-full py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Google Reviews</h2>
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-4xl font-bold">4.9</span>
                <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <StarIcon key={star} filled={star <= 5} /> // 5 stars filled for 4.9 rating
                ))}
                </div>
          </div>
        </div>

        <div 
          className="relative group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <a 
            href={currentReview.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="block"
          >
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium mr-3">
                  {currentReview.name.charAt(0)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{currentReview.name}</h4>
                  <div className="flex items-center">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <StarIcon key={star} filled={star <= currentReview.rating} />
                      ))}
                    </div>
                    <span className="text-sm text-gray-500 ml-2">{currentReview.rating}/5</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-700 mb-3">{currentReview.text}</p>
              <p className="text-sm text-gray-500">{currentReview.date}</p>
            </div>
          </a>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              prevReview();
            }}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : ''
            }`}
            aria-label="Previous review"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              nextReview();
            }}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : ''
            }`}
            aria-label="Next review"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="flex justify-center mt-6 space-x-2">
          {reviewsData.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                index === currentIndex ? 'bg-blue-600' : 'bg-gray-300'
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}