/**
 * Next.js Middleware for authentication and session management.
 * Protects /dashboard and /api routes, refreshes sessions, manages redirects.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Don't run middleware on auth callback or static paths
  if (
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/public/')
  ) {
    return;
  }

  // Always refresh the session for all routes
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
