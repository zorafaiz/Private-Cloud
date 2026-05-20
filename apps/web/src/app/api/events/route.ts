/**
 * Events (calendar) API route.
 * GET: list events in a date range
 * POST: create event
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createEventSchema } from '@private-cloud/shared';
import type { ApiResponse, CalendarEvent } from '@private-cloud/shared';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET /api/events?start=YYYY-MM-DD&end=YYYY-MM-DD
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CalendarEvent[]>>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const start = request.nextUrl.searchParams.get('start');
    const end = request.nextUrl.searchParams.get('end');

    if (!start || !end || !DATE_RE.test(start) || !DATE_RE.test(end)) {
      return NextResponse.json(
        { success: false, error: 'Parameter start dan end (YYYY-MM-DD) wajib diisi' },
        { status: 400 },
      );
    }

    const { data: events, error } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', start)
      .lte('event_date', end)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('GET /api/events error:', error);
      return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: (events ?? []) as CalendarEvent[],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * POST /api/events
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<CalendarEvent>>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createEventSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: validation.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 },
      );
    }

    const { title, event_date, description, color } = validation.data;

    const { data: event, error } = await supabase
      .from('events')
      .insert({
        user_id: user.id,
        title: title.trim(),
        event_date,
        description: description?.trim() || null,
        color: color ?? '#3b82f6',
      })
      .select()
      .single();

    if (error) {
      console.error('POST /api/events error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, data: event as CalendarEvent },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
