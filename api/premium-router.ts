/**
 * premiumRouter — paywall + transparent Stripe checkout for premium reports.
 *
 * Endpoints:
 *   premium.pricing            (public)  — what each report costs + what's included
 *   premium.createCheckout     (authed)  — Stripe Checkout session (hosted)
 *   premium.verifyPayment      (authed)  — confirm paid + unlock target row
 *
 * The frontend shows the floating StripeCheckoutWidget (centered overlay)
 * whenever an unpaid appraisal/proverify report is viewed; the widget calls
 * createCheckout → redirects to Stripe → success URL returns to the same
 * page → verifyPayment unlocks the full report in place.
 */

import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { logAudit, getClientIP } from "./security";
import { createPremiumCheckout, fetchStripeSession, markPremiumPaid, PREMIUM_PRICES, dollarsToCents } from "./lib/premium-pay";

export const premiumRouter = createRouter({
  /** Transparent pricing + what's included — shown on the paywall itself. */
  pricing: publicQuery.query(() => ({
    appraisal: {
      amount: PREMIUM_PRICES.appraisal.dollars,
      includes: [
        "AI value estimate with low–high range",
        "Condition & authenticity readout",
        "Market analysis + comparable bands",
        "Factors increasing / decreasing value",
        "Email delivery of your full report",
      ],
    },
    proverify: {
      amount: PREMIUM_PRICES.proverify.dollars,
      includes: [
        "3-expert AI consensus review",
        "Authenticity / value / condition scores",
        "Red-flag & key-findings summary",
        "Recommended next steps",
        "Printable report with disclaimer",
      ],
    },
  })),

  /** Create a Stripe Checkout session for a premium report unlock. */
  createCheckout: authedQuery
    .input(
      z.object({
        type: z.enum(["appraisal", "proverify"]),
        targetId: z.number().int().positive(),
        itemName: z.string().max(300).optional().default(""),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // The target row must exist (and belong to the caller) BEFORE charging.
      if (input.type === "appraisal") {
        const { appraisals } = await import("@db/schema");
        const [row] = await db.select().from(appraisals).where(eq(appraisals.id, input.targetId)).limit(1);
        if (!row) throw new Error("Appraisal not found");
        if (row.userId && ctx.user?.id && row.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("You can only unlock your own appraisals");
        }
        if (row.paid) return { alreadyPaid: true, type: input.type, targetId: input.targetId, url: null, sessionId: "" };
      } else {
        const { expertApplications } = await import("@db/schema");
        const [row] = await db.select().from(expertApplications).where(eq(expertApplications.id, input.targetId)).limit(1);
        if (!row) throw new Error("Verification request not found");
        if (row.userId && ctx.user?.id && row.userId !== ctx.user.id && ctx.user.role !== "admin") {
          throw new Error("You can only unlock your own verification requests");
        }
        if (row.paid) return { alreadyPaid: true, type: input.type, targetId: input.targetId, url: null, sessionId: "" };

        // Charge the TIER fee stored on the application (standard/express/rush)
        // so what the customer pays matches what the submit form advertised.
        const tierAmount = row.reviewFee ? dollarsToCents(row.reviewFee) : PREMIUM_PRICES.proverify.cents;
        const tierLabel = row.reviewFee ? `$${parseFloat(String(row.reviewFee)).toFixed(2)}` : PREMIUM_PRICES.proverify.dollars;
        const itemName = input.itemName || row.itemName;
        const result = await createPremiumCheckout({
          type: input.type,
          itemName,
          userId: ctx.user?.id,
          targetId: input.targetId,
          successUrl: input.successUrl,
          cancelUrl: input.cancelUrl,
          cents: tierAmount,
          amountLabel: tierLabel,
        });
        return { alreadyPaid: false, ...result };
      }

      const itemName = input.itemName || (input.type === "appraisal" ? "item" : "item");
      const result = await createPremiumCheckout({
        type: input.type,
        itemName,
        userId: ctx.user?.id,
        targetId: input.targetId,
        successUrl: input.successUrl,
        cancelUrl: input.cancelUrl,
      });

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "premium.createCheckout",
        userId: ctx.user?.id,
        action: "premium_checkout_created",
        details: `${input.type}:${input.targetId} session:${result.sessionId} amount:${result.amount}`,
      });

      return { alreadyPaid: false, ...result };
    }),

  /** Verify Stripe payment and unlock the report. Returns the paid row. */
  verifyPayment: authedQuery
    .input(
      z.object({
        type: z.enum(["appraisal", "proverify"]),
        targetId: z.number().int().positive(),
        sessionId: z.string().min(4),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { payment_status } = await fetchStripeSession(input.sessionId);
      if (payment_status !== "paid") {
        return { success: false, status: payment_status, message: "Payment not complete" };
      }

      const paid = await markPremiumPaid(input.type, input.targetId);
      if (!paid) throw new Error(`${input.type === "appraisal" ? "Appraisal" : "Verification request"} not found`);

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "premium.verifyPayment",
        userId: ctx.user?.id,
        action: "premium_report_unlocked",
        details: `${input.type}:${input.targetId}`,
      });

      return { success: true, paid, message: "Report unlocked" };
    }),
});
