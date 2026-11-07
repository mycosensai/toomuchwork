/**
 * session-router.ts — Session management API.
 *
 * Lists active sessions, revokes individual sessions, revokes all sessions.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { and, desc, eq } from "drizzle-orm";
import { sessions } from "@db/schema";
import { revokeAllUserSessions, logAudit, getClientIP } from "./security";

export const sessionRouter = createRouter({
  /** List all active sessions for the current user. */
  list: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const rows = await db.select().from(sessions).where(and(eq(sessions.userId, ctx.user!.id), eq(sessions.revoked, 0))).orderBy(desc(sessions.createdAt));
    return rows;
  }),

  /** Revoke a specific session. */
  revoke: authedQuery
    .input(z.object({ sessionId: z.number().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(sessions).set({ revoked: 1 }).where(and(eq(sessions.id, input.sessionId), eq(sessions.userId, ctx.user!.id)));
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
