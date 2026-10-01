/**
 * web-push-router.ts — Push notification subscriptions.
 *
 * Manages browser push notification subscriptions and sends notifications.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { logAudit, getClientIP } from "./security";

export const webPushRouter = createRouter({
  /** Register a push subscription. */
  subscribe: authedQuery
    .input(z.object({ endpoint: z.string().url(), keys: z.object({ p256dh: z.string(), auth: z.string() }).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(users).set({ pushSubscription: JSON.stringify(input) }).where(eq(users.id, ctx.user!.id));
      await logAudit({ path: "webPush.subscribe", userId: ctx.user!.id, action: "push_subscribed", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Unregister push notifications. */
  unsubscribe: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    await db.update(users).set({ pushSubscription: null }).where(eq(users.id, ctx.user!.id));
    await logAudit({ path: "webPush.unsubscribe", userId: ctx.user!.id, action: "push_unsubscribed", ip: getClientIP(ctx.req), method: "POST" });
    return { success: true };
  }),
});
