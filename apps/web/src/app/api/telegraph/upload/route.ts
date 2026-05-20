/**
 * Telegraph Upload API route.
 * Proxies image uploads to the Telegraph proxy worker.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@private-cloud/shared';

interface TelegraphUploadResult {
  url: string;
  src: string;
}

/**
 * POST /api/telegraph/upload
 * Accepts an image file via FormData and forwards it to the Telegraph proxy worker.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<TelegraphUploadResult>>> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Tidak terautentikasi' },
      { status: 401 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Request harus berupa multipart/form-data' },
      { status: 400 },
    );
  }

  const file = formData.get('image');

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'File gambar diperlukan' },
      { status: 400 },
    );
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: 'Hanya file gambar yang diperbolehkan (JPEG, PNG, GIF, WebP)' },
      { status: 400 },
    );
  }

  // Validate file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json(
      { success: false, error: 'Ukuran gambar maksimal 5MB' },
      { status: 400 },
    );
  }

  const workerUrl = process.env.TELEGRAPH_WORKER_URL;

  if (!workerUrl) {
    return NextResponse.json(
      { success: false, error: 'Konfigurasi Telegraph proxy tidak lengkap' },
      { status: 500 },
    );
  }

  // Forward to Telegraph proxy worker
  const proxyFormData = new FormData();
  proxyFormData.append('file', file, file.name);

  try {
    const workerResponse = await fetch(`${workerUrl}/upload`, {
      method: 'POST',
      body: proxyFormData,
    });

    const result = (await workerResponse.json()) as ApiResponse<TelegraphUploadResult>;

    return NextResponse.json(result, { status: workerResponse.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengunggah ke Telegraph';
    return NextResponse.json(
      { success: false, error: message },
      { status: 502 },
    );
  }
}
