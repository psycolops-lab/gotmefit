'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';

export default function BookAppointment() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('offline');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date: '',
    time: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000);

      const payload = {
        summary: 'Fitness Appointment',
        description: `Notes: ${formData.notes}`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendeeEmail: formData.email,
        attendeeName: formData.name,
        meetingType,
      };

      const res = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Booking failed');

      const { formattedDate, formattedTime, meetLink } = data.event;

      if (meetingType === 'offline') {
        toast.success(
          `See you at GotMeFit, Marine Drive, Raipur on ${formattedDate} at ${formattedTime}`
        );
      } else {
        toast.success(
          `Join via Meet: ${meetLink} on ${formattedDate} at ${formattedTime}`
        );
      }

      router.push('/');
    } catch (err: any) {
      toast.error(err.message || 'Failed to book');
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden md:max-w-2xl">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Book an Appointment</h1>
              <p className="mt-2 text-sm text-gray-600">Schedule your fitness session with us</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name, Email, Toggle, Date, Time, Notes – unchanged */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" name="name" required value={formData.name} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input type="email" name="email" required value={formData.email} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Session Type</label>
                <div className="flex bg-gray-100 p-1 rounded-full w-fit">
                  <button type="button" onClick={() => setMeetingType('offline')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                      meetingType === 'offline' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}>
                    Offline
                  </button>
                  <button type="button" onClick={() => setMeetingType('online')}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                      meetingType === 'online' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600'
                    }`}>
                    Online
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input type="date" name="date" required min={today} value={formData.date} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray- nontent">Time</label>
                  <input type="time" name="time" required min="09:00" max="18:00" step="1800"
                    value={formData.time} onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Notes (Optional)</label>
                <textarea name="notes" rows={3} value={formData.notes} onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requirements..." />
              </div>

              <div className="flex space-x-4">
                <button type="button" onClick={() => router.back()}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                    isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                  }`}>
                  {isSubmitting ? 'Booking...' : 'Book Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}