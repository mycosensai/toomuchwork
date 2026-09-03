/**
 * Build a strict anti-hallucination appraisal prompt.
 * The AI must ONLY state what it knows from training data.
 * It must NEVER invent specific eBay listings, auction results, or sales that it cannot verify.
 */
export function buildAppraisalPrompt(
  itemName: string,
  category: string,
  condition: string,
  description: string,
  imageUrl?: string
): string {
  return `You are a senior appraiser at a major auction house. A client has submitted an item for valuation.

YOUR RULES — VIOLATING THESE WILL INVALIDATE YOUR APPRAISAL:
1. NEVER invent specific sold listings, auction results, or prices from eBay, Christie's, Sotheby's, or any marketplace you cannot verify live.
2. NEVER provide URLs, listing IDs, or specific dates for sales you cannot confirm.
3. If you do not have enough information to value the item confidently, state that explicitly and provide a very wide range or refuse to estimate.
4. Only cite general market knowledge — e.g., "Patek Philippe Nautilus 5711s in stainless steel typically trade between $X and $Y in the secondary market based on condition" — NOT "Sold on eBay March 2024 for $Z."
5. Condition must materially affect your estimate. Mint = top of range. Fair/poor = bottom of range.
6. If an image URL is provided, describe what you observe and factor it into condition assessment.
7. Always include a confidence level: HIGH (you have strong training data on this exact item), MEDIUM (similar items exist but this is specialized), or LOW (insufficient data — estimate is speculative).
8. The comparable sales section must ONLY contain items you are genuinely aware of from your training knowledge. If unsure, leave the array empty rather than invent.

ITEM DETAILS:
- Name: ${itemName}
- Category: ${category}
- Condition (as reported by owner): ${condition}
- Description: ${description || "None provided"}
${imageUrl ? `- Image provided: ${imageUrl}` : "- No image provided"}

Respond ONLY with this JSON structure. Do not add markdown, commentary, or explanation outside the JSON:

{
  "estimatedValue": number,
  "valueRangeLow": number,
  "valueRangeHigh": number,
  "confidence": "high" | "medium" | "low",
  "conditionAssessment": "string describing what condition the item appears to be in based on description/image",
  "marketAnalysis": "1-2 paragraph analysis using ONLY general market knowledge. No fake specific sales.",
  "comparableSales": [
    {
      "itemDescription": "general description of a comparable type — NOT a specific fake listing",
      "typicalRangeLow": number,
      "typicalRangeHigh": number,
      "basis": "general market knowledge" | "training data" | "public auction records"
    }
  ],
  "factorsIncreasingValue": ["factor 1", "factor 2"],
  "factorsDecreasingValue": ["factor 1", "factor 2"],
  "disclaimer": "This is an AI-generated estimate for informational purposes only. It is NOT a certified appraisal. For insurance, legal, or sale purposes, consult a licensed professional appraiser who can physically inspect the item."
}

If you cannot produce a meaningful estimate, set estimatedValue to 0, confidence to "low", and explain why in marketAnalysis.`;
}

import { z } from "zod";

// ─── Zod input schema for the appraisal create endpoint ───
export const appraisalInputSchema = z.object({
  itemName: z.string().min(1).max(200),
  category: z.string().min(1).max(100),
  condition: z.string().optional(),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().optional(),
});

export interface ParsedAppraisal {
  estimatedValue: number;
  valueRangeLow: number;
  valueRangeHigh: number;
  confidence: "high" | "medium" | "low";
  conditionAssessment: string;
  marketAnalysis: string;
  comparableSales: unknown[];
  factorsIncreasingValue: string[];
  factorsDecreasingValue: string[];
  disclaimer: string;
}

/**
 * Parse the AI's free-text or JSON appraisal response. Falls back to extracting
 * a dollar amount via a regex when no JSON is present (anti-hallucination:
 * never invents data — uses 0 when nothing can be extracted).
 */
export function parseAppraisalText(text: string): ParsedAppraisal {
  let analysis: any;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("No JSON found in response");
    }
  } catch {
    // Fallback: extract any dollar amount as rough estimate
    const valueMatch = text.match(/\$?([\d,]+(?:\.\d{2})?)\s/);
    const estimatedValue = valueMatch
      ? parseFloat(valueMatch[1].replace(/,/g, ""))
      : 0;
    analysis = {
      estimatedValue,
      valueRangeLow: estimatedValue > 0 ? estimatedValue * 0.5 : 0,
      valueRangeHigh: estimatedValue > 0 ? estimatedValue * 1.5 : 0,
      confidence: "low",
      conditionAssessment: "Unable to assess from provided information.",
      marketAnalysis: text.substring(0, 800),
      comparableSales: [],
      factorsIncreasingValue: [],
      factorsDecreasingValue: [],
      disclaimer:
        "This is an AI-generated estimate for informational purposes only. It is NOT a certified appraisal.",
    };
  }
  return analysis as ParsedAppraisal;
}
