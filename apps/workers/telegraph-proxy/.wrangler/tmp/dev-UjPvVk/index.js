var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-Y74nym/checked-fetch.js
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

// .wrangler/tmp/bundle-Y74nym/strip-cf-connecting-ip-header.js
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

// src/index.ts
var TELEGRAPH_UPLOAD_URL = "https://telegra.ph/upload";
var ALLOWED_IMAGE_TYPES = /* @__PURE__ */ new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
]);
function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
var router = t();
router.options("*", (request, env) => {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(env.ALLOWED_ORIGIN)
  });
});
router.get("/health", (_request, env) => {
  return Response.json(
    { success: true, message: "Telegraph proxy is running" },
    { headers: corsHeaders(env.ALLOWED_ORIGIN) }
  );
});
router.post("/upload", async (request, env) => {
  const headers = corsHeaders(env.ALLOWED_ORIGIN);
  const maxFileSize = parseInt(env.MAX_FILE_SIZE, 10) || 5 * 1024 * 1024;
  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, error: "Request harus berupa multipart/form-data" },
      { status: 400, headers }
    );
  }
  const file = formData.get("file");
  if (!file || typeof file === "string") {
    return Response.json(
      { success: false, error: "File gambar diperlukan" },
      { status: 400, headers }
    );
  }
  const imageFile = file;
  if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
    return Response.json(
      {
        success: false,
        error: `Tipe file tidak didukung: ${imageFile.type}. Gunakan JPEG, PNG, GIF, atau WebP.`
      },
      { status: 400, headers }
    );
  }
  if (imageFile.size > maxFileSize) {
    const maxMB = Math.round(maxFileSize / (1024 * 1024));
    return Response.json(
      { success: false, error: `Ukuran file melebihi batas ${maxMB}MB` },
      { status: 400, headers }
    );
  }
  const telegraphForm = new FormData();
  telegraphForm.append("file", imageFile, imageFile.name);
  try {
    const telegraphResponse = await fetch(TELEGRAPH_UPLOAD_URL, {
      method: "POST",
      body: telegraphForm
    });
    if (!telegraphResponse.ok) {
      return Response.json(
        { success: false, error: "Telegraph API mengembalikan error" },
        { status: telegraphResponse.status, headers }
      );
    }
    const result = await telegraphResponse.json();
    if (!Array.isArray(result) || result.length === 0) {
      return Response.json(
        { success: false, error: "Respons Telegraph tidak valid" },
        { status: 502, headers }
      );
    }
    const firstResult = result[0];
    if (firstResult.error) {
      return Response.json(
        { success: false, error: firstResult.error },
        { status: 400, headers }
      );
    }
    if (!firstResult.src) {
      return Response.json(
        { success: false, error: "Telegraph tidak mengembalikan URL gambar" },
        { status: 502, headers }
      );
    }
    return Response.json(
      {
        success: true,
        data: {
          url: `https://telegra.ph${firstResult.src}`,
          src: firstResult.src
        }
      },
      { status: 200, headers }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gagal mengunggah ke Telegraph";
    return Response.json(
      { success: false, error: message },
      { status: 500, headers }
    );
  }
});
router.all("*", (_request, env) => {
  return Response.json(
    { success: false, error: "Route tidak ditemukan" },
    { status: 404, headers: corsHeaders(env.ALLOWED_ORIGIN) }
  );
});
var src_default = {
  fetch: (request, env, ctx) => router.handle(request, env, ctx)
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

// .wrangler/tmp/bundle-Y74nym/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-Y74nym/middleware-loader.entry.ts
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
