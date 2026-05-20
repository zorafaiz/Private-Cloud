var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-QJThid/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-QJThid/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// ../../../node_modules/.pnpm/itty-router@5.0.23/node_modules/itty-router/index.mjs
var t = /* @__PURE__ */ __name(({ base: e = "", routes: t2 = [], ...o2 } = {}) => ({ __proto__: new Proxy({}, { get: (o3, r2, a, s) => (o4, ...n) => t2.push([r2.toUpperCase?.(), RegExp(`^${(s = (e + o4).replace(/\/+(\/|$)/g, "$1")).replace(/(\/?\.?):(\w+)\+/g, "($1(?<$2>*))").replace(/(\/?\.?):(\w+)/g, "($1(?<$2>[^$1/]+?))").replace(/\./g, "\\.").replace(/(\/?)\*/g, "($1.*)?")}/*$`), n, s]) && a }), routes: t2, ...o2, async fetch(e2, ...r2) {
  let a, s, n = new URL(e2.url), c = e2.query = { __proto__: null };
  for (let [e3, t3] of n.searchParams)
    c[e3] = c[e3] ? [].concat(c[e3], t3) : t3;
  e:
    try {
      for (let t3 of o2.before || [])
        if (null != (a = await t3(e2.proxy ?? e2, ...r2)))
          break e;
      t:
        for (let [o3, c2, l, i] of t2)
          if ((o3 == e2.method || "ALL" == o3) && (s = n.pathname.match(c2))) {
            e2.params = s.groups || {}, e2.route = i;
            for (let t3 of l)
              if (null != (a = await t3(e2.proxy ?? e2, ...r2)))
                break t;
          }
    } catch (t3) {
      if (!o2.catch)
        throw t3;
      a = await o2.catch(t3, e2.proxy ?? e2, ...r2);
    }
  try {
    for (let t3 of o2.finally || [])
      a = await t3(a, e2.proxy ?? e2, ...r2) ?? a;
  } catch (t3) {
    if (!o2.catch)
      throw t3;
    a = await o2.catch(t3, e2.proxy ?? e2, ...r2);
  }
  return a;
} }), "t");
var o = /* @__PURE__ */ __name((e = "text/plain; charset=utf-8", t2) => (o2, r2 = {}) => {
  if (void 0 === o2 || o2 instanceof Response)
    return o2;
  const a = new Response(t2?.(o2) ?? o2, r2.url ? void 0 : r2);
  return a.headers.set("content-type", e), a;
}, "o");
var r = o("application/json; charset=utf-8", JSON.stringify);
var p = o("text/plain; charset=utf-8", String);
var f = o("text/html");
var u = o("image/jpeg");
var h = o("image/png");
var g = o("image/webp");

// ../../../node_modules/.pnpm/nanoid@5.1.11/node_modules/nanoid/index.browser.js
var random = /* @__PURE__ */ __name((bytes) => crypto.getRandomValues(new Uint8Array(bytes)), "random");
var customRandom = /* @__PURE__ */ __name((alphabet, defaultSize, getRandom) => {
  let safeByteCutoff = 256 - 256 % alphabet.length;
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1;
    return (size = defaultSize) => {
      if (!size)
        return "";
      let id = "";
      while (true) {
        let bytes = getRandom(size);
        let j = size;
        while (j--) {
          id += alphabet[bytes[j] & mask];
          if (id.length >= size)
            return id;
        }
      }
    };
  }
  let step = Math.ceil(1.6 * 256 * defaultSize / safeByteCutoff);
  return (size = defaultSize) => {
    if (!size)
      return "";
    let id = "";
    while (true) {
      let bytes = getRandom(step);
      let j = step;
      while (j--) {
        if (bytes[j] < safeByteCutoff) {
          id += alphabet[bytes[j] % alphabet.length];
          if (id.length >= size)
            return id;
        }
      }
    }
  };
}, "customRandom");
var customAlphabet = /* @__PURE__ */ __name((alphabet, size = 21) => customRandom(alphabet, size | 0, random), "customAlphabet");

// src/index.ts
var ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var CODE_LENGTH = 6;
var generateCode = customAlphabet(ALPHABET, CODE_LENGTH);
var RESERVED_CODES = /* @__PURE__ */ new Set(["api", "create", "stats", "admin", "login"]);
var CORS_METHODS = "GET, POST, OPTIONS";
var CORS_HEADERS = "Content-Type, Authorization";
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": CORS_METHODS,
    "Access-Control-Allow-Headers": CORS_HEADERS,
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(body, status = 200, extraHeaders) {
  return Response.json(body, {
    status,
    headers: { ...corsHeaders(), ...extraHeaders }
  });
}
__name(jsonResponse, "jsonResponse");
function getOrigin(env, request) {
  if (env.SHORTENER_ORIGIN) {
    return env.SHORTENER_ORIGIN.replace(/\/$/, "");
  }
  const url = new URL(request.url);
  return url.origin;
}
__name(getOrigin, "getOrigin");
function authenticate(request, env) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token || token !== env.AUTH_SECRET) {
    return jsonResponse({ success: false, error: "Unauthorized" }, 401);
  }
  return null;
}
__name(authenticate, "authenticate");
function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}
__name(normalizeUrl, "normalizeUrl");
function isValidCustomCode(code) {
  return /^[a-zA-Z0-9]{4,12}$/.test(code);
}
__name(isValidCustomCode, "isValidCustomCode");
function isReservedCode(code) {
  return RESERVED_CODES.has(code.toLowerCase());
}
__name(isReservedCode, "isReservedCode");
async function insertLink(env, code, url) {
  try {
    await env.DB.prepare(
      "INSERT INTO links (code, url, created_at, clicks) VALUES (?, ?, datetime('now'), 0)"
    ).bind(code, url).run();
    return "ok";
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("UNIQUE") || message.includes("unique")) {
      return "duplicate";
    }
    console.error("insertLink error:", message);
    return "error";
  }
}
__name(insertLink, "insertLink");
async function fetchLinkRow(env, code) {
  return env.DB.prepare("SELECT code, url, created_at, clicks FROM links WHERE code = ?").bind(code).first();
}
__name(fetchLinkRow, "fetchLinkRow");
function buildCreateResponse(row, origin) {
  return {
    success: true,
    data: {
      code: row.code,
      url: row.url,
      shortUrl: `${origin}/${row.code}`,
      created_at: row.created_at,
      clicks: row.clicks ?? 0
    }
  };
}
__name(buildCreateResponse, "buildCreateResponse");
var router = t();
router.options("*", () => {
  return new Response(null, { status: 204, headers: corsHeaders() });
});
router.post("/api/create", async (request, env) => {
  const authError = authenticate(request, env);
  if (authError) {
    return authError;
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ success: false, error: "Request body tidak valid" }, 400);
  }
  const url = body.url ? normalizeUrl(body.url) : null;
  if (!url) {
    return jsonResponse(
      { success: false, error: "URL harus valid dan menggunakan http atau https" },
      400
    );
  }
  const origin = getOrigin(env, request);
  if (body.customCode) {
    const code = body.customCode.trim();
    if (!isValidCustomCode(code)) {
      return jsonResponse(
        { success: false, error: "Kode kustom harus alfanumerik, 4-12 karakter" },
        400
      );
    }
    if (isReservedCode(code)) {
      return jsonResponse({ success: false, error: "Kode tidak diizinkan (reserved)" }, 400);
    }
    const insertResult = await insertLink(env, code, url);
    if (insertResult === "duplicate") {
      return jsonResponse({ success: false, error: "Kode sudah digunakan" }, 409);
    }
    if (insertResult === "error") {
      return jsonResponse({ success: false, error: "Gagal menyimpan link" }, 500);
    }
    const row = await fetchLinkRow(env, code);
    if (!row) {
      return jsonResponse({ success: false, error: "Gagal memuat link baru" }, 500);
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
    if (insertResult === "duplicate") {
      continue;
    }
    if (insertResult === "error") {
      return jsonResponse({ success: false, error: "Gagal menyimpan link" }, 500);
    }
    const row = await fetchLinkRow(env, code);
    if (!row) {
      return jsonResponse({ success: false, error: "Gagal memuat link baru" }, 500);
    }
    return jsonResponse(buildCreateResponse(row, origin), 201);
  }
  return jsonResponse(
    { success: false, error: "Gagal membuat kode unik setelah beberapa percobaan" },
    500
  );
});
router.get("/api/stats/:code", async (request, env) => {
  const authError = authenticate(request, env);
  if (authError) {
    return authError;
  }
  const code = request.params?.code;
  if (!code || typeof code !== "string") {
    return jsonResponse({ success: false, error: "Kode tidak valid" }, 400);
  }
  const row = await env.DB.prepare(
    "SELECT code, url, clicks FROM links WHERE code = ?"
  ).bind(code).first();
  if (!row) {
    return jsonResponse({ success: false, error: "Link tidak ditemukan" }, 404);
  }
  const response = {
    success: true,
    data: { code: row.code, clicks: row.clicks ?? 0, url: row.url }
  };
  return jsonResponse(response);
});
router.get("/:code", async (request, env) => {
  const code = request.params?.code;
  if (!code || typeof code !== "string") {
    return jsonResponse({ success: false, error: "Kode tidak valid" }, 400);
  }
  if (code === "api" || code.startsWith("api/")) {
    return jsonResponse({ success: false, error: "Route tidak ditemukan" }, 404);
  }
  const row = await env.DB.prepare("SELECT url FROM links WHERE code = ?").bind(code).first();
  if (!row?.url) {
    return jsonResponse({ success: false, error: "Link tidak ditemukan" }, 404);
  }
  await env.DB.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ?").bind(code).run();
  return new Response(null, {
    status: 301,
    headers: {
      Location: row.url,
      "Cache-Control": "public, max-age=31536000"
    }
  });
});
router.all("*", () => {
  return jsonResponse({ success: false, error: "Route tidak ditemukan" }, 404);
});
function checkRateLimit(_request) {
  return null;
}
__name(checkRateLimit, "checkRateLimit");
var src_default = {
  fetch(request, env, ctx) {
    const limited = checkRateLimit(request);
    if (limited) {
      return Promise.resolve(limited);
    }
    return router.handle(request, env, ctx);
  }
};

// ../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260520.1/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260520.1/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-QJThid/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// ../../../node_modules/.pnpm/wrangler@3.114.17_@cloudflare+workers-types@4.20260520.1/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-QJThid/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
