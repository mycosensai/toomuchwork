/**
 * password-reset-router.ts — Password reset flow.
 *
 * Flow:
 *   1. POST forgotPassword { email } → generates token, sends reset email
 *   2. POST resetPassword { token, newPassword } → validates token, updates password
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { users } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { validatePasswordStrength, logAudit, getClientIP } from "./security";
import { env } from "./lib/env";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";

const resetSecret = env.appSecret;

function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

export const passwordResetRouter = createRouter({
  /** Request a password reset. Sends email with token link. */
  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user) {
        // Don't reveal whether the email exists
        return { success: true };
      }
      const token = generateResetToken();
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt,
      });
      await sendEmail({
        to: input.email,
        subject: "Reset your Vault DFW password",
        text: `Use this link to reset your password: ${env.vaultDomain}/reset-password?token=${token}`,
        html: `<a href="${env.vaultDomain}/reset-password?token=${token}">Reset Password</a>`,
      });
      logAudit({
        userId: user.id,
        action: "password_reset_requested",
        ip: getClientIP(ctx.req),
        method: "POST",
      });
      return { success: true };
    }),

  /** Reset password with token. */
  resetPassword: publicQuery
    .input(z.object({ token: z.string().length(64), newPassword: z.string().min(8) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const strength = validatePasswordStrength(input.newPassword);
      if (!strength.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: strength.errors.join(", ") });
      }
      const [reset] = await db.select().from(passwordResetTokens)
        .where(eq(passwordResetTokens.token, input.token))
        .where(eq(passwordResetTokens.used, 0))
        .where(eq(passwordResetTokens.expiresAt, { gt: Math.floor(Date.now() / 1000) }));
      if (!reset) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
      }
      const hashed = await hashPassword(input.newPassword);
      await db.update(users).set({ password: hashed }).where(eq(users.id, reset.userId));
      await db.update(passwordResetTokens).set({ used: 1 }).where(eq(passwordResetTokens.id, reset.id));
      await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, reset.userId));
      await logAudit({
        userId: reset.userId,
        action: "password_reset_completed",
        ip: getClientIP(ctx.req),
        method: "POST",
      });
      return { success: true };
    }),
});

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$100000$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

function bytesToBase64(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input));
}
