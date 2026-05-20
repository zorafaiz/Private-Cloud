/**
 * URL Shortener Worker (s.domainkamu.com)
 *
 * D1 schema:
 * CREATE TABLE links (
 *   code TEXT PRIMARY KEY,
 *   url TEXT NOT NULL,
 *   created_at TEXT DEFAULT (datetime('now')),
 *   clicks INTEGER DEFAULT 0
 * );
 *
 * Routes:
 *   GET  /:code           → 301 redirect, increment clicks
 *   POST /api/create      → create link (Bearer AUTH_SECRET)
 *   GET  /api/stats/:code → click count (Bearer AUTH_SECRET)
 */

import { Router, type IRequest } from 'itty-router';
import { customAlphabet } from 'nanoid';

interface Env {
  DB: D1Database;
  AUTH_SECRET: string;
  /** Public shortener origin, e.g. https://s.domainkamu.com */
  SHORTENER_ORIGIN?: string;
}

interface LinkRow {
  code: string;
  url: string;
  created_at: string;
  clicks: number;
}

interface CreateLinkBody {
  url?: string;
  customCode?: string;
}

interface CreateLinkResponse {
  success: boolean;
  data?: {
    code: string;
    url: string;
    shortUrl: string;
    created_at: string;
    clicks: number;
  };
  error?: string;
}

interface StatsResponse {
  success: boolean;
  data?: { code: string; clicks: number; url: string };
  error?: string;
}

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CODE_LENGTH = 6;
const generateCode = customAlphabet(ALPHABET, CODE_LENGTH);

const RESERVED_CODES = new Set(['api', 'create', 'stats', 'admin', 'login']);

const CORS_METHODS = 'GET, POST, OPTIONS';
const CORS_HEADERS = 'Content-Type, Authorization';

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': CORS_METHODS,
    'Access-Control-Allow-Headers': CORS_HEADERS,
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(), ...extraHeaders },
  });
}

function getOrigin(env: Env, request: Request): string {
  if (env.SHORTENER_ORIGIN) {
    return env.SHORTENER_ORIGIN.replace(/\/$/, '');
  }
  const url = new URL(request.url);
  return url.origin;
}

function authenticate(request: IRequest, env: Env): Response | null {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token || token !== env.AUTH_SECRET) {
    return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
  }
  return null;
}

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function isValidCustomCode(code: string): boolean {
  return /^[a-zA-Z0-9]{4,12}$/.test(code);
}

function isReservedCode(code: string): boolean {
  return RESERVED_CODES.has(code.toLowerCase());
}

type InsertResult = 'ok' | 'duplicate' | 'error';

async function insertLink(env: Env, code: string, url: string): Promise<InsertResult> {
  try {
    await env.DB.prepare(
      'INSERT INTO links (code, url, created_at, clicks) VALUES (?, ?, datetime(\'now\'), 0)',
    )
      .bind(code, url)
      .run();
    return 'ok';
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('UNIQUE') || message.includes('unique')) {
      return 'duplicate';
    }
    console.error('insertLink error:', message);
    return 'error';
  }
}

async function fetchLinkRow(env: Env, code: string): Promise<LinkRow | null> {
  return env.DB.prepare('SELECT code, url, created_at, clicks FROM links WHERE code = ?')
    .bind(code)
    .first<LinkRow>();
}

function buildCreateResponse(
  row: LinkRow,
  origin: string,
): CreateLinkResponse {
  return {
    success: true,
    data: {
      code: row.code,
      url: row.url,
      shortUrl: `${origin}/${row.code}`,
      created_at: row.created_at,
      clicks: row.clicks ?? 0,
    },
  };
}

const router = Router();

router.options('*', (): Response => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});

/**
 * POST /api/create
 */
router.post('/api/create', async (request: IRequest, env: Env): Promise<Response> => {
  const authError = authenticate(request, env);
  if (authError) {
    return authError;
  }

  let body: CreateLinkBody;
  try {
    body = (await request.json()) as CreateLinkBody;
  } catch {
    return jsonResponse({ success: false, error: 'Request body tidak valid' }, 400);
  }

  const url = body.url ? normalizeUrl(body.url) : null;
  if (!url) {
    return jsonResponse(
      { success: false, error: 'URL harus valid dan menggunakan http atau https' },
      400,
    );
  }

  const origin = getOrigin(env, request);

  if (body.customCode) {
    const code = body.customCode.trim();
    if (!isValidCustomCode(code)) {
      return jsonResponse(
        { success: false, error: 'Kode kustom harus alfanumerik, 4-12 karakter' },
        400,
      );
    }
    if (isReservedCode(code)) {
      return jsonResponse({ success: false, error: 'Kode tidak diizinkan (reserved)' }, 400);
    }

    const insertResult = await insertLink(env, code, url);
    if (insertResult === 'duplicate') {
      return jsonResponse({ success: false, error: 'Kode sudah digunakan' }, 409);
    }
    if (insertResult === 'error') {
      return jsonResponse({ success: false, error: 'Gagal menyimpan link' }, 500);
    }

    const row = await fetchLinkRow(env, code);
    if (!row) {
      return jsonResponse({ success: false, error: 'Gagal memuat link baru' }, 500);
    }
    return jsonResponse(buildCreateResponse(row, origin), 201);
  }

  const maxAttempts = 3;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const code = generateCode();
    if (isReservedCode(code)) {
      continue;
    }

    const insertResult = await insertLink(env, code, url);
    if (insertResult === 'duplicate') {
      continue;
    }
    if (insertResult === 'error') {
      return jsonResponse({ success: false, error: 'Gagal menyimpan link' }, 500);
    }

    const row = await fetchLinkRow(env, code);
    if (!row) {
      return jsonResponse({ success: false, error: 'Gagal memuat link baru' }, 500);
    }
    return jsonResponse(buildCreateResponse(row, origin), 201);
  }

  return jsonResponse(
    { success: false, error: 'Gagal membuat kode unik setelah beberapa percobaan' },
    500,
  );
});

/**
 * GET /api/stats/:code
 */
router.get('/api/stats/:code', async (request: IRequest, env: Env): Promise<Response> => {
  const authError = authenticate(request, env);
  if (authError) {
    return authError;
  }

  const code = request.params?.code;
  if (!code || typeof code !== 'string') {
    return jsonResponse({ success: false, error: 'Kode tidak valid' }, 400);
  }

  const row = await env.DB.prepare(
    'SELECT code, url, clicks FROM links WHERE code = ?',
  )
    .bind(code)
    .first<LinkRow>();

  if (!row) {
    return jsonResponse({ success: false, error: 'Link tidak ditemukan' }, 404);
  }

  const response: StatsResponse = {
    success: true,
    data: { code: row.code, clicks: row.clicks ?? 0, url: row.url },
  };
  return jsonResponse(response);
});

/**
 * GET /:code — redirect
 */
router.get('/:code', async (request: IRequest, env: Env): Promise<Response> => {
  const code = request.params?.code;
  if (!code || typeof code !== 'string') {
    return jsonResponse({ success: false, error: 'Kode tidak valid' }, 400);
  }

  if (code === 'api' || code.startsWith('api/')) {
    return jsonResponse({ success: false, error: 'Route tidak ditemukan' }, 404);
  }

  const row = await env.DB.prepare('SELECT url FROM links WHERE code = ?')
    .bind(code)
    .first<{ url: string }>();

  if (!row?.url) {
    return jsonResponse({ success: false, error: 'Link tidak ditemukan' }, 404);
  }

  await env.DB.prepare('UPDATE links SET clicks = clicks + 1 WHERE code = ?')
    .bind(code)
    .run();

  return new Response(null, {
    status: 301,
    headers: {
      Location: row.url,
      'Cache-Control': 'public, max-age=31536000',
    },
  });
});

router.all('*', (): Response => {
  return jsonResponse({ success: false, error: 'Route tidak ditemukan' }, 404);
});

/** Rate limiting stub — extend with KV/Durable Object if needed. */
function checkRateLimit(_request: IRequest): Response | null {
  return null;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const limited = checkRateLimit(request as IRequest);
    if (limited) {
      return Promise.resolve(limited);
    }
    return router.handle(request, env, ctx);
  },
};
