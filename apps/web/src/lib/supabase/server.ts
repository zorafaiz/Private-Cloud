/**
 * Server-side Supabase client for use in Server Components and Route Handlers.
 * Uses the @supabase/ssr package with cookie-based session management.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Creates a Supabase server client that reads/writes cookies for session persistence.
 * Must be called in Server Components, Route Handlers, or Middleware.
 */
export async function createClient() {
  return createSupabaseServerClient();
}

/** @deprecated Prefer createClient — same implementation. */
export async function createSupabaseServerClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // The `setAll` method is called from a Server Component.
            // This can be ignored if middleware is refreshing user sessions.
          }
        },
      },
    },
  );
}

// Re-export: createClient() delegates to createSupabaseServerClient() above.
