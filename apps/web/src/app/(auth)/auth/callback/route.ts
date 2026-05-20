/**
 * Auth callback route handler.
 * Handles the redirect from Supabase magic link authentication.
 * Exchanges the auth code for a session and sets cookies.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');

  // Handle errors from Supabase
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(error)}&error_code=${requestUrl.searchParams.get('error_code') || ''}`,
        requestUrl.origin,
      ),
    );
  }

  // Handle missing code
  if (!code) {
    return NextResponse.redirect(
      new URL(
        '/login?error=missing_code',
        requestUrl.origin,
      ),
    );
  }

  try {
    const supabase = await createClient();

    // Exchange code for session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    // Success - redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengautentikasi';
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(message)}`,
        requestUrl.origin,
      ),
    );
  }
}
