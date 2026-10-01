/**
 * referral-router.ts — Referral & affiliate tracking system.
 *
 * Generate referral links, track clicks/conversions, compute stats.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc, sql } from "drizzle-orm";
import { users, referralLinks } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";
import { randomBytes } from "crypto";
import { notifyTelegram } from "./lib/telegram";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export const referralRouter = createRouter({
  /** Generate a referral link for the current user. */
  generateLink: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user!.id;
    const code = generateReferralCode();
    await db.insert(referralLinks).values({ userId, code });
    await logAudit({ path: "referral.generateLink", userId, action: "referral_link_generated", ip: getClientIP(ctx.req), method: "POST" });
    return { code, link: `${process.env.VAULT_DOMAIN || "https://thevaultdfw.win"}/ref=${code}` };
  }),

  /** Track a referral click. */
  trackClick: publicQuery
    .input(z.object({ code: z.string().length(8) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [link] = await db.select().from(referralLinks).where(eq(referralLinks.code, input.code));
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
      await db.update(referralLinks).set({ clicks: link.clicks + 1 }).where(eq(referralLinks.id, link.id));
      return { success: true };
    }),

  /** Track a referral conversion (when a referred user makes a purchase). */
  trackConversion: authedQuery
    .input(z.object({ code: z.string().length(8), amount: z.number().min(0) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [link] = await db.select().from(referralLinks).where(eq(referralLinks.code, input.code));
      if (!link) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid referral code" });
      await db.update(referralLinks).set({ conversions: link.conversions + 1, revenue: link.revenue + input.amount }).where(eq(referralLinks.id, link.id));
      // Award bonus to referrer
      await db.update(users).set({ memberPoints: sql<number>`member_points + 10` }).where(eq(users.id, link.userId));
      await logAudit({ path: "referral.trackConversion", userId: link.userId, action: "referral_conversion", ip: getClientIP(ctx.req), method: "POST" });
      await notifyTelegram("🤝 REFERRAL CONVERTED", {
        "Code": input.code,
        "Value": `$${input.amount}`,
        "Referrer": `#${link.userId}`,
      });
      return { success: true };
    }),

  /** Get referral stats for the current user. */
  stats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user!.id;
    const [stats] = await db.select({
      totalClicks: sql<number>`COALESCE(SUM(clicks), 0)`,
      totalConversions: sql<number>`COALESCE(SUM(conversions), 0)`,
      totalRevenue: sql<number>`COALESCE(SUM(revenue), 0)`,
    }).from(referralLinks).where(eq(referralLinks.userId, userId));
    return { clicks: Number(stats?.totalClicks || 0), conversions: Number(stats?.totalConversions || 0), revenue: Number(stats?.totalRevenue || 0) };
  }),
});
