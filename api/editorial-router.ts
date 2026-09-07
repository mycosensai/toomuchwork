/**
 * editorial-router.ts — Editorial / blog content management.
 *
 * Powers the "Vault Picks" editorial section + curated articles.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { editorialArticles } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const editorialRouter = createRouter({
  /** List editorial articles (public-facing). */
  list: publicQuery
    .input(z.object({ limit: z.number().min(1).max(50).optional(), category: z.string().optional() }))
    .query(async ({ input }) => {
      const db = getDb();
      const where = input.category ? eq(editorialArticles.category, input.category) : undefined;
      const rows = await db.select().from(editorialArticles).where(where).orderBy(desc(editorialArticles.createdAt)).limit(input.limit || 20);
      return rows;
    }),

  /** Get a single article by slug. */
  get: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db.select().from(editorialArticles).where(eq(editorialArticles.slug, input.slug)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
      return row;
    }),

  /** Seller/editor: create an article. */
  create: authedQuery
    .input(z.object({ title: z.string().max(300), slug: z.string().max(300), category: z.string().max(100), excerpt: z.string().max(500).optional(), content: z.string().max(10000), tags: z.string().array(z.string()).optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const insert = await db.insert(editorialArticles).values({ title: input.title, slug: input.slug, category: input.category, excerpt: input.excerpt || null, content: input.content, tags: input.tags || null });
      const id = Number(insert.meta.last_row_id);
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "editorial.create", userId: ctx.user!.id, action: "article_created", details: `article:${id}` });
      return { id };
    }),
});
