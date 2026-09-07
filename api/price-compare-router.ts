/**
 * price-compare-router.ts — Price comparison tool.
 *
 * Compares listing prices against category averages and historical snapshots.
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, sql, desc } from "drizzle-orm";
import { listings, priceSnapshots, categories } from "@db/schema";
import { TRPCError } from "@trpc/server";

export const priceCompareRouter = createRouter({
  /** Compare a listing against category average. */
  compare: publicQuery
    .input(z.object({ listingId: z.number().min(1) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId));
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      const categoryId = listing.categoryId;
      const [avg] = await db.select({ avg: sql<number>`COALESCE(AVG(CAST(price AS REAL)), 0)` }).from(listings).where(eq(listings.categoryId, categoryId)).where(eq(listings.status, "active"));
      const [min] = await db.select({ min: sql<number>`COALESCE(MIN(CAST(price AS REAL)), 0)` }).from(listings).where(eq(listings.categoryId, categoryId)).where(eq(listings.status, "active"));
      const [max] = await db.select({ max: sql<number>`COALESCE(MAX(CAST(price AS REAL)), 0)` }).from(listings).where(eq(listings.categoryId, categoryId)).where(eq(listings.status, "active"));
      const [median] = await db.select({ median: sql<number>`COALESCE(CAST(price AS REAL), 0)` }).from(listings).where(eq(listings.categoryId, categoryId)).where(eq(listings.status, "active")).orderBy(sql`ABS(CAST(price AS REAL) - ${Number(listing.price)})`).limit(1);
      const snapshots = await db.select().from(priceSnapshots).where(eq(priceSnapshots.listingId, input.listingId)).orderBy(desc(priceSnapshots.createdAt)).limit(30);
      return {
        listingPrice: Number(listing.price),
        categoryAvg: Number(avg?.avg || 0),
        categoryMin: Number(min?.min || 0),
        categoryMax: Number(max?.max || 0),
        categoryMedian: Number(median?.median || 0),
        isAboveAvg: Number(listing.price) > Number(avg?.avg || 0),
        history: snapshots,
      };
    }),
});
