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
  const headers = getSecurityHeaders();
  for (const [key, value] of Object.entries(headers)) {
    c.header(key, value);
  }
});

// ─── CORS ───
app.use("/api/*", cors(getCorsConfig()));

// ─── Trailing slash ───
app.use(trimTrailingSlash());

// ─── Rate limiting ───
app.use("/api/*", async (c, next) => {
  if (c.req.path === "/api/stripe/webhook") {
    await next();
    return;
  }

  const isAuth =
    c.req.path.includes("/api/auth/") ||
    c.req.path.includes("localAuth.login") ||
    c.req.path.includes("localAuth.register") ||
    c.req.path.includes("oauth.initiate") ||
    c.req.path.includes("oauth.callback");

  const config = isAuth ? { maxRequests: 5, windowMs: 60_000 } : undefined;
  const result = checkRateLimit(c.req.raw, config);

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

  if (!event.id || !event.type) return c.json({ ok: false, error: "Invalid Stripe event" }, 400);

  const duplicate = await db.prepare("SELECT id FROM webhook_events WHERE id = ? LIMIT 1").bind(event.id).first();
  if (duplicate) return c.json({ ok: true, duplicate: true, eventId: event.id });

  if (!STRIPE_ALLOWED_EVENTS.has(event.type)) {
    await db
      .prepare("INSERT INTO webhook_events (id, provider, event_type, processed_at, metadata) VALUES (?, ?, ?, ?, ?)")
      .bind(event.id, "stripe", event.type, Date.now(), JSON.stringify({ ignored: true }))
      .run();
    return c.json({ ok: true, ignored: true, type: event.type });
  }

  const object = event.data?.object || {};
  const sessionId = typeof object.id === "string" ? object.id : "";

  if (event.type === "checkout.session.completed" && sessionId) {
    // 0a. LISTING FEE session? → mark fee paid + activate listing (gate unlock).
    //     Fee sessions live in listing_fees (not stripe_sessions), so check here first.
    const feeRow = await db.prepare("SELECT id, listing_id FROM listing_fees WHERE stripe_session_id = ? AND status != 'paid' LIMIT 1").bind(sessionId).first<{ id: number; listing_id: number | null }>();
    if (feeRow?.id) {
      await db.prepare("UPDATE listing_fees SET status = 'paid', paid_at = unixepoch() WHERE id = ?").bind(feeRow.id).run();
      if (feeRow.listing_id) {
        await db.prepare("UPDATE listings SET status = 'active' WHERE id = ? AND status = 'pending_fee'").bind(feeRow.listing_id).run();
      }
    }

    // 0b. Purchase session → mark stripe session completed + create order.
    await db.prepare("UPDATE stripe_sessions SET status = ? WHERE session_id = ?").bind("completed", sessionId).run();
    const sessionRow = await db.prepare("SELECT listing_id, user_id, amount, commission FROM stripe_sessions WHERE session_id = ? LIMIT 1").bind(sessionId).first<{ listing_id: number; user_id: number | null; amount: string; commission: string }>();
    if (sessionRow?.listing_id) {
      // 1. Mark listing sold
      await db.prepare("UPDATE listings SET status = ? WHERE id = ?").bind("sold", sessionRow.listing_id).run();
      // 2. Create the canonical ORDER row (buyer purchase record)
      const listingRow = await db.prepare("SELECT title, images, seller_id FROM listings WHERE id = ? LIMIT 1").bind(sessionRow.listing_id).first<{ title: string; images: string | null; seller_id: number | null }>();
      const buyerEmail = typeof object.customer_email === "string" ? object.customer_email : null;
      const shippedAddress = typeof object.shipping === "object" && object.shipping ? JSON.stringify(object.shipping) : null;
      const commissionNum = Number(sessionRow.commission) || 0;
      const payoutAmount = (Number(sessionRow.amount) - commissionNum).toFixed(2);
      await db
        .prepare(
          "INSERT INTO orders (user_id, seller_id, listing_id, listing_title, listing_image, amount, commission, payment_method, payment_status, order_status, shipping_address, payout_status, payout_amount, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'stripe', 'completed', 'confirmed', ?, 'pending', ?, ?, unixepoch(), unixepoch())"
        )
        .bind(
          sessionRow.user_id,
          listingRow?.seller_id || null,
          sessionRow.listing_id,
          listingRow?.title || "Vault Purchase",
          listingRow?.images || null,
          sessionRow.amount,
          sessionRow.commission,
          shippedAddress,
          payoutAmount,
          JSON.stringify({ stripe_session_id: sessionId, buyer_email: buyerEmail })
        )
        .run();
      // 3. Queue seller notification (email row, sent by notification worker)
      if (listingRow?.seller_id) {
        const seller = await db.prepare("SELECT id, email, name FROM users WHERE id = ? LIMIT 1").bind(listingRow.seller_id).first<{ id: number; email: string | null; name: string | null }>();
        if (seller?.email) {
          await db
            .prepare("INSERT INTO email_notifications (user_id, recipient_email, type, subject, body_text, status, created_at) VALUES (?, ?, 'order_placed', ?, ?, 'pending', unixepoch())")
            .bind(
              seller.id,
              seller.email,
              `Your item sold: ${listingRow.title}`,
              `Great news! Your item "${listingRow.title}" was purchased for $${sessionRow.amount}. We'll notify you when payment settles.`
            )
            .run();
        }
      }
    }
  }

  // Released hold: buyer abandoned checkout or payment failed → listing back to active
  if (event.type === "checkout.session.expired" && sessionId) {
    await db.prepare("UPDATE stripe_sessions SET status = ? WHERE session_id = ?").bind("expired", sessionId).run();
    const sessionRow = await db.prepare("SELECT listing_id FROM stripe_sessions WHERE session_id = ? LIMIT 1").bind(sessionId).first<{ listing_id: number }>();
    if (sessionRow?.listing_id) {
      await db.prepare("UPDATE listings SET status = 'active' WHERE id = ? AND status = 'reserved'").bind(sessionRow.listing_id).run();
    }
  }

  if (event.type === "payment_intent.payment_failed") {
      // NOTE: payment_intent events carry a PaymentIntent ID (pi_...) as object.id,
      // NOT a Checkout Session ID (cs_...). stripe_sessions stores cs_... IDs, so a
      // session_id lookup never matches. Release the hold via the listing from
      // event metadata instead.
      const obj = (event.data?.object || {}) as Record<string, any>;
      const listingFromMeta = Number(obj?.metadata?.listingId) || 0;
      await db.prepare("UPDATE stripe_sessions SET status = ? WHERE session_id = ?").bind("failed", sessionId).run();
      if (listingFromMeta) {
        await db.prepare("UPDATE listings SET status = 'active' WHERE id = ? AND status = 'reserved'").bind(listingFromMeta).run();
      }
    }

  await db
    .prepare("INSERT INTO webhook_events (id, provider, event_type, processed_at, metadata) VALUES (?, ?, ?, ?, ?)")
    .bind(event.id, "stripe", event.type, Date.now(), JSON.stringify({ sessionId }))
    .run();

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
  const stripeKey =
    (c.env as any)?.VITE_STRIPE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" && (process as any).env?.VITE_STRIPE_PUBLISHABLE_KEY) ||
    "";
  return c.json({
    VITE_STRIPE_PUBLISHABLE_KEY: stripeKey,
    VAULT_DOMAIN: (c.env as any)?.VAULT_DOMAIN || "thevaultdfw.win",
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
    const { eq, desc, sql } = await import("drizzle-orm");
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

app.all("/api/*", (c) => c.json({ error: "API route not found", path: c.req.path }, 404));

// Cloudflare Pages onRequest
export const onRequest = async (context: any) => {
  const url = new URL(context.request.url);
  if (url.pathname.startsWith('/api/')) {
    return app.fetch(context.request, context.env, context);
  }
  // Non-API requests fall through to Pages static asset serving
  return context.next();
};