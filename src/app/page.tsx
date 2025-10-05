'use client';

import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleAppointment = () => {
    router.push('/book');
  };

  const handleLogin = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center p-8 max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">Welcome to GotMeFit</h1>
        <p className="text-xl text-gray-600 mb-8">Your personal fitness and wellness companion</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleAppointment}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book an Appointment
          </button>
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-white text-gray-800 font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Login
          </button>
        </div>
      </div>
    </div>
  );
}
