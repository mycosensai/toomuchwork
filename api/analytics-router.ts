import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, sql, desc } from "drizzle-orm";
import { listings, orders } from "@db/schema";
import { TRPCError } from "@trpc/server";

export const analyticsRouter = createRouter({
  dashboard: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user!.id;
    const [listingCount] = await db.select({ count: sql<number>`count(*)` }).from(listings).where(eq(listings.sellerId, userId));
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.sellerId, userId));
    return {
      listings: listingCount?.count || 0,
      orders: orderCount?.count || 0,
    };
  }),
  revenueTrends: authedQuery
    .input(z.object({ days: z.number().min(1).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;
      const rows = await db.select({ date: sql<string>`date(created_at)`, total: sql<number>`sum(amount)` }).from(orders).where(eq(orders.sellerId, userId)).groupBy(sql`date(created_at)`).orderBy(sql`date(created_at) DESC`).limit(input.days);
      return rows;
    }),
  listingStats: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user!.id;
    const rows = await db.select({ id: listings.id, title: listings.title, views: listings.views, createdAt: listings.createdAt }).from(listings).where(eq(listings.sellerId, userId)).orderBy(desc(listings.createdAt)).limit(20);
    return rows;
  }),
});
