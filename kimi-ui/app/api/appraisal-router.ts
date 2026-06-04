import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appraisals } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

function getCommissionRate(value: number): string {
  if (value >= 10000) return "5.00";
  if (value >= 7500) return "10.00";
  if (value >= 1000) return "7.00";
  return "5.00";
}

export const appraisalRouter = createRouter({
  create: publicQuery
    .input(
      z.object({
        itemName: z.string().min(1),
        category: z.string().min(1),
        condition: z.string().optional(),
        description: z.string().optional(),
        imageUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Create pending appraisal
      const [result] = await db.insert(appraisals).values({
        userId: ctx.user?.id || null,
        itemName: input.itemName,
        category: input.category,
        condition: input.condition || "good",
        description: input.description || "",
        imageUrl: input.imageUrl || null,
        status: "pending",
      });

      const appraisalId = Number(result.insertId);

      // Run AI analysis asynchronously
      try {
        const prompt = `You are an expert appraiser specializing in rare and valuable collectibles, jewelry, art, watches, antiques, coins, and luxury items. 

Analyze this item and provide a professional appraisal:

Item: ${input.itemName}
Category: ${input.category}
Condition: ${input.condition || "good"}
Description: ${input.description || "N/A"}

Provide a JSON response with the following structure:
{
  "estimatedValue": number (fair market value in USD),
  "valueRangeLow": number (conservative estimate),
  "valueRangeHigh": number (optimistic estimate),
  "confidence": "high" | "medium" | "low",
  "marketAnalysis": "detailed market analysis paragraph",
  "comparableSales": [
    { "title": "similar item description", "price": 1234, "source": "eBay/Christies/etc", "date": "2024-01" }
  ],
  "factors": ["key factors affecting value"]
}

Be realistic and base estimates on actual market data. If uncertain, use a wide range and lower confidence.`;

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt,

        });

        // Parse the AI response
        let analysis;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error("No JSON found in response");
          }
        } catch {
          // Fallback parsing
          const valueMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)/);
          const estimatedValue = valueMatch
            ? parseFloat(valueMatch[1].replace(/,/g, ""))
            : 1000;
          analysis = {
            estimatedValue,
            valueRangeLow: estimatedValue * 0.7,
            valueRangeHigh: estimatedValue * 1.3,
            confidence: "medium",
            marketAnalysis: text.substring(0, 500),
            comparableSales: [],
            factors: ["Analysis based on limited data"],
          };
        }

        const commissionRate = getCommissionRate(analysis.estimatedValue);
        const commissionEstimate = analysis.estimatedValue * (parseFloat(commissionRate) / 100);

        // Update appraisal with results
        await db.update(appraisals).set({
          estimatedValue: String(analysis.estimatedValue),
          valueRangeLow: String(analysis.valueRangeLow),
          valueRangeHigh: String(analysis.valueRangeHigh),
          confidence: analysis.confidence,
          marketAnalysis: analysis.marketAnalysis,
          comparableSales: (analysis.comparableSales || []) as any,
          status: "completed",
          commissionEstimate: String(commissionEstimate),
          commissionRate: commissionRate,
        }).where(eq(appraisals.id, appraisalId));

        return {
          id: appraisalId,
          status: "completed",
          estimatedValue: analysis.estimatedValue,
          valueRangeLow: analysis.valueRangeLow,
          valueRangeHigh: analysis.valueRangeHigh,
          confidence: analysis.confidence,
          marketAnalysis: analysis.marketAnalysis,
          comparableSales: analysis.comparableSales || [],
          commissionRate,
          commissionEstimate,
        };
      } catch (error) {
        await db.update(appraisals).set({
          status: "failed",
          marketAnalysis: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        }).where(eq(appraisals.id, appraisalId));

        return {
          id: appraisalId,
          status: "failed",
          error: error instanceof Error ? error.message : "Appraisal failed",
        };
      }
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [appraisal] = await db
        .select()
        .from(appraisals)
        .where(eq(appraisals.id, input.id))
        .limit(1);
      return appraisal || null;
    }),

  list: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    if (!ctx.user?.id) return [];
    return db
      .select()
      .from(appraisals)
      .where(eq(appraisals.userId, ctx.user.id))
      .orderBy(desc(appraisals.createdAt));
  }),
});
