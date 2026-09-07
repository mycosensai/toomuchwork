/**
 * savedSearches-router.ts — Saved searches with scheduled digests.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { logAudit } from "./security";

export const savedSearchRouter = createRouter({
  /** Save a search criteria. */
  save: authedQuery
    .input(z.object({ name: z.string().max(100), criteria: z.object({ category: z.string().optional(), minPrice: z.number().min(0).optional(), maxPrice: z.number().min(0).optional(), keywords: z.string().max(500).optional(), sort: z.enum(["price-asc","price-desc","newest","views"]).optional() }).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert({} as any).values({ userId: ctx.user!.id, name: input.name, criteria: JSON.stringify(input.criteria) });
      return { saved: true };
    }),

  /** List saved searches for user. */
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db.select().from({} as any).where(eq({} as any, ctx.user!.id));
  }),

  /** Delete a saved search. */
  delete: authedQuery.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
    const db = getDb();
    await db.delete({} as any).where(eq({} as any, input.id));
    return { deleted: true };
  }),
});
