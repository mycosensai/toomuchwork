import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "@db/schema";
import { verifyLocalTokenAndRefresh } from "./local-auth-router";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { eq } from "drizzle-orm";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions,
): Promise<TrpcContext> {
  const ctx: TrpcContext = {
    req: opts.req,
    resHeaders: opts.resHeaders,
  };

  // ─── Local auth token (with sliding expiration) ───
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
