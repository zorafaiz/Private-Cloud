/**
 * Notes API endpoints for CRUD operations.
 * GET: List notes with search, pagination, and sorting
 * POST: Create a new note
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createNoteSchema } from '@private-cloud/shared';
import type { Note, PaginatedResponse } from '@private-cloud/shared';

/** Escape `%`, `_`, and `\` for Postgres ILIKE patterns inside PostgREST `.or()` filters. */
function escapeIlikePattern(raw: string): string {
  return raw.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

function emptyPaginatedError(
  error: string,
  status: number,
  page = 0,
  per_page = 0,
): NextResponse<PaginatedResponse<Note>> {
  return NextResponse.json(
    {
      success: false,
      error,
      data: [],
      page,
      per_page,
      total: 0,
    },
    { status },
  );
}

/**
 * GET /api/notes
 * List all notes for authenticated user with search, pagination, and sorting.
 * Query params:
 *   - search: keyword to search in title and content (ILIKE)
 *   - page: page number (default: 1)
 *   - per_page: items per page (default: 20, max: 100)
 *   - sort: sort field and direction (default: "updated_at.desc")
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<PaginatedResponse<Note>>> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return emptyPaginatedError('Unauthorized', 401);
    }

    const url = new URL(request.url);
    const searchRaw = url.searchParams.get('search') || '';
    const pageParam = parseInt(url.searchParams.get('page') || '1', 10);
    const perPageParam = Math.min(
      parseInt(url.searchParams.get('per_page') || '20', 10),
      100,
    );
    const sortParam = url.searchParams.get('sort') || 'updated_at.desc';

    const [sortFieldRaw, sortDirectionRaw] = sortParam.split('.');
    const isAscending = sortDirectionRaw === 'asc';

    const page = Math.max(pageParam, 1);
    const perPage = Math.max(perPageParam, 1);
    const offset = (page - 1) * perPage;

    let query = supabase
      .from('notes')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    const trimmedSearch = searchRaw.trim();
    if (trimmedSearch) {
      const safe = escapeIlikePattern(trimmedSearch);
      query = query.or(`title.ilike.%${safe}%,content.ilike.%${safe}%`);
    }

    const validSortFields = ['created_at', 'updated_at', 'title'] as const;
    const field = validSortFields.includes(sortFieldRaw as (typeof validSortFields)[number])
      ? sortFieldRaw
      : 'updated_at';
    query = query.order(field, { ascending: isAscending });

    query = query.range(offset, offset + perPage - 1);

    const { data, error, count } = await query;

    if (error) {
      console.error('Database error:', error);
      return emptyPaginatedError('Failed to fetch notes', 500, page, perPage);
    }

    const response: PaginatedResponse<Note> = {
      success: true,
      data: (data ?? []) as Note[],
      page,
      per_page: perPage,
      total: count ?? 0,
    };

    return NextResponse.json(response);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('GET /api/notes error:', message);
    return emptyPaginatedError(message, 500);
  }
}

/**
 * POST /api/notes
 * Create a new note.
 * Body: validated with createNoteSchema
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createNoteSchema.safeParse(body);

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

    const { data, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: title.trim(),
        content: content ?? '',
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data as Note }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    console.error('POST /api/notes error:', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
