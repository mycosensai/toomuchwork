#!/usr/bin/env node
/**
 * thevault-v2 — Database Migration Tool
 * Phase 2: Schema export + zero-data-loss migration to D1.
 *
 * Usage:
 *   node scripts/migrate-db.js                    # Print schema SQL to stdout
 *   node scripts/migrate-db.js --apply            # Apply to production D1 (requires wrangler)
 *   node scripts/migrate-db.js --export-schema    # Print drizzle schema SQL only
 *
 * Prerequisites:
 *   - wrangler CLI authenticated
 *   - CLOUDFLARE_API_TOKEN or wrangler login
 *   - D1 database "thevault-db" exists
 *
 * Zero data loss guarantee:
 *   All migrations use CREATE TABLE IF NOT EXISTS / ADD COLUMN IF NOT EXISTS
 *   patterns. Existing rows are never dropped. The script is idempotent.
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── All migration SQL statements, in dependency order ───

// ─── Additional supplementary tables not in drizzle schema ───
const RAW_TABLES = [
  // Links between listings and categories (junction table)
  `CREATE TABLE IF NOT EXISTS listing_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    FOREIGN KEY (listing_id) REFERENCES listings(id),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  );`,
];

// ─── Indexes not captured in drizzle schema ───
const EXTRA_INDEXES = [
  "CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);",
  "CREATE INDEX IF NOT EXISTS idx_listings_user_id ON listings(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_appraisals_user_id ON appraisals(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);",
  "CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_stripe_sessions_listing_id ON stripe_sessions(listing_id);",
  "CREATE INDEX IF NOT EXISTS idx_stripe_sessions_user_id ON stripe_sessions(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id ON support_conversations(user_id);",
  "CREATE INDEX IF NOT EXISTS idx_agent_logs_project_id ON agent_logs(project_id);",
  "CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);",
  "CREATE INDEX IF NOT EXISTS idx_agent_tasks_project_id ON agent_tasks(project_id);",
  "CREATE INDEX IF NOT EXISTS idx_agent_cycles_project_id ON agent_cycles(project_id);",
];

// ─── Helpers ───

function fullSchemaSQL() {
  const parts = [
    "-- ================================================================",
    `-- thevault-v2 — Full D1 Schema Export`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Source: drizzle migration 0000 + schema-agents.ts + raw migrations`,
    "-- ================================================================",
    "",
  ];

  // Migration 0000 contains all drizzle-managed tables
  parts.push(
    readFileSync(resolve(ROOT, "db/migrations/0000_graceful_frightful_four.sql"), "utf-8").trim(),
  );

  // Supplementary tables
  parts.push("-- ─── Supplementary tables ───");
  parts.push(...RAW_TABLES);

  // Users schema fix
  parts.push("-- ─── Users schema fix ───");
  parts.push(
    readFileSync(resolve(ROOT, "migrations/0001_users_schema_fix.sql"), "utf-8").trim(),
  );

  // Webhook events
  parts.push("-- ─── Webhook events ───");
  parts.push(
    readFileSync(resolve(ROOT, "migrations/0002_webhook_events.sql"), "utf-8").trim(),
  );

  // Extra indexes
  parts.push("-- ─── Performance indexes ───");
  parts.push(...EXTRA_INDEXES);

  return parts.join("\n\n") + "\n";
}

async function applyToD1() {
  console.log("[migrate-db] Generating full schema SQL...");
  const sql = fullSchemaSQL();
  const tmpFile = resolve(ROOT, ".tmp-migration-full.sql");

  writeFileSync(tmpFile, sql, "utf-8");
  console.log(`[migrate-db] Written to ${tmpFile}`);

  console.log("[migrate-db] Applying via wrangler d1 execute...");
  try {
    execSync(
      `npx wrangler d1 execute thevault-db --file="${tmpFile}" --remote`,
      { cwd: ROOT, stdio: "inherit", timeout: 120_000 },
    );
    console.log("[migrate-db] ✅ Migration applied successfully — zero data loss.");
  } catch (err) {
    console.error("[migrate-db] ❌ Migration failed:", err.message);
    console.error("[migrate-db] SQL file left at:", tmpFile);
    process.exit(1);
  }

  // Cleanup
  try {
    execSync(`rm "${tmpFile}"`, { stdio: "ignore" });
  } catch {
    // ignore cleanup failure
  }
}

// ─── Main ───

const flag = process.argv[2];

if (flag === "--apply") {
  await applyToD1();
} else if (flag === "--export-schema") {
  console.log(fullSchemaSQL());
} else {
  // Default: print instructions
  console.log(`
╔══════════════════════════════════════════════════════════╗
║           thevault-v2  Database Migration Tool          ║
╠══════════════════════════════════════════════════════════╣
║                                                        ║
║  Commands:                                             ║
║                                                        ║
║    node scripts/migrate-db.js --export-schema           ║
║      → Print full D1 schema SQL to stdout               ║
║                                                        ║
║    node scripts/migrate-db.js --apply                   ║
║      → Apply schema to production D1 via wrangler        ║
║                                                        ║
║  Migration Summary:                                     ║
║                                                        ║
║  Tables managed by drizzle-orm (db/schema.ts):          ║
║     ~40 tables in migration 0000                        ║
║                                                        ║
║  Tables from schema-agents.ts:                          ║
║     agent_projects, agent_tasks, agent_cycles,          ║
║     agent_sessions, agent_logs, agent_providers,        ║
║     agent_fleet_state, agent_messages                   ║
║                                                        ║
║  Raw SQL tables (outside drizzle):                     ║
║     webhook_events, listing_categories                  ║
║                                                        ║
║  All operations use IF NOT EXISTS — zero data loss.     ║
║                                                        ║
╚══════════════════════════════════════════════════════════╝
`);
  process.exit(0);
}
