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

  // 1. OAuth session auth (with sliding expiration)
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

  // 2. Local auth fallback (with sliding expiration)
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
