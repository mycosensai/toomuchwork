/**
 * moderation-router.ts — Content moderation queue.
 *
 * Admin-side moderation for blog posts, curated collections, and user-generated content.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { editorialArticles } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const moderationRouter = createRouter({
  /** Get pending content for moderation. */
  pending: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(editorialArticles).where(eq(editorialArticles.status, "pending")).orderBy(desc(editorialArticles.createdAt));
    return rows;
  }),

  /** Approve content. */
  approve: authedQuery
    .input(z.object({ contentId: z.number().min(1), notes: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(editorialArticles).set({ status: "approved", moderatedBy: ctx.user!.id, moderatedAt: new Date() }).where(eq(editorialArticles.id, input.contentId));
      await logAudit({ path: "moderation.approveContent", userId: ctx.user!.id, action: "content_approved", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Reject content. */
  reject: authedQuery
    .input(z.object({ contentId: z.number().min(1), reason: z.string().min(5) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(editorialArticles).set({ status: "rejected", moderationNotes: input.reason, moderatedBy: ctx.user!.id, moderatedAt: new Date() }).where(eq(editorialArticles.id, input.contentId));
      await logAudit({ path: "moderation.rejectContent", userId: ctx.user!.id, action: "content_rejected", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Flag suspicious content via AI. */
  flagSuspicious: authedQuery
    .input(z.object({ contentId: z.number().min(1), reason: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(editorialArticles).set({ status: "flagged", moderationNotes: input.reason, moderatedBy: ctx.user!.id, moderatedAt: new Date() }).where(eq(editorialArticles.id, input.contentId));
      await logAudit({ path: "moderation.flagContent", userId: ctx.user!.id, action: "content_flagged", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),
});
