import { z } from "zod";
import { createRouter, publicQuery, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { forumPosts, forumReplies, users } from "@db/schema";
import { desc, eq, sql, and } from "drizzle-orm";
import { logAudit, getClientIP } from "./security";

// ─── Link decimation ───
// Strip any URL from content for non-admin users to prevent spam/scam links
function stripLinks(text: string): string {
  // Remove http/https/ftp URLs
  return text.replace(/https?:\/\/[^\s<>"']+/gi, "[LINK REMOVED]")
    .replace(/www\.[^\s<>"']+/gi, "[LINK REMOVED]")
    // Remove bare domains like example.com
    .replace(/\b[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.[a-z]{2,}(?:\/[^\s<>"']*)?/gi, "[LINK REMOVED]");
}

export const forumRouter = createRouter({
  // ─── List posts ───
  listPosts: publicQuery
    .input(z.object({
      category: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const where = input.category
        ? eq(forumPosts.category, input.category)
        : undefined;

      const [posts, countResult] = await Promise.all([
        db
          .select()
          .from(forumPosts)
          .where(where)
          .orderBy(desc(forumPosts.isPinned), desc(forumPosts.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(forumPosts)
          .where(where),
      ]);

      return {
        posts: posts.map(p => ({
          ...p,
          content: p.content.substring(0, 300) + (p.content.length > 300 ? "..." : ""),
        })),
        total: Number(countResult[0]?.count || 0),
        page: input.page,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / input.limit),
      };
    }),

  // ─── Get single post ───
  getPost: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [post] = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, input.id))
        .limit(1);

      if (!post) throw new Error("Post not found");

      const replies = await db
        .select()
        .from(forumReplies)
        .where(eq(forumReplies.postId, input.id))
        .orderBy(forumReplies.createdAt);

      return { post, replies };
    }),

  // ─── Create post ───
  createPost: authedQuery
    .input(z.object({
      title: z.string().min(1).max(200),
      content: z.string().min(1).max(10000),
      category: z.string().default("general"),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;
      const isAdmin = ctx.user!.role === "admin";

      // Strip links for non-admin users
      const sanitizedContent = isAdmin ? input.content : stripLinks(input.content);

      const result = await db.insert(forumPosts).values({
        userId,
        userName: ctx.user!.name || "Anonymous",
        userAvatar: ctx.user!.avatar,
        title: input.title,
        content: sanitizedContent,
        category: input.category,
      });

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "forum.createPost",
        userId,
        action: "forum_create",
        details: `title:${input.title} category:${input.category}`,
      });

      return { ok: true, id: Number(result.meta.last_row_id) };
    }),

  // ─── Reply to post ───
  replyToPost: authedQuery
    .input(z.object({
      postId: z.number(),
      content: z.string().min(1).max(5000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;
      const isAdmin = ctx.user!.role === "admin";

      // Check post exists and not locked
      const [post] = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, input.postId))
        .limit(1);

      if (!post) throw new Error("Post not found");
      if (post.isLocked) throw new Error("Post is locked");

      // Strip links for non-admin users
      const sanitizedContent = isAdmin ? input.content : stripLinks(input.content);

      await db.insert(forumReplies).values({
        postId: input.postId,
        userId,
        userName: ctx.user!.name || "Anonymous",
        userAvatar: ctx.user!.avatar,
        content: sanitizedContent,
      });

      // Update reply count
      await db
        .update(forumPosts)
        .set({ replyCount: post.replyCount + 1, updatedAt: new Date() })
        .where(eq(forumPosts.id, input.postId));

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "forum.replyToPost",
        userId,
        action: "forum_reply",
        details: `postId:${input.postId}`,
      });

      return { ok: true };
    }),

  // ─── Delete post (admin only) ───
  deletePost: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(forumReplies).where(eq(forumReplies.postId, input.id));
      await db.delete(forumPosts).where(eq(forumPosts.id, input.id));
      return { ok: true };
    }),

  // ─── Pin/unpin post (admin only) ───
  togglePin: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [post] = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, input.id))
        .limit(1);
      if (!post) throw new Error("Post not found");

      await db
        .update(forumPosts)
        .set({ isPinned: !post.isPinned, updatedAt: new Date() })
        .where(eq(forumPosts.id, input.id));

      return { ok: true, isPinned: !post.isPinned };
    }),

  // ─── Lock/unlock post (admin only) ───
  toggleLock: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [post] = await db
        .select()
        .from(forumPosts)
        .where(eq(forumPosts.id, input.id))
        .limit(1);
      if (!post) throw new Error("Post not found");

      await db
        .update(forumPosts)
        .set({ isLocked: !post.isLocked, updatedAt: new Date() })
        .where(eq(forumPosts.id, input.id));

      return { ok: true, isLocked: !post.isLocked };
    }),

  // ─── Categories (list distinct) ───
  listCategories: publicQuery.query(async () => {
    const db = getDb();
    const result = await db
      .select({ category: forumPosts.category, count: sql<number>`count(*)` })
      .from(forumPosts)
      .groupBy(forumPosts.category)
      .orderBy(forumPosts.category);

    return result;
  }),
});
