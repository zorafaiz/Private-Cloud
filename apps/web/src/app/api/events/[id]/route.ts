/**
 * Single event API route.
 * PUT: update event
 * DELETE: remove event
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateEventSchema } from '@private-cloud/shared';
import type { CalendarEvent } from '@private-cloud/shared';

/**
 * PUT /api/events/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const eventId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateEventSchema.safeParse(body);

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

    const updateData: Record<string, string | null> = {};
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (event_date !== undefined) {
      updateData.event_date = event_date;
    }
    if (description !== undefined) {
      updateData.description = description;
    }
    if (color !== undefined) {
      updateData.color = color;
    }

    const { data, error } = await supabase
      .from('events')
      .update(updateData)
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: data as CalendarEvent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/events/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const eventId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deletedRows, error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('DELETE /api/events error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete event' }, { status: 500 });
    }

    if (!deletedRows?.length) {
      return NextResponse.json({ success: false, error: 'Event not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
