import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { createOAuthCallbackHandler } from "./kimi/auth";
import { handleOAuthCallback } from "./oauth-handlers";
import { Paths } from "@contracts/constants";
import {
  getSecurityHeaders,
  checkRateLimit,
  getCorsConfig,
  logAudit,
  getClientIP,
  STRICT_RATE_LIMIT,
} from "./security";

const app = new Hono<{ Bindings: HttpBindings }>();

// Security headers on every response
app.use(async (c, next) => {
  await next();
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value);
  }
});

// CORS
app.use("/api/*", cors(getCorsConfig()));

// Strip trailing slashes
app.use(trimTrailingSlash());

// Global rate limiting
app.use("/api/*", async (c, next) => {
  const isAuthEndpoint =
    c.req.path.includes("localAuth.login") ||
    c.req.path.includes("localAuth.register") ||
    c.req.path.includes("auth.");

  const config = isAuthEndpoint ? STRICT_RATE_LIMIT : undefined;
  const result = checkRateLimit(c.req.raw, config);

  if (!result.allowed) {
    logAudit({
      ip: getClientIP(c.req.raw),
      method: c.req.method,
      path: c.req.path,
      action: "rate_limited",
      details: `Retry after ${Math.ceil((result.resetAt - Date.now()) / 1000)}s`,
    });
    return c.json(
      {
        error: "Too many requests",
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      },
      429
    );
  }

  await next();
});

// Audit logging for mutations
app.use("/api/trpc/*", async (c, next) => {
  await next();
  // Log all mutation responses and any errors
  if (c.req.method === "POST" && c.error) {
    logAudit({
      ip: getClientIP(c.req.raw),
      method: c.req.method,
      path: c.req.path,
      action: "api_error",
      details: `${c.error.name}: ${c.error.message}`.substring(0, 200),
    });
  }
});

// Body size limit (50MB for image uploads)
app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

// OAuth callbacks
app.get(Paths.oauthCallback, createOAuthCallbackHandler());
app.get("/api/oauth/callback/google", (c) => handleOAuthCallback(c, "google"));
app.get("/api/oauth/callback/x", (c) => handleOAuthCallback(c, "x"));
app.get("/api/oauth/callback/github", (c) => handleOAuthCallback(c, "github"));

// Health check (no auth needed)
app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    timestamp: Date.now(),
    environment: env.isProduction ? "production" : "development",
  })
);

// tRPC handler
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
    onError: (opts) => {
      console.error(
        `[tRPC] ${opts.error.code} | ${opts.path} | ${opts.error.message}`
      );
    },
  });
});

// Catch-all for unknown API routes
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { serveStaticFiles } = await import("./lib/vite");
  serveStaticFiles(app);

  const port = parseInt(process.env.PORT || "3000");
  serve({ fetch: app.fetch, port }, () => {
    console.log(`[VAULT] Server running on http://localhost:${port}/`);
    console.log(`[VAULT] Security headers: ENABLED`);
    console.log(`[VAULT] Rate limiting: ENABLED`);
    console.log(`[VAULT] CORS: ENABLED`);
    console.log(`[VAULT] Audit logging: ENABLED`);
  });
}
