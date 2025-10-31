// components/appointments/AppointmentNotesModal.tsx
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import toast from 'react-hot-toast';

type Props = {
  open: boolean;
  onClose: () => void;
  appointmentId: string;
  existingNotes?: string;
  onSaved: () => void;
};

export default function AppointmentNotesModal({ open, onClose, appointmentId, existingNotes, onSaved }: Props) {
  const [notes, setNotes] = useState(existingNotes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!notes.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    setSaving(true);

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Not authenticated");
      setSaving(false);
      return;
    }

    // INSERT a new note (every save = new row)
    const { error } = await supabase
      .from('appointment_notes')
      .insert({
        appointment_id: appointmentId,
        notes: notes.trim(),
        added_by: user.id,
      });

    if (error) {
      console.error("Save error:", error);
      toast.error('Failed to save note');
    } else {
      toast.success('Note saved!');
      onSaved();   // refresh badge
      onClose();
    }

    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meeting Notes</DialogTitle>
        </DialogHeader>
        <Textarea
          placeholder="What was discussed? Next steps? Goals?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={6}
        />
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Notes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}