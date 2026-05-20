/**
 * Telegraph.ph Proxy Worker
 *
 * Proxies image uploads to Telegraph.ph API to avoid CORS restrictions.
 * Validates file type and size before forwarding.
 *
 * Routes:
 *   POST /upload  - Upload an image to Telegraph.ph
 *   GET  /health  - Health check endpoint
 */

import { Router, IRequest } from 'itty-router';

interface Env {
  ALLOWED_ORIGIN: string;
  MAX_FILE_SIZE: string;
}

const TELEGRAPH_UPLOAD_URL = 'https://telegra.ph/upload';

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]);

/**
 * Creates CORS headers for responses.
 */
function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

const router = Router();

/**
 * OPTIONS - CORS preflight handler
 */
router.options('*', (request: IRequest, env: Env): Response => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env.ALLOWED_ORIGIN),
  });
});

/**
 * GET /health
 * Returns a simple health check response.
 */
router.get('/health', (_request: IRequest, env: Env): Response => {
  return Response.json(
    { success: true, message: 'Telegraph proxy is running' },
    { headers: corsHeaders(env.ALLOWED_ORIGIN) },
  );
});

/**
 * POST /upload
 * Accepts a multipart form with an image file and forwards it to Telegraph.ph.
 */
router.post('/upload', async (request: IRequest, env: Env): Promise<Response> => {
  const headers = corsHeaders(env.ALLOWED_ORIGIN);
  const maxFileSize = parseInt(env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, error: 'Request harus berupa multipart/form-data' },
      { status: 400, headers },
    );
  }

  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return Response.json(
      { success: false, error: 'File gambar diperlukan' },
      { status: 400, headers },
    );
  }

  const imageFile = file as unknown as File;

  // Validate file type
  if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
    return Response.json(
      {
        success: false,
        error: `Tipe file tidak didukung: ${imageFile.type}. Gunakan JPEG, PNG, GIF, atau WebP.`,
      },
      { status: 400, headers },
    );
  }

  // Validate file size
  if (imageFile.size > maxFileSize) {
    const maxMB = Math.round(maxFileSize / (1024 * 1024));
    return Response.json(
      { success: false, error: `Ukuran file melebihi batas ${maxMB}MB` },
      { status: 400, headers },
    );
  }

  // Forward to Telegraph.ph
  const telegraphForm = new FormData();
  telegraphForm.append('file', imageFile, imageFile.name);

  try {
    const telegraphResponse = await fetch(TELEGRAPH_UPLOAD_URL, {
      method: 'POST',
      body: telegraphForm,
    });

    if (!telegraphResponse.ok) {
      return Response.json(
        { success: false, error: 'Telegraph API mengembalikan error' },
        { status: telegraphResponse.status, headers },
      );
    }

    const result = await telegraphResponse.json() as Array<{ src?: string; error?: string }>;

    if (!Array.isArray(result) || result.length === 0) {
      return Response.json(
        { success: false, error: 'Respons Telegraph tidak valid' },
        { status: 502, headers },
      );
    }

    const firstResult = result[0];

    if (firstResult.error) {
      return Response.json(
        { success: false, error: firstResult.error },
        { status: 400, headers },
      );
    }

    if (!firstResult.src) {
      return Response.json(
        { success: false, error: 'Telegraph tidak mengembalikan URL gambar' },
        { status: 502, headers },
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          url: `https://telegra.ph${firstResult.src}`,
          src: firstResult.src,
        },
      },
      { status: 200, headers },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Gagal mengunggah ke Telegraph';
    return Response.json(
      { success: false, error: message },
      { status: 500, headers },
    );
  }
});

/**
 * Catch-all: return 404 for unmatched routes.
 */
router.all('*', (_request: IRequest, env: Env): Response => {
  return Response.json(
    { success: false, error: 'Route tidak ditemukan' },
    { status: 404, headers: corsHeaders(env.ALLOWED_ORIGIN) },
  );
});

export default {
  fetch: (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> =>
    router.handle(request, env, ctx),
};
