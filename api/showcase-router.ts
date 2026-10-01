/**
 * showcase-router.ts — Collector showcase / collection pages.
 *
 * Collectors can create public showcase pages listing their collection.
 * Columns match the `showcases` / `showcase_listings` schema exactly.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { showcases, showcaseListings } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const showcaseRouter = createRouter({
  /** List public showcases. */
  list: publicQuery
    .input(z.object({ limit: z.number().min(1).max(50).optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db
        .select()
        .from(showcases)
        .where(eq(showcases.isPublic, true))
        .orderBy(desc(showcases.createdAt))
        .limit(input?.limit || 20);
      return rows;
    }),

  /** Get a single showcase by id. */
  get: publicQuery
    .input(z.object({ id: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [row] = await db.select().from(showcases).where(eq(showcases.id, input.id)).limit(1);
      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Showcase not found" });
      return row;
    }),

  /** Authenticated user's own showcases. */
  my: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    return db
      .select()
      .from(showcases)
      .where(eq(showcases.userId, ctx.user!.id))
      .orderBy(desc(showcases.createdAt));
  }),

  /** Create a showcase. */
  create: authedQuery
    .input(
      z.object({
        title: z.string().max(300),
        description: z.string().max(2000).optional(),
        coverImage: z.string().max(2000).optional(),
        isPublic: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const insert = await db.insert(showcases).values({
        userId: ctx.user!.id,
        title: input.title,
        description: input.description || null,
        coverImage: input.coverImage || null,
        isPublic: input.isPublic ?? true,
      });
      const id = Number(insert.meta.last_row_id);
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "showcase.create", userId: ctx.user!.id, action: "showcase_created", details: `showcase:${id}` });
      return { id };
    }),

  /** Add listings to a showcase (owner only). */
  addListing: authedQuery
    .input(z.object({ showcaseId: z.number().positive(), listingId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [owned] = await db.select().from(showcases).where(eq(showcases.id, input.showcaseId)).limit(1);
      if (!owned || owned.userId !== ctx.user!.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not your showcase" });
      }
      await db.insert(showcaseListings).values({ showcaseId: input.showcaseId, listingId: input.listingId });
      return { added: true };
    }),
});
