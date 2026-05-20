/**
 * Auth callback API route.
 * Handles the OAuth/magic link callback from Supabase.
 * Exchanges the authorization code for a session.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If no code or exchange failed, redirect to login with error
  return NextResponse.redirect(
    new URL('/login?error=auth_callback_failed', requestUrl.origin),
  );
}
