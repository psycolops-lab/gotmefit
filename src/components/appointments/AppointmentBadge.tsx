'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Video, MapPin, FileText } from 'lucide-react';
import AppointmentNotesModal from './AppointmentNotesModal';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  appointment: {
    id: string;
    start_time: string;
    end_time: string;
    meeting_type: 'online' | 'offline';
    host_id: string;
    member_id: string;
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const start = new Date(appointment.start_time);
  const isOnline = appointment.meeting_type === 'online';

  // ✅ Load user + member profile
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setCurrentUserId(user.id);

      const { data: memberProfile } = await supabase
        .from('member_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (memberProfile) setMemberProfileId(memberProfile.id);

      // Determine relationship to this appointment
      if (appointment.host_id === user.id) setIsHost(true);
      if (memberProfile && appointment.member_id === memberProfile.id)
        setIsMember(true);
    };

    loadUser();
  }, [appointment.host_id, appointment.member_id]);

  const canViewNotes = isHost || isMember;

  // ✅ NEW: allow both host and member to see the member's notes
  // (since only the member adds notes, and added_by = member's auth.users.id)
  const memberNote = appointment.appointment_notes?.[0]; // assume one note per meeting

  // ✅ Member sees their own note (can edit or add)
  // ✅ Host sees the member’s note if exists (but no “Add” button)
  const isMemberAddedNote = memberNote?.added_by === currentUserId;

  return (
    <>
      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          {isOnline ? (
            <Video className="h-3 w-3" />
          ) : (
            <MapPin className="h-3 w-3" />
          )}
          <span>{format(start, 'MMM d, h:mm a')}</span>
        </div>

        {canViewNotes && (
          memberNote ? (
            <div className="mt-1 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-900">
              <div className="flex items-center gap-1 font-medium">
                <FileText className="h-3 w-3" />
                Meeting Notes:
              </div>
              <p className="mt-1 whitespace-pre-wrap">{memberNote.notes}</p>
              {/* ✅ Only the member who added the note can edit it */}
              {isMemberAddedNote && (
                <button
                  onClick={() => setOpen(true)}
                  className="mt-1 text-primary hover:underline text-xs"
                >
                  Edit Notes
                </button>
              )}
            </div>
          ) : (
            // ✅ Only member (not host) can add notes
            isMember && (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-1 text-primary hover:underline"
              >
                <FileText className="h-3 w-3" />
                Add Meeting Notes
              </button>
            )
          )
        )}
      </div>

      {isMember && (
        <AppointmentNotesModal
          open={open}
          onClose={() => setOpen(false)}
          appointmentId={appointment.id}
          existingNotes={memberNote?.notes}
          onSaved={onAddNotes}
        />
      )}
    </>
  );
}
