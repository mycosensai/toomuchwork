import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { messages, users } from "@db/schema";
import { desc, eq, sql, or, and } from "drizzle-orm";
import { logAudit, getClientIP } from "./security";

export const messagesRouter = createRouter({
  // ─── Inbox (messages received) ───
  inbox: authedQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;
      const offset = (input.page - 1) * input.limit;

      const [msgs, countResult] = await Promise.all([
        db
          .select()
          .from(messages)
          .where(eq(messages.recipientId, userId))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(eq(messages.recipientId, userId)),
      ]);

      return {
        messages: msgs,
        total: Number(countResult[0]?.count || 0),
        unread: msgs.filter(m => !m.isRead).length,
        page: input.page,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / input.limit),
      };
    }),

  // ─── Outbox (messages sent) ───
  outbox: authedQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;
      const offset = (input.page - 1) * input.limit;

      const [msgs, countResult] = await Promise.all([
        db
          .select()
          .from(messages)
          .where(eq(messages.senderId, userId))
          .orderBy(desc(messages.createdAt))
          .limit(input.limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)` })
          .from(messages)
          .where(eq(messages.senderId, userId)),
      ]);

      return {
        messages: msgs,
        total: Number(countResult[0]?.count || 0),
        page: input.page,
        totalPages: Math.ceil(Number(countResult[0]?.count || 0) / input.limit),
      };
    }),

  // ─── Send message ───
  send: authedQuery
    .input(z.object({
      recipientId: z.number(),
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const senderId = ctx.user!.id;

      // Validate recipient exists
      const [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.id, input.recipientId))
        .limit(1);

      if (!recipient) throw new Error("Recipient not found");

      await db.insert(messages).values({
        senderId,
        senderName: ctx.user!.name || "Unknown",
        recipientId: input.recipientId,
        recipientName: recipient.name || "Unknown",
        subject: input.subject,
        body: input.body,
      });

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "messages.send",
        userId: senderId,
        action: "message_send",
        details: `to:${input.recipientId} subject:${input.subject}`,
      });

      return { ok: true };
    }),

  // ─── Mark as read ───
  markRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .update(messages)
        .set({ isRead: true })
        .where(and(
          eq(messages.id, input.id),
          eq(messages.recipientId, ctx.user!.id)
        ));
      return { ok: true };
    }),

  // ─── Delete message ───
  delete: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db
        .delete(messages)
        .where(and(
          eq(messages.id, input.id),
          or(eq(messages.senderId, ctx.user!.id), eq(messages.recipientId, ctx.user!.id))
        ));
      return { ok: true };
    }),

  // ─── Get unread count ───
  unreadCount: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(
        eq(messages.recipientId, ctx.user!.id),
        eq(messages.isRead, false)
      ));
    return { count: Number(result?.count || 0) };
  }),

  // ─── Reply to message ───
  reply: authedQuery
    .input(z.object({
      parentMessageId: z.number(),
      body: z.string().min(1).max(10000),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const senderId = ctx.user!.id;

      const [parent] = await db
        .select()
        .from(messages)
        .where(eq(messages.id, input.parentMessageId))
        .limit(1);

      if (!parent) throw new Error("Parent message not found");

      // Determine recipient: if I'm the sender, reply goes to original recipient
      const isSender = parent.senderId === senderId;
      const recipientId = isSender ? parent.recipientId : parent.senderId;

      const [recipient] = await db
        .select()
        .from(users)
        .where(eq(users.id, recipientId))
        .limit(1);

      if (!recipient) throw new Error("Recipient not found");

      await db.insert(messages).values({
        senderId,
        senderName: ctx.user!.name || "Unknown",
        recipientId,
        recipientName: recipient.name || "Unknown",
        subject: `Re: ${parent.subject}`,
        body: input.body,
        parentMessageId: input.parentMessageId,
      });

      return { ok: true };
    }),

  // ─── Get conversation thread ───
  thread: authedQuery
    .input(z.object({ messageId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;

      const [root] = await db
        .select()
        .from(messages)
        .where(and(
          eq(messages.id, input.messageId),
          or(eq(messages.senderId, userId), eq(messages.recipientId, userId))
        ))
        .limit(1);

      if (!root) throw new Error("Message not found");

      // Get all messages in the thread
      const threadMsgs = await db
        .select()
        .from(messages)
        .where(or(
          eq(messages.id, root.parentMessageId || 0),
          eq(messages.parentMessageId, root.id),
          eq(messages.id, root.id),
        ))
        .orderBy(messages.createdAt);

      return { messages: threadMsgs };
    }),

  // ─── List all user conversations (admin: all users, user: own) ───
  conversations: authedQuery
    .input(z.object({ page: z.number().default(1), limit: z.number().default(20) }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const userId = ctx.user!.id;

      // Get latest message per conversation partner
      const offset = (input.page - 1) * input.limit;

      const convos = await db.all(sql`
        SELECT m.* FROM messages m
        INNER JOIN (
          SELECT 
            CASE 
              WHEN sender_id = ${userId} THEN recipient_id 
              ELSE sender_id 
            END as other_user,
            MAX(created_at) as max_created
          FROM messages
          WHERE sender_id = ${userId} OR recipient_id = ${userId}
          GROUP BY other_user
        ) latest ON (
          (m.sender_id = ${userId} AND m.recipient_id = latest.other_user)
          OR (m.recipient_id = ${userId} AND m.sender_id = latest.other_user)
        ) AND m.created_at = latest.max_created
        ORDER BY m.created_at DESC
        LIMIT ${input.limit} OFFSET ${offset}
      `);

      return { conversations: convos || [] };
    }),
});
