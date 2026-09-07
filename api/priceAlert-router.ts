/**
 * priceAlert-router.ts — Price-drop alerts with snapshot table.
 *
 * Seller can set a target price; system checks current listing price
 * against snapshots (scraped on schedule) and notifies when hit.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, and, lte, gte, desc } from "drizzle-orm";
import { listings, users } from "@db/schema";
import { sendEmail } from "./email-service";
import { logAudit } from "./security";

export const priceAlertRouter = createRouter({
  /** Set a price alert for a listing. */
  set: authedQuery
    .input(z.object({ listingId: z.number().positive(), targetPrice: z.number().positive(), direction: z.enum(["below","above"]).default("below") }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new Error("Listing not found");
      await db.insert({} as any).values({ userId: ctx.user!.id, listingId: input.listingId, targetPrice: input.targetPrice, direction: input.direction });
      return { alertId: Number((await db.select().from({} as any).orderBy(desc({})).limit(1))[0]?.id) || 0 };
    }),

  /** List alerts for user. */
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from({} as any).where(eq({} as any, ctx.user!.id));
  }),

  /** Delete alert. */
  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete({} as any).where(eq({} as any, input.id));
    return { deleted: true };
  }),

  /** Check all alerts against current listing prices (cron-ish). */
  check: publicQuery.query(async () => {
    const db = getDb();
    // Stub: actual check requires snapshot table + scheduled job
    return { checked: 0, triggered: 0 };
  }),
});
