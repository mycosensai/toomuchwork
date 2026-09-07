/**
 * analytics-router.ts — Seller analytics & dashboard metrics.
 *
 * Provides revenue trends, conversion rates, listing views, top performers.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc, sql } from "drizzle-orm";
import { sellerDashboardMetrics, listings, orders, priceSnapshots, offers } from "@db/schema";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = createRouter({
  /** Get seller dashboard metrics. */
  dashboard: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const sellerId = ctx.user!.id;
    const [metrics] = await db.select().from(sellerDashboardMetrics).where(eq(sellerDashboardMetrics.sellerId, sellerId)).orderBy(desc(sellerDashboardMetrics.period)).limit(1);
    const [totalRevenue] = await db.select({ total: sql<number>`COALESCE(SUM(price), 0)` }).from(orders).where(eq(orders.sellerId, sellerId)).where(eq(orders.status, "completed"));
    const [totalListings] = await db.select({ count: sql<number>`COUNT(*)` }).from(listings).where(eq(listings.sellerId, sellerId)).where(eq(listings.status, "active"));
    const [avgPrice] = await db.select({ avg: sql<number>`COALESCE(AVG(price), 0)` }).from(listings).where(eq(listings.sellerId, sellerId));
    const recentViews = await db.select({ listingId: listings.id, views: listings.viewCount }).from(listings).where(eq(listings.sellerId, sellerId)).limit(5);
    const topOffer = await db.select({ amount: offers.amount }).from(offers).where(eq(offers.listingId, listings.id)).orderBy(desc(offers.amount)).limit(1);
    return {
      totalRevenue: Number(totalRevenue?.total || 0),
      totalListings: Number(totalListings?.count || 0),
      avgPrice: Number(avgPrice?.avg || 0),
      recentViews,
    };
  }),

  /** Get revenue trends by period. */
  revenueTrends: authedQuery
    .input(z.object({ period: z.enum(["weekly", "monthly", "yearly"]).optional() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const period = input.period || "monthly";
      const sellerId = ctx.user!.id;
      const rows = await db.select({
        period: orders.createdAt,
        revenue: sql<number>`COALESCE(SUM(price), 0)`,
      }).from(orders).where(eq(orders.sellerId, sellerId)).where(eq(orders.status, "completed")).orderBy(desc(orders.createdAt)).limit(12);
      return rows;
    }),

  /** Get listing views and conversion rates. */
  listingStats: authedQuery
    .input(z.object({ listingId: z.number().min(1) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).where(eq(listings.sellerId, ctx.user!.id));
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      const [views] = await db.select({ count: sql<number>`COALESCE(SUM(viewCount), 0)` }).from(listings).where(eq(listings.id, input.listingId));
      const [offersCount] = await db.select({ count: sql<number>`COUNT(*)` }).from(offers).where(eq(offers.listingId, input.listingId));
      return { views: Number(views?.count || 0), offersCount: Number(offersCount?.count || 0) };
    }),
});
