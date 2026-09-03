import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders, sellerPayouts, listings } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

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
      const db = getDb();
      if (!ctx.user) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }
      const result = await db.insert(orders).values({
        userId: ctx.user.id,
        listingId: input.listingId,
        listingTitle: input.listingTitle,
        listingImage: input.listingImage || null,
        amount: String(input.amount),
        commission: String(input.commission || 0),
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

      if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "You do not own this order" });
      }

      const updateData: Record<string, unknown> = {};
      if (input.paymentStatus) updateData.paymentStatus = input.paymentStatus;
      if (input.orderStatus) updateData.orderStatus = input.orderStatus;
      if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber;

      await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
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
      if (order.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") {
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
      if (order.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") {
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
      if (order.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") {
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
      if (order.userId && order.userId !== ctx.user?.id && ctx.user?.role !== "admin") return null;
      return order;
    }),
});