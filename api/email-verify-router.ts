/**
 * Email verification. Tokens are hashed and consumed with one AND predicate.
 * Verifying a canonical owner mailbox also provisions role=admin. Sign-up does not.
 */
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { emailVerificationTokens, users } from "@db/schema";
import { sendEmail } from "./email-service";
import { logAudit, getClientIP } from "./security";
import { env } from "./lib/env";
import { isCanonicalAdminEmail } from "./lib/admin-access";
import { hashToken, randomToken } from "./lib/token-hash";

export const emailVerifyRouter = createRouter({
  sendVerification: publicQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user) return { success: true };
      const token = randomToken(32);
      const tokenHash = await hashToken(token);
      const expiresAt = Math.floor(Date.now() / 1000) + 86400;
      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      const origin = env.vaultDomain ? `https://${env.vaultDomain.replace(/^https?:\/\//, "")}` : "https://thevaultdfw.win";
      const delivery = await sendEmail({
        to: input.email,
        subject: "Verify your Vault DFW email",
        text: `Verify your email: ${origin}/verify-email?token=${token}`,
        html: `<a href="${origin}/verify-email?token=${token}">Verify Email</a>`,
      });
      logAudit({
        path: "emailVerify.sendVerification",
        userId: user.id,
        action: delivery.success ? "verification_email_queued" : "verification_email_failed",
        ip: getClientIP(ctx.req),
        method: "POST",
      });
      return { success: true };
    }),

  verifyEmail: publicQuery
    .input(z.object({ token: z.string().length(64) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const now = Math.floor(Date.now() / 1000);
      const tokenHash = await hashToken(input.token);
      const claim = await db
        .update(emailVerificationTokens)
        .set({ usedAt: now })
        .where(and(
          eq(emailVerificationTokens.tokenHash, tokenHash),
          isNull(emailVerificationTokens.usedAt),
          gt(emailVerificationTokens.expiresAt, now),
        ));
      if (!Number(claim.meta?.changes ?? 0)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification token" });
      }
      const [tokenRow] = await db
        .select()
        .from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.tokenHash, tokenHash))
        .limit(1);
      if (!tokenRow) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification token" });
      const [user] = await db.select().from(users).where(eq(users.id, tokenRow.userId)).limit(1);
      await db
        .update(users)
        .set({
          email_verified: 1,
          role: user && isCanonicalAdminEmail(user.email) ? "admin" : user?.role ?? "user",
          updatedAt: new Date(),
        })
        .where(eq(users.id, tokenRow.userId));
      await logAudit({
        path: "emailVerify.verifyEmail",
        userId: tokenRow.userId,
        action: "email_verified",
        ip: getClientIP(ctx.req),
        method: "POST",
      });
      return { success: true };
    }),
});
