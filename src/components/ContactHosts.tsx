// components/ContactHosts.tsx
'use client';

import { Calendar, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function ContactHosts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  // Auto-open once (optional — remove if not needed)
  useEffect(() => {
    if (!localStorage.getItem('fab-seen')) {
      setTimeout(() => setOpen(true), 800);
      localStorage.setItem('fab-seen', 'true');
    }
  }, []);

  const handleBook = () => {
    setOpen(false);
    router.push('/member/book');
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl transition-all hover:scale-110 hover:shadow-blue-500/50"
        aria-label="Quick actions"
      >
        <Mail className="h-6 w-6" />
        {!open && !localStorage.getItem('fab-seen') && (
          <span className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-red-500" />
        )}
      </button>

      {/* Slide-Up Panel */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)]">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-gray-700 dark:bg-gray-900/95">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-5">
                <h3 className="text-lg font-bold text-white">Quick Actions</h3>
              </div>

              {/* Actions */}
              <div className="p-4">
                <button
                  onClick={handleBook}
                  className="flex w-full items-center gap-4 rounded-xl bg-blue-50 p-4 text-left font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                >
                  <Calendar className="h-8 w-8 rounded-lg bg-blue-600 p-1.5 text-white" />
                  <div>
                    <div className="font-semibold">Book Appointment</div>
                    <div className="text-sm opacity-80">Schedule with your trainer</div>
                  </div>
                </button>
              </div>

              {/* Close */}
              <div className="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => setOpen(false)}
                  className="w-full text-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}