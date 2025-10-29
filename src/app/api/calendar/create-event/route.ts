import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const eventSchema = z.object({
  summary: z.string().min(1),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timeZone: z.string().default('UTC'),
  attendeeEmail: z.string().email(),
  attendeeName: z.string().min(1),
  meetingType: z.enum(['online', 'offline']),
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

    const {
      summary,
      description,
      start,
      end,
      timeZone,
      attendeeEmail,
      attendeeName,
      meetingType,
    } = validation.data;

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId || calendarId === 'primary') {
      throw new Error('Set GOOGLE_CALENDAR_ID to trainer email (not "primary")');
    }

    // ---- FREE-BUSY WITH BUFFER ----
    const bufferMs = 5 * 60 * 1000;
    const timeMin = new Date(new Date(start).getTime() - bufferMs).toISOString();
    const timeMax = new Date(new Date(end).getTime() + bufferMs).toISOString();

    const freeBusy = await calendar.freebusy.query({
      requestBody: { timeMin, timeMax, timeZone, items: [{ id: calendarId }] },
    });

    if (freeBusy.data.calendars?.[calendarId]?.busy?.length) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 409 }
      );
    }

    // ---- ATTENDEES: Member + Host (calendar owner) ----
    const attendees = [
      { email: attendeeEmail, displayName: attendeeName, responseStatus: 'needsAction' },
      { email: calendarId, displayName: 'Gym Trainer (Host)', responseStatus: 'accepted' }, // ← HOST
    ];

    // ---- EVENT PAYLOAD ----
    const event: any = {
      summary,
      description: description ?? '',
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      attendees,
      reminders: { useDefault: true },
    };

    if (meetingType === 'online') {
      event.conferenceData = {
        createRequest: {
          requestId: `meet-${Date.now()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' },
        },
      };
    }

    const createdEvent = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: meetingType === 'online' ? 1 : 0,
      sendUpdates: 'all', // ← EMAILS BOTH
    });

    const meetLink = createdEvent.data.hangoutLink ?? '';

    // ---- RETURN FORMATTED DATE FOR TOAST ----
    const eventDate = new Date(start);
    const formattedDate = eventDate.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const formattedTime = eventDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return NextResponse.json({
      success: true,
      event: {
        id: createdEvent.data.id,
        htmlLink: createdEvent.data.htmlLink,
        meetLink,
        formattedDate,
        formattedTime,
      },
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}
//For scalability: Super Admin can create branch-specific calendars; pass calendarId dynamically via Member dashboard (e.g., based on assigned Trainer).