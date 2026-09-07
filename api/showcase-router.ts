/**
 * showcase-router.ts — Collector showcase / collection pages.
 *
 * Collectors can create public showcase pages listing their collection.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { showcases } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const showcaseRouter = createRouter({
  /** List public showcases. */
  list: publicQuery
    .input(z.object({ limit: z.number().min(1).max(50).optional(), sellerId: z.number().positive().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.sellerId ? eq(showcases.sellerId, input.sellerId) : undefined;
      const rows = await db.select().from(showcases).where(where).orderBy(desc(showcases.createdAt)).limit(input.limit || 20);
      return rows;
    }),

  /** Get a single showcase by slug. */
  get: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db.select().from(showcases).where(eq(showcases.slug, input.slug)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Showcase not found" });
      return row;
    }),

  /** Seller: create a showcase. */
  create: authedQuery
    .input(z.object({ title: z.string().max(300), slug: z.string().max(300), description: z.string().max(2000).optional(), category: z.string().max(100).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const insert = await db.insert(showcases).values({ title: input.title, slug: input.slug, description: input.description || null, category: input.category || null, sellerId: ctx.user!.id });
      const id = Number(insert.meta.last_row_id);
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "showcase.create", userId: ctx.user!.id, action: "showcase_created", details: `showcase:${id}` });
      return { id };
    }),

  /** Seller: add listings to showcase. */
  addListing: authedQuery
    .input(z.object({ showcaseId: z.number().positive(), listingId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.insert(showcaseListings).values({ showcaseId: input.showcaseId, listingId: input.listingId });
      return { added: true };
    }),
});
