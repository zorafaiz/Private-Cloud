/**
 * Files API route.
 * Handles listing and deleting files from the cloud drive.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { deleteFromR2 } from '@/lib/r2';
import type { ApiResponse, FileMetadata, PaginatedResponse } from '@private-cloud/shared';

/**
 * GET /api/files?page=1&per_page=20
 * Lists files for the authenticated user with pagination.
 */
export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<FileMetadata>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Tidak terautentikasi', page: 0, per_page: 0, total: 0 },
      { status: 401 },
    );
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get('per_page') || '20', 10)));
  const offset = (page - 1) * perPage;

  // Get total count
  const { count, error: countError } = await supabase
    .from('files')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (countError) {
    return NextResponse.json(
      { success: false, error: countError.message, page, per_page: perPage, total: 0 },
      { status: 500 },
    );
  }

  // Get paginated files
  const { data: files, error: filesError } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', user.id)
    .order('uploaded_at', { ascending: false })
    .range(offset, offset + perPage - 1);

  if (filesError) {
    return NextResponse.json(
      { success: false, error: filesError.message, page, per_page: perPage, total: 0 },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    data: files as FileMetadata[],
    page,
    per_page: perPage,
    total: count ?? 0,
  });
}

/**
 * DELETE /api/files?id=<fileId>
 * Deletes a file by ID from both Supabase and R2.
 * Attempts to delete from R2 first, but will delete from DB even if R2 fails.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Tidak terautentikasi' },
      { status: 401 },
    );
  }

  const { searchParams } = request.nextUrl;
  const fileId = searchParams.get('id');

  if (!fileId) {
    return NextResponse.json(
      { success: false, error: 'ID file diperlukan' },
      { status: 400 },
    );
  }

  // Fetch the file record to get the R2 key
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('r2_key')
    .eq('id', fileId)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json(
      { success: false, error: 'File tidak ditemukan' },
      { status: 404 },
    );
  }

  // Delete from R2 (with best-effort approach - continue even if this fails)
  let r2Error: string | null = null;
  try {
    await deleteFromR2(file.r2_key);
  } catch (err) {
    r2Error = err instanceof Error ? err.message : 'Kesalahan menghapus dari R2';
    // Log but don't return error yet - we still want to delete from DB
    console.error('R2 deletion error:', r2Error);
  }

  // Delete from database
  const { error: deleteError } = await supabase
    .from('files')
    .delete()
    .eq('id', fileId)
    .eq('user_id', user.id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: deleteError.message },
      { status: 500 },
    );
  }

  // If DB delete succeeded but R2 had issues, still report success to user
  // (the file is effectively deleted from their perspective)
  return NextResponse.json({
    success: true,
    message: r2Error ? 'File dihapus dari database (R2 failed)' : 'File berhasil dihapus',
  });
}
