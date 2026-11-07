import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { listings, offers, stripeSessions } from "@db/schema";
import { and, eq, sql } from "drizzle-orm";
import { env } from "./lib/env";
import { logAudit, getClientIP, assertSensitiveLimit } from "./security";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeFetch(endpoint: string, body?: URLSearchParams, method: string = "POST"): Promise<any> {
  if (!env.stripeSecretKey) throw new Error("Stripe is not configured");
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method,
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

const VAULT_BRANDING = {
  display_name: "The Vault",
  background_color: "#080808",
  button_color: "#C9A84C",
};

export const stripeRouter = createRouter({
  createSession: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        offerPrice: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertSensitiveLimit(ctx.req, "checkout");
      const db = getDb();
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new Error("Listing not found");
      if (listing.sellerId === ctx.user?.id) throw new Error("You cannot purchase your own listing");
      if (listing.isBuyNow === false && listing.isConsignment === false) throw new Error("Listing is not available for direct purchase");
      if (listing.status === "sold") throw new Error("Item already sold");
      if (listing.status === "reserved") throw new Error("Item is on hold for another buyer");
      if (listing.status !== "active") throw new Error(`Item is not available for purchase (status: ${listing.status})`);

      // ATOMIC RESERVATION: only proceed if still active at this instant.
      // Prevents double-purchase of a single-unit item (compare-and-set).
      const reserve = await db
        .update(listings)
        .set({ status: "reserved", updatedAt: new Date() })
        .where(sql`${listings.id} = ${listing.id} AND ${listings.status} = 'active'`);
      if (!reserve?.meta?.changes || Number(reserve.meta.changes) === 0) {
        // Lost the race — another checkout reserved it first.
        throw new Error("Item was just purchased by another buyer or is no longer available");
      }

      const [accepted] = await db
        .select()
        .from(offers)
        .where(and(
          eq(offers.listingId, listing.id),
          eq(offers.buyerId, ctx.user.id),
          eq(offers.status, "accepted"),
        ))
        .limit(1);
      const price = accepted ? Number(accepted.amount) : Number(listing.price);
      if (!Number.isFinite(price) || price <= 0) throw new Error("Listing price is invalid");
      const commission = price * (Number(listing.commissionRate) / 100);
      void input.offerPrice;

      const body = new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": listing.title,
        "line_items[0][price_data][product_data][description]": listing.description?.substring(0, 500) || "",
        "line_items[0][price_data][unit_amount]": String(Math.round(price * 100)),
        "line_items[0][quantity]": "1",
        mode: "payment",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        "metadata[listingId]": String(listing.id),
        "metadata[userId]": ctx.user?.id ? String(ctx.user.id) : "guest",
        "metadata[commission]": String(commission),
      });

      let session: { id: string; url: string; metadata?: Record<string, string> };
      try {
        session = await stripeFetch("/checkout/sessions", body);
        await db.insert(stripeSessions).values({
          sessionId: session.id,
          userId: ctx.user?.id || null,
          listingId: listing.id,
          amount: String(price),
          commission: String(commission),
          status: "pending",
          metadata: JSON.stringify({ listingId: listing.id, userId: ctx.user.id, amount: price }),
        });
      } catch (error) {
        await db
          .update(listings)
          .set({ status: "active", updatedAt: new Date() })
          .where(and(eq(listings.id, listing.id), eq(listings.status, "reserved")));
        throw error;
      }

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "stripe.createSession",
        userId: ctx.user?.id,
        action: "checkout_initiated",
        details: `listing:${listing.id} amount:${price}`,
      });

      return { sessionId: session.id, url: session.url };
    }),

  verifySession: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const [record] = await db.select().from(stripeSessions).where(eq(stripeSessions.sessionId, input.sessionId)).limit(1);
      if (!record || (record.userId && record.userId !== ctx.user?.id)) {
        return { status: "unknown", amount_total: null, session: null };
      }
      const session = await stripeFetch(`/checkout/sessions/${input.sessionId}`, undefined, "GET");
      return { status: session.payment_status, amount_total: session.amount_total, session: record };
    }),

  getPublishableKey: publicQuery.query(() => {
    return { key: env.stripePublishableKey || "" };
  }),

  getBranding: publicQuery.query(() => {
    return { displayName: VAULT_BRANDING.display_name, backgroundColor: VAULT_BRANDING.background_color, buttonColor: VAULT_BRANDING.button_color };
  }),
});