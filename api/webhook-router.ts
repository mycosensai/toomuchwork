/**
 * webhook-router.ts — Webhook endpoints for Stripe, Solana, and more.
 *
 * Receives: Stripe checkout.session.completed, payment_intent.succeeded,
 *           Solana transfer events, and order webhooks.
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { orders } from "@db/schema";
import { logAudit, getClientIP } from "./security";
import { env } from "./lib/env";
import { TRPCError } from "@trpc/server";

export const webhookRouter = createRouter({
  /** Stripe webhook endpoint. */
  stripe: publicQuery
    .input(z.object({ eventType: z.string(), payload: z.object({}).passthrough() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { eventType, payload } = input;
      await db.insert(webhookEvents).values({
        eventType,
        payload: JSON.stringify(payload),
        status: "processing",
      });
      await logAudit({ action: `stripe_webhook_${eventType}`, ip: getClientIP(ctx.req), method: "POST" });
      // Process based on event type
      switch (eventType) {
        case "checkout.session.completed": {
          const sessionId = (payload as any).data?.object?.id;
          if (sessionId) {
            await db.update(orders).set({ status: "paid" }).where(eq(orders.stripeSessionId, sessionId));
          }
          break;
        }
        case "payment_intent.succeeded": {
          const pi = (payload as any).data?.object;
          if (pi?.payment_intent) {
            await db.update(orders).set({ status: "paid" }).where(eq(orders.stripeSessionId, pi.payment_intent));
          }
          break;
        }
      }
      await db.update(webhookEvents).set({ status: "processed", processedAt: new Date() }).where(eq(webhookEvents.eventType, eventType));
      return { success: true };
    }),

  /** Solana transfer webhook. */
  solana: publicQuery
    .input(z.object({ eventType: z.string(), payload: z.object({}).passthrough() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { eventType, payload } = input;
      await db.insert(webhookEvents).values({
        eventType: `solana_${eventType}`,
        payload: JSON.stringify(payload),
        status: "processing",
      });
      await logAudit({ action: `solana_webhook_${eventType}`, ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),
});
