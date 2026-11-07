/**
 * Cloudflare Pages Functions Entry Point
 * Replaces Node.js boot.ts -- runs as a Cloudflare Worker with D1
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trimTrailingSlash } from "hono/trailing-slash";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "../api/router";
import { createContext } from "../api/context";
import { setDb } from "../api/queries/connection";
import { setCloudflareEnv } from "../api/lib/env";
import { checkRateLimit, getSecurityHeaders, getCorsConfig } from "../api/security";
import { env } from "../api/lib/env";
import { publicPublishableKey } from "../api/lib/redact";
import { applyStripeEvent, claimStripeEvent, markStripeEvent } from "../api/lib/stripe-events";
import { runScheduledMaintenance } from "../api/lib/scheduled-jobs";

type Env = Record<string, unknown> & {
  DB?: D1Database;
  thevault?: D1Database;
};

type AuthInput = {
  name?: string;
  email?: string;
  password?: string;
};

type StripeEvent = {
  id?: string;
  type?: string;
  data?: {
    object?: Record<string, any>;
  };
};

const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;
const STRIPE_ALLOWED_EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.expired",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
]);

function getD1(env: Env): D1Database | undefined {
  return env.DB || env.thevault;
}

function getRequestContext(c: any) {
  return {
    req: c.req.raw,
    resHeaders: new Headers(),
  };
}

function getPublicAuthError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Authentication failed";
}

function getEnvString(env: Env, name: string): string {
  const value = env[name];
  return typeof value === "string" ? value : "";
}

function parseStripeSignature(header: string): { timestamp: number; signatures: string[] } {
  const parts = header.split(",").map((part) => part.trim());
  const timestampPart = parts.find((part) => part.startsWith("t="));
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter(Boolean);

  const timestamp = Number(timestampPart?.slice(2));
  return { timestamp, signatures };
}

function hexToBytes(hex: string): Uint8Array {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2 !== 0) return new Uint8Array();
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function verifyStripeSignature(rawBody: string, signatureHeader: string, signingSecret: string) {
  const { timestamp, signatures } = parseStripeSignature(signatureHeader);
  if (!timestamp || signatures.length === 0) return { ok: false, error: "Invalid Stripe signature header" };

  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > STRIPE_WEBHOOK_TOLERANCE_SECONDS) {
    return { ok: false, error: "Stripe webhook timestamp outside tolerance" };
  }

  const expected = await hmacSha256Hex(signingSecret, `${timestamp}.${rawBody}`);
  const expectedBytes = hexToBytes(expected);
  const matched = signatures.some((sig) => timingSafeEqual(expectedBytes, hexToBytes(sig)));

  return matched ? { ok: true } : { ok: false, error: "Stripe signature verification failed" };
}

const app = new Hono<{ Bindings: Env }>();

// ─── Initialize environment & DB ───
app.use(async (c, next) => {
  setCloudflareEnv(c.env as unknown as Record<string, unknown>);
  (globalThis as any).__cfExecCtx = c.executionCtx;

  const db = getD1(c.env);
  if (db) {
    setDb(db);
  }

  await next();
});

// ─── Security headers ───
app.use(async (c, next) => {
  await next();
  if (env.securityHeadersEnabled) {
    const headers = getSecurityHeaders();
    for (const [key, value] of Object.entries(headers)) {
      c.header(key, value);
    }
  }
});

// ─── CORS ───
app.use("/api/*", cors(getCorsConfig()));

// ─── Trailing slash ───
app.use(trimTrailingSlash());

// ─── Rate limiting ───
app.use("/api/*", async (c, next) => {
  if (!env.rateLimitingEnabled || c.req.path === "/api/stripe/webhook") {
    await next();
    return;
  }

  const ip = c.req.header("cf-connecting-ip") || "unknown";
  const result = checkRateLimit(c.req.raw, {
    windowMs: 60_000,
    maxRequests: 60,
    keyGenerator: () => `api:${ip}`,
  });

  if (!result.allowed) {
    return c.json(
      {
        ok: false,
        error: "Too many requests",
        retryAfter: Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
      429,
    );
  }

  await next();
});

// ─── Health ───
app.get("/api/health", (c) =>
  c.json({
    ok: true,
    status: "ok",
    version: "v3.0.0",
    database: getD1(c.env) ? "bound" : "missing",
    timestamp: new Date().toISOString(),
  }),
);

// ─── DB Health ───
app.get("/api/db/health", async (c) => {
  const db = getD1(c.env);

  if (!db) {
    return c.json({ ok: false, error: "D1 binding missing" }, 500);
  }

  try {
    const result = await db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name LIMIT 100")
      .all();

    return c.json({ ok: true, tables: result.results ?? [] });
  } catch (err) {
    return c.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "D1 query failed",
      },
      500,
    );
  }
});

// ─── Stripe webhook ───
app.post("/api/stripe/webhook", async (c) => {
  const db = getD1(c.env);
  if (!db) return c.json({ ok: false, error: "D1 binding missing" }, 500);

  const signingSecret = getEnvString(c.env, "STRIPE_WEBHOOK_SECRET");
  if (!signingSecret) return c.json({ ok: false, error: "Stripe webhook secret missing" }, 500);

  const signatureHeader = c.req.header("Stripe-Signature") || "";
  if (!signatureHeader) return c.json({ ok: false, error: "Missing Stripe-Signature header" }, 400);

  const rawBody = await c.req.text();
  const verified = await verifyStripeSignature(rawBody, signatureHeader, signingSecret);
  if (!verified.ok) return c.json({ ok: false, error: verified.error }, 400);

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return c.json({ ok: false, error: "Invalid JSON payload" }, 400);
  }

  if (!env.stripeWebhooksEnabled) return c.json({ ok: false, error: "Stripe webhooks are disabled" }, 503);

  if (!event.id || !event.type) return c.json({ ok: false, error: "Invalid Stripe event" }, 400);

  const claim = await claimStripeEvent(db, { id: event.id, type: event.type, data: event.data }, rawBody);
  if (claim === "processed") return c.json({ ok: true, duplicate: true, eventId: event.id });

  if (!STRIPE_ALLOWED_EVENTS.has(event.type)) {
    await markStripeEvent(db, event.id, "processed");
    return c.json({ ok: true, ignored: true, type: event.type });
  }

  try {
    await applyStripeEvent(db, { id: event.id, type: event.type, data: event.data });
    await markStripeEvent(db, event.id, "processed");
  } catch (error) {
    await markStripeEvent(db, event.id, "failed");
    console.error("[stripe webhook]", error instanceof Error ? error.message : error);
    return c.json({ ok: false, error: "Webhook processing failed" }, 500);
  }

  return c.json({ ok: true, eventId: event.id, type: event.type });
});

// Intercom webhook disabled pending schema fix
// app.route("/api/webhooks/intercom", intercomWebhook);

// ─── Clerk webhook ───
// app.route("/api/webhooks/clerk", clerkWebhook);

// ─── Auth routes ───
app.post("/api/auth/register", async (c) => {
  let input: AuthInput;
  try {
    input = await c.req.json<AuthInput>();
  } catch {
    return c.json({ ok: false, error: "Invalid request body" }, 400);
  }

  try {
    const caller = appRouter.createCaller(await createContext(getRequestContext(c) as any));
    const result = await caller.localAuth.register({
      name: String(input.name || ""),
      email: String(input.email || ""),
      password: String(input.password || ""),
    });
    return c.json({ ok: true, ...result });
  } catch (error) {
    return c.json({ ok: false, error: getPublicAuthError(error) }, 400);
  }
});

app.post("/api/auth/login", async (c) => {
  let input: AuthInput;
  try {
    input = await c.req.json<AuthInput>();
  } catch {
    return c.json({ ok: false, error: "Invalid request body" }, 400);
  }

  try {
    const caller = appRouter.createCaller(await createContext(getRequestContext(c) as any));
    const result = await caller.localAuth.login({
      email: String(input.email || ""),
      password: String(input.password || ""),
    });
    return c.json({ ok: true, ...result });
  } catch (error) {
    return c.json({ ok: false, error: getPublicAuthError(error) }, 400);
  }
});

// ─── OAuth routes ───
app.get("/api/oauth/:provider/initiate", async (c) => {
  try {
    const provider = c.req.param("provider") as "google" | "github" | "x";
    const host = c.req.header("host") || undefined;

    const { buildAuthUrl } = await import("../api/oauth-providers");
    const result = await buildAuthUrl(provider, host);

    if (result.error || !result.url) {
      return c.json({ ok: false, error: result.error || "Failed to build auth URL" }, 400);
    }
    return c.redirect(result.url, 302);
  } catch (e: any) {
    return c.json({ ok: false, error: "OAuth init error", detail: e?.message || String(e) }, 500);
  }
});

app.get("/api/oauth/callback/:provider", async (c) => {
  const provider = c.req.param("provider") as "google" | "github" | "x";
  const { handleOAuthCallback } = await import("../api/oauth-handlers");
  return handleOAuthCallback(c as any, provider);
});

// ─── Client config endpoint (exposes public env vars at runtime) ───
app.get("/api/config", (c) => {
  const stripeKey = publicPublishableKey(
    (c.env as { VITE_STRIPE_PUBLISHABLE_KEY?: string })?.VITE_STRIPE_PUBLISHABLE_KEY,
  );
  return c.json({
    VITE_STRIPE_PUBLISHABLE_KEY: stripeKey,
    VAULT_DOMAIN: (c.env as { VAULT_DOMAIN?: string })?.VAULT_DOMAIN || "thevaultdfw.win",
  });
});

// ─── tRPC handler ───
async function handleTRPC(c: any) {
  try {
    return await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext,
      onError: (opts) => {
        console.error(`[tRPC] ${opts.error.code} | ${opts.path} | ${opts.error.message}`);
      },
    });
  } catch (err: any) {
    console.error("[tRPC Handler Error]", err?.message || err);
    return c.json({ error: "Internal server error" }, 500);
  }
}

app.all("/api/trpc", handleTRPC);
app.all("/api/trpc/*", handleTRPC);

// ─── Telegram inbound webhook (support tickets) ───
// Telegram POSTs updates here when a dedicated vault support bot is used.
// Gated by the VAULT_TG_BOT_TOKEN secret — never shares the Hermes gateway
// bot token, so it cannot conflict with the gateway's own polling.
// Expected Telegram secret header: "X-Telegram-Bot-Token" (or ?token=).
app.post("/api/telegram/webhook", async (c) => {
  const botToken = getEnvString(c.env, "VAULT_TG_BOT_TOKEN");
  if (!botToken) {
    return c.json({ ok: false, error: "VAULT_TG_BOT_TOKEN not configured" }, 503);
  }
  const headerToken = c.req.header("X-Telegram-Bot-Token") || "";
  const queryToken = new URL(c.req.url).searchParams.get("token") || "";
  if (headerToken && headerToken !== botToken) return c.json({ ok: false, error: "bad token" }, 401);
  if (!headerToken && queryToken !== botToken) return c.json({ ok: false, error: "bad token" }, 401);

  let update: any;
  try {
    update = await c.req.json();
  } catch {
    return c.json({ ok: false, error: "invalid json" }, 400);
  }

  const msg = update?.message || update?.edited_message;
  if (!msg?.text && !msg?.caption) return c.json({ ok: true, ignored: "no text" });

  const text = (msg.text || msg.caption || "").slice(0, 4000);
  const from = msg.from || {};
  const chat = msg.chat || {};
  const senderName = [from.first_name, from.last_name].filter(Boolean).join(" ") || from.username || "Anonymous";
  const subject = text.slice(0, 80);

  // Create the ticket via the shared router logic through drizzle.
  try {
    const { drizzle } = await import("drizzle-orm/d1");
    const { _eq, _desc, sql } = await import("drizzle-orm");
    const { supportTickets } = await import("../db/schema");
    const { notifyTelegram, sendTelegramMessage } = await import("../api/lib/telegram");
    const db = getD1(c.env);

    const [row] = await (drizzle(db) as any)
      .select({ count: sql<number>`count(*)` })
      .from(supportTickets);
    const ticketNo = `VLT-${1001 + Number(row?.count || 0)}`;

    await (drizzle(db) as any).insert(supportTickets).values({
      ticketNo,
      channel: "telegram",
      status: "new",
      priority: "normal",
      subject,
      message: text,
      customerName: senderName,
      telegramUserId: String(from.id || ""),
      telegramUsername: from.username || "",
      telegramChatId: String(chat.id || ""),
      assignedAgent: "concierge",
      acknowledged: false,
    });

    // Ack the customer in their chat.
    await sendTelegramMessage(String(chat.id || ""), [
      `<b>🏛 The Vault DFW — Ticket ${ticketNo}</b>`,
      `Your inquiry has been received and assigned a ticket.`,
      ``,
      `<b>Subject:</b> ${subject}`,
      `<b>Status:</b> new — an agent will respond shortly.`,
      ``,
      `<i>Keep this number for reference: ${ticketNo}</i>`,
    ].join("\n"));

    // Ack in the owner's inbox — the agent confirms receipt here.
    await notifyTelegram("🎫 NEW SUPPORT TICKET", {
      "Ticket": ticketNo,
      "Channel": "telegram",
      "Subject": subject,
      "From": senderName,
      "Message": text.slice(0, 200),
      "Status": "acknowledged",
    });

    return c.json({ ok: true, ticketNo });
  } catch (err: any) {
    console.error("[telegram webhook]", err?.message || err);
    return c.json({ ok: false, error: "ticket creation failed" }, 500);
  }
});

app.get("/api/assets/*", async (c) => {
  const key = decodeURIComponent(c.req.path.replace(/^\/api\/assets\//, ""));
  if (!key.startsWith("uploads/") || key.includes("..")) {
    return c.json({ error: "invalid key" }, 400);
  }
  const bucket = (c.env as { ASSETS?: { get: (key: string) => Promise<{ body: ReadableStream; httpMetadata?: { contentType?: string } } | null> } }).ASSETS;
  if (!bucket) return c.json({ error: "storage unavailable" }, 503);
  const obj = await bucket.get(key);
  if (!obj) return c.json({ error: "not found" }, 404);
  const contentType = obj.httpMetadata?.contentType || "application/octet-stream";
  if (!contentType.startsWith("image/")) return c.json({ error: "unsupported object" }, 415);
  const headers = new Headers();
  headers.set("content-type", contentType);
  headers.set("cache-control", "public, max-age=3600");
  headers.set("x-content-type-options", "nosniff");
  return new Response(obj.body, { headers });
});

app.all("/api/*", (c) => c.json({ error: "API route not found", path: c.req.path }, 404));

function canonicalFor(pathname: string): string {
  const clean = pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";
  return `https://thevaultdfw.win${clean}`;
}

// Cloudflare Pages onRequest
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith("/api/")) {
    return app.fetch(context.request, context.env, context);
  }
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;
  const html = await response.text();
  const canonical = canonicalFor(url.pathname).replace(/"/g, "");
  const rewritten = html
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${canonical}" />`);
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  return new Response(rewritten, { status: response.status, statusText: response.statusText, headers });
};

export async function scheduled(_event: unknown, env: Env, ctx: ExecutionContext): Promise<void> {
  setCloudflareEnv(env as Record<string, unknown>);
  const db = getD1(env);
  if (!db) return;
  setDb(db);
  ctx.waitUntil(runScheduledMaintenance());
}