import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

// Set the refresh token from env
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

// Input validation schema
const eventSchema = z.object({
  summary: z.string().min(1, 'Event title is required'),
  description: z.string().optional(),
  start: z.string().datetime(),
  end: z.string().datetime(),
  timeZone: z.string().default('UTC'),
  attendeeEmail: z.string().email('Valid email is required'),
  attendeeName: z.string().min(1, 'Name is required'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = eventSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { summary, description, start, end, timeZone, attendeeEmail, attendeeName } = validation.data;

    // Check if time slot is available
    const freeBusy = await calendar.freebusy.query({
      requestBody: {
        timeMin: start,
        timeMax: end,
        timeZone,
        items: [{ id: process.env.GOOGLE_CALENDAR_ID }],
      },
    });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID is not set');
    }

    const calendarData = freeBusy.data.calendars?.[calendarId];
    const isBusy = calendarData?.busy && calendarData.busy.length > 0;
    
    if (isBusy) {
      return NextResponse.json(
        { error: 'Selected time slot is not available' },
        { status: 409 }
      );
    }

    // Create event
    const event = {
      summary,
      description,
      start: { dateTime: start, timeZone },
      end: { dateTime: end, timeZone },
      attendees: [
        { email: attendeeEmail, displayName: attendeeName },
      ],
      reminders: {
        useDefault: true,
      },
    };

    if (!process.env.GOOGLE_CALENDAR_ID) {
      throw new Error('GOOGLE_CALENDAR_ID is not set');
    }

    const createdEvent = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
      sendUpdates: 'all',
    });

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
