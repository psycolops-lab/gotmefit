import { google } from 'googleapis';
import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_BASE_URL}/api/google/callback`
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const cookieStore = await cookies();
  const storedState = cookieStore.get('google_auth_state')?.value;

  // Validate state
  if (!state || state !== storedState) {
    return NextResponse.json(
      { error: 'Invalid state parameter' },
      { status: 400 }
    );
  }

  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code as string);
    
    // Important: In production, store refresh token securely (e.g., database)
    // This is just for demo - you'll see the refresh token in the response
    return NextResponse.json({
      message: 'Successfully authenticated with Google',
      refresh_token: tokens.refresh_token, // Save this to .env as GOOGLE_REFRESH_TOKEN
      tokens: {
        ...tokens,
        // Don't expose these in production
        access_token: '***',
        id_token: '***',
      },
    });
  } catch (error) {
    console.error('Error getting tokens:', error);
    return NextResponse.json(
      { error: 'Failed to authenticate with Google' },
      { status: 500 }
    );
  }
}
