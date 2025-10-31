'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast, { Toaster } from 'react-hot-toast';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";

import { Check, ChevronsUpDown, Calendar, Clock, User, Mail, MessageSquare } from 'lucide-react';
import { cn } from "@/lib/utils";

type Host = { label: string; email: string };
type MeetingType = 'online' | 'offline';

export default function MemberBookAppointment() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingType, setMeetingType] = useState<MeetingType>('offline');
  const [selectedHost, setSelectedHost] = useState<string>('');
  const [hosts, setHosts] = useState<Host[]>([]);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberName, setMemberName] = useState('');
  const [form, setForm] = useState({ date: '', time: '', notes: '' });

  useEffect(() => {
    async function fetchHosts() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('Not authenticated');

        const res = await fetch('/api/member/hosts', {
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');

        setHosts(data.hosts);
        setMemberEmail(data.memberEmail);
        setMemberName(data.memberName);
        if (data.hosts.length > 0) setSelectedHost(data.hosts[0].email);
      } catch (err: any) {
        toast.error(err.message);
      }
    }
    fetchHosts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHost) return toast.error('Select a host');

    setIsSubmitting(true);
    try {
      const start = new Date(`${form.date}T${form.time}:00`);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      const payload = {
        summary: 'Gym Appointment',
        description: `Notes: ${form.notes}`,
        start: start.toISOString(),
        end: end.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        attendeeEmail: memberEmail,
        attendeeName: memberName,
        hostEmail: selectedHost,
        meetingType,
      };

      const res = await fetch('/api/calendar/create-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      const d = new Date(start);
      const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
      const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const venue = 'GotMeFit, Marine Drive, Raipur';

      toast.success(
        meetingType === 'offline'
          ? `See you at ${venue} on ${dateStr} at ${timeStr}`
          : `Join via Meet: ${data.event.meetLink} on ${dateStr} at ${timeStr}`
      );
      router.push('/');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <>
      <Toaster position="top-center" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 mt-10">
        <Card className="max-w-2xl mx-auto shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Book Your Session
            </CardTitle>
            <p className="text-muted-foreground mt-2">Schedule with your trainer, nutritionist, or admin</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ✅ Host Selector — Command + Popover */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Meet With
                </Label>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {selectedHost
                        ? hosts.find((h) => h.email === selectedHost)?.label
                        : "Select host..."}
                      <ChevronsUpDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search host..." />
                      <CommandEmpty>No host found.</CommandEmpty>
                      <CommandGroup>
                        {hosts.map((h) => (
                          <CommandItem
                            key={h.email}
                            value={h.email}
                            onSelect={() => setSelectedHost(h.email)}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedHost === h.email ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {h.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Session Type */}
              <div className="space-y-2">
                <Label>Session Type</Label>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant={meetingType === 'offline' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setMeetingType('offline')}
                  >
                    <Badge variant="secondary" className="mr-2">Physical</Badge> Offline
                  </Button>
                  <Button
                    type="button"
                    variant={meetingType === 'online' ? 'default' : 'outline'}
                    className="flex-1"
                    onClick={() => setMeetingType('online')}
                  >
                    <Badge variant="secondary" className="mr-2">Virtual</Badge> Online
                  </Button>
                </div>
              </div>

              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Name
                  </Label>
                  <Input value={memberName} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Email
                  </Label>
                  <Input value={memberEmail} readOnly className="bg-muted" />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Date
                  </Label>
                  <Input type="date" required min={today} value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Time
                  </Label>
                  <Input type="time" required min="09:00" max="18:00" step="1800" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Notes (Optional)
                </Label>
                <Textarea
                  placeholder="Any special requests or concerns?"
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
