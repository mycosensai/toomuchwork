/**
 * premium-pay.ts — Stripe checkout + verification for premium report unlocks
 * (AI Appraisal, ProVerify Engine).
 *
 * Mirrors the proven listing-fee pattern (listing-fee-router.ts):
 *   createCheckout  → Stripe Checkout Session (hosted) for a one-time fee
 *   verifyPayment   → confirm payment_status=paid against Stripe, then mark
 *                     the target row `paid=true` + `unlockedAt` and return
 *                     the full report payload so the caller unlocks in-page.
 *
 * The gate is ENFORCED server-side: appraisal.getById / expert.getApplication
 * only return full results when the row's paid=true (see those routers).
 * Pricing is a constant here — the single place to change it.
 */

import { eq } from "drizzle-orm";
import { getDb } from "../queries/connection";
import { env } from "./env";

const STRIPE_API = "https://api.stripe.com/v1";

// ─── Pricing (transparent, one-time) ────────────────────────────────────────
// proverify default = standard tier; express/rush tiers are stored on the
// application row (review_fee) and charged via the `cents` override below.
export const PREMIUM_PRICES: Record<"appraisal" | "proverify", { cents: number; dollars: string; label: string }> = {
  appraisal: { cents: 2900, dollars: "29.00", label: "AI Appraisal Report" },
  proverify: { cents: 4999, dollars: "49.99", label: "ProVerify Engine Report" },
};

/** Convert a "$49.99"-style stored fee to cents (also accepts bare numbers). */
export function dollarsToCents(amount: string | number): number {
  const n = typeof amount === "number" ? amount : parseFloat(String(amount).replace(/[^0-9.]/g, ""));
  return Math.round((Number.isFinite(n) ? n : 49.99) * 100);
}

export function premiumProductName(type: "appraisal" | "proverify", itemName: string): string {
  const base = PREMIUM_PRICES[type].label;
  return itemName ? `${base} — ${itemName}` : base;
}

async function stripeFetch(endpoint: string, body?: URLSearchParams): Promise<any> {
  if (!env.stripeSecretKey) throw new Error("Stripe not configured");
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${env.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body?.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Stripe API error: ${text}`);
  }
  return res.json();
}

/**
 * Create a one-time Stripe Checkout session for a premium report.
 * Success URL returns to the SAME page (frontend re-verifies and unlocks in
 * place — no Stripe-hosted dead-end).
 */
export async function createPremiumCheckout(opts: {
  type: "appraisal" | "proverify";
  itemName: string;
  userId?: number | null;
  targetId: number;
  successUrl: string;
  cancelUrl: string;
  /** Override unit amount in cents (e.g. tiered ProVerify fee stored on the row). */
  cents?: number;
  /** Display label for the override amount (e.g. "$99.99"). */
  amountLabel?: string;
}): Promise<{ sessionId: string; url: string | null; amount: string }> {
  const base = PREMIUM_PRICES[opts.type];
  const cents = opts.cents ?? base.cents;
  const amount = opts.amountLabel ?? base.dollars;
  const body = new URLSearchParams({
    "payment_method_types[]": "card",
    "line_items[0][price_data][currency]": "usd",
    "line_items[0][price_data][product_data][name]": premiumProductName(opts.type, opts.itemName),
    "line_items[0][price_data][product_data][description]": `One-time fee for your ${base.label}. Includes full AI analysis, comparable research, and downloadable report.`,
    "line_items[0][price_data][unit_amount]": String(cents),
    "line_items[0][quantity]": "1",
    mode: "payment",
    success_url: opts.successUrl,
    cancel_url: opts.cancelUrl,
    "metadata[premiumType]": opts.type,
    "metadata[targetId]": String(opts.targetId),
    "metadata[userId]": String(opts.userId ?? ""),
  });

  const session = await stripeFetch("/checkout/sessions", body);
  return { sessionId: session.id, url: session.url, amount };
}

/** Confirm payment with Stripe; returns payment_status. */
export async function fetchStripeSession(sessionId: string): Promise<{ payment_status: string; amount_total: number | null }> {
  const session = await stripeFetch(`/checkout/sessions/${sessionId}`);
  return { payment_status: session.payment_status, amount_total: session.amount_total };
}

/**
 * After payment is confirmed, mark the target row paid and return it.
 * Returns null when the row doesn't exist.
 */
export async function markPremiumPaid(
  type: "appraisal" | "proverify",
  targetId: number,
): Promise<{ id: number; paid: boolean; itemName: string } | null> {
  const db = getDb();

  if (type === "appraisal") {
    const { appraisals } = await import("@db/schema");
    const [row] = await db.select().from(appraisals).where(eq(appraisals.id, targetId)).limit(1);
    if (!row) return null;
    if (!row.paid) {
      await db.update(appraisals).set({ paid: true, unlockedAt: new Date() }).where(eq(appraisals.id, targetId));
    }
    return { id: row.id, paid: true, itemName: row.itemName };
  }

  const { expertApplications } = await import("@db/schema");
  const [row] = await db.select().from(expertApplications).where(eq(expertApplications.id, targetId)).limit(1);
  if (!row) return null;
  if (!row.paid) {
    await db.update(expertApplications).set({ paid: true, unlockedAt: new Date() }).where(eq(expertApplications.id, targetId));
  }
  return { id: row.id, paid: true, itemName: row.itemName };
}
