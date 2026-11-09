import { env } from "./lib/env";
import { getRawDb } from "./queries/connection";
import { auditLogs } from "@db/schema";
import { desc, sql } from "drizzle-orm";

interface RateLimitEntry {
  count: number;
  windowStart: number;
  lastSeen: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const MAX_RATE_LIMIT_ENTRIES = 10000;

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: Request) => string;
}

export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 60,
};

export const STRICT_RATE_LIMIT: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 5,
};

function pruneRateLimitStore(now: number) {
  if (rateLimitStore.size < MAX_RATE_LIMIT_ENTRIES) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.lastSeen > 15 * 60 * 1000) {
      rateLimitStore.delete(key);
    }
  }
}

// ─── D1-backed security state ───
// In-memory Maps are per-isolate on Cloudflare Workers, so all persistent
// security state (rate-limit counters, revoked tokens, revoked user sessions)
// lives in D1. The in-memory mirrors remain only as a best-effort fast path
// and as a fallback when the D1 binding is unavailable (local dev).

const RATE_LIMIT_CLEANUP_PROBABILITY = 0.02; // ~2% of writes trigger pruning

function rawDb(): ReturnType<typeof getRawDb> {
  try {
    return getRawDb();
  } catch {
    return null;
  }
}

export async function checkRateLimitD1(
  req: Request,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const db = rawDb();
  if (!db) return checkRateLimit(req, config);

  const key = `ratelimit:${(config.keyGenerator || getClientIP)(req)}`;
  const now = Date.now();

  try {
    const stmt = db
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count, last_seen) VALUES (?, ?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE WHEN rate_limits.window_start <= ? THEN 1 ELSE rate_limits.count + 1 END,
           window_start = CASE WHEN rate_limits.window_start <= ? THEN ? ELSE rate_limits.window_start END,
           last_seen = excluded.last_seen
         RETURNING count, window_start`,
      )
      .bind(key, now, now, now - config.windowMs, now - config.windowMs, now);

    const row = (await stmt.first()) as
      | { count: number; window_start: number }
      | null;

    if (!row) return checkRateLimit(req, config);

    // Opportunistic pruning of stale windows / expired revocations.
    if (Math.random() < RATE_LIMIT_CLEANUP_PROBABILITY) {
      void db
        .prepare("DELETE FROM rate_limits WHERE last_seen < ?")
        .bind(now - 15 * 60 * 1000)
        .run()
        .catch(() => {});
    }

    const allowed = row.count <= config.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - row.count),
      resetAt: row.window_start + config.windowMs,
    };
  } catch (error) {
    console.error("[Security] D1 rate limit failed, falling back to in-memory:", error);
    return checkRateLimit(req, config);
  }
}

export function getClientIP(req: Request): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  req: Request,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT,
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = (config.keyGenerator || getClientIP)(req);
  const now = Date.now();

  pruneRateLimitStore(now);

  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > config.windowMs) {
    rateLimitStore.set(key, {
      count: 1,
      windowStart: now,
      lastSeen: now,
    });

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    };
  }

  entry.lastSeen = now;

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + config.windowMs,
    };
  }

  entry.count++;

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.windowStart + config.windowMs,
  };
}

const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
];

export function sanitizeInput(input: string): string {
  const truncated = input.slice(0, 5000);

  let sanitized = truncated;

  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[removed]");
  }

  return sanitized
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      result[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      result[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) => (typeof item === "string" ? sanitizeInput(item) : item));
    } else {
      result[key] = value;
    }
  }

  return result;
}

export function sanitizeForPrompt(input: string): string {
  return input
    .replace(/\{\}/g, "")
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, "")
    .substring(0, 2000);
}

export function getSecurityHeaders(): Record<string, string> {
  return {
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "X-DNS-Prefetch-Control": "off",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "accelerometer=(), ambient-light-sensor=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), midi=(), payment=(self), picture-in-picture=(), publickey-credentials-get=(self), screen-wake-lock=(), usb=(), xr-spatial-tracking=()",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-site",
    "Cross-Origin-Embedder-Policy": "credentialless",
    "Origin-Agent-Cluster": "?1",
    "Content-Security-Policy":
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' https://js.stripe.com https://appleid.cdn-apple.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "img-src 'self' data: https: blob:; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "connect-src 'self' https://api.stripe.com https://api.mainnet-beta.solana.com https://api.opensea.io https://api.rarible.org https://api.magiceden.dev https://appleid.apple.com https://accounts.google.com https://oauth2.googleapis.com https://api.github.com https://api.x.com; " +
      "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://appleid.apple.com; " +
      "media-src 'none'; " +
      "worker-src 'self' blob:; " +
      "object-src 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self' https://appleid.apple.com https://accounts.google.com https://github.com https://x.com; " +
      "frame-ancestors 'none'; " +
      "upgrade-insecure-requests;",
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  };
}

function normalizeAllowedHost(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.replace(/^https?:\/\//, "").split("/")[0].toLowerCase();
  }
}

/**
 * Allowlist for the Host header used to build OAuth redirect_uri values.
 * Never trust the raw Host header — an attacker-controlled host would make
 * the provider send the authorization code to a hostile redirect_uri.
 */
export function isAllowedAppHost(host: string | null | undefined): boolean {
  if (!host) return false;

  const hostname = normalizeAllowedHost(host);

  if (!env.isProduction && ["localhost", "127.0.0.1"].includes(hostname)) {
    return true;
  }

  // Cloudflare Pages preview/production domains (*.pages.dev)
  if (hostname === "pages.dev" || hostname.endsWith(".pages.dev")) {
    return true;
  }

  const allowedDomain = env.vaultDomain ? normalizeAllowedHost(env.vaultDomain) : "thevaultdfw.win";
  return hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`);
}

export function getCorsConfig() {
  return {
    origin: (origin: string): string | null => {
      if (!origin) return null;

      let hostname = "";

      try {
        hostname = new URL(origin).hostname.toLowerCase();
      } catch {
        return null;
      }

      if (!env.isProduction && ["localhost", "127.0.0.1"].includes(hostname)) {
        return origin;
      }

      const allowedDomain = env.vaultDomain ? normalizeAllowedHost(env.vaultDomain) : "thevaultdfw.win";

      if (hostname === allowedDomain || hostname.endsWith(`.${allowedDomain}`)) {
        return origin;
      }

      return null;
    },
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"] as string[],
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Local-Auth-Token",
      "X-Session-Id",
      "X-Agent-Token",
      "X-Requested-With",
      "Stripe-Signature",
      "X-CC-Webhook-Signature",
      "X-Client-Version",
    ],
    exposeHeaders: ["Retry-After"],
    credentials: false,
    maxAge: 86400,
  };
}

interface AuditLogEntry {
  timestamp: string;
  ip: string;
  method: string;
  path: string;
  userId?: number;
  action: string;
  details?: string;
  userAgent?: string;
}

const auditLog: AuditLogEntry[] = [];
const MAX_AUDIT_LOG = 10000;

export function logAudit(entry: Omit<AuditLogEntry, "timestamp">): void {
  const logEntry: AuditLogEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  auditLog.push(logEntry);

  if (auditLog.length > MAX_AUDIT_LOG) {
    auditLog.splice(0, auditLog.length - MAX_AUDIT_LOG);
  }

  console.log(
    `[AUDIT] ${logEntry.timestamp} | ${logEntry.ip} | ${logEntry.method} ${logEntry.path} | ${logEntry.action}${entry.userId ? ` | user:${entry.userId}` : ""}${entry.details ? ` | ${entry.details}` : ""}`,
  );

  try {
    const db = getRawDb();
    if (!db) return;

    void db
      .prepare(
        `INSERT INTO audit_logs (audit_id, agent_name, check_type, severity, finding, details, auto_fixed, fix_applied, fix_result, requires_human_review, checked_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        `runtime-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        "runtime",
        "web_access",
        entry.action.includes("failed") || entry.action.includes("webhook_rejected") ? "error" : "info",
        entry.path,
        JSON.stringify({ ...entry, timestamp: logEntry.timestamp }),
        false,
        null,
        null,
        false,
        new Date().toISOString(),
      )
      .run();
  } catch (error) {
    console.error("[AUDIT] Failed to persist to D1:", error);
  }
}

export function getAuditLog(
  limit: number = 100,
  filter?: { ip?: string; userId?: number; action?: string },
): AuditLogEntry[] {
  let logs = [...auditLog].reverse();

  if (filter?.ip) logs = logs.filter((l) => l.ip === filter.ip);
  if (filter?.userId) logs = logs.filter((l) => l.userId === filter.userId);
  if (filter?.action) logs = logs.filter((l) => l.action === filter.action);

  return logs.slice(0, limit);
}

// ─── Token revocation (D1-backed, in-memory mirror as best-effort) ───

const REVOCATION_TTL_MS = 8 * 24 * 60 * 60 * 1000; // tokens live at most 7 days

const revokedTokens = new Set<string>();
const revokedUserSessions = new Map<number, number>();

export async function revokeToken(token: string): Promise<void> {
  if (token.length >= 4096) return;

  revokedTokens.add(token);

  const db = rawDb();
  if (db) {
    try {
      await db
        .prepare("INSERT OR IGNORE INTO revoked_tokens (token, revoked_at) VALUES (?, ?)")
        .bind(token, Date.now())
        .run();
    } catch (error) {
      console.error("[Security] Failed to persist token revocation:", error);
    }
  }
}

export async function revokeAllUserSessions(userId: number): Promise<void> {
  revokedUserSessions.set(userId, Date.now());

  const db = rawDb();
  if (db) {
    try {
      await db
        .prepare("INSERT INTO revoked_user_sessions (user_id, revoked_at) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET revoked_at = excluded.revoked_at")
        .bind(userId, Date.now())
        .run();
    } catch (error) {
      console.error("[Security] Failed to persist user session revocation:", error);
    }
  }
}

export async function isTokenRevoked(token: string): Promise<boolean> {
  if (revokedTokens.has(token)) return true;

  const db = rawDb();
  if (!db) return false;

  try {
    const row = await db
      .prepare("SELECT token FROM revoked_tokens WHERE token = ? LIMIT 1")
      .bind(token)
      .first();
    return !!row;
  } catch (error) {
    console.error("[Security] Failed to read token revocation state:", error);
    return false;
  }
}

export async function isUserSessionRevoked(userId: number, tokenIssuedAt: number): Promise<boolean> {
  const inMemoryRevokedAt = revokedUserSessions.get(userId);
  if (inMemoryRevokedAt && tokenIssuedAt < inMemoryRevokedAt) return true;

  const db = rawDb();
  if (!db) return false;

  try {
    const row = await db
      .prepare("SELECT revoked_at FROM revoked_user_sessions WHERE user_id = ? LIMIT 1")
      .bind(userId)
      .first();
    if (!row) return false;
    const revokedAt = Number(row.revoked_at);
    return tokenIssuedAt < revokedAt;
  } catch (error) {
    console.error("[Security] Failed to read session revocation state:", error);
    return false;
  }
}

// Opportunistic cleanup of revocation entries older than the max token lifetime.
export async function pruneRevocationState(): Promise<void> {
  const db = rawDb();
  if (!db) return;

  const cutoff = Date.now() - REVOCATION_TTL_MS;
  try {
    await db
      .prepare("DELETE FROM revoked_tokens WHERE revoked_at < ?")
      .bind(cutoff)
      .run();
    await db
      .prepare("DELETE FROM revoked_user_sessions WHERE revoked_at < ?")
      .bind(cutoff)
      .run();
  } catch {
    // best-effort
  }
}

export function validateUrl(url: string, allowedHosts?: string[]): boolean {
  try {
    const parsed = new URL(url);

    if (env.isProduction && parsed.protocol !== "https:") return false;
    if (env.isProduction && (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1")) return false;
    if (allowedHosts && !allowedHosts.includes(parsed.hostname)) return false;
    if (parsed.username || parsed.password) return false;

    return true;
  } catch {
    return false;
  }
}

export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) errors.push("Minimum 8 characters");
  if (password.length > 128) errors.push("Maximum 128 characters");
  if (!/[A-Z]/.test(password)) errors.push("At least one uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("At least one lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("At least one number");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("At least one special character");

  return {
    valid: errors.length === 0,
    errors,
  };
}
