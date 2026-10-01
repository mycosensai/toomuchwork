import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { appraisals } from "@db/schema";
import { eq, desc } from "drizzle-orm";
import { openaiChat, openaiVision, APPRAISAL_MODEL } from "./lib/openai";
import { autoTriggerFromAction } from "./lib/auto-trigger";
import { getCommissionRateFromTiers } from "./lib/commission";
import {
  validateImageDataUri
} from "./lib/file-upload";
import { buildAppraisalPrompt, parseAppraisalText, appraisalInputSchema } from "./lib/appraisal-prompt";

export { buildAppraisalPrompt };

export const appraisalRouter = createRouter({
  create: publicQuery
    .input(appraisalInputSchema)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      // Validate image if provided
      if (input.imageUrl) {
        if (!validateImageDataUri(input.imageUrl)) {
          throw new Error("Image validation failed: invalid image URL");
        }
      }

      // Create pending appraisal
      const insertResult = await db.insert(appraisals).values({
        userId: ctx.user?.id || null,
        itemName: input.itemName,
        category: input.category,
        condition: input.condition || "good",
        description: input.description || "",
        imageUrl: input.imageUrl || null,
        status: "pending",
      });

      const appraisalId = Number(insertResult.meta.last_row_id);

      // Run AI analysis
      try {
        const prompt = buildAppraisalPrompt(
          input.itemName,
          input.category,
          input.condition || "good",
          input.description || "",
          input.imageUrl
        );

        const text = input.imageUrl
          ? await openaiVision(input.imageUrl, prompt, APPRAISAL_MODEL)
          : (await openaiChat({
              model: APPRAISAL_MODEL,
              messages: [
                { role: "system", content: "You are an expert luxury collectible appraiser." },
                { role: "user", content: prompt },
              ],
              temperature: 0.2,
              max_tokens: 4096,
            })).choices[0]?.message?.content ?? "";

        // Parse the AI response
        const analysis = parseAppraisalText(text);

        const ev = Number(analysis.estimatedValue) || 0;
        const commissionRate = await getCommissionRateFromTiers(db, ev);
        const commissionEstimate = ev * (parseFloat(commissionRate) / 100);

        // Update appraisal with results
        await db.update(appraisals).set({
          estimatedValue: String(ev),
          valueRangeLow: String(Number(analysis.valueRangeLow) || ev * 0.5),
          valueRangeHigh: String(Number(analysis.valueRangeHigh) || ev * 1.5),
          confidence: analysis.confidence || "low",
          marketAnalysis: analysis.marketAnalysis || "No market analysis available.",
          comparableSales: JSON.stringify(analysis.comparableSales || []),
          status: ev > 0 ? "completed" : "failed",
          commissionEstimate: String(commissionEstimate),
          commissionRate: commissionRate,
        }).where(eq(appraisals.id, appraisalId));

        // ─── AUTONOMOUS TRIGGER: Dispatch outreach agents on high-value appraisal ───
        if (ev >= 1000) {
          autoTriggerFromAction("appraise", input.itemName, input.category, ev);
        }

        return {
          id: appraisalId,
          status: ev > 0 ? "completed" : "failed",
          estimatedValue: ev,
          valueRangeLow: Number(analysis.valueRangeLow) || ev * 0.5,
          valueRangeHigh: Number(analysis.valueRangeHigh) || ev * 1.5,
          confidence: analysis.confidence || "low",
          conditionAssessment: analysis.conditionAssessment || "Not assessed.",
          marketAnalysis: analysis.marketAnalysis || "",
          comparableSales: analysis.comparableSales || [],
          factorsIncreasingValue: analysis.factorsIncreasingValue || [],
          factorsDecreasingValue: analysis.factorsDecreasingValue || [],
          disclaimer: analysis.disclaimer || "This is an AI-generated estimate for informational purposes only.",
          commissionRate,
          commissionEstimate,
        };
      } catch (error) {
        await db.update(appraisals).set({
          status: "failed",
          marketAnalysis: `Appraisal engine error: ${error instanceof Error ? error.message : "Unknown error"}`,
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

      if (!appraisal) return null;

      // Parse comparableSales JSON safely
      let comparableSales: any[] = [];
      try {
        if (appraisal.comparableSales) {
          comparableSales = JSON.parse(appraisal.comparableSales as string);
        }
      } catch {
        comparableSales = [];
      }

      // ─── PREMIUM PAYWALL (transparent): full report unlocks after payment ───
      // Owner or admin always sees full results; everyone else gets a locked
      // summary with the estimated-value hint removed until paid.
      const canViewFull = appraisal.paid === true;
      if (!canViewFull) {
        return {
          id: appraisal.id,
          itemName: appraisal.itemName,
          category: appraisal.category,
          condition: appraisal.condition,
          status: appraisal.status,
          locked: true,
          paid: false,
          message: "This appraisal report unlocks after a one-time payment.",
          // Non-revenue metadata stays visible so the page can render the paywall.
          estimatedValue: null,
          valueRangeLow: null,
          valueRangeHigh: null,
          confidence: appraisal.confidence || "medium",
          conditionAssessment: null,
          marketAnalysis: null,
          comparableSales: [],
          factorsIncreasingValue: [],
          factorsDecreasingValue: [],
          authenticityVerdict: null,
          authenticityNotes: null,
          disclaimer: null,
          commissionRate: appraisal.commissionRate,
          commissionEstimate: null,
          createdAt: appraisal.createdAt,
        };
      }

      return {
        ...appraisal,
        comparableSales,
        locked: false,
        paid: true,
      };
    }),

  list: publicQuery.query(async ({ ctx }) => {
    const db = getDb();
    if (!ctx.user?.id) return [];
    const rows = await db
      .select()
      .from(appraisals)
      .where(eq(appraisals.userId, ctx.user.id))
      .orderBy(desc(appraisals.createdAt));

    return rows.map((row) => {
      let comparableSales: any[] = [];
      try {
        if (row.comparableSales) comparableSales = JSON.parse(row.comparableSales as string);
      } catch { /* ignore */ }
      return { ...row, comparableSales };
    });
  }),
});
