import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { orders } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

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
