import { z } from "zod";
import { createRouter, publicQuery, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { aiAgentLogs, listings } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { sanitizeForPrompt, logAudit, getClientIP } from "./security";

export const agentRouter = createRouter({
  findBuyers: publicQuery
    .input(
      z.object({
        listingId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) throw new Error("Listing not found");

      // Sanitize inputs before injecting into AI prompt
      const safeTitle = sanitizeForPrompt(listing.title);
      const safeDesc = sanitizeForPrompt(listing.description || "N/A");

      const [logResult] = await db.insert(aiAgentLogs).values({
        agentName: "Vault Buyer Finder",
        agentType: "buyer_finder",
        listingId: listing.id,
        status: "running",
        input: JSON.stringify({
          title: safeTitle,
          price: listing.price,
          category: listing.categoryId,
        }),
        message: "Scanning for potential buyers...",
      });

      const logId = Number(logResult.insertId);

      try {
        const prompt = `You are an expert collector network analyst. Analyze this item and identify the ideal buyer profile:

Item: ${safeTitle}
Price: $${listing.price}
Category: ${listing.categoryId}
Condition: ${listing.condition}
Description: ${safeDesc}

Provide a JSON response:
{
  "buyerProfiles": [
    {
      "profile": "description of ideal buyer",
      "demographic": "likely age/income/location",
      "motivation": "why they would buy",
      "confidence": 85,
      "sources": ["where to find these buyers"]
    }
  ],
  "marketingChannels": ["best channels to reach buyers"],
  "priceStrategy": "suggested pricing strategy",
  "timeline": "estimated days to sell",
  "summary": "brief strategic summary"
}`;

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt,
        });

        let result;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { summary: text };
        } catch {
          result = { summary: text, buyerProfiles: [] };
        }

        await db.update(aiAgentLogs).set({
          status: "completed",
          output: JSON.stringify(result),
          confidence: String(result.buyerProfiles?.[0]?.confidence || 70),
          message: `Found ${result.buyerProfiles?.length || 0} buyer profiles. ${result.summary?.substring(0, 200) || ""}`,
        }).where(eq(aiAgentLogs.id, logId));

        // Audit log
        const ip = getClientIP(ctx.req);
        const uid = ctx.user?.id;
        logAudit({
          ip,
          method: "POST",
          path: "agent.findBuyers",
          userId: uid,
          action: "buyer_finder_completed",
          details: `listing:${listing.id}`,
        });

        return { success: true, logId, result };
      } catch (error) {
        await db.update(aiAgentLogs).set({
          status: "failed",
          message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        }).where(eq(aiAgentLogs.id, logId));

        return { success: false, error: error instanceof Error ? error.message : "Failed" };
      }
    }),

  analyzeMarket: publicQuery
    .input(
      z.object({
        listingId: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) throw new Error("Listing not found");

      const safeTitle = sanitizeForPrompt(listing.title);

      const [logResult] = await db.insert(aiAgentLogs).values({
        agentName: "Vault Market Analyzer",
        agentType: "price_analyzer",
        listingId: listing.id,
        status: "running",
        input: JSON.stringify({ title: safeTitle, price: listing.price }),
        message: "Analyzing market data...",
      });

      const logId = Number(logResult.insertId);

      try {
        const prompt = `Analyze the current market for this collectible item:

Item: ${safeTitle}
Listed Price: $${listing.price}
Condition: ${listing.condition}

Provide market analysis JSON:
{
  "marketTrend": "bullish/bearish/neutral",
  "demandLevel": "high/medium/low",
  "competitionAnalysis": "how many similar items available",
  "optimalPriceRange": { "min": number, "max": number },
  "bestTimeToSell": "seasonal/market timing advice",
  "priceRecommendation": "hold/reduce/increase",
  "keyInsights": ["specific market insights"]
}`;

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt,
        });

        let result;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          result = jsonMatch ? JSON.parse(jsonMatch[0]) : { keyInsights: [text] };
        } catch {
          result = { keyInsights: [text], marketTrend: "neutral", demandLevel: "medium" };
        }

        await db.update(aiAgentLogs).set({
          status: "completed",
          output: JSON.stringify(result),
          confidence: "75",
          message: `Market analysis complete. Trend: ${result.marketTrend || "neutral"}`,
        }).where(eq(aiAgentLogs.id, logId));

        return { success: true, logId, result };
      } catch (error) {
        await db.update(aiAgentLogs).set({
          status: "failed",
          message: `Error: ${error instanceof Error ? error.message : "Unknown"}`,
        }).where(eq(aiAgentLogs.id, logId));

        return { success: false, error: error instanceof Error ? error.message : "Failed" };
      }
    }),

  logs: publicQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(aiAgentLogs)
      .orderBy(desc(aiAgentLogs.createdAt))
      .limit(50); // Pagination limit prevents DB dump
  }),

  allLogs: adminQuery.query(async () => {
    const db = getDb();
    return db
      .select()
      .from(aiAgentLogs)
      .orderBy(desc(aiAgentLogs.createdAt))
      .limit(500); // Even admin has limits
  }),
});
