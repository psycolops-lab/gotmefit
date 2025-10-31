"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import AppointmentBadge from "./AppointmentBadge";
import AppointmentNotesModal from "./AppointmentNotesModal";
import { format, isToday, isTomorrow } from "date-fns";

type Appointment = {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  host_type: string;
  meeting_type: "online" | "offline";
  meet_link?: string | null;
  appointment_notes?: { notes: string }[];
};

export default function AppointmentsList() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [memberProfileId, setMemberProfileId] = useState<string | null>(null);
  const [notesModal, setNotesModal] = useState({
    open: false,
    apptId: "",
    notes: "" as string | undefined,
  });

  /* -----------------------------
     1️⃣ Get member_profile.id 
  ------------------------------*/
  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("member_profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (data?.id) setMemberProfileId(data.id);
    };

    fetchProfile();
  }, []);

  /* -----------------------------
     2️⃣ Load appointments once profile ID exists 
  ------------------------------*/
  const loadAppointments = async () => {
    if (!memberProfileId) return; // ✅ do nothing until profile loaded

    const { data } = await supabase
      .from("appointments")
      .select("*, appointment_notes(notes)")
      .eq("member_id", memberProfileId)
      .order("start_time", { ascending: false });

    if (data) setAppointments(data);
  };

  useEffect(() => {
    if (!memberProfileId) return;

    const load = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, appointment_notes(notes)")
        .eq("member_id", memberProfileId)
        .order("start_time", { ascending: false });

      if (data) setAppointments(data);
    };

    load();

    const channel = supabase
      .channel("member-appts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        load
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointment_notes" },
        load
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel); // ✅ Sync cleanup only
    };
  }, [memberProfileId]);

  /* ----------------------------- */
  const openNotes = (apptId: string) => {
    const appt = appointments.find((a) => a.id === apptId);
    setNotesModal({
      open: true,
      apptId,
      notes: appt?.appointment_notes?.[0]?.notes,
    });
  };

  const formatAppointmentText = (appt: Appointment) => {
    const start = new Date(appt.start_time);
    const time = format(start, "h:mm a");

    if (isTomorrow(start))
      return `You booked an appointment with ${appt.host_type} **tomorrow** at ${time}`;

    if (isToday(start))
      return `You booked an appointment with ${appt.host_type} **today** at ${time}`;

    return `You booked an appointment with ${appt.host_type} on ${format(
      start,
      "MMM d"
    )} at ${time}`;
  };

  return (
    <>
      <div className="space-y-2">
        {appointments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No appointments yet.</p>
        ) : (
          appointments.map((appt) => (
            <div
              key={appt.id}
              className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm"
            >
              {new Date(appt.end_time) > new Date() && (
                <p
                  className="flex-1 pr-2"
                  dangerouslySetInnerHTML={{
                    __html: formatAppointmentText(appt).replace(
                      /\*\*(.*?)\*\*/g,
                      "<strong>$1</strong>"
                    ),
                  }}
                />
              )}

              <AppointmentBadge
                appointment={appt}
                onAddNotes={() => openNotes(appt.id)} // ✅ pass appt.id manually
              />
            </div>
          ))
        )}
      </div>

      <AppointmentNotesModal
        open={notesModal.open}
        onClose={() => setNotesModal({ ...notesModal, open: false })}
        appointmentId={notesModal.apptId}
        existingNotes={notesModal.notes}
        onSaved={loadAppointments}
      />
    </>
  );
}
