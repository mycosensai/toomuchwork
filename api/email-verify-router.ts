/**
 * email-verify-router.ts — Email verification flow.
 *
 * Flow:
 *   1. POST sendVerification → sends verification email with token
 *   2. POST verifyEmail { token } → marks email verified
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, gt } from "drizzle-orm";
import { users, emailVerificationTokens } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";
import { env } from "./lib/env";
import { randomBytes } from "crypto";

function generateVerifyToken(): string {
  return randomBytes(32).toString("hex");
}

export const emailVerifyRouter = createRouter({
  /** Send verification email. */
  sendVerification: publicQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user) return { success: true };
      const token = generateVerifyToken();
      const expiresAt = Math.floor(Date.now() / 1000) + 86400; // 24 hours
      await db.insert(emailVerificationTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });
      await sendEmail({
        to: input.email,
        subject: "Verify your Vault DFW email",
        text: `Verify your email: ${env.vaultDomain}/verify-email?token=${token}`,
        html: `<a href="${env.vaultDomain}/verify-email?token=${token}">Verify Email</a>`,
      });
      return { success: true };
    }),

  /** Verify email with token. */
  verifyEmail: publicQuery
    .input(z.object({ token: z.string().length(64) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [tokenRow] = await db.select().from(emailVerificationTokens)
        .where(eq(emailVerificationTokens.token, input.token))
        .where(eq(emailVerificationTokens.used, 0))
        .where(gt(emailVerificationTokens.expiresAt, Math.floor(Date.now() / 1000)));
      if (!tokenRow) throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired verification token" });
      await db.update(users).set({ email_verified: 1, updatedAt: new Date() }).where(eq(users.id, tokenRow.userId));
      await db.update(emailVerificationTokens).set({ used: 1 }).where(eq(emailVerificationTokens.id, tokenRow.id));
      await logAudit({ path: "emailVerify.verifyEmail", userId: tokenRow.userId, action: "email_verified", ip: getClientIP(ctx.req), method: "POST" });
      return { success: true };
    }),
});
