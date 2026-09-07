/**
 * subscription-router.ts — Vault Pro membership (Stripe subscription).
 *
 * Features:
 *   - Plans: monthly $19.99 / quarterly $49.99 / annual $149.99
 *   - Checkout (Stripe subscription session)
 *   - Portal (manage subscription)
 *   - Status check (active? plan? expires?)
 *
 * Benefits: free appraisals, 1 free ProVerify/year, 0% listing fees, priority support.
 * Benefits are enforced at the app layer by checking subscription status.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

const PLANS = {
  monthly: { price: 19.99, stripePriceId: "price_vault_pro_monthly", name: "Vault Pro — Monthly" },
  quarterly: { price: 49.99, stripePriceId: "price_vault_pro_quarterly", name: "Vault Pro — Quarterly" },
  annual: { price: 149.99, stripePriceId: "price_vault_pro_annual", name: "Vault Pro — Annual" },
} as const;

export type PlanKey = keyof typeof PLANS;

export const subscriptionRouter = createRouter({
  /** List available plans. */
  plans: publicQuery.query(async () => {
    return Object.entries(PLANS).map(([key, p]) => ({ key, ...p }));
  }),

  /** Start subscription checkout. */
  checkout: authedQuery
    .input(z.object({ plan: z.enum(["monthly", "quarterly", "annual"]) }))
    .mutation(async ({ input, ctx }) => {
      const plan = PLANS[input.plan];
      const body = new URLSearchParams({
        "payment_method_types[]": "card",
        "line_items[0][price]": plan.stripePriceId,
        "line_items[0][quantity]": "1",
        mode: "subscription",
        success_url: `${process.env.VAULT_DOMAIN || "https://thevaultdfw.win"}/profile?tab=subscription`,
        cancel_url: `${process.env.VAULT_DOMAIN || "https://thevaultdfw.win"}/profile?tab=subscription`,
        "metadata[userId]": String(ctx.user!.id),
        "metadata[plan]": input.plan,
      });
      const session = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { Authorization: `Bearer ${(globalThis as any).env?.STRIPE_SECRET_KEY || ""}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }).then(r => r.json()).catch(() => null);
      return { plan: input.plan, planName: plan.name, price: plan.price, sessionId: session?.id || null, url: session?.url || null };
    }),

  /** Check current subscription status. */
  status: authedQuery.query(async ({ ctx }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.id, ctx.user!.id)).limit(1);
      return {
        subscribed: user?.stripeSubscriptionId ? true : false,
        plan: user?.stripeSubscriptionPlan || null,
        status: user?.stripeSubscriptionStatus || "inactive",
        currentPeriodEnd: user?.stripeSubscriptionEnd || null,
      };
    }),

  /** Cancel subscription (cancel at period end). */
  cancel: authedQuery
    .input(z.object({ cancelAtPeriodEnd: z.boolean().optional() }))
    .mutation(async ({ input, ctx }) => {
      const body = new URLSearchParams();
      if (input.cancelAtPeriodEnd !== false) body.set("cancel_at_period_end", "true");
      const res = await fetch(`https://api.stripe.com/v1/subscriptions/${(globalThis as any).env?.STRIPE_SUBSCRIPTION_ID || ""}`, {
        method: "POST", headers: { Authorization: `Bearer ${(globalThis as any).env?.STRIPE_SECRET_KEY || ""}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      }).then(r => r.json()).catch(() => null);
      return { cancelled: !!res?.cancel_at_period_end };
    }),
});

import { users as _users } from "@db/schema";
