/**
 * Proxy click stats from the shortener Worker.
 * GET /api/shorten/stats/:code
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ApiResponse } from '@private-cloud/shared';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } },
): Promise<NextResponse<ApiResponse<{ code: string; clicks: number; url: string }>>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const code = params.code;
    const workerUrl = process.env.SHORTENER_WORKER_URL?.replace(/\/$/, '');
    const workerSecret = process.env.SHORTENER_SECRET;

    if (!workerUrl || !workerSecret) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi shortener tidak lengkap' },
        { status: 500 },
      );
    }

    const workerResponse = await fetch(`${workerUrl}/api/stats/${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${workerSecret}` },
    });

    const result = (await workerResponse.json()) as ApiResponse<{
      code: string;
      clicks: number;
      url: string;
    }>;

    return NextResponse.json(result, { status: workerResponse.status });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
