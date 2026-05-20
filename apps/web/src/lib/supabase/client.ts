/**
 * Browser-side Supabase client for use in Client Components.
 * Uses the @supabase/ssr package with singleton pattern to avoid multiple instances.
 */

'use client';

import { createBrowserClient } from '@supabase/ssr';

let cachedClient: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Creates or returns a cached Supabase client for client-side (browser) use.
 * Uses singleton pattern to ensure only one instance exists.
 * Safe to expose the anon key in browser - it's designed for public access.
 */
export function createClient() {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return cachedClient;
}
