import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyOAuthSessionAndRefresh } from "./oauth-handlers";
import { verifyLocalTokenAndRefresh } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

/**
 * Verify a Clerk session token from the Authorization header or __session cookie
 */
async function verifyClerkSession(headers: Headers): Promise<User | null> {
  // Try Authorization header first: "Bearer <session_token>"
  const authHeader = headers.get("Authorization");
  let sessionToken: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    sessionToken = authHeader.slice(7);
  }

  // Fall back to __session cookie
  if (!sessionToken) {
    const cookieHeader = headers.get("cookie");
    if (cookieHeader) {
      for (const pair of cookieHeader.split(";")) {
        const [key, ...rest] = pair.trim().split("=");
        if (key?.trim() === "__session") {
          sessionToken = rest.join("=");
          break;
        }
      }
    }
  }

  if (!sessionToken) return null;

  // Verify with Clerk API
  try {
    const clerkSecretKey = (globalThis as any).__CLERK_SECRET_KEY;
    if (!clerkSecretKey) return null;

    const resp = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: sessionToken }),
    });

    if (!resp.ok) return null;

    const sessionData = await resp.json() as { user_id?: string; id?: string; status?: string };
    if (!sessionData.user_id || sessionData.status !== "active") return null;

    // Fetch user details from Clerk
    const userResp = await fetch(
      `https://api.clerk.com/v1/users/${sessionData.user_id}`,
      {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      }
    );

    if (!userResp.ok) return null;

    const clerkUser = await userResp.json() as {
      id: string;
      email_addresses?: { email_address: string; id: string }[];
      first_name?: string;
      last_name?: string;
      image_url?: string;
      username?: string;
    };

    // Map Clerk user to our db user — upsert
    const db = getDb();
    const clerkId = clerkUser.id;
    const email = clerkUser.email_addresses?.[0]?.email_address || null;
    const name = clerkUser.first_name || clerkUser.last_name
      ? [clerkUser.first_name, clerkUser.last_name].filter(Boolean).join(" ")
      : clerkUser.username || email?.split("@")[0] || "Collector";

    // Check if user exists
    const [existing] = await db
      .select()
      .from(users)
      .where(eq(users.unionId, clerkId))
      .limit(1);

    if (existing) {
      // Update existing Clerk user
      await db
        .update(users)
        .set({
          name,
          email: email || existing.email,
          avatar: clerkUser.image_url || existing.avatar,
          lastSignInAt: new Date(),
        })
        .where(eq(users.id, existing.id));
      return { ...existing, name, email: email || existing.email, avatar: clerkUser.image_url || existing.avatar };
    }

    // Check by email for account linking
    if (email) {
      const [byEmail] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (byEmail) {
        await db
          .update(users)
          .set({
            unionId: clerkId,
            name: name || byEmail.name,
            avatar: clerkUser.image_url || byEmail.avatar,
            lastSignInAt: new Date(),
          })
          .where(eq(users.id, byEmail.id));
        return { ...byEmail, unionId: clerkId, name: name || byEmail.name!, avatar: clerkUser.image_url || byEmail.avatar };
      }
    }

    // Create new user
    const result = await db.insert(users).values({
      unionId: clerkId,
      name,
      email,
      avatar: clerkUser.image_url || null,
      role: "user",
    });
    const userId = Number(result.meta.last_row_id);

    return {
      id: userId,
      unionId: clerkId,
      name,
      email,
      avatar: clerkUser.image_url || null,
      role: "user",
    } as User;
  } catch (err) {
    console.error("[Clerk] Session verification error:", err);
    return null;
  }
}

/**
 * Parse cookies from header
 */
function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  for (const pair of cookieHeader.split(";")) {
    const [key, ...rest] = pair.trim().split("=");
    if (key && rest.length > 0) cookies[key] = rest.join("=");
  }
  return cookies;
}

/**
 * Set cookie on response headers
 */
function setCookieHeader(resHeaders: Headers, name: string, value: string, options: {
  httpOnly?: boolean;
  path?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  maxAge?: number;
}) {
  const parts = [`${name}=${value}`];
  if (options.httpOnly) parts.push("HttpOnly");
  if (options.path) parts.push(`Path=${options.path}`);
  if (options.sameSite) parts.push(`SameSite=${options.sameSite}`);
  if (options.secure) parts.push("Secure");
  if (options.maxAge) parts.push(`Max-Age=${options.maxAge}`);
  const existing = resHeaders.get("set-cookie");
  if (existing) {
    resHeaders.set("set-cookie", `${existing}, ${parts.join("; ")}`);
  } else {
    resHeaders.set("set-cookie", parts.join("; "));
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
  };

  // 1. Try Clerk session first
  try {
    const clerkUser = await verifyClerkSession(opts.req.headers);
    if (clerkUser) {
      ctx.user = clerkUser as User;
      return ctx;
    }
  } catch {
    // Clerk session invalid
  }

  // 2. OAuth session auth (with sliding expiration)
  try {
    const { user: oauthUser, newToken } = await verifyOAuthSessionAndRefresh(opts.req.headers);

    if (oauthUser) {
      ctx.user = oauthUser as User;

      // If token was refreshed, set new cookie
      if (newToken) {
        const cookieHeader = opts.req.headers.get("cookie");
        const isLocalhost = cookieHeader?.includes("localhost:") || cookieHeader?.includes("127.0.0.1:");
        setCookieHeader(opts.resHeaders, "vault_session", newToken, {
          httpOnly: true,
          path: "/",
          sameSite: isLocalhost ? "lax" : "none",
          secure: !isLocalhost,
          maxAge: 7 * 24 * 60 * 60, // 7 days
        });
      }
      return ctx;
    }
  } catch {
    // OAuth session invalid
  }

  // 3. Local auth fallback (with sliding expiration)
  try {
    const localToken = opts.req.headers.get("x-local-auth-token");

    if (localToken) {
      const { userId, newToken } = await verifyLocalTokenAndRefresh(localToken);

      if (userId) {
        const db = getDb();

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);

        if (user) {
          ctx.user = user;

          // If token was refreshed, set new header for client to pick up
          if (newToken) {
            opts.resHeaders.set("x-local-auth-token", newToken);
          }
        }
      }
    }
  } catch {
    // Local auth invalid
  }

  return ctx;
}