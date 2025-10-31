import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from "@/lib/supabaseAdmin"; // ✅ only new import

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const eventSchema = z.object({
  summary: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timeZone: z.string().default('UTC'),
  attendeeEmail: z.string().email('Valid email is required'),
  attendeeName: z.string().min(1, 'Name is required'),
  meetingType: z.enum(['online', 'offline']).default('offline'),
  hostEmail: z.string().email().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = eventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { summary, description, start, end, timeZone, attendeeEmail, attendeeName, meetingType, hostEmail } = validation.data;

    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start,
        timeMax: end,
        timeZone,
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) throw new Error('GOOGLE_CALENDAR_ID not set');

    const calendarData = freeBusy.data.calendars?.[calendarId];
    const isBusy = calendarData?.busy && calendarData.busy.length > 0;

    if (isBusy) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 409 }
      );
    }

    const defaultHostEmail = process.env.DEFAULT_GYM_EMAIL;
    const finalHostEmail = hostEmail || defaultHostEmail;

    const event = {
      summary,
      description,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName },
        { email: finalHostEmail, displayName: 'Gym Host' },
      ],
      reminders: { useDefault: true },
      conferenceData: meetingType === 'online'
        ? {
            createRequest: {
              requestId: `meet-${Date.now()}`,
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          }
        : undefined,
    };

    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: meetingType === 'online' ? 1 : 0,
      sendUpdates: 'all',
    });

    // ✅ ✅ SAVE TO SUPABASE (after event created)
        // === GET MEMBER FROM USERS ===
    const { data: memberData, error: memberError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", attendeeEmail)
      .single();

    if (memberError || !memberData?.id) {
      console.error('Member not found in users:', attendeeEmail, memberError);
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    // === GET MEMBER PROFILE (required for appointments.member_id) ===
    const { data: memberProfile, error: profileError } = await supabaseAdmin
      .from("member_profiles")
      .select("id")
      .eq("user_id", memberData.id)
      .single();

    if (profileError || !memberProfile?.id) {
      console.error('Member profile missing:', attendeeEmail, profileError);
      return NextResponse.json(
        { error: 'Member profile not found. Please complete registration.' },
        { status: 404 }
      );
    }

    // === GET HOST ===
    const { data: hostData, error: hostError } = await supabaseAdmin
      .from("users")
      .select("id, role")
      .eq("email", finalHostEmail)
      .single();

    if (hostError || !hostData?.id) {
      console.error('Host not found:', finalHostEmail, hostError);
      return NextResponse.json({ error: 'Host not found' }, { status: 404 });
    }

    // === INSERT APPOINTMENT ===
    const { data: apptData, error: apptError } = await supabaseAdmin
      .from("appointments")
      .insert({
        member_id: memberProfile.id,     // ← NOW CORRECT
        host_id: hostData.id,
        host_type: hostData.role,
        event_id: createdEvent.data.id,
        title: summary,
        description,
        start_time: start,
        end_time: end,
        meeting_type: meetingType,
        meet_link: createdEvent.data?.hangoutLink ?? null,
      })
      .select()
      .single();

    if (apptError) {
      console.error('Failed to save appointment:', apptError);
      return NextResponse.json(
        { error: 'Failed to save appointment', details: apptError.message },
        { status: 500 }
      );
    }

    console.log('Appointment saved:', apptData.id);

    return NextResponse.json({
      success: true,
      event: {
        id: createdEvent.data.id,
        htmlLink: createdEvent.data.htmlLink,
        start: createdEvent.data.start,
        end: createdEvent.data.end,
      },
    });

  } catch (error) {
    console.error('Error creating calendar event:', error);
    return NextResponse.json(
      { error: 'Failed to create calendar event' },
      { status: 500 }
    );
  }
}
