/**
 * Password reset. Tokens are random, stored as SHA-256, and single-use.
 * The lookup is one AND predicate: hash match, unused (used_at IS NULL), unexpired.
 * Consumption is an atomic UPDATE so two callers cannot both succeed.
 */
import { z } from "zod";
import { and, eq, gt, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { passwordResetTokens, users } from "@db/schema";
import { sendEmail } from "./email-service";
import { validatePasswordStrength, logAudit, getClientIP, assertSensitiveLimit } from "./security";
import { env } from "./lib/env";
import { hashToken, randomToken } from "./lib/token-hash";

export const passwordResetRouter = createRouter({
  forgotPassword: publicQuery
    .input(z.object({ email: z.string().email().max(320) }))
    .mutation(async ({ input, ctx }) => {
      await assertSensitiveLimit(ctx.req, "reset");
      const db = getDb();
      const [user] = await db.select().from(users).where(eq(users.email, input.email));
      if (!user) return { success: true };

      const token = randomToken(32);
      const tokenHash = await hashToken(token);
      const expiresAt = Math.floor(Date.now() / 1000) + 3600;
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        tokenHash,
        expiresAt,
      });
      const origin = env.vaultDomain ? `https://${env.vaultDomain.replace(/^https?:\/\//, "")}` : "https://thevaultdfw.win";
      const delivery = await sendEmail({
        to: input.email,
        subject: "Reset your Vault DFW password",
        text: `Use this link to reset your password: ${origin}/reset-password?token=${token}`,
        html: `<a href="${origin}/reset-password?token=${token}">Reset Password</a>`,
      });
      logAudit({
        path: "passwordReset.forgotPassword",
        userId: user.id,
        action: delivery.success ? "password_reset_requested" : "password_reset_delivery_failed",
        ip: getClientIP(ctx.req),
        method: "POST",
      });
      return { success: true };
    }),

  resetPassword: publicQuery
    .input(z.object({ token: z.string().length(64), newPassword: z.string().min(8) }))
    .mutation(async ({ input, ctx }) => {
      await assertSensitiveLimit(ctx.req, "reset");
      const strength = validatePasswordStrength(input.newPassword);
      if (!strength.valid) {
        throw new TRPCError({ code: "BAD_REQUEST", message: strength.errors.join(", ") });
      }
      const db = getDb();
      const now = Math.floor(Date.now() / 1000);
      const tokenHash = await hashToken(input.token);
      const claim = await db
        .update(passwordResetTokens)
        .set({ usedAt: now })
        .where(and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ));
      if (!Number(claim.meta?.changes ?? 0)) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
      }
      const [reset] = await db
        .select()
        .from(passwordResetTokens)
        .where(eq(passwordResetTokens.tokenHash, tokenHash))
        .limit(1);
      if (!reset) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid or expired reset token" });
      }
      const hashed = await hashPassword(input.newPassword);
      await db.update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, reset.userId));
      await logAudit({
        path: "passwordReset.resetPassword",
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
