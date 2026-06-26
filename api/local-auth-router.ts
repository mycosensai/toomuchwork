import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { SignJWT, jwtVerify } from "jose";
import { TRPCError } from "@trpc/server";
import { validatePasswordStrength, logAudit, getClientIP, isTokenRevoked, isUserSessionRevoked } from "./security";
import { env } from "./lib/env";

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Lazy JWT secret — resolves at first use, not at module load
let jwtSecretCache: Uint8Array | null = null;
function getJwtSecret(): Uint8Array {
  if (jwtSecretCache) return jwtSecretCache;
  const secret = env.appSecret;
  jwtSecretCache = new TextEncoder().encode(secret);
  return jwtSecretCache;
}

interface LocalAuthTokenPayload {
  sub: string;
  lastActivity: number; // Unix timestamp
  iat: number; // Issued at
}

/**
 * Create local auth token with lastActivity timestamp
 */
async function createToken(userId: number): Promise<string> {
  const now = Date.now();
  return new SignJWT({
    sub: String(userId),
    lastActivity: now,
    iat: Math.floor(now / 1000),
  } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Absolute max: 7 days
    .sign(getJwtSecret());
}

/**
 * Verify local auth token and optionally return new token (sliding expiration)
 * Returns { userId, newToken } where newToken is set if session was refreshed
 */
export async function verifyLocalTokenAndRefresh(token: string): Promise<{
  userId: number | null;
  newToken: string | null;
}> {
  try {
    const { payload } = await jwtVerify<LocalAuthTokenPayload>(token, getJwtSecret(), {
      clockTolerance: 60,
    });

    const userId = payload.sub ? parseInt(payload.sub, 10) : null;
    const lastActivity = payload.lastActivity as number | undefined;
    const iat = payload.iat as number | undefined;

    if (!userId) return { userId: null, newToken: null };

    const now = Date.now();

    // Check idle timeout (30 minutes)
    if (lastActivity && now - lastActivity > IDLE_TIMEOUT_MS) {
      console.log(`[LocalAuth] Token expired due to idle timeout for user ${userId}`);
      return { userId: null, newToken: null };
    }

    // Check absolute max age (7 days) - iat is in seconds
    if (iat && now - iat * 1000 > ABSOLUTE_MAX_AGE_MS) {
      console.log(`[LocalAuth] Token expired due to absolute max age for user ${userId}`);
      return { userId: null, newToken: null };
    }

    // Check token revocation and session revocation
    if (isTokenRevoked(token) || isUserSessionRevoked(userId, (iat || 0) * 1000)) {
      console.log(`[LocalAuth] Token revoked for user ${userId}`);
      return { userId: null, newToken: null };
    }

    // Refresh token if lastActivity is older than 5 minutes (avoid updating on every request)
    let newToken: string | null = null;
    if (lastActivity && now - lastActivity > 5 * 60 * 1000) {
      newToken = await createToken(userId);
    }

    return { userId, newToken };
  } catch {
    return { userId: null, newToken: null };
  }
}

/**
 * Verify local auth token (without refresh)
 * Kept for backward compatibility
 */
export async function verifyLocalToken(token: string): Promise<number | null> {
  const result = await verifyLocalTokenAndRefresh(token);
  return result.userId;
}

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        name: z.string().min(1).max(255),
        email: z.string().email().max(320),
        password: z.string().min(8).max(255),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate password strength
      const strength = validatePasswordStrength(input.password);
      if (!strength.valid) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Password too weak: ${strength.errors.join(", ")}`,
        });
      }

      const db = getDb();
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        // Log the attempt but don't reveal email exists
        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "localAuth.register",
          action: "register_duplicate_email",
          details: `email:${input.email}`,
        });
        throw new TRPCError({
          code: "CONFLICT",
          message: "An account with this email already exists",
        });
      }

      const hashedPassword = await hashPassword(input.password);
      const isAdmin = env.adminEmails.includes(input.email.toLowerCase());
      const insertResult = await db.insert(users).values({
        name: input.name,
        email: input.email,
        password: hashedPassword,
        role: isAdmin ? "admin" : "user",
      });
      const userId = Number(insertResult.meta.last_row_id);

      const token = await createToken(userId);

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "localAuth.register",
        action: "user_registered",
        details: `user:${userId}`,
      });

      return {
        token,
        user: {
          id: userId,
          name: input.name,
          email: input.email,
        },
      };
    }),

  login: publicQuery
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, input.email))
        .limit(1);

      if (!user || !user.password) {
        // Generic error to prevent user enumeration
        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "localAuth.login",
          action: "login_failed",
          details: `email:${input.email} reason:invalid_credentials`,
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const valid = await verifyPassword(input.password, user.password);
      if (!valid) {
        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "localAuth.login",
          action: "login_failed",
          details: `user:${user.id} reason:wrong_password`,
        });
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Invalid email or password",
        });
      }

      const token = await createToken(user.id);

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "localAuth.login",
        userId: user.id,
        action: "login_success",
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const authHeader = ctx.req.headers.get("x-local-auth-token");
    if (!authHeader) return null;

    const { userId, newToken } = await verifyLocalTokenAndRefresh(authHeader);
    if (!userId) return null;

    // If token was refreshed, set header for client to pick up
    if (newToken) {
      ctx.resHeaders.set("x-local-auth-token", newToken);
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return user || null;
  }),
});

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(input: string): Uint8Array {
  const bin = atob(input);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" }, key, 256);
  return `pbkdf2$100000$${bytesToBase64(salt)}$${bytesToBase64(new Uint8Array(bits))}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, iterationStr, saltB64, hashB64] = stored.split("$");
  if (scheme !== "pbkdf2" || !iterationStr || !saltB64 || !hashB64) return false;
  const iterations = Number(iterationStr);
  const salt = base64ToBytes(saltB64);
  const expected = base64ToBytes(hashB64);
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations, hash: "SHA-256" }, key, expected.length * 8);
  const actual = new Uint8Array(bits);
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= actual[i] ^ expected[i];
  return diff === 0;
}