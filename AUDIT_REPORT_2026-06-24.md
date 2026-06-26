# THE VAULT DFW — Comprehensive Security & QA Audit
**Repository:** C:\Users\vdako\toomuchwork (canonical)  
**Target:** thevaultdfw.win  
**Date:** 2026-06-24  
**Auditor:** Hermes Agent (automated deep-dive + manual code review)  
**Scope:** Full-stack Cloudflare Pages + Hono + tRPC + React + D1 + Stripe + Clerk + Solana

---

## Executive Summary

The codebase has a solid modern foundation (Drizzle ORM, CSP, HSTS, structured auth, parameterized queries). However, **multiple P0 Critical findings** in authorization, information disclosure, and session management require immediate remediation before production use. The most dangerous issues are unauthenticated order manipulation, environment variable leakage, and a weak JWT secret fallback that enables trivial session forgery.

---

## 1. CRITICAL SECURITY RISKS

### 1.1 Unauthenticated Order Modification (Broken Access Control)
**Files:** `api/orders-router.ts:51-81`  
**Risk:** Critical

The `orders.updateStatus` mutation is `publicQuery` — **any unauthenticated user can modify ANY order** by ID. No ownership check, no authentication, no authorization.

Exploits:
- Mark orders as "paid" / "delivered" to falsify records
- Inject tracking numbers to fraud shipping confirmations
- Cancel/refund orders arbitrarily

**Code evidence:**
```typescript
// api/orders-router.ts:51
updateStatus: publicQuery  // <-- NO AUTH
  .input(z.object({
    orderId: z.number(),
    paymentStatus: z.enum(["pending", "completed", "failed", "refunded"]).optional(),
    orderStatus: z.enum(["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]).optional(),
    trackingNumber: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    // No ctx.user check!
    await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
```

**Recommendation:**
```typescript
updateStatus: authedQuery  // Require login
  .input(/* ... */)
  .mutation(async ({ input, ctx }) => {
    const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
    if (!order) throw new TRPCError({ code: "NOT_FOUND" });
    // Allow owner or admin only
    if (order.userId !== ctx.user.id && ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    await db.update(orders).set(updateData).where(eq(orders.id, input.orderId));
```

---

### 1.2 Unauthenticated Order Creation (Broken Access Control / Abuse)
**File:** `api/orders-router.ts:20-49`  
**Risk:** Critical

`orders.create` is `publicQuery`. Any unauthenticated user can create unlimited orders with arbitrary amounts, titles, and shipping addresses.

Exploits:
- Database pollution / DoS via massive order creation
- Fraudulent order records that can later be "confirmed" via 1.1

**Code evidence:**
```typescript
// api/orders-router.ts:20
create: publicQuery  // <-- NO AUTH
  .input(z.object({
    listingId: z.number(),
    amount: z.number().positive(),
    // ... arbitrary data
  }))
  .mutation(async ({ input, ctx }) => {
    // userId is set to null if unauthenticated!
    const result = await db.insert(orders).values({
      userId: ctx.user?.id || null,  // <-- NULL for unauthenticated
```

**Recommendation:**
- Change to `authedQuery` OR validate against an active Stripe session before allowing creation
- Never allow `userId: null` for marketplace orders

---

### 1.3 Debug Endpoint Exposing Environment Variable Names (Information Disclosure)
**File:** `functions/[[path]].ts:193-198` (and root `[[path]].ts:200-206`)  
**Risk:** Critical

`GET /api/env-keys` returns all environment variable names sorted, including:
- `SOL_USD_RATE`, `USDC_USD_RATE`, `SOLANA_TREASURY`, `TREASURY_WALLET`
- `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`
- `STRIPE_SECRET_KEY`, `COINBASE_API_KEY`, `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`

While values are masked, leaking the full surface area reveals:
- Which services are integrated (Solana, Stripe, OpenAI, Clerk, Coinbase)
- Exact secret variable names for targeted attacks
- Treasury wallet configuration

**Code evidence:**
```typescript
// functions/[[path]].ts:193
app.get("/api/env-keys", (c) => {
  const keys = Object.keys(c.env as Record<string, unknown>).filter(k => !k.startsWith("__"));
  const solanaKeys = keys.filter(k => k.includes("SOL") || k.includes("TREASURY") || k.includes("RATE"));
  const allKeys = keys.sort();
  return c.json({ total: allKeys.length, solanaKeys, allKeys });  // <-- LEAKS ALL KEY NAMES
});
```

**Recommendation:**
- **Remove `/api/env-keys` entirely from production**
- If diagnostics are needed, protect behind `adminQuery` + audit log, and redact sensitive key names

---

### 1.4 JWT Secret Fallback to Hardcoded String (Cryptographic Failure)
**Files:** `api/lib/env.ts:32, 48`; `api/local-auth-router.ts:19-24`  
**Risk:** Critical

If `APP_SECRET` is not configured, `env.appSecret` returns `"fallback-secret"`. The local-auth-router warns but **continues execution**. In production, this means **ALL JWT tokens are signed with a known static key**, allowing trivial session forgery for any user ID.

**Code evidence:**
```typescript
// api/lib/env.ts:31-33
let cfEnv: CloudflareEnv = {
  APP_SECRET: "development-secret-change-in-production",  // <-- HARDCODED FALLBACK
};

// api/lib/env.ts:47-49
get appSecret(): string {
  return cfEnv.APP_SECRET || "fallback-secret";  // <-- SECOND FALLBACK
}

// api/local-auth-router.ts:19-22
if (!secret || secret === "fallback-secret") {
  console.warn("WARNING: APP_SECRET not configured. Using fallback for development.");
  // Continues anyway!
}
```

**Recommendation:**
- **Remove all fallbacks.** Fail closed if `APP_SECRET` is missing.
- Throw an error during startup or return 500 for all auth-dependent requests.

---

### 1.5 In-Memory Audit Logs and Token Revocation (Compliance / Security Gap)
**File:** `api/security.ts:230-294`  
**Risk:** High

Audit logs (`auditLog` array) and revoked tokens (`revokedTokens` Set, `revokedUserSessions` Map) are stored in process memory. Cloudflare Workers spin down after inactivity. On cold start:
- All audit history is lost (compliance violation)
- Revoked tokens are no longer recognized (compromised tokens remain valid)
- User session revocations are wiped (can't force logout after password change)

**Code evidence:**
```typescript
// api/security.ts:241
const auditLog: AuditLogEntry[] = [];  // <-- IN-MEMORY ONLY

// api/security.ts:274-275
const revokedTokens = new Set<string>();  // <-- LOST ON COLD START
const revokedUserSessions = new Map<number, number>();  // <-- LOST ON COLD START
```

**Recommendation:**
- Persist audit logs to D1 database (minimum: failed logins, admin actions)
- Store revoked token `jti` claims and user revocation timestamps in D1

---

### 1.6 Clerk Secret Key Exposed in globalThis (Information Disclosure)
**File:** Root `[[path]].ts:130-133`  
**Risk:** High

The Clerk secret key is exposed to the entire Worker runtime via `globalThis`:

```typescript
const clerkSecretKey = typeof c.env.CLERK_SECRET_KEY === "string" ? c.env.CLERK_SECRET_KEY : "";
if (clerkSecretKey) {
  (globalThis as any).__CLERK_SECRET_KEY = clerkSecretKey;  // <-- GLOBAL EXPOSURE
}
```

**Risk:** Any module in the Worker can access `globalThis.__CLERK_SECRET_KEY`. If a third-party dependency or future code has a vulnerability, this key is exposed.

**Recommendation:**
- Keep `CLERK_SECRET_KEY` in a closure-scoped variable or module-level `let`
- Never attach secrets to `globalThis`

---

### 1.7 Hardcoded Admin Email in Clerk Webhook (Authorization Bypass)
**File:** `functions/clerk-webhook.ts:85`  
**Risk:** High

```typescript
const isAdminEmail = email === 'ratchetkrewelabs@gmail.com';
```

An attacker who creates a Clerk account with this email automatically receives admin privileges. This email is also publicly visible in the codebase.

**Recommendation:**
- Move admin email(s) to an environment variable (`ADMIN_EMAILS` comma-separated)
- Consider a separate admin approval workflow instead of auto-promotion

---

## 2. FUNCTIONAL BUGS

### 2.1 Legacy Dead Code Still in Repository
**Files:** `src/main.js`, `src/vault-api.js`  
**Risk:** Medium

The old vanilla JS SPA (~1190 lines) is dead code — `index.html` only loads `main.tsx`. However, these files remain in the repo and could be accidentally deployed or served if routing changes. They contain:
- `innerHTML`-based XSS patterns
- Global token storage
- Unsafe DOM manipulation from the previous architecture

**Recommendation:**
- Delete `src/main.js` and `src/vault-api.js` to eliminate confusion and attack surface

---

### 2.2 `process.env.CLOUDFLARE_API_TOKEN` in Cloudflare Worker Runtime
**Files:** `api/admin-router.ts:214, 236, 259`  
**Risk:** High (functional)

Cloudflare Pages Functions (Workers) do **NOT** have `process.env`. The admin Cloudflare management endpoints (`cloudflareStatus`, `cloudflareDeploy`, `cloudflareBindings`) will always see `undefined` for `apiToken` and return errors. This is broken functionality, not a runtime security hole, but it means Cloudflare management is non-functional from the admin panel.

**Code evidence:**
```typescript
// api/admin-router.ts:214
const apiToken = process.env.CLOUDFLARE_API_TOKEN;  // <-- ALWAYS undefined in Workers
```

**Recommendation:**
- Use `c.env.CLOUDFLARE_API_TOKEN` passed through `wrangler.toml` `[vars]` or secrets

---

### 2.3 Stripe Webhook Secret Compared Client-Side via Public Mutation
**File:** `api/stripe-router.ts:114-160`  
**Risk:** High

`stripe.handleWebhook` is a `publicQuery` mutation that accepts the Stripe secret key from the client as an input parameter and compares it to `env.stripeSecretKey`. While this doesn't directly leak the secret, it:
- Allows brute-force / timing attacks on the secret via a public endpoint
- Normalizes the pattern of sending webhook secrets through the client
- Bypasses the proper webhook endpoint (`functions/[[path]].ts` already has a correct Stripe webhook handler at `/api/stripe/webhook` with signature verification)

**Code evidence:**
```typescript
// api/stripe-router.ts:114
handleWebhook: publicQuery
  .input(z.object({ payload: z.string(), signature: z.string(), secret: z.string() }))
  .mutation(async ({ input }) => {
    if (input.secret !== env.stripeSecretKey) {  // <-- CLIENT-PROVIDED SECRET!
      throw new Error("Webhook verification failed");
    }
```

**Recommendation:**
- **Remove the tRPC `stripe.handleWebhook` mutation entirely**
- The correct handler is already in `functions/[[path]].ts`. If client-side webhook simulation is needed, use a separate admin-only endpoint

---

### 2.4 CORS `credentials:true` with Broad Public Mutations
**File:** `api/security.ts:224`  
**Risk:** High

The CORS config sets `credentials: true`, meaning cookies/auth headers are sent cross-origin. Multiple `publicQuery` mutations accept requests without authentication. Combined with `credentials:true`, an attacker-hosted page can make the victim's browser send authenticated requests to these endpoints if any XSS exists or if the user has an active session.

Affected public mutations:
- `cart.add`, `cart.remove`, `cart.clear`
- `orders.create`
- `stripe.handleWebhook`
- `email.sendAppraisalResult`
- `newsletter.subscribe`

**Recommendation:**
- For truly public endpoints that don't need credentials, either set `credentials: false` OR require authentication on all mutations
- Make purely public endpoints read-only queries

---

### 2.5 Email Spam via Public Mutation
**File:** `api/email-router.ts:21-102`  
**Risk:** Medium-High

`email.sendAppraisalResult` is a `publicQuery` mutation. **Anyone can send emails to any address** with arbitrary appraisal content using the site's Resend API key. This enables:
- Spam/phishing attacks using the domain's reputation
- Resend quota exhaustion
- Reputation damage for `thevaultdfw.win`

**Recommendation:**
- Change to `authedQuery` OR add a rate limit + CAPTCHA
- Only allow sending to the authenticated user's own email

---

### 2.6 Hardcoded Cloudflare Account ID in Admin Router
**File:** `api/admin-router.ts:215, 237, 260`  
**Risk:** Low

Account ID `2ad733f9d698170c202b12924868c60e` is hardcoded. While not a secret, it couples the admin panel to a single Cloudflare account.

**Recommendation:**
- Move to environment variable

---

### 2.7 View Count Increment Without Rate Limiting (DoS)
**File:** `api/listings-router.ts:79-81`  
**Risk:** Low-Medium

`listings.getById` is `publicQuery` and increments `viewCount` on every request. An attacker can spam this endpoint to inflate view counts artificially.

**Code evidence:**
```typescript
// api/listings-router.ts:79-81
await db.update(listings)
  .set({ viewCount: sql`${listings.viewCount} + 1` })
  .where(eq(listings.id, input.id));
```

**Recommendation:**
- Add rate limiting to `listings.getById`
- Consider debouncing view count increments (e.g., once per IP per hour)

---

### 2.8 Cart Manipulation via Session ID Guessing
**File:** `api/cart-router.ts:41-61`  
**Risk:** Low-Medium

`cart.add` is `publicQuery` and accepts `x-session-id` header. The session ID is client-generated and weak (per AUDIT_FINDINGS.md, uses `Math.random()` + timestamp). An attacker can forge session IDs to add items to arbitrary carts.

**Recommendation:**
- Issue cart sessions server-side with cryptographically secure IDs
- Bind cart operations to authenticated users where possible

---

### 2.9 Missing Input Length Validation on Orders
**File:** `api/orders-router.ts:25-31`  
**Risk:** Low-Medium

`orders.create` accepts `shippingAddress` with no `maxLength`, and `listingTitle` with no explicit max. This could lead to oversized payloads / DoS.

**Recommendation:**
```typescript
shippingAddress: z.string().max(500).optional(),
listingTitle: z.string().max(255),
```

---

## 3. OPTIMIZATION / HARDENING OPPORTUNITIES

### 3.1 Dependency Vulnerabilities
**Files:** `package.json`, `package-lock.json`  
**Risk:** Medium

`npm audit` reports **12 vulnerabilities (9 moderate, 3 high)**:

| Package | Vulnerable | Severity | Fix |
|---------|-----------|----------|-----|
| `@solana/web3.js` | <=1.98.4 | High | Upgrade to latest patched version |
| `@solana/spl-token` | ^0.4.14 | High | Upgrade to 0.1.8+ |
| `@solana/spl-token-group` | * | Moderate | Upgrade via spl-token |
| `@solana/spl-token-metadata` | * | Moderate | Upgrade via spl-token |
| `bigint-buffer` | * | High | Upgraded automatically with spl-token |
| `uuid` | <11.1.1 | Moderate | Upgrade to 11.1.1+ |
| `esbuild` | <=0.24.2 (dev) | Moderate | Dev-only, upgrade vite |

**Recommendation:**
```bash
npm audit fix
# Manual if needed:
npm install @solana/web3.js@latest @solana/spl-token@latest uuid@latest
```

---

### 3.2 Replace Regex XSS Sanitizer with Proper HTML Escaping
**File:** `api/security.ts:93-119`  
**Risk:** Hardening

The `sanitizeInput` function uses regex-based XSS pattern replacement. This is bypassable (e.g., encoded tags, mutation XSS).

**Recommendation:**
- Use proper HTML entity encoding for server-side output
- For rich-text rendering, use a sanitizer like `isomorphic-dompurify` or strip tags with a strict allowlist
- For React components, rely on JSX auto-escaping

---

### 3.3 Increase PBKDF2 Iterations
**File:** `api/local-auth-router.ts:275`  
**Risk:** Optimization

PBKDF2 with 100,000 iterations is below current OWASP baseline. NIST recommends 600,000 for PBKDF2-SHA256 as of 2023.

**Recommendation:**
- Increase to **310,000 iterations** (OWASP 2023 baseline) or switch to `bcryptjs` with cost factor 12+

---

### 3.4 Token Revocation Not Enforced
**File:** `api/local-auth-router.ts`, `api/oauth-handlers.ts`  
**Risk:** Medium

`security.ts` exports `isTokenRevoked()` and `isUserSessionRevoked()`, but these are **NEVER called** during token verification. Revoking a token or a user's sessions has no effect.

**Recommendation:**
- Call `isTokenRevoked(token)` and `isUserSessionRevoked(userId, iat)` in `verifyLocalTokenAndRefresh` and `verifyOAuthSessionAndRefresh`

---

### 3.5 Remove `'unsafe-inline'` from CSP (Where Possible)
**File:** `api/security.ts:158-172`  
**Risk:** Hardening

The CSP includes `'unsafe-inline'` for scripts. Modern React (via Vite) does not require inline scripts. Removing `'unsafe-inline'` and using nonces/hashes would significantly reduce XSS impact.

**Recommendation:**
- Audit all inline event handlers and style attributes
- Use nonces for unavoidable inline scripts
- Note: Hono's own inline script for CORS preflight may need `'script-src 'none' for OPTIONS'`

---

### 3.6 Distributed Rate Limiting
**File:** `api/security.ts`, `functions/[[path]].ts:158-179`  
**Risk:** Hardening

Current rate limiting is in-memory `Map` with max 10,000 entries. In a multi-Cloudflare Worker environment, rate limits are per-instance, not global.

**Recommendation:**
- Use Cloudflare KV or D1 for distributed rate limiting
- Add per-user rate limits (not just per-IP) for authenticated mutations
- Apply rate limits to ALL mutations, not just `/api/*` paths

---

### 3.7 Move Hardcoded Values to Environment Variables
**Files:** Multiple  
**Risk:** Low

Hardcoded values found:
- `api/lib/env.ts:32` — development secret
- `api/admin-router.ts:215,237,260` — Cloudflare account ID
- `functions/clerk-webhook.ts:85` — admin email
- `functions/[[path]].ts:269` — D1 database ID (exposed in admin panel)

**Recommendation:**
- All hardcoded values should be moved to `wrangler.toml` `[vars]` or secrets

---

## 4. FEATURE COMPLETENESS AUDIT

### Completed Modules (Implemented + Wired)
| Module | Status |
|--------|--------|
| Auth: OAuth (Google, GitHub, X, Apple) + local email/password + Clerk webhook | ✅ |
| Listings: CRUD with images, categories, featured/certified filters | ✅ |
| Cart: add/remove/clear with ownership checks (partial) | ✅ |
| Orders: list/getById (partial) + create (unauthenticated — CRITICAL BUG) | ⚠️ |
| Stripe: checkout session creation + webhook handling | ✅ (webhook: `/api/stripe/webhook` correct; tRPC mutation: BROKEN) |
| Blockchain: certificate generation (Solana keypair) + verification | ✅ |
| Appraisals: DB schema + email sending | ✅ |
| Newsletter: subscribe/unsubscribe | ✅ |
| Reviews, Wishlist, Categories, Shipping | Schema + partial routers |
| Admin panel: stats, user/listing management, agent project management | ✅ |
| AI agents: OpenAI integration, autonomous triggers | ✅ |
| Security: CSP, HSTS, rate limiting (in-memory), password validation | ✅ (with gaps) |

### Incomplete / Dead Modules
| Module | Issue |
|--------|-------|
| Coinbase | Removed from runtime (per v2 audit) |
| Intercom webhook | Commented out in functions/[[path]].ts:283 |
| Admin Cloudflare management | Non-functional (`process.env` bug) |
| `src/main.js`, `src/vault-api.js` | Dead code, should be deleted |

---

## 5. PRIORITIZED ACTION ITEMS

### P0 — Immediate (Before Any Production Access)
| # | Action | File(s) |
|---|--------|---------|
| A | **Change `orders.updateStatus` from `publicQuery` to `authedQuery` + add ownership check** | `api/orders-router.ts:51` |
| B | **Change `orders.create` from `publicQuery` to `authedQuery`** | `api/orders-router.ts:20` |
| C | **Remove `/api/env-keys` endpoint from production** | `functions/[[path]].ts:193`, root `[[path]].ts:200` |
| D | **Remove JWT secret fallback — fail closed when `APP_SECRET` missing** | `api/lib/env.ts:32,48`; `api/local-auth-router.ts:19` |
| E | **Delete dead files `src/main.js`, `src/vault-api.js`** | `src/main.js`, `src/vault-api.js` |

### P1 — This Sprint
| # | Action | File(s) |
|---|--------|---------|
| F | **Remove `stripe.handleWebhook` tRPC mutation** | `api/stripe-router.ts:114` |
| G | **Move `CLERK_SECRET_KEY` out of `globalThis`** | Root `[[path]].ts:130-133` |
| H | **Move admin email list to environment variable** | `functions/clerk-webhook.ts:85` |
| I | **Fix CORS: require auth on all mutations OR set `credentials: false` on public ones** | `api/security.ts:224` |
| J | **Change `email.sendAppraisalResult` to `authedQuery` or add rate limit + CAPTCHA** | `api/email-router.ts:21` |
| K | **Call `isTokenRevoked()` / `isUserSessionRevoked()` during JWT verification** | `api/local-auth-router.ts:58`; `api/oauth-handlers.ts:79` |
| L | **Fix `process.env.CLOUDFLARE_API_TOKEN` → use `c.env`** | `api/admin-router.ts:214,236,259` |
| M | **Persist audit logs to D1 (minimum: failed logins, admin actions)** | `api/security.ts:241` |
| N | **Add `maxLength` validation to `orders.create` text inputs** | `api/orders-router.ts:25-31` |

### P2 — Next Sprint
| # | Action | File(s) |
|---|--------|---------|
| O | **Upgrade `@solana/web3.js` and `@solana/spl-token` to patch vulnerabilities** | `package.json` |
| P | **Increase PBKDF2 iterations to 310,000 or switch to bcrypt** | `api/local-auth-router.ts:275` |
| Q | **Add rate limiting to `listings.getById` to prevent view count inflation** | `api/listings-router.ts:64` |
| R | **Replace regex XSS sanitizer with proper HTML escaping** | `api/security.ts:104` |
| S | **Remove `'unsafe-inline'` from CSP where possible** | `api/security.ts:160` |
| T | **Implement distributed rate limiting via Cloudflare KV or D1** | `api/security.ts` |
| U | **Issue server-side cart sessions instead of client-generated `Math.random()` IDs** | Cart router + client |
| V | **Move hardcoded Cloudflare account ID to environment** | `api/admin-router.ts:215` |

---

## 6. CONCLUSION

The application has a solid modern foundation, but **the P0 items represent immediate, exploitable vulnerabilities** that must be fixed before the site handles real users or payments. The most urgent are:

1. **Unauthenticated order manipulation** — anyone can mark orders as paid/delivered
2. **Environment variable leakage** — `/api/env-keys` reveals service integrations
3. **JWT secret fallback** — production can run with a known signing key

Fixing P0 eliminates the most dangerous attack surface. P1 addresses systemic authz and logging gaps. Dependency upgrades are routine maintenance.

**Overall Risk Rating: HIGH — Not production-ready without P0 fixes.**

---

*Audit performed by Hermes Agent (automated deep-dive + manual code review against toomuchwork canonical repository)*
