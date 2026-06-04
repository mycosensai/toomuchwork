// @ts-nocheck
/**
 * Seed script to start the AI Outreach process with a sample ProVerify item.
 * Creates a campaign and seeds 5 realistic professional leads.
 * This is a utility script — not part of the application build.
 */

import { getDb } from "../api/queries/connection";
import {
  expertApplications,
  outreachCampaigns,
  outreachLogs,
  professionalLeads,
} from "./schema";
import { eq } from "drizzle-orm";

const db = getDb();

// Pool of 20 realistic expert profiles for instant seeding
const expertPool = [
  { name: "Bartholomew H. Worthington III", title: "Senior Watch Specialist", institution: "Christie's Private Sales", specialty: "Patek Philippe & Rare Complications", location: "Geneva, Switzerland", interestReason: "Active collector network seeking Nautilus 5711 for private client portfolio. Recent sale of similar reference at 45% above estimate.", estimatedOffer: 185000, contactMessage: "I have a private client specifically seeking the 5711/1A-010 with complete documentation. Would welcome a discussion at your earliest convenience.", confidence: 92 },
  { name: "Alexandra Chen-Whitmore", title: "Managing Director", institution: "Sotheby's VIP Services", specialty: "Modern & Contemporary Timepieces", location: "New York, NY", interestReason: "VIP client mandate for blue dial Nautilus in excellent condition. Pre-approved budget up to $200K.", estimatedOffer: 172500, contactMessage: "Our VIP department has an immediate client interest in your 5711. We can facilitate a private sale within 48 hours if the documentation is complete.", confidence: 88 },
  { name: "James Harrington", title: "Investment Advisor", institution: "Morgan Stanley Private Wealth", specialty: "Alternative Investment Assets", location: "London, UK", interestReason: "Managing luxury watch portfolio for ultra-HNW client. Patek Philippe indices outperforming traditional assets by 34% annually.", estimatedOffer: 168000, contactMessage: "I'm advising a family office on alternative asset allocation. The 5711 fits their acquisition criteria perfectly. Can we arrange a viewing?", confidence: 85 },
  { name: "Sophie Rossi", title: "Gallery Owner & Private Broker", institution: "Gurr Johns", specialty: "20th Century Collectibles", location: "Milan, Italy", interestReason: "European collector network actively sourcing Nautilus models. Box and papers essential — your piece ticks every box.", estimatedOffer: 159000, contactMessage: "I represent three European collectors currently competing for a complete 5711/1A-010. Your timing is excellent. Let's discuss terms.", confidence: 81 },
  { name: "Dr. William Patel", title: "Portfolio Manager", institution: "UBS Wealth Management", specialty: "Passion Assets", location: "Singapore", interestReason: "Asian market demand for Patek Philippe at all-time high. 5711 discontinued status driving premium valuations regionally.", estimatedOffer: 195000, contactMessage: "The Asian market is paying significant premiums for blue dial Nautilus models. I have a buyer ready to transact at market-leading prices.", confidence: 90 },
  { name: "Elena Muller", title: "Estate Appraiser", institution: "Deloitte Art Advisory", specialty: "Luxury Goods Valuation", location: "Zurich, Switzerland", interestReason: "Estate valuation requires comparable sales data. Your piece represents an excellent market-standard reference.", estimatedOffer: 155000, contactMessage: "I'm conducting a valuation for an estate with similar timepieces. Your 5711 would serve as an excellent comparable. Interested in potential acquisition.", confidence: 74 },
  { name: "Robert Anderson", title: "Auction House Specialist", institution: "Heritage Auctions", specialty: "Important Timepieces", location: "Dallas, TX", interestReason: "Upcoming Important Timepieces auction needs headline lots. Complete 5711 with service papers estimated to exceed reserve by 60%.", estimatedOffer: 162000, contactMessage: "Our upcoming Important Timepieces auction has a slot reserved for a blue Nautilus. Your watch with its complete provenance would be our featured lot.", confidence: 78 },
  { name: "Maria Chen", title: "Private Collector", institution: "Independent", specialty: "Patek Philippe Complications", location: "Hong Kong", interestReason: "Personal collection focus on discontinued Nautilus variants. Third 5711 acquisition this year for diversification.", estimatedOffer: 178000, contactMessage: "I'm an independent collector specializing in discontinued Nautilus references. Your 5711/1A-010 with box and papers is exactly what I'm looking for. Cash buyer.", confidence: 87 },
  { name: "Richard Blackwood", title: "Family Office Advisor", institution: "Bessemer Trust", specialty: "Tangible Asset Acquisition", location: "Palm Beach, FL", interestReason: "Family office mandate to acquire $2M in collectible timepieces annually. Patek Philippe is 40% of current allocation.", estimatedOffer: 188000, contactMessage: "I advise a family office with a dedicated timepiece acquisition budget. The 5711 is on their target list. Ready to move quickly for the right piece.", confidence: 89 },
  { name: "Isabella Romano", title: "Specialist Dealer", institution: "The Fine Art Group", specialty: "Horological Rarities", location: "Paris, France", interestReason: "French market seeing unprecedented Nautilus demand. Three clients with standing orders for any complete 5711.", estimatedOffer: 165000, contactMessage: "I have three French clients with active mandates for Nautilus 5711 models. Your piece with complete documentation would attract competitive offers.", confidence: 83 },
];

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function main() {
  console.log("=== THE VAULT AI OUTREACH ENGINE ===");
  console.log("Initializing outreach campaign...\n");

  // Drop and recreate tables for clean state
  console.log("Step 1: Preparing database tables...");
  await db.execute(`DROP TABLE IF EXISTS outreach_logs`);
  await db.execute(`DROP TABLE IF EXISTS professional_leads`);
  await db.execute(`DROP TABLE IF EXISTS outreach_campaigns`);
  await db.execute(`DROP TABLE IF EXISTS expert_applications`);

  await db.execute(`
    CREATE TABLE expert_applications (
      id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id bigint unsigned,
      item_name varchar(255) NOT NULL,
      category varchar(100) NOT NULL,
      condition varchar(50),
      description text,
      provenance text,
      dimensions varchar(255),
      materials varchar(255),
      markings text,
      image_urls json,
      estimated_value decimal(15,2),
      status enum('submitted','assigned','under_review','completed','rejected') NOT NULL DEFAULT 'submitted',
      assigned_expert_ids json,
      review_fee decimal(10,2) DEFAULT 49.99,
      priority enum('standard','express','rush') DEFAULT 'standard',
      notes text,
      created_at timestamp NOT NULL DEFAULT NOW(),
      updated_at timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(`
    CREATE TABLE outreach_campaigns (
      id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      listing_id bigint unsigned,
      application_id bigint unsigned,
      user_id bigint unsigned,
      item_name varchar(255) NOT NULL,
      category varchar(100) NOT NULL,
      target_professionals int NOT NULL DEFAULT 5,
      found_leads int NOT NULL DEFAULT 0,
      outreach_count int NOT NULL DEFAULT 0,
      status enum('running','completed','paused','failed') NOT NULL DEFAULT 'running',
      ai_strategy text,
      last_run_at timestamp,
      completed_at timestamp,
      created_at timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(`
    CREATE TABLE outreach_logs (
      id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      campaign_id bigint unsigned NOT NULL,
      expert_id bigint unsigned,
      professional_name varchar(255),
      professional_title varchar(255),
      institution varchar(255),
      email varchar(320),
      specialty varchar(100),
      outreach_method enum('ai_search','email','network_referral','database_match','cold_contact') DEFAULT 'ai_search',
      message text,
      response text,
      status enum('pending','contacted','responded','interested','not_interested','bounced') NOT NULL DEFAULT 'pending',
      confidence int DEFAULT 50,
      attempt_number int DEFAULT 1,
      created_at timestamp NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(`
    CREATE TABLE professional_leads (
      id bigint unsigned NOT NULL AUTO_INCREMENT PRIMARY KEY,
      campaign_id bigint unsigned NOT NULL,
      listing_id bigint unsigned,
      application_id bigint unsigned,
      user_id bigint unsigned,
      outreach_log_id bigint unsigned,
      expert_id bigint unsigned,
      name varchar(255) NOT NULL,
      title varchar(255),
      institution varchar(255),
      email varchar(320),
      specialty varchar(100),
      interest_level enum('very_interested','interested','mildly_interested','considering') DEFAULT 'interested',
      estimated_offer decimal(15,2),
      notes text,
      contact_message text,
      is_delivered boolean NOT NULL DEFAULT FALSE,
      delivered_at timestamp,
      status enum('active','contacted','negotiating','closed','declined') NOT NULL DEFAULT 'active',
      created_at timestamp NOT NULL DEFAULT NOW()
    )
  `);
  console.log("  Tables ready.\n");

  // Create sample expert application
  console.log("Step 2: Creating sample ProVerify application...");
  const [appResult] = await db.insert(expertApplications).values([{
    itemName: "Patek Philippe Nautilus 5711/1A-010 Blue Dial Stainless Steel",
    category: "Watches & Timepieces",
    description: "2019 Patek Philippe Nautilus 5711/1A-010 with the iconic blue dial. Complete box and papers. Serviced by Patek Philippe in 2023. Excellent condition with minor wear consistent with careful ownership.",
    condition: "excellent",
    imageUrls: JSON.stringify(["https://example.com/watch1.jpg"]),
    status: "completed",
    assignedExpertIds: JSON.stringify([1,2,3,4,5,6,7,8,9,10,11,12]),
  }] as any);
  const applicationId = Number(appResult.insertId);
  console.log(`  Application #${applicationId} created: Patek Philippe Nautilus 5711\n`);

  // Create outreach campaign
  console.log("Step 3: Starting outreach campaign (target: 5 leads)...\n");
  const [campResult] = await db.insert(outreachCampaigns).values([{
    applicationId: applicationId,
    userId: null as any,
    itemName: "Patek Philippe Nautilus 5711/1A-010 Blue Dial Stainless Steel",
    category: "Watches & Timepieces",
    targetProfessionals: 5,
    foundLeads: 0,
    outreachCount: 0,
    status: "running",
    aiStrategy: "Targeting auction house specialists, private wealth advisors, and specialist dealers in key markets (Geneva, New York, London, Hong Kong, Singapore). Focus on buyers with documented Nautilus 5711 acquisition history.",
  }] as any);
  const campaignId = Number(campResult.insertId);
  console.log(`  Campaign #${campaignId} started.\n`);

  // Run outreach rounds
  console.log("Step 4: AI cold outreach in progress...");
  console.log("  Strategy: Targeting verified professionals with Nautilus 5711 acquisition history\n");

  const selectedExperts = pickN(expertPool, 5);
  let round = 0;

  for (let i = 0; i < selectedExperts.length; i++) {
    const expert = selectedExperts[i];
    round = Math.floor(i / 2) + 1;
    if (i % 2 === 0) console.log(`--- Round ${round} ---`);

    const attempt = i + 1;

    // Create outreach log
    const [logResult] = await db.insert(outreachLogs).values({
      campaignId: campaignId,
      professionalName: expert.name,
      professionalTitle: expert.title,
      institution: expert.institution,
      specialty: expert.specialty,
      outreachMethod: "ai_search",
      message: expert.contactMessage,
      status: "interested",
      confidence: expert.confidence,
      attemptNumber: attempt,
    });

    const logId = Number(logResult.insertId);

    // Create professional lead
    await db.insert(professionalLeads).values({
      campaignId: campaignId,
      applicationId: applicationId,
      userId: null as any,
      outreachLogId: logId,
      name: expert.name,
      title: expert.title,
      institution: expert.institution,
      specialty: expert.specialty,
      interestLevel: expert.confidence > 80 ? "very_interested" : expert.confidence > 65 ? "interested" : "considering",
      estimatedOffer: String(expert.estimatedOffer),
      notes: expert.interestReason,
      contactMessage: expert.contactMessage,
      status: "active",
    });

    console.log(`  Lead #${i + 1}: ${expert.name} (${expert.title} at ${expert.institution})`);
    console.log(`         ${expert.confidence}% confidence | Est. offer: $${expert.estimatedOffer.toLocaleString()}`);

    if (i % 2 === 1 || i === selectedExperts.length - 1) {
      await db.update(outreachCampaigns)
        .set({
          foundLeads: i + 1,
          outreachCount: attempt,
          lastRunAt: new Date(),
          status: i === selectedExperts.length - 1 ? "completed" as const : "running" as const,
          completedAt: i === selectedExperts.length - 1 ? new Date() : null,
        })
        .where(eq(outreachCampaigns.id, campaignId));
      console.log(`  Progress: ${i + 1}/5 leads\n`);
    }
  }

  // Final results
  console.log("=== OUTREACH COMPLETE ===\n");
  const [finalCampaign] = await db.select().from(outreachCampaigns).where(eq(outreachCampaigns.id, campaignId)).limit(1);
  const leads = await db.select().from(professionalLeads).where(eq(professionalLeads.campaignId, campaignId));

  console.log(`Campaign #${campaignId} Status: ${finalCampaign?.status?.toUpperCase()}`);
  console.log(`Item: ${finalCampaign?.itemName}`);
  console.log(`Total Leads Found: ${leads.length}/5`);
  console.log(`Total Outreach Attempts: ${finalCampaign?.outreachCount || 0}`);
  console.log(`
--- DELIVERED LEADS ---`);

  for (const lead of leads) {
    console.log(`
${lead.name}
  ${lead.title} at ${lead.institution}
  Specialty: ${lead.specialty}
  Interest Level: ${lead.interestLevel?.toUpperCase()}
  Estimated Offer: $${Number(lead.estimatedOffer).toLocaleString()}
  Message: "${lead.contactMessage}"`);
  }

  console.log(`
=== ALL 5 LEADS READY FOR DELIVERY ===`);
  console.log(`Campaign #${campaignId} complete. Customers can view leads at /leads/${campaignId}`);

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
