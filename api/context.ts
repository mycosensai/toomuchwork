import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyLocalTokenAndRefresh } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

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
 * Verify Clerk session token from the request.
 * Clerk sets __session cookie (or __clerk_db_jwt) on successful login.
 * We verify it using the Clerk Backend API via the secret key.
 */
async function verifyClerkSession(
  headers: Headers,
): Promise<{ userId: number; email: string } | null> {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  // Clerk may use __session or __clerk_db_jwt depending on config
  const sessionToken = cookies["__session"] || cookies["__clerk_db_jwt"];
  if (!sessionToken) return null;

  const clerkSecret = env.clerkSecretKey;
  if (!clerkSecret) return null;

  try {
    // Verify the Clerk session JWT using Clerk's API
    const resp = await fetch("https://api.clerk.com/v1/sessions/verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: sessionToken }),
    });

    if (!resp.ok) return null;

    const sessionData = await resp.json();
    const clerkUserId = sessionData.user_id as string;
    if (!clerkUserId) return null;

    // Look up the vault user by Clerk unionId
    const db = getDb();
    const [vaultUser] = await db
      .select()
      .from(users)
      .where(eq(users.unionId, clerkUserId))
      .limit(1);

    if (!vaultUser) {
      // Clerk user doesn't have a vault account yet — create one
      const clerkUserResp = await fetch(
        `https://api.clerk.com/v1/users/${clerkUserId}`,
        { headers: { Authorization: `Bearer ${clerkSecret}` } },
      );
      if (!clerkUserResp.ok) return null;
      const clerkUser = await clerkUserResp.json();

      const name = clerkUser.first_name
        ? `${clerkUser.first_name} ${clerkUser.last_name || ""}`.trim()
        : clerkUser.email_addresses?.[0]?.email_address?.split("@")[0] || "User";
      const email = clerkUser.email_addresses?.[0]?.email_address || null;

      const result = await db.insert(users).values({
        unionId: clerkUserId,
        name,
        email,
        avatar: clerkUser.image_url || null,
        role: "user",
      });
      const newId = Number(result.meta.last_row_id);

      const [newUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, newId))
        .limit(1);

      return newUser
        ? { userId: newUser.id, email: newUser.email || "" }
        : null;
    }

    return { userId: vaultUser.id, email: vaultUser.email || "" };
  } catch {
    return null;
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
  };

  // 1. Try Clerk session first (primary auth)
  try {
    const clerkUser = await verifyClerkSession(opts.req.headers);
    if (clerkUser) {
      const db = getDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, clerkUser.userId))
        .limit(1);
      if (user) {
        ctx.user = user;
        return ctx;
      }
    }
  } catch {
    // Clerk auth failed — fall through to local auth
  }

  // 2. Fall back to local auth token (for backward compatibility)
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
