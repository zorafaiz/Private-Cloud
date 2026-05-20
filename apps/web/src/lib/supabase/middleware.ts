/**
 * Supabase middleware helper for refreshing auth sessions on every request.
 * Automatically refreshes expired tokens and keeps sessions alive.
 * Must be called in the Next.js middleware for all protected routes.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * Refreshes the Supabase auth session by reading/writing cookies in the middleware.
 * Handles unauthenticated users gracefully (doesn't crash if not logged in).
 * Returns the response with potentially updated session cookies.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  // Refresh the session - this will automatically refresh expired tokens
  // Handles unauthenticated users gracefully (doesn't throw if no session)
  try {
    await supabase.auth.getUser();
  } catch (err) {
    // Silently continue if there's no session - user may be on login page
    if (process.env.NODE_ENV === 'development') {
      console.debug('Session refresh check:', err instanceof Error ? err.message : 'No session');
    }
  }

  return response;
}
