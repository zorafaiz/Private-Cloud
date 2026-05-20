/**
 * URL Shortener API — proxies creation to the Cloudflare Worker.
 * POST /api/shorten
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { shortenUrlSchema } from '@private-cloud/shared';
import type { ApiResponse, ShortenResult } from '@private-cloud/shared';

const WORKER_TIMEOUT_MS = 10_000;

/**
 * POST /api/shorten
 * Creates a shortened URL via Worker POST /api/create.
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<ShortenResult>>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Request body tidak valid' }, { status: 400 });
    }

    const parsed = shortenUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          message: parsed.error.errors.map((e) => e.message).join(', '),
        },
        { status: 400 },
      );
    }

    const workerUrl = process.env.SHORTENER_WORKER_URL?.replace(/\/$/, '');
    const workerSecret = process.env.SHORTENER_SECRET;
    const publicOrigin =
      process.env.SHORTENER_PUBLIC_URL?.replace(/\/$/, '') ?? workerUrl ?? 'https://s.domainkamu.com';

    if (!workerUrl || !workerSecret) {
      return NextResponse.json(
        { success: false, error: 'Konfigurasi shortener tidak lengkap' },
        { status: 500 },
      );
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);

    let workerResponse: Response;
    try {
      workerResponse = await fetch(`${workerUrl}/api/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${workerSecret}`,
        },
        body: JSON.stringify({
          url: parsed.data.url.trim(),
          customCode: parsed.data.customCode,
        }),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return NextResponse.json(
          { success: false, error: 'Layanan pemendek URL timeout' },
          { status: 504 },
        );
      }
      const message = err instanceof Error ? err.message : 'Gagal menghubungi layanan pemendek URL';
      return NextResponse.json({ success: false, error: message }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    let result: {
      success?: boolean;
      data?: {
        code: string;
        url: string;
        shortUrl?: string;
        clicks?: number;
        created_at?: string;
      };
      error?: string;
    };

    try {
      result = (await workerResponse.json()) as typeof result;
    } catch {
      return NextResponse.json(
        { success: false, error: 'Respons worker tidak valid' },
        { status: 502 },
      );
    }

    if (!workerResponse.ok || !result.success || !result.data?.code) {
      const status =
        workerResponse.status === 409
          ? 409
          : workerResponse.status >= 400 && workerResponse.status < 600
            ? workerResponse.status
            : 502;
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Gagal membuat link pendek',
        },
        { status },
      );
    }

    const code = result.data.code;
    const shortUrl = result.data.shortUrl ?? `${publicOrigin}/${code}`;

    return NextResponse.json(
      {
        success: true,
        data: {
          shortUrl,
          code,
          url: result.data.url,
          clicks: result.data.clicks ?? 0,
          created_at: result.data.created_at,
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
