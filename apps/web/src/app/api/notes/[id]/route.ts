/**
 * Note operations for individual notes.
 * GET: Fetch a single note
 * PUT: Update a note
 * DELETE: Delete a note
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateNoteSchema } from '@private-cloud/shared';
import type { Note } from '@private-cloud/shared';

/**
 * GET /api/notes/[id]
 * Get a single note by ID with ownership verification.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const noteId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data as Note,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('GET /api/notes/[id] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * PUT /api/notes/[id]
 * Update a note with ownership verification.
 * Partial update: only fields present in the validated body.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const noteId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateNoteSchema.safeParse(body);

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

    const { title, content } = validation.data;

    const updateData: Record<string, string> = {
      updated_at: new Date().toISOString(),
    };
    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (content !== undefined) {
      updateData.content = content;
    }

    const { data, error } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: data as Note,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('PUT /api/notes/[id] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

/**
 * DELETE /api/notes/[id]
 * Delete a note with ownership verification.
 * Returns 204 No Content on success.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const noteId = params.id;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data: deletedRows, error } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Delete note error:', error);
      return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 });
    }

    if (!deletedRows?.length) {
      return NextResponse.json({ success: false, error: 'Note not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('DELETE /api/notes/[id] error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
