/**
 * OAuth 2.0 Callback Handlers
 * Handles the authorization code callback for Google, X, and Apple
 * Includes sliding expiration: 30-minute idle timeout with 7-day absolute max
 */

import type { Context } from "hono";
import { setCookie } from "hono/cookie";
import {
  verifyState,
  exchangeCode,
  fetchProfile,
  type OAuthProvider,
} from "./oauth-providers";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq, and } from "drizzle-orm";
import { sql } from "drizzle-orm";
import * as jose from "jose";
import { env } from "./lib/env";
import { getSessionCookieOptions } from "./lib/cookies";
import { logAudit, getClientIP } from "./security";

const getJwtSecret = () => new TextEncoder().encode(env.appSecret);
const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const ABSOLUTE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return env.adminEmails.includes(email.toLowerCase());
}

interface OAuthTokenPayload {
  userId: number;
  provider: string;
  lastActivity: number; // Unix timestamp
  iat: number; // Issued at
}

/**
 * Create OAuth session token with lastActivity timestamp
 */
async function createOAuthSessionToken(payload: {
  userId: number;
  provider: string;
}): Promise<string> {
  const now = Date.now();
  return new jose.SignJWT({
    userId: payload.userId,
    provider: payload.provider,
    lastActivity: now,
    iat: now,
  } as unknown as jose.JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Absolute max: 7 days
    .sign(getJwtSecret());
}

/**
 * Verify OAuth session and optionally refresh token (sliding expiration)
 * Returns { user, newToken } where newToken is set if session was refreshed
 */
export async function verifyOAuthSessionAndRefresh(
  headers: Headers
): Promise<{
  user: { id: number; name: string | null; email: string | null; avatar: string | null; role: string } | null;
  newToken: string | null;
}> {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return { user: null, newToken: null };

  // Parse cookies manually
  const cookies: Record<string, string> = {};
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key && rest.length > 0) cookies[key] = rest.join("=");
  }

  const token = cookies["vault_session"];
  if (!token) return { user: null, newToken: null };

  try {
    const { payload } = await jose.jwtVerify<OAuthTokenPayload>(token, getJwtSecret(), {
      clockTolerance: 60,
    });

    const userId = payload.userId as number;
    const lastActivity = payload.lastActivity as number | undefined;
    const iat = payload.iat as number | undefined;

    if (!userId) return { user: null, newToken: null };

    const now = Date.now();

    // Check idle timeout (30 minutes)
    if (lastActivity && now - lastActivity > IDLE_TIMEOUT_MS) {
      console.log(`[OAuth] Session expired due to idle timeout for user ${userId}`);
      return { user: null, newToken: null };
    }

    // Check absolute max age (7 days) - iat is in seconds, convert to ms
    if (iat && now - iat * 1000 > ABSOLUTE_MAX_AGE_MS) {
      console.log(`[OAuth] Session expired due to absolute max age for user ${userId}`);
      return { user: null, newToken: null };
    }

    const db = getDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) return { user: null, newToken: null };

    // Refresh token if lastActivity is older than 5 minutes (avoid updating on every request)
    let newToken: string | null = null;
    if (lastActivity && now - lastActivity > 5 * 60 * 1000) {
      newToken = await createOAuthSessionToken({ userId, provider: payload.provider as string });
    }

    return { user, newToken };
  } catch {
    return { user: null, newToken: null };
  }
}

/**
 * Verify an OAuth session cookie and return the user (without refresh)
 * Used for simple verification without token rotation
 */
export async function verifyOAuthSession(
  headers: Headers
): Promise<{ id: number; name: string | null; email: string | null; avatar: string | null; role: string } | null> {
  const result = await verifyOAuthSessionAndRefresh(headers);
  return result.user;
}

export async function handleOAuthCallback(c: Context, provider: OAuthProvider) {
  const code = c.req.query("code");
  const state = c.req.query("state");
  const error = c.req.query("error");
  const errorDescription = c.req.query("error_description");

  if (error) {
    console.warn(`[OAuth ${provider}] Error: ${error} - ${errorDescription}`);
    return c.redirect("/?oauth_error=" + encodeURIComponent(error), 302);
  }

  if (!code || !state) {
    return c.redirect("/?oauth_error=missing_params", 302);
  }

  // Verify the signed state (CSRF protection)
  const stateData = await verifyState(state);
  if (!stateData || stateData.provider !== provider) {
    console.warn(`[OAuth ${provider}] Invalid state parameter`);
    return c.redirect("/?oauth_error=invalid_state", 302);
  }

  try {
    // Exchange code for access token
    const tokenResult = await exchangeCode(provider, code, stateData.pkce, stateData.redirectUri);
    if (tokenResult.error || !tokenResult.access_token) {
      console.warn(`[OAuth ${provider}] Token exchange failed:`, tokenResult.error);
      return c.redirect("/?oauth_error=token_exchange_failed", 302);
    }

    // Fetch user profile
    const profile = await fetchProfile(provider, tokenResult.access_token);

    // Upsert user in database
    const db = getDb();

    // Check if user exists by provider+id or email
    const [existingByProvider] = await db
      .select()
      .from(users)
      .where(
        sql`${users.oauthProvider} = ${provider} AND ${users.oauthProviderId} = ${profile.id}`
      )
      .limit(1);

    let userId: number;

    if (existingByProvider) {
      // Update existing OAuth user
      await db
        .update(users)
        .set({
          name: profile.name,
          email: profile.email || existingByProvider.email,
          avatar: profile.avatar || existingByProvider.avatar,
          lastSignInAt: new Date(),
        })
        .where(eq(users.id, existingByProvider.id));
      userId = existingByProvider.id;
    } else if (profile.email) {
      // Check by email for account linking
      const [existingByEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, profile.email))
        .limit(1);

      if (existingByEmail) {
        // Link OAuth to existing account
        await db
          .update(users)
          .set({
            oauthProvider: provider,
            oauthProviderId: profile.id,
            name: profile.name || existingByEmail.name,
            avatar: profile.avatar || existingByEmail.avatar,
            lastSignInAt: new Date(),
          })
          .where(eq(users.id, existingByEmail.id));
        userId = existingByEmail.id;
      } else {
        // Create new user
        const result = await db.insert(users).values({
          oauthProvider: provider,
          oauthProviderId: profile.id,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar,
          role: isAdminEmail(profile.email) ? "admin" : "user",
        });
        userId = Number(result.meta.last_row_id);
      }
    } else {
      // No email, create by provider
      const result = await db.insert(users).values({
        oauthProvider: provider,
        oauthProviderId: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        role: "user",
      });
      userId = Number(result.meta.last_row_id);
    }

    // Create session token
    const sessionToken = await createOAuthSessionToken({
      userId,
      provider,
    });

    // Set session cookie
    const cookieOpts = getSessionCookieOptions(c.req.raw.headers);
    setCookie(c, "vault_session", sessionToken, {
      ...cookieOpts,
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    logAudit({
      ip: getClientIP(c.req.raw),
      method: "GET",
      path: `/api/oauth/callback/${provider}`,
      userId,
      action: "oauth_login",
      details: `provider:${provider} email:${profile.email || "none"}`,
    });

    return c.redirect("/", 302);
  } catch (err) {
    console.error(`[OAuth ${provider}] Callback error:`, err);
    return c.redirect(
      "/?oauth_error=" +
        encodeURIComponent(
          err instanceof Error ? err.message : "callback_failed"
        ),
      302
    );
  }
}