/**
 * badges-router.ts — Collector badge & rank system.
 *
 * Ranks: Collector (new) -> Curator (5 sales) -> Appraiser (25) -> Dealer (100)
 * Badges are earned automatically based on activity.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc, sql } from "drizzle-orm";
import { users, orders } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

const RANKS = [
  { rank: "Collector", minSales: 0, icon: "🪙" },
  { rank: "Curator", minSales: 5, icon: "📋" },
  { rank: "Appraiser", minSales: 25, icon: "🔍" },
  { rank: "Dealer", minSales: 100, icon: "🏛️" },
];

export function getRank(salesCount: number): string {
  let rank = RANKS[0].rank;
  for (const r of RANKS) {
    if (salesCount >= r.minSales) rank = r.rank;
  }
  return rank;
}

export const badgesRouter = createRouter({
  /** Get the user's current rank + badge progress. */
  tier: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user!.id)).limit(1);
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
    const rank = getRank(Number(user.salesCount || 0));
    const currentRank = RANKS.find(r => r.rank === rank);
    const nextRank = RANKS.find(r => r.minSales > (currentRank?.minSales || 0));
    return {
      rank,
      icon: currentRank?.icon || "🪙",
      salesCount: Number(user.salesCount || 0),
      nextRank: nextRank?.rank || null,
      nextRankMinSales: nextRank?.minSales || null,
      progress: nextRank ? Math.min(100, Math.round((Number(user.salesCount || 0) / nextRank.minSales) * 100)) : 100,
    };
  }),

  /** Public leaderboard of top sellers by sales count. */
  leaderboard: publicQuery
    .input(z.object({ limit: z.number().min(1).max(100).optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      // users has no salesCount column — derive from paid orders per seller.
      const rows = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          salesCount: sql<number>`count(${orders.id})`,
          rank: users.role,
        })
        .from(users)
        .leftJoin(orders, eq(orders.sellerId, users.id))
        .where(sql`${orders.payoutStatus} = 'paid' OR ${orders.id} IS NULL`)
        .groupBy(users.id)
        .orderBy(desc(sql`count(${orders.id})`))
        .limit(input.limit || 20);
      return rows;
    }),
});
