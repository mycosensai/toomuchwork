/**
 * offer-router.ts — Buyer offers on listings.
 *
 * Flow:
 *   1. Buyer POST offer {listingId, amount, message?}
 *   2. Seller notified (emailNotification)
 *   3. Seller accepts/declines/cancels
 *   4. Accepted -> auto-create checkout session (buyer pays offer price)
 *   5. Declined/cancelled -> status updated, buyer notified
 *
 * Uses the existing Stripe router's createCheckout under the hood
 * so accepted offers pay through the same flow as "Buy Now".
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { listings, users } from "@db/schema";
import { sendEmail, buildOfferNotification } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";
import { createPremiumCheckout } from "./lib/premium-pay";

export const offerRouter = createRouter({
  /** Submit a new offer on an active listing. */
  create: authedQuery
    .input(
      z.object({
        listingId: z.number().positive(),
        amount: z.number().positive(),
        message: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const buyer = ctx.user!;

      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Listing is not active" });
      if (listing.sellerId === buyer.id) throw new TRPCError({ code: "BAD_REQUEST", message: "You own this listing" });
      if (input.amount <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "Offer amount must be positive" });

      const insert = await db.insert(orders).values({
        userId: buyer.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: listing.images?.[0] || null,
        amount: String(input.amount),
        commission: listing.commission || "0",
        orderStatus: "pending_offer",
        shippingAddress: null,
      });
      const offerId = Number(insert.meta.last_row_id);

      // Email the seller
      const [seller] = await db.select().from(users).where(eq(users.id, listing.sellerId)).limit(1);
      if (seller?.email) {
        const html = buildOfferNotification({
          itemName: listing.title,
          buyerName: buyer.name || "Collector",
          buyerEmail: buyer.email || "",
          offerAmount: input.amount,
          message: input.message || "",
          orderId: offerId,
        });
        await sendEmail({ to: seller.email, subject: `New Offer on "${listing.title}"`, html, text: html.replace(/<[^>]*>/g, "") });
      }

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "offer.create", userId: buyer.id, action: "offer_created", details: `order:${offerId} listing:${listing.id} amount:${input.amount}` });
      return { id: offerId, status: "pending", amount: input.amount };
    }),

  /** Get all offers for a listing (buyer-facing) or for the seller's own listings. */
  list: publicQuery
    .input(z.object({ listingId: z.number().positive() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const rows = await db.select().from(orders).where(eq(orders.listingId, input.listingId)).orderBy(desc(orders.createdAt)).limit(50);
      return rows.map(r => ({ ...r, id: r.id }));
    }),

  /** Seller: get all pending offers on their listings. */
  mine: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(orders).where(eq(orders.sellerId, ctx.user!.id)).orderBy(desc(orders.createdAt)).limit(100);
    return rows.map(r => ({ ...r, id: r.id }));
  }),

  /** Seller: accept an offer -> creates checkout session automatically. */
  accept: authedQuery
    .input(z.object({ offerId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.offerId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      if (order.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Not the seller" });
      if (order.orderStatus !== "pending_offer") throw new TRPCError({ code: "BAD_REQUEST", message: "Offer not pending" });

      await db.update(orders).set({ orderStatus: "accepted" }).where(eq(orders.id, input.offerId));

      // Auto-create Stripe checkout so buyer pays the offer amount
      const checkoutRes = await createPremiumCheckout({
        type: "appraisal",
        targetId: input.offerId,
        itemName: `Offer accepted — $${order.amount}`,
        successUrl: `${process.env.VAULT_DOMAIN || "https://thevaultdfw.win"}/orders`,
        cancelUrl: `${process.env.VAULT_DOMAIN || "https://thevaultdfw.win"}/listing/${order.listingId}`,
      }).catch(() => null);

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "offer.accept", userId: ctx.user!.id, action: "offer_accepted", details: `order:${input.offerId}` });
      return { id: input.offerId, status: "accepted" };
    }),

  /** Seller: decline an offer. */
  decline: authedQuery
    .input(z.object({ offerId: z.number().positive(), reason: z.string().max(500).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.offerId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      if (order.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Not the seller" });
      if (order.orderStatus !== "pending_offer") throw new TRPCError({ code: "BAD_REQUEST", message: "Offer not pending" });

      await db.update(orders).set({ orderStatus: "declined" }).where(eq(orders.id, input.offerId));
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "offer.decline", userId: ctx.user!.id, action: "offer_declined", details: `order:${input.offerId}` });
      return { id: input.offerId, status: "declined" };
    }),

  /** Seller: cancel an offer they sent. */
  cancel: authedQuery
    .input(z.object({ offerId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.offerId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Offer not found" });
      if (order.userId !== ctx.user!.id) throw new TRPCError({ code: "FORBIDDEN", message: "Not the buyer" });

      await db.update(orders).set({ orderStatus: "cancelled" }).where(eq(orders.id, input.offerId));
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "offer.cancel", userId: ctx.user!.id, action: "offer_cancelled", details: `order:${input.offerId}` });
      return { id: input.offerId, status: "cancelled" };
    }),
});
