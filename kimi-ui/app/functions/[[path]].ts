/**
 * Cloudflare Pages Functions Entry Point
 * Hono app running as a Cloudflare Worker with D1 database
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../src/server/router";
import { createContext } from "../src/server/context";
import { createOAuthCallbackHandler } from "../src/server/kimi/auth";
import { handleOAuthCallback } from "../src/server/oauth-handlers";
import {
  getSecurityHeaders,
  checkRateLimit,
  getCorsConfig,
  getClientIP,
  STRICT_RATE_LIMIT,
} from "../src/server/security";
import { createDb } from "../src/server/db-d1";
import { setD1Database } from "../api/queries/connection";

export interface Env {
  DB: D1Database;
  APP_SECRET: string;
  STRIPE_SECRET_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  COINBASE_API_KEY?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Initialize D1 and attach to context
app.use(async (c, next) => {
  // Set the D1 database for this request
  setD1Database(createDb(c.env.DB));
  // Also set APP_SECRET in env for downstream use
  (c.env as any).appSecret = c.env.APP_SECRET;
  await next();
});

// Security headers
app.use(async (c, next) => {
  await next();
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value);
  }
});

// CORS
app.use("/api/*", cors(getCorsConfig()));
app.use(trimTrailingSlash());

// Rate limiting
app.use("/api/*", async (c, next) => {
  const isAuthEndpoint =
    c.req.path.includes("localAuth.login") ||
    c.req.path.includes("localAuth.register") ||
    c.req.path.includes("auth.");
  const config = isAuthEndpoint ? STRICT_RATE_LIMIT : undefined;
  const result = checkRateLimit(c.req.raw, config);
  if (!result.allowed) {
    return c.json(
      { error: "Too many requests", retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000) },
      429
    );
  }
  await next();
});

// OAuth callbacks
app.get("/api/oauth/callback", createOAuthCallbackHandler());
app.get("/api/oauth/callback/google", (c) => handleOAuthCallback(c, "google"));
app.get("/api/oauth/callback/x", (c) => handleOAuthCallback(c, "x"));
app.get("/api/oauth/callback/github", (c) => handleOAuthCallback(c, "github"));

// Health check
app.get("/api/health", (c) =>
  c.json({ status: "ok", timestamp: Date.now(), environment: "production" })
);

// tRPC handler
app.use("/api/trpc/*", async (c) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: c.req.raw,
    router: appRouter,
    createContext,
    onError: (opts) => {
      console.error(`[tRPC] ${opts.error.code} | ${opts.path} | ${opts.error.message}`);
    },
  });
});

// Catch-all for API
app.all("/api/*", (c) => c.json({ error: "Not Found" }, 404));

export const onRequest = app.fetch;
