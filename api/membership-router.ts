/**
 * membership-router.ts — Membership badge + tier system.
 *
 * Ranks: Collector (new) -> Curator (5 sales) -> Appraiser (25) -> Dealer (100)
 * Badges are earned automatically; verified on profile.
 * Ties to stripe subscription + sales count for Vault Pro tier.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc, gte } from "drizzle-orm";
import { users, orders, listings } from "@db/schema";
import { logAudit, getClientIP } from "./security";

export const membershipRouter = createRouter({
  /** Compute current tier + next tier info for a user. */
  tier: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user!.id)).limit(1);
    if (!user) throw new Error("User not found");

    const totalSales = await db.select({ cnt: db.$functions.count() }).from(orders).where(eq(orders.sellerId, ctx.user!.id)).then(r => Number(r[0]?.cnt) || 0);
    const totalListings = await db.select({ cnt: db.$functions.count() }).from(listings).where(eq(listings.sellerId, ctx.user!.id)).then(r => Number(r[0]?.cnt) || 0);

    const tiers = [
      { rank: "Collector", badge: "🟢", threshold: 0 },
      { rank: "Curator", badge: "🔵", threshold: 5 },
      { rank: "Appraiser", badge: "🟡", threshold: 25 },
      { rank: "Dealer", badge: "🟣", threshold: 100 },
    ];
    let current = tiers[0];
    for (const t of tiers) { if (totalSales >= t.threshold) current = t; }
    const next = tiers.find(t => t.threshold > current.threshold);

    return {
      rank: current.rank,
      badge: current.badge,
      salesCount: totalSales,
      listingsCount: totalListings,
      nextRank: next?.rank || null,
      nextThreshold: next?.threshold || null,
      progress: next ? Math.min((totalSales / next.threshold) * 100, 100) : 100,
      isVaultPro: !!user?.stripeSubscriptionId,
      benefits: {
        freeAppraisals: !!user?.stripeSubscriptionId,
        freeProVerify: (totalSales >= 5) || !!user?.stripeSubscriptionId,
        zeroListingFees: !!user?.stripeSubscriptionId,
        prioritySupport: !!user?.stripeSubscriptionId,
      },
    };
  }),

  /** List all members (leaderboard, top by sales). */
  leaderboard: publicQuery
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select({ userId: users.id, name: users.name, avatar: users.avatar }).from(users).orderBy(desc(db.$functions.count()).map(orders.sellerId)).limit(input.limit || 20);
      return rows;
    }),
});
