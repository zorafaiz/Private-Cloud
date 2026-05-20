/**
 * File download API route.
 * Generates a presigned download URL for a file from R2.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePresignedDownloadUrl } from '@/lib/r2';
import type { ApiResponse } from '@private-cloud/shared';

interface DownloadUrlResponse {
  downloadUrl: string;
  filename: string;
}

/**
 * GET /api/files/download?key=<r2Key>
 * Returns a presigned download URL for the specified file.
 */
export async function GET(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<DownloadUrlResponse>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Tidak terautentikasi' },
      { status: 401 },
    );
  }

  const key = request.nextUrl.searchParams.get('key');

  if (!key) {
    return NextResponse.json(
      { success: false, error: 'Key file diperlukan' },
      { status: 400 },
    );
  }

  // Verify the file belongs to the user
  const { data: file, error: fetchError } = await supabase
    .from('files')
    .select('filename')
    .eq('r2_key', key)
    .eq('user_id', user.id)
    .single();

  if (fetchError || !file) {
    return NextResponse.json(
      { success: false, error: 'File tidak ditemukan atau akses ditolak' },
      { status: 404 },
    );
  }

  try {
    const downloadUrl = await generatePresignedDownloadUrl(key);

    return NextResponse.json({
      success: true,
      data: {
        downloadUrl,
        filename: file.filename,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat URL unduhan';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
