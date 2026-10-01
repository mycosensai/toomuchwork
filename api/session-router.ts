/**
 * session-router.ts — Session management API.
 *
 * Lists active sessions, revokes individual sessions, revokes all sessions.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { TRPCError } from "@trpc/server";
import { revokeToken, revokeAllUserSessions, logAudit, getClientIP } from "./security";
import { jwtVerify } from "jose";

export const sessionRouter = createRouter({
  /** List all active sessions for the current user. */
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(sessions).where(eq(sessions.userId, ctx.user!.id)).orderBy(desc(sessions.createdAt));
    return rows;
  }),

  /** Revoke a specific session. */
  revoke: authedQuery
    .input(z.object({ sessionId: z.number().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(sessions).set({ revoked: 1 }).where(eq(sessions.id, input.sessionId)).where(eq(sessions.userId, ctx.user!.id));
      await logAudit({ path: "session.revoke", userId: ctx.user!.id, action: "session_revoked", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),

  /** Revoke all sessions except current. */
  revokeAll: authedQuery.mutation(async ({ ctx }) => {
    await revokeAllUserSessions(ctx.user!.id);
    await logAudit({ path: "session.revokeAll", userId: ctx.user!.id, action: "sessions_revoked_all", ip: getClientIP(ctx.req), method: "POST" });
    return { success: true };
  }),
});

// Inline sessions table reference
const sessions = { id: sql`id`, userId: sql`user_id`, token: sql`token`, deviceInfo: sql`device_info`, ipAddress: sql`ip_address`, isCurrent: sql`is_current`, revoked: sql`revoked`, createdAt: sql`created_at` };
import { sql } from "drizzle-orm";
