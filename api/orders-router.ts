import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { isProvisionedAdmin } from "./lib/admin-access";
import { getDb } from "./queries/connection";
import { orders, sellerPayouts, listings } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { parseStringList } from "./lib/listing-json";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP, assertSensitiveLimit } from "./security";
import { notifyTelegram } from "./lib/telegram";

export const ordersRouter = createRouter({
  list: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user?.id;
    if (!userId) return [];
    return db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt))
      .limit(100);
  }),

  // Seller view: orders for items the current user sold
  mySold: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(orders)
      .where(eq(orders.sellerId, ctx.user!.id))
      .orderBy(desc(orders.createdAt))
      .limit(100);
  }),

  create: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        listingTitle: z.string().max(255),
        listingImage: z.string().optional(),
        amount: z.number().positive(),
        commission: z.number().optional(),
        paymentMethod: z
          .enum(["stripe", "dex", "solana_wallet", "other"])
          .optional(),
        shippingAddress: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await assertSensitiveLimit(ctx.req, "checkout");
      const db = getDb();
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing || listing.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing is not available" });
      }
      if (listing.sellerId === ctx.user.id) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You cannot purchase your own listing" });
      }
      const amount = Number(listing.price);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Listing price is invalid" });
      }
      const commission = amount * (Number(listing.commissionRate) / 100);
      const result = await db.insert(orders).values({
        userId: ctx.user.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        listingTitle: listing.title,
        listingImage: parseStringList(listing.images)[0] || null,
        amount: amount.toFixed(2),
        commission: commission.toFixed(2),
        paymentMethod: input.paymentMethod || "other",
        paymentStatus: "pending",
        orderStatus: "pending",
        shippingAddress: input.shippingAddress || null,
      });
      return { id: Number(result.meta.last_row_id), success: true };
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        orderId: z.number(),
        paymentStatus: z
          .enum(["pending", "completed", "failed", "refunded"])
          .optional(),
        orderStatus: z
          .enum([
            "pending",
            "confirmed",
            "shipped",
            "delivered",
            "cancelled",
            "refunded",
          ])
          .optional(),
        trackingNumber: z.string().max(255).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);

      if (!order) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      const buyer = order.userId === ctx.user.id;
      const seller = order.sellerId === ctx.user.id;
      const admin = isProvisionedAdmin(ctx.user);
      if (!buyer && !seller && !admin) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this order" });
      }
      if (input.paymentStatus || input.orderStatus === "refunded" || input.orderStatus === "confirmed") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Paid, refunded, and confirmed states are webhook-only" });
      }
      if (buyer && !seller && !admin) {
        if (input.orderStatus && input.orderStatus !== "cancelled") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Buyers can only cancel an unpaid order" });
        }
        if (input.orderStatus === "cancelled" && order.paymentStatus === "completed") {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Paid orders cannot be cancelled here" });
        }
        if (input.trackingNumber) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can set tracking" });
        }
      }

      const updateData: Record<string, unknown> = {};
      if (input.orderStatus) updateData.orderStatus = input.orderStatus;
      if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber;

      await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
      await notifyTelegram("📦 ORDER UPDATED", {
        "Order ID": String(input.orderId),
        "Item": order.listingTitle,
        "Status": input.orderStatus || order.orderStatus || "—",
        "Tracking": input.trackingNumber || "—",
      });
      return { success: true };
    }),

  // ─── FULFILLMENT LIFECYCLE (canonical buyer-purchase path) ───
  // Seller (or admin) marks the item shipped with carrier + tracking.
  markShipped: authedQuery
    .input(
      z.object({
        orderId: z.number(),
        carrier: z.enum(["fedex", "ups", "usps", "dhl"]),
        trackingNumber: z.string().min(1),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.sellerId !== ctx.user!.id && !isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the seller of this order" });
      }
      if (order.paymentStatus !== "completed") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order payment is not completed" });
      }

      await db
        .update(orders)
        .set({
          orderStatus: "shipped",
          trackingNumber: `${input.carrier}:${input.trackingNumber}`,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "orders.markShipped",
        userId: ctx.user!.id,
        action: "order_shipped",
        details: `order:${input.orderId} carrier:${input.carrier} tracking:${input.trackingNumber}`,
      });

      return { success: true, status: "shipped" };
    }),

  // Seller (or admin) marks the item delivered.
  markDelivered: authedQuery
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.sellerId !== ctx.user!.id && !isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the seller of this order" });
      }

      await db
        .update(orders)
        .set({ orderStatus: "delivered", updatedAt: new Date() })
        .where(eq(orders.id, input.orderId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "orders.markDelivered",
        userId: ctx.user!.id,
        action: "order_delivered",
        details: `order:${input.orderId}`,
      });

      return { success: true, status: "delivered" };
    }),

  // Complete the order: mark listing sold + create the seller payout record.
  complete: authedQuery
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      if (order.sellerId !== ctx.user!.id && !isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You are not the seller of this order" });
      }
      if (order.orderStatus !== "delivered" && order.orderStatus !== "shipped") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Order must be shipped or delivered before completing" });
      }

      // Mark listing sold
      await db.update(listings).set({ status: "sold" }).where(eq(listings.id, order.listingId));

      // Create payout record (amount = order amount − commission)
      const payoutAmount = order.payoutAmount || (Number(order.amount) - Number(order.commission || 0)).toFixed(2);
      const payoutInsert = await db.insert(sellerPayouts).values({
        sellerId: order.sellerId || 0,
        saleTransactionId: order.id,
        amount: payoutAmount,
        status: "pending",
      });
      const payoutId = Number(payoutInsert.meta.last_row_id);

      // Mark order completed + payout pending
      await db
        .update(orders)
        .set({
          orderStatus: "completed",
          payoutStatus: "pending",
          payoutAmount,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, input.orderId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "orders.complete",
        userId: ctx.user!.id,
        action: "order_completed",
        details: `order:${input.orderId} payout:${payoutId} amount:${payoutAmount}`,
      });

      return {
        success: true,
        status: "completed",
        payoutId,
        payoutAmount: Number(payoutAmount),
        commissionAmount: Number(order.commission || 0),
      };
    }),

  getById: publicQuery
    .input(z.object({ orderId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, input.orderId))
        .limit(1);
      if (!order) return null;
      if (order.userId && order.userId !== ctx.user?.id && !isProvisionedAdmin(ctx.user)) return null;
      return order;
    }),
});