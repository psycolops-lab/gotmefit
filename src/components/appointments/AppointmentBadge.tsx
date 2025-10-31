'use client';

import { format } from 'date-fns';
import { Video, MapPin, FileText } from 'lucide-react';
import { useState } from 'react';
import AppointmentNotesModal from './AppointmentNotesModal';

type Props = {
  appointment: {
    id: string;
    start_time: string;
    end_time: string;
    meeting_type: 'online' | 'offline';
    appointment_notes?: Array<{
      id?: string;
      notes: string;
      added_by?: string;
      created_at?: string;
    }>;
  };
  onAddNotes: () => void;
};

export default function AppointmentBadge({ appointment, onAddNotes }: Props) {
  const [open, setOpen] = useState(false);
  const start = new Date(appointment.start_time);
  const isOnline = appointment.meeting_type === 'online';

  // ✅ Show first note if exists (no user filter)
  const myNote = appointment.appointment_notes?.[0];

  return (
    <>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {isOnline ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
          <span>{format(start, 'MMM d, h:mm a')}</span>
        </div>

        {myNote ? (
          <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
            <div className="flex items-center gap-1 font-medium">
              <FileText className="h-3 w-3" />
              Your Notes:
            </div>
            <p className="mt-1 whitespace-pre-wrap">{myNote.notes}</p>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <FileText className="h-3 w-3" />
            Add Meeting Notes
          </button>
        )}
      </div>

      <AppointmentNotesModal
        open={open}
        onClose={() => setOpen(false)}
        appointmentId={appointment.id}
        existingNotes={myNote?.notes}
        onSaved={onAddNotes}
      />
    </>
  );
}
