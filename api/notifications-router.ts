/**
 * notifications-router.ts — In-app notification inbox.
 *
 * Powers the notification bell + unread count across all pages.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { notifications } from "@db/schema";
import { logAudit, getClientIP } from "./security";

export const notificationsRouter = createRouter({
  /** List notifications for the current user (paginated). */
  list: authedQuery
    .input(z.object({ limit: z.number().min(1).max(100).optional(), offset: z.number().min(0).optional() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const limit = input.limit || 50;
      const offset = input.offset || 0;
      const rows = await db.select().from(notifications).where(eq(notifications.userId, ctx.user!.id)).orderBy(desc(notifications.createdAt)).limit(limit).offset(offset);
      return rows;
    }),

  /** Get unread count. */
  unreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [row] = await db.select({ count: eq(notifications.isRead, 0) }).from(notifications).where(eq(notifications.userId, ctx.user!.id)).where(eq(notifications.isRead, 0));
    return { unread: Number(row?.count || 0) };
  }),

  /** Mark a notification as read. */
  markRead: authedQuery
    .input(z.object({ id: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.id, input.id)).where(eq(notifications.userId, ctx.user!.id));
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "notifications.markRead", userId: ctx.user!.id, action: "notification_read", details: `notification:${input.id}` });
      return { id: input.id };
    }),

  /** Mark all notifications as read. */
  markAllRead: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.userId, ctx.user!.id)).where(eq(notifications.isRead, 0));
    return { marked: true };
  }),
});
