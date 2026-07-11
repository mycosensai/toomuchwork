/**
 * Concierge Router — AI-powered site directory & service recommender
 * Understands the site's services and helps visitors find the right
 * service based on cost, item type, size, and their needs.
 */
import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { openaiChatStream } from "./lib/openai";

const SITE_SERVICES = [
  {
    id: "browse",
    name: "Browse Collection",
    path: "/browse",
    description: "Shop the marketplace for rare and exclusive collectibles — antiques, luxury watches, fine jewelry, rare coins, fine art, sports memorabilia, rare books, precious stones.",
    bestFor: "Buyers looking to purchase verified collectibles and luxury items.",
    costRange: "$100 - $500,000+",
  },
  {
    id: "sell",
    name: "Sell an Item",
    path: "/sell",
    description: "List your items for sale with transparent commissions: 5% under $1K, 7% $1K-$7.5K, 10% $7.5K-$10K, 5% over $10K.",
    bestFor: "Sellers wanting to reach verified collectors with AI-powered buyer matching.",
    costRange: "$100 - $500,000+",
  },
  {
    id: "appraisal",
    name: "AI Appraisal",
    path: "/appraisal",
    description: "Upload photos and get an instant AI-powered market valuation. Analyzes comparable sales, condition, provenance, and market trends across the internet.",
    bestFor: "Anyone who wants to know what their item is worth before buying/selling. Great for estate items, inherited pieces, or found treasures.",
    costRange: "Free — included with listing (standard tier)",
  },
  {
    id: "proverify",
    name: "ProVerify Certification",
    path: "/proverify",
    description: "AI-powered authenticity verification with blockchain certification on Solana. Creates a permanent, verifiable on-chain record of your item including photos and appraisal report.",
    bestFor: "High-value items needing authenticity proof. Luxury watches, fine art, rare collectibles. Buyers wanting guaranteed authentic items.",
    costRange: "$49.99+ per item",
  },
  {
    id: "token",
    name: "Token Gallery (NFTs)",
    path: "/token-gallery",
    description: "View and manage blockchain-certified items as NFTs on Solana. Each certificate is minted on-chain for permanent provenance.",
    bestFor: "Collectors who want blockchain-verified proof of ownership and authenticity for their items.",
    costRange: "Included with ProVerify certification",
  },
  {
    id: "forum",
    name: "Community Forum",
    path: "/forum",
    description: "Connect with fellow collectors. Discuss appraisals, trading tips, category-specific topics, and get advice from the community.",
    bestFor: "Collectors looking to network, ask questions, share knowledge, and discuss the market.",
    costRange: "Free",
  },
  {
    id: "orders",
    name: "My Orders",
    path: "/orders",
    description: "Track your purchases, view order history, check shipping status, and manage returns.",
    bestFor: "Buyers who have made purchases and need to track or manage their orders.",
    costRange: "N/A",
  },
  {
    id: "wishlist",
    name: "Wishlist",
    path: "/wishlist",
    description: "Save items you're interested in for later. Get notifications when prices drop or similar items appear.",
    bestFor: "Browsers who want to bookmark items and come back later.",
    costRange: "Free",
  },
  {
    id: "messages",
    name: "Messages",
    path: "/messages",
    description: "Direct messaging system for buyer-seller communication. Send and receive messages about listings, offers, and inquiries.",
    bestFor: "Users who need to communicate with sellers, buyers, or the platform owner.",
    costRange: "Free (requires login)",
  },
  {
    id: "agents",
    name: "AI Agent Fleet",
    path: "/agents",
    description: "Autonomous AI agents that handle outreach, buyer matching, market research, and business operations. Each project has dedicated agents.",
    bestFor: "Power users and business partners who want AI-driven automation for listings, outreach, and market analysis.",
    costRange: "Included with ProVerify or business partnership",
  },
  {
    id: "certificates",
    name: "Blockchain Certificates",
    path: "/certificate",
    description: "View and download blockchain certification records. Each certificate is a permanent on-chain record with unique hash and metadata.",
    bestFor: "Anyone who needs to verify an item's authenticity or download their certification documents.",
    costRange: "Included with ProVerify",
  },
  {
    id: "support",
    name: "Support Center",
    path: "/support",
    description: "Contact the team directly for disputes, inquiries, and help. Email: ratchetkrewelabs@gmail.com",
    bestFor: "Users who need human assistance, have disputes, or can't find what they need through self-service.",
    costRange: "Free",
  },
];

const SYSTEM_PROMPT = `You are a helpful concierge for The Vault DFW, a premium collector marketplace. Your job is to understand what the guest wants and recommend the best service.

SITE SERVICES:
${SITE_SERVICES.map(s => `- ${s.name} (${s.path}): ${s.description} Best for: ${s.bestFor} Cost: ${s.costRange}`).join("\n")}

GUIDELINES:
1. Listen to what the user describes — cost range, item type, size/quantity, and what they want to achieve
2. Recommend 1-3 services that best match their needs
3. Explain WHY each service fits their situation
4. If they want to buy something, recommend Browse + ProVerify
5. If they want to sell, recommend Sell + Appraisal (+ ProVerify for high-value)
6. If they're unsure what their item is worth, recommend Appraisal
7. If they want authenticity proof, recommend ProVerify
8. If they want community advice, recommend Forum
9. Always include direct links to the services you recommend
10. Be warm, helpful, and precise — no fluff
11. If what they need doesn't exist on the site, be honest and suggest the closest match or Support

RESPONSE FORMAT:
Return your response as JSON with this structure:
{
  "message": "Your warm, helpful response text with markdown formatting",
  "recommendations": [
    {
      "id": "service-id",
      "name": "Service Name",
      "path": "/service-path",
      "reason": "Why this fits their specific needs"
    }
  ]
}

Keep the message conversational and human. Use emojis sparingly.`;

export const conciergeRouter = createRouter({
  // ─── Chat with the concierge ───
  chat: publicQuery
    .input(z.object({
      message: z.string().min(1).max(2000),
    }))
    .mutation(async ({ input }) => {
      // Use streaming internally but return the full result
      let fullResponse = "";

      const systemMsg = { role: "system" as const, content: SYSTEM_PROMPT };
      const userMsg = { role: "user" as const, content: input.message };

      await openaiChatStream(
        {
          messages: [systemMsg, userMsg],
          temperature: 0.7,
          max_tokens: 1500,
        },
        (chunk, done) => {
          fullResponse += chunk;
        }
      );

      // Parse the JSON response
      try {
        const parsed = JSON.parse(fullResponse);
        return {
          message: parsed.message || fullResponse,
          recommendations: parsed.recommendations || [],
        };
      } catch {
        // If parsing fails, return raw text
        return {
          message: fullResponse,
          recommendations: [],
        };
      }
    }),

  // ─── Get all services (for the directory view) ───
  services: publicQuery.query(() => {
    return SITE_SERVICES;
  }),
});
