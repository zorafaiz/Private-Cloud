/**
 * Presigned URL API route.
 * Generates presigned URLs for direct file upload to R2.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generatePresignedUploadUrl } from '@/lib/r2';
import { presignedUrlRequestSchema } from '@/lib/validators';
import type { ApiResponse, FileMetadata } from '@private-cloud/shared';
import { randomUUID } from 'crypto';

interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
  fileId: string;
}

/**
 * POST /api/files/presigned
 * Generates a presigned URL for uploading a file to R2 and creates metadata entry.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<PresignedUrlResponse>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Tidak terautentikasi' },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request body tidak valid' },
      { status: 400 },
    );
  }

  // Validate input
  const parsed = presignedUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: parsed.error.errors.map((e) => e.message).join(', '),
      },
      { status: 400 },
    );
  }

  const { filename, contentType, size } = parsed.data;

  try {
    // Generate presigned upload URL
    const { url: uploadUrl, key } = await generatePresignedUploadUrl(
      user.id,
      filename,
      contentType,
      size,
    );

    // Create placeholder file record - will be updated after successful upload
    const fileId = randomUUID();
    const { error: insertError } = await supabase.from('files').insert({
      id: fileId,
      user_id: user.id,
      filename,
      r2_key: key,
      size_bytes: size,
      mime_type: contentType,
      uploaded_at: new Date().toISOString(),
    });

    if (insertError) {
      return NextResponse.json(
        { success: false, error: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      data: { uploadUrl, key, fileId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal membuat URL presigned';
    const status = message.includes('melebihi batas') ? 413 : 500;
    return NextResponse.json(
      { success: false, error: message },
      { status },
    );
  }
}
