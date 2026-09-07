/**
 * ai-assistant-router.ts — AI assistant chat & recommendations.
 *
 * Powers the AI assistant widget on every page +
 * AI-driven recommendations (price alerts, comparables).
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq } from "drizzle-orm";
import { listings, priceSnapshots, priceAlerts } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";
import { env } from "./lib/env";

export const aiAssistantRouter = createRouter({
  /** Get AI-driven recommendations for the current user. */
  recommendations: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const userId = ctx.user!.id;
    // Stub: actual recommendations use browsing history + watchlist
    const [recent] = await db.select().from(listings).orderBy(desc(listings.createdAt)).limit(5);
    return {
      recommendations: recent ? [{ listingId: recent.id, title: recent.title, reason: "Recently listed" }] : [],
      priceAlerts: [],
      comparables: [],
    };
  }),

  /** Check price alerts against current listing prices (scheduled). */
  checkPriceAlerts: publicQuery.query(async () => {
    const db = getDb();
    const alerts = await db.select().from(priceAlerts).where(eq(priceAlerts.notified, 0));
    let triggered = 0;
    for (const alert of alerts) {
      const [listing] = await db.select().from(listings).where(eq(listings.id, alert.listingId)).limit(1);
      if (!listing) continue;
      const currentPrice = Number(listing.price);
      const target = Number(alert.targetPrice);
      const hit = alert.direction === "below" ? currentPrice <= target : currentPrice >= target;
      if (hit) {
        await db.update(priceAlerts).set({ notified: 1 }).where(eq(priceAlerts.id, alert.id));
        triggered++;
      }
    }
    return { checked: alerts.length, triggered };
  }),

  /** Send a prompt to the AI assistant and get a response. */
  ask: authedQuery
    .input(z.object({ message: z.string().max(4000), context: z.enum(["listing", "pricing", "market", "general"]).default("general") }))
    .mutation(async ({ input, ctx }) => {
      // Stub: actual AI call would go to OpenAI/Claude via env
      const response = `You asked about "${input.message}". This is an AI assistant placeholder — integrate your LLM provider (OpenAI/Claude) via env to enable real responses.`;
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "aiAssistant.ask", userId: ctx.user!.id, action: "ai_asked", details: `context:${input.context}` });
      return { response, context: input.context };
    }),
});
