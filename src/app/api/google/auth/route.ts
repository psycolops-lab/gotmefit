import { google } from 'googleapis';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback`
);

export async function GET() {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
    prompt: 'consent',
  });

  // Store state in HTTP-only cookie for security
  const state = Math.random().toString(36).substring(7);
  const cookieStore = await cookies();
  cookieStore.set('google_auth_state', state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });

  // Add state to URL
  const authUrl = `${url}&state=${state}`;
  
  return redirect(authUrl);
}
