/**
 * Email Router
 * Handles sending appraisal results via email
 * Integrated with Resend API for Cloudflare Workers
 */

import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appraisals } from "@db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";
import { sendEmail, buildAppraisalEmail } from "./email-service";
import { logAudit, getClientIP } from "./security";

export const emailRouter = createRouter({
  /**
   * Send appraisal results via email
   * Requires authentication; sends to the logged-in user's email on file
   */
  sendAppraisalResult: authedQuery
    .input(
      z.object({
        appraisalId: z.number(),
        paymentLink: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      if (!ctx.user?.email) {
        return { success: false, error: "No email on file for this account" };
      }

      const [appraisal] = await db
        .select()
        .from(appraisals)
        .where(eq(appraisals.id, input.appraisalId))
        .limit(1);

      if (!appraisal) {
        return { success: false, error: "Appraisal not found" };
      }

      const ev = Number(appraisal.estimatedValue) || 0;
      const low = Number(appraisal.valueRangeLow) || ev * 0.5;
      const high = Number(appraisal.valueRangeHigh) || ev * 1.5;
      const commissionRate = appraisal.commissionRate || "5.00";
      const commissionEstimate = ev * (parseFloat(commissionRate) / 100);

      const payLink =
        input.paymentLink ||
        `${ctx.req ? new URL(ctx.req.url).origin : "https://thevaultdfw.win"}/proverify?appraisalId=${input.appraisalId}`;

      const { html, text } = buildAppraisalEmail(
        appraisal.itemName,
        ev,
        low,
        high,
        appraisal.confidence || "medium",
        appraisal.condition || "Not assessed",
        appraisal.marketAnalysis || "No market analysis available.",
        commissionRate,
        commissionEstimate,
        payLink
      );

      const result = await sendEmail({
        to: ctx.user.email,
        subject: `Your AI Appraisal for "${appraisal.itemName}" — $${ev.toLocaleString()}`,
        html,
        text,
      });

      if (!result.success) {
        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "email.sendAppraisalResult",
          userId: ctx.user.id,
          action: "email_failed",
          details: `appraisal:${input.appraisalId} to:${ctx.user.email} error:${result.error}`,
        });
        return { success: false, error: result.error };
      }

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "email.sendAppraisalResult",
        userId: ctx.user.id,
        action: "email_sent",
        details: `appraisal:${input.appraisalId} to:${ctx.user.email} value:$${ev}`,
      });

      return {
        success: true,
        message: `Appraisal sent to ${ctx.user.email}`,
        emailId: result.id,
      };
    }),

  /**
   * Test email configuration
   */
  testConfig: publicQuery.query(async () => {
    return { configured: !!(env as any).resendApiKey };
  }),
});
