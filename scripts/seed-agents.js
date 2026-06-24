#!/usr/bin/env node
/**
 * Seed Agent Projects into D1
 * Reads agent definitions from code and inserts them into the D1 database.
 *
 * Usage:
 *   node scripts/seed-agents.js              # Preview SQL
 *   node scripts/seed-agents.js --apply      # Insert into D1 via wrangler
 */

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// Agent definitions are in agent-definitions.ts — we extract the data manually
// to avoid runtime ts-node issues. These must match agent-definitions.ts exactly.
const SEED = [
  { projectId: "appraiser", name: "AI Appraiser", description: "Photo-based luxury item appraisal. Value ranges, authenticity, market analysis.", mode: "A", priority: 1, cycleBudgetMinutes: 5, verificationCommand: "Output must contain valid estimatedValue and valueRangeLow/High. Confidence must be one of high/medium/low.", handsOff: '["users","payments","auth"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "outreach", name: "Buyer Outreach", description: "Professional lead generation. Finds verified buyers, collectors, dealers.", mode: "A", priority: 1, cycleBudgetMinutes: 10, verificationCommand: "Each segment must be a professional type, not a fake individual. No invented names or emails.", handsOff: '["users","payments","stripe"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "proverify", name: "ProVerify Engine", description: "Multi-expert verification with consensus scoring for authenticity and value.", mode: "A", priority: 1, cycleBudgetMinutes: 8, verificationCommand: "Must have 3+ expert reviews with scores 0-100. All scores marked as simulated estimates.", handsOff: '["users","payments"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "content", name: "Content & SEO", description: "Product descriptions, SEO copy, marketing content for listings.", mode: "B", priority: 2, cycleBudgetMinutes: 5, verificationCommand: "Must have exactly 3 variants with correct word counts. No fabricated provenance.", handsOff: '["users","payments","auth"]', providerId: "openai", model: "gpt-4o-mini" },
  { projectId: "security", name: "Security Auditor", description: "Security monitoring, vulnerability audits, penetration testing.", mode: "A", priority: 1, cycleBudgetMinutes: 10, verificationCommand: "Each finding must have severity and remediation. No invented CVEs.", handsOff: '["users","payments","production_db"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "pricing", name: "Pricing Intelligence", description: "Market analysis and price recommendations based on real data only.", mode: "B", priority: 2, cycleBudgetMinutes: 7, verificationCommand: "Comparables must be general market knowledge only. No specific unverified sales.", handsOff: '["users","payments","stripe"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "support", name: "Support Assistant", description: "Customer support. Answers FAQs, routes complex issues to humans.", mode: "B", priority: 3, cycleBudgetMinutes: 3, verificationCommand: "Response must be based only on provided policies. Must not fabricate policy details.", handsOff: '["users","payments","auth","personal_data"]', providerId: "openai", model: "gpt-4o-mini" },
  { projectId: "listing", name: "Listing Optimizer", description: "Quality checks for photos, descriptions, pricing, compliance.", mode: "A", priority: 2, cycleBudgetMinutes: 5, verificationCommand: "Compliance flags must be specific. Scores 0-100 integers. No invented violations.", handsOff: '["users","payments","production_db"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "compliance", name: "Compliance Monitor", description: "Legal/regulatory compliance review. Terms, privacy, shipping, tax.", mode: "B", priority: 2, cycleBudgetMinutes: 10, verificationCommand: "Findings must reference general regulations only. No invented section numbers.", handsOff: '["users","payments","legal_contracts"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "social", name: "Social Lead Gen", description: "Social media intelligence. Community identification, engagement strategy.", mode: "A", priority: 3, cycleBudgetMinutes: 8, verificationCommand: "No fabricated usernames, follower counts, or metrics. Use placeholders only.", handsOff: '["users","payments","personal_data"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "research", name: "Market Research", description: "Web intelligence. Searches for buyer interest, social discussions, and market trends.", mode: "A", priority: 2, cycleBudgetMinutes: 10, verificationCommand: "Every finding must include source URL. No fabricated URLs or posts.", handsOff: '["users","payments","auth","personal_data"]', providerId: "openai", model: "gpt-4o" },
  // ─── NEW AGENTS ───
  { projectId: "cataloging", name: "Cataloging Agent", description: "Intake and catalog new auction items. Generates structured catalog records from item details.", mode: "A", priority: 1, cycleBudgetMinutes: 5, verificationCommand: "Must have valid title, category, description. No fabricated provenance or maker marks.", handsOff: '["users","payments","auth"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "photography", name: "Photography Agent", description: "Process and optimize images for auction listings. Crops, color-corrects, generates thumbnails.", mode: "A", priority: 2, cycleBudgetMinutes: 3, verificationCommand: "Must not alter item appearance beyond standard optimization. Quality score 0-100 required.", handsOff: '["users","payments","auth","personal_data"]', providerId: "openai", model: "gpt-4o-mini" },
  { projectId: "logistics", name: "Logistics Agent", description: "Coordinate shipping and tracking for sold items. Generates labels and schedules pickups.", mode: "A", priority: 2, cycleBudgetMinutes: 5, verificationCommand: "Must include carrier, tracking number, and insurance for items over $5,000.", handsOff: '["users","payments","pricing","legal"]', providerId: "openai", model: "gpt-4o" },
  { projectId: "inventory", name: "Inventory Agent", description: "Track items in storage. Updates stock counts, location assignments, status transitions.", mode: "B", priority: 3, cycleBudgetMinutes: 3, verificationCommand: "Status transitions must be valid. Flag discrepancies for human review.", handsOff: '["users","payments","auth","personal_data"]', providerId: "openai", model: "gpt-4o-mini" },
  { projectId: "analytics", name: "Analytics Agent", description: "Data analysis and reporting. Revenue trends, forecasts, customer segment insights.", mode: "B", priority: 3, cycleBudgetMinutes: 8, verificationCommand: "All predictions must include confidence levels and ranges. No guaranteed future values.", handsOff: '["users","payments","auth","personal_data"]', providerId: "openai", model: "gpt-4o" },
];

function generateSQL() {
  const now = Date.now();
  const lines = [];

  for (const a of SEED) {
    lines.push(
      `INSERT OR IGNORE INTO agent_projects (project_id, name, description, mode, priority, engineer_command, verification_command, cycle_budget_minutes, hands_off, provider_id, model, active, created_at, updated_at) ` +
      `VALUES ('${a.projectId}', '${a.name.replace(/'/g, "''")}', '${a.description.replace(/'/g, "''")}', '${a.mode}', ${a.priority}, '', '${a.verificationCommand.replace(/'/g, "''")}', ${a.cycleBudgetMinutes}, '${a.handsOff}', '${a.providerId}', '${a.model}', 1, ${now}, ${now});`
    );
  }

  return lines.join("\n");
}

const flag = process.argv[2];

if (flag === "--apply") {
  const sql = generateSQL();
  const tmpFile = resolve(ROOT, ".tmp-seed-agents.sql");
  writeFileSync(tmpFile, sql, "utf-8");

  console.log(`[seed-agents] Seeding ${SEED.length} agents into D1...`);
  try {
    execSync(
      `npx wrangler d1 execute thevault-db --file="${tmpFile}" --remote`,
      { cwd: ROOT, stdio: "inherit", timeout: 60_000 },
    );
    console.log(`[seed-agents] ✅ ${SEED.length} agents seeded successfully.`);
  } catch (err) {
    console.error("[seed-agents] ❌ Failed:", err.message);
    process.exit(1);
  } finally {
    try { execSync(`rm "${tmpFile}"`, { stdio: "ignore" }); } catch {}
  }
} else {
  // Preview mode
  console.log("─── SEED SQL (preview) ───");
  console.log(generateSQL());
  console.log(`\n${SEED.length} agents ready. Run with --apply to seed D1.`);
}
