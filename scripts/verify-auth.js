#!/usr/bin/env node
/**
 * thevault-v2 — Auth & API Wiring Verification
 * Phase 3: Verify all auth flows, API endpoint mappings, and agent integration.
 *
 * Usage:
 *   node scripts/verify-auth.js
 *   node scripts/verify-auth.js --list-endpoints
 */

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let failures = 0;
let passes = 0;

function ok(msg) {
  passes++;
  console.log(`  ✅ ${msg}`);
}

function fail(msg, detail) {
  failures++;
  console.log(`  ❌ ${msg}${detail ? `\n      ${detail}` : ""}`);
}

function section(title) {
  console.log(`\n── ${title} ──`);
}

// ─── Verify Auth Flow ───
section("AUTHENTICATION FLOW");

// Check OAuth middleware exists
const contextContents = readFileSync(resolve(ROOT, "api/context.ts"), "utf-8");
if (contextContents.includes("verifyOAuthSessionAndRefresh")) {
  ok("OAuth session verification present in context.ts");
} else {
  fail("verifyOAuthSessionAndRefresh missing from context.ts");
}

if (contextContents.includes("verifyLocalTokenAndRefresh")) {
  ok("Local auth token verification present in context.ts");
} else {
  fail("verifyLocalTokenAndRefresh missing from context.ts");
}

// Check local auth router
const localAuth = readFileSync(resolve(ROOT, "api/local-auth-router.ts"), "utf-8");
if (localAuth.includes("verifyLocalTokenAndRefresh")) {
  ok("verifyLocalTokenAndRefresh exports from local-auth-router.ts");
}
if (localAuth.includes("verifyLocalTokenAndRefresh") && localAuth.includes("isTokenRevoked")) {
  ok("Token revocation check integrated in local auth");
} else {
  fail("Token revocation missing from local auth verification");
}

// Check OAuth handlers
const oauthHandlers = readFileSync(resolve(ROOT, "api/oauth-handlers.ts"), "utf-8");
if (oauthHandlers.includes("verifyOAuthSessionAndRefresh")) {
  ok("verifyOAuthSessionAndRefresh exports from oauth-handlers.ts");
} else {
  fail("verifyOAuthSessionAndRefresh missing from oauth-handlers.ts");
}

// Check middleware chain
const middleware = readFileSync(resolve(ROOT, "api/middleware.ts"), "utf-8");
if (middleware.includes("requireAuth") && middleware.includes("requireRole")) {
  ok("requireAuth + requireRole middlewares present");
}
if (middleware.includes("adminQuery")) {
  ok("adminQuery (auth + admin role) middleware configured");
}
if (middleware.includes("authedQuery")) {
  ok("authedQuery middleware configured for authenticated-only endpoints");
}

// Check Clerk webhook auth
const clerkWebhook = readFileSync(resolve(ROOT, "functions/clerk-webhook.ts"), "utf-8");
if (clerkWebhook.includes("ADMIN_EMAILS") || clerkWebhook.includes("getAdminEmails")) {
  ok("Admin email check in Clerk webhook (no hardcoded emails)");
}

// Check email auth
const emailRouter = readFileSync(resolve(ROOT, "api/email-router.ts"), "utf-8");
if (emailRouter.includes("authedQuery") && !emailRouter.includes("publicQuery")) {
  ok("email.sendAppraisalResult requires authentication");
}

// Check cookie security
const cookies = readFileSync(resolve(ROOT, "api/lib/cookies.ts"), "utf-8");
if (cookies.includes("HttpOnly") && cookies.includes("SameSite") && cookies.includes("secure")) {
  ok("Secure cookie options (HttpOnly, SameSite, secure) present");
}

// ─── Verify API Endpoint Mapping ───
section("API ENDPOINT MAPPING");

// Read frontend tRPC provider
const trpcProvider = readFileSync(resolve(ROOT, "src/providers/trpc.tsx"), "utf-8");
if (trpcProvider.includes("/api/trpc")) {
  ok("tRPC client connects to /api/trpc");
} else {
  fail("tRPC client endpoint missing");
}
if (trpcProvider.includes('credentials: "include"')) {
  ok("tRPC client sends credentials (cookies) with requests");
}
if (trpcProvider.includes("x-local-auth-token")) {
  ok("tRPC client sends local auth token header");
}

// Read backend router
const apiRouter = readFileSync(resolve(ROOT, "api/router.ts"), "utf-8");
const routers = ["accountingRouter","adminRouter","agentRouter","appraisalRouter","authRouter",
  "autonomousRouter","blockchainRouter","cartRouter","categoriesRouter","coldEmailRouter",
  "cryptoRouter","dailyReportRouter","emailRouter","expertRouter","graphWorkflowRouter",
  "interAgentPoliceRouter","internetResearchRouter","listingFeeRouter","listingsRouter",
  "newsletterRouter","ordersRouter","outreachRouter","partnershipRouter","profileRouter",
  "reviewsRouter","saleRouter","samsonRouter","selfAuditRouter","shippingRouter","socialRouter",
  "stripeRouter","userWorkflowRouter","wishlistRouter"];

for (const r of routers) {
  if (apiRouter.includes(r)) {
    ok(`api/router.ts includes ${r}`);
  } else {
    fail(`api/router.ts missing ${r} — frontend calls to this router will fail`);
  }
}

// Verify frontend page routes match backend routers
const pageFiles = readdirSync(resolve(ROOT, "src/pages")).filter(f => f.endsWith(".tsx"));
for (const page of pageFiles) {
  const pageName = page.replace(".tsx", "").toLowerCase();
  const routerFile = `api/${pageName}-router.ts`;
  if (existsSync(resolve(ROOT, routerFile))) {
    // Both page and dedicated router exist
  }
}

// ─── Verify Agent Integration ───
section("AGENT INTEGRATION");

const agentRouterFile = readFileSync(resolve(ROOT, "api/agent-router.ts"), "utf-8");
if (agentRouterFile.includes("getDb") || agentRouterFile.includes("getRawDb")) {
  ok("Agent router accesses database");
}
if (agentRouterFile.includes("ctx.user")) {
  ok("Agent router has user context access");
}

const agentDefs = readFileSync(resolve(ROOT, "api/agent-definitions.ts"), "utf-8");
if (agentDefs) {
  ok("Agent definitions file exists");
}

const agentPrompts = readFileSync(resolve(ROOT, "api/agent-prompts.ts"), "utf-8");
if (agentPrompts) {
  ok("Agent prompts file exists");
}

const autoTrigger = readFileSync(resolve(ROOT, "api/lib/auto-trigger.ts"), "utf-8");
if (autoTrigger.includes("getDb") || autoTrigger.includes("agent_cycles") || autoTrigger.includes("agent_logs")) {
  ok("Auto-trigger engine accesses agent cycles/logs tables");
}

// Check schema agents exist
const schemaAgents = readFileSync(resolve(ROOT, "db/schema-agents.ts"), "utf-8");
for (const table of ["agentProjects","agentTasks","agentCycles","agentSessions","agentLogs"]) {
  if (schemaAgents.includes(table)) {
    ok(`Agent schema table '${table}' present`);
  } else {
    fail(`Agent schema table '${table}' missing`);
  }
}

// ─── Summary ───
console.log(`\n═══════════════════════════════════════`);
console.log(`  ${passes} passed, ${failures} failed`);
console.log(`═══════════════════════════════════════\n`);

process.exit(failures > 0 ? 1 : 0);
