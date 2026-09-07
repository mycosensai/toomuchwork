/**
 * curator-router.ts — Curated lists & editorial collection management.
 *
 * Powers the "Curated Collections" / "Vault Picks" browse page
 * and the collector showcase editor.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { curatedLists, showcaseListings, listings } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const curatorRouter = createRouter({
  /** List curated collections (public-facing). */
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(curatedLists).orderBy(desc(curatedLists.createdAt)).limit(20);
    return rows;
  }),

  /** Get a single curated collection by slug. */
  get: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db.select().from(curatedLists).where(eq(curatedLists.slug, input.slug)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      return row;
    }),

  /** Seller/curator: create a curated list. */
  create: authedQuery
    .input(z.object({ title: z.string().max(200), description: z.string().max(2000).optional(), category: z.string().max(100).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const insert = await db.insert(curatedLists).values({ title: input.title, description: input.description || null, category: input.category || null, slug: input.title.toLowerCase().replace(/\s+/g, "-").slice(0, 200) });
      const id = Number(insert.meta.last_row_id);
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "curator.create", userId: ctx.user!.id, action: "curated_created", details: `collection:${id}` });
      return { id };
    }),

  /** Add a listing to a curated list. */
  addListing: authedQuery
    .input(z.object({ listId: z.number().positive(), listingId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(showcaseListings).values({ showcaseId: input.listId, listingId: input.listingId });
      return { added: true };
    }),

  /** Remove listing from curated list. */
  removeListing: authedQuery
    .input(z.object({ listId: z.number().positive(), listingId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.delete(showcaseListings).where(eq(showcaseListings.showcaseId, input.listId)).where(eq(showcaseListings.listingId, input.listingId));
      return { removed: true };
    }),
});
