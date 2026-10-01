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
import { orders, webhookEvents } from "@db/schema";
import { logAudit, getClientIP } from "./security";
import { env } from "./lib/env";
import { notifyTelegram } from "./lib/telegram";
import { TRPCError } from "@trpc/server";

export const webhookRouter = createRouter({
  /** Stripe webhook endpoint. */
  stripe: publicQuery
    .input(z.object({ eventType: z.string(), payload: z.object({}).passthrough() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { eventType, payload } = input;

      // Telegram first — independent of DB health.
      await notifyTelegram("💰 PAYMENT EVENT", {
        "Event": eventType,
        "Id": (payload as any).data?.object?.id || "—",
      });

      try {
        await db.insert(webhookEvents).values({
          eventType,
          payload: JSON.stringify(payload),
          status: "processing",
        });
      } catch (e) {
        console.error("[webhook] event log insert failed (non-fatal):", (e as Error).message);
      }
      await logAudit({ path: "webhook.stripe", action: `stripe_webhook_${eventType}`, ip: getClientIP(ctx.req), method: "POST" });
      // Process based on event type
      switch (eventType) {
        case "checkout.session.completed": {
          const sessionId = (payload as any).data?.object?.id;
          const amount = (payload as any).data?.object?.amount_total;
          const email = (payload as any).data?.object?.customer_details?.email;
          // orders has no stripe_session_id column — the row is matched at checkout.
          // Keep the audit + Telegram alert; DB flip happens via orders.updateStatus.
          void sessionId;
          await notifyTelegram("💰 SALE COMPLETED", {
            "Order": sessionId || "unknown",
            "Amount": amount ? `$${(amount / 100).toFixed(2)}` : "—",
            "Email": email || "—",
          });
          break;
        }
        case "payment_intent.succeeded": {
          const pi = (payload as any).data?.object;
          void pi?.payment_intent;
          break;
        }
      }
      return { success: true };
    }),

  /** Solana transfer webhook. */
  solana: publicQuery
    .input(z.object({ eventType: z.string(), payload: z.object({}).passthrough() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { eventType, payload } = input;

      // Telegram first — independent of DB health.
      await notifyTelegram("⛓ SOLANA EVENT", {
        "Event": eventType,
        "Signature": (payload as any).signature || "—",
        "Amount": (payload as any).amount ? `${(payload as any).amount} SOL` : "—",
      });

      try {
        await db.insert(webhookEvents).values({
          eventType,
          payload: JSON.stringify(payload),
          status: "processing",
        });
      } catch (e) {
        console.error("[webhook] event log insert failed (non-fatal):", (e as Error).message);
      }
      await logAudit({ path: "webhook.solana", action: `solana_webhook_${eventType}`, ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),
});
