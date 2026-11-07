import { ErrorMessages } from "@contracts/constants";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { isProvisionedAdmin } from "./lib/admin-access";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    const nodeEnv = typeof process !== "undefined" ? process.env.NODE_ENV : undefined;
    const expose = nodeEnv === "development" || nodeEnv === "test";
    if (expose) return shape;
    const data = { ...(shape.data as Record<string, unknown>) };
    delete data.stack;
    return { ...shape, data };
  },
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

const requireAuth = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: ErrorMessages.unauthenticated,
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user } });
});

function requireRole(role: string) {
  return t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (role === "admin") {
      if (!isProvisionedAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: ErrorMessages.insufficientRole,
        });
      }
      return next({ ctx: { ...ctx, user: ctx.user! } });
    }

    if (!ctx.user || ctx.user.role !== role) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: ErrorMessages.insufficientRole,
      });
    }

    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const authedQuery = t.procedure.use(requireAuth);
export const adminQuery = t.procedure.use(requireRole("admin"));
