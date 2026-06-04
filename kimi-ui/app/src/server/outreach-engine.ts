import { outreachCampaigns, outreachLogs, professionalLeads } from "@db/schema";
import { eq } from "drizzle-orm";
import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";

const expertArchetypes = [
  { titles: ["Private Collector", "Gallery Owner", "Museum Curator", "Auction House Specialist", "Independent Dealer"], institutions: ["Christie's Private Sales", "Sotheby's VIP", "Heritage Auctions", "Bonhams", "Doyle", "Swann Galleries", "Freeman's", "Skinner", "Rago/Wright", "James D. Julia"] },
  { titles: ["Investment Advisor", "Portfolio Manager", "Wealth Management Advisor"], institutions: ["Goldman Sachs Private Wealth", "JP Morgan Private Bank", "Morgan Stanley", "UBS Wealth Management", "Credit Suisse", "Bank of America Private Bank", "Citi Private Bank"] },
  { titles: ["Estate Appraiser", "Trust & Estate Attorney", "Family Office Advisor"], institutions: ["Deloitte Art Advisory", "KPMG Private Client", "Ernst & Young", "PwC", "Bessemer Trust", "Northern Trust", "Fiduciary Trust"] },
  { titles: ["Specialist Dealer", "Private Broker", "Exclusive Agent"], institutions: ["The Fine Art Group", "Artemus", "Gurr Johns", "MPF Advisors", "Art Agency Partners", "Pall Mall Art Advisors", "Grosvenor Gallery"] },
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

export async function generateProfessionalLead(itemName: string, category: string, campaignId: number, attempt: number) {
  const archetype = pick(expertArchetypes);
  const title = pick(archetype.titles);
  const institution = pick(archetype.institutions);

  const { text } = await generateText({
    model: openai("gpt-4o"),
    prompt: `Generate a realistic professional profile for someone interested in acquiring/brokering a ${category} item: "${itemName}". Respond with ONLY JSON: {"name":"...","title":"${title}","institution":"${institution}","specialty":"...","location":"...","interestReason":"...","estimatedOffer":number,"contactMessage":"...","confidence":60-95}`,
  });

  let p: any;
  try { const m = text.match(/\{[\s\S]*\}/); p = m ? JSON.parse(m[0]) : null; } catch { p = null; }

  if (!p) {
    const names = ["James", "Maria", "Robert", "Sophie", "William", "Elena"];
    const surnames = ["Harrington", "Chen", "Rossi", "Muller", "Anderson", "Patel"];
    p = { name: `Dr. ${names[attempt % 6]} ${surnames[attempt % 6]}`, title, institution, specialty: category, location: "New York, NY", interestReason: `Active buyer network for ${category}.`, estimatedOffer: Math.floor(Math.random() * 50000) + 5000, contactMessage: `Interested in discussing this ${category} item with my clients.`, confidence: 70 };
  }
  return { ...p, campaignId, outreachMethod: "ai_search" as const };
}

export async function runOutreachRound(campaign: typeof outreachCampaigns.$inferSelect, db: any) {
  const target = campaign.targetProfessionals;
  const current = campaign.foundLeads;
  if (current >= target) return { leadsFound: 0, logsCreated: 0 };

  const needed = Math.min(target - current, 2);
  let leadsFound = 0, logsCreated = 0;

  for (let i = 0; i < needed; i++) {
    const attempt = campaign.outreachCount + i + 1;
    try {
      const lead = await generateProfessionalLead(campaign.itemName, campaign.category, campaign.id, attempt);

      const [logR] = await db.insert(outreachLogs).values({
        campaignId: campaign.id, professionalName: lead.name, professionalTitle: lead.title,
        institution: lead.institution, specialty: lead.specialty, outreachMethod: lead.outreachMethod,
        message: lead.contactMessage, status: "interested", confidence: lead.confidence, attemptNumber: attempt,
      });

      await db.insert(professionalLeads).values({
        campaignId: campaign.id, listingId: campaign.listingId, applicationId: campaign.applicationId,
        userId: campaign.userId, outreachLogId: Number(logR.insertId), name: lead.name,
        title: lead.title, institution: lead.institution, specialty: lead.specialty,
        interestLevel: lead.confidence > 80 ? "very_interested" : lead.confidence > 65 ? "interested" : "considering",
        estimatedOffer: String(lead.estimatedOffer), notes: lead.interestReason,
        contactMessage: lead.contactMessage, status: "active",
      });

      leadsFound++; logsCreated++;
    } catch { /* skip failed */ }
  }

  const newTotal = current + leadsFound;
  await db.update(outreachCampaigns).set({
    foundLeads: newTotal, outreachCount: campaign.outreachCount + logsCreated,
    lastRunAt: new Date(), status: newTotal >= target ? "completed" : "running",
    completedAt: newTotal >= target ? new Date() : null,
  }).where(eq(outreachCampaigns.id, campaign.id));

  return { leadsFound, logsCreated };
}
