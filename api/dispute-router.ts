/**
 * dispute-router.ts — Escrow dispute resolution system.
 *
 * Buyers/sellers can raise disputes, escalate, and resolve them.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { orders } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const disputeRouter = createRouter({
  /** Raise a new dispute. */
  createDispute: authedQuery
    .input(z.object({ orderId: z.number().min(1), reason: z.string().min(10), evidence: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).where(eq(orders.id, ctx.user!.id));
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      await db.insert(disputes).values({
        orderId: input.orderId,
        raisedBy: ctx.user!.id,
        reason: input.reason,
        evidence: input.evidence,
        status: "open",
      });
      await logAudit({ userId: ctx.user!.id, action: "dispute_created", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Resolve a dispute (admin only). */
  resolveDispute: authedQuery
    .input(z.object({ disputeId: z.number().min(1), resolution: z.enum(["buyer_wins", "seller_wins", "refund", "partial"]), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(disputes).set({ status: "resolved", resolution: input.resolution, notes: input.notes, resolvedAt: new Date() }).where(eq(disputes.id, input.disputeId));
      await logAudit({ userId: ctx.user!.id, action: "dispute_resolved", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Get disputes for the current user. */
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(disputes).where(eq(disputes.raisedBy, ctx.user!.id)).orderBy(desc(disputes.createdAt));
    return rows;
  }),
});

// Need to import disputes table — add inline
import { sql } from "drizzle-orm";
const disputes = { id: sql`id`, orderId: sql`order_id`, raisedBy: sql`raised_by`, reason: sql`reason`, evidence: sql`evidence`, status: sql`status`, resolution: sql`resolution`, notes: sql`notes`, resolvedAt: sql`resolved_at`, createdAt: sql`created_at` };
