/**
 * Public tRPC lookalikes are not payment webhooks.
 * Signed ingestion lives at POST /api/stripe/webhook.
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";

const rejected = publicQuery
  .input(z.object({ eventType: z.string(), payload: z.object({}).passthrough() }))
  .mutation(() => {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Provider events are accepted only at signed HTTP webhook endpoints",
    });
  });

export const webhookRouter = createRouter({
  stripe: rejected,
  solana: rejected,
});
