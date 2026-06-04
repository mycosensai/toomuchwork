// ============================================================================
// db.ts — D1 database access layer + inline migrations
// ============================================================================
import type { Env } from './types.ts';

const MIGRATIONS = [
  // Users
  `CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    email       TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    role        TEXT NOT NULL DEFAULT 'user',
    avatar_url  TEXT,
    provider    TEXT NOT NULL,
    password_hash TEXT,
    password_salt TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  // Sessions (opaque, stored in KV too — D1 copy for queries)
  `CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    revoked_at  TEXT
  );`,
  // Listings
  `CREATE TABLE IF NOT EXISTS listings (
    id          TEXT PRIMARY KEY,
    owner_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_cents  INTEGER NOT NULL,
    category    TEXT NOT NULL,
    condition   TEXT NOT NULL CHECK (condition IN ('mint','near-mint','good','fair')),
    images      TEXT NOT NULL DEFAULT '[]',
    status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','sold','archived')),
    metadata    TEXT NOT NULL DEFAULT '{}',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  // Leads
  `CREATE TABLE IF NOT EXISTS leads (
    id          TEXT PRIMARY KEY,
    listing_id  TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id    TEXT REFERENCES users(id) ON DELETE SET NULL,
    buyer_email TEXT,
    buyer_name  TEXT,
    message     TEXT DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','converted','closed')),
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  // Token / Mint records
  `CREATE TABLE IF NOT EXISTS mint_records (
    id              TEXT PRIMARY KEY,
    listing_id      TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    owner_id        TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chain_id        INTEGER NOT NULL,
    contract_address TEXT NOT NULL,
    token_id        TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','minted','transferred','burned')),
    onchain_uri     TEXT,
    offchain_uri    TEXT,
    physical_item   TEXT NOT NULL DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );`,
  // Agent jobs
  `CREATE TABLE IF NOT EXISTS agent_jobs (
    id          TEXT PRIMARY KEY,
    agent       TEXT NOT NULL,
    action      TEXT NOT NULL,
    payload     TEXT NOT NULL DEFAULT '{}',
    status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','succeeded','failed')),
    result      TEXT,
    error       TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    finished_at TEXT
  );`,
  // Checkout sessions
  `CREATE TABLE IF NOT EXISTS checkout_sessions (
    id                  TEXT PRIMARY KEY,
    listing_id          TEXT NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    buyer_id            TEXT REFERENCES users(id) ON DELETE SET NULL,
    amount_cents        INTEGER NOT NULL,
    currency            TEXT NOT NULL DEFAULT 'usd',
    status              TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','complete','expired','canceled')),
    payment_intent_id   TEXT,
    client_secret       TEXT,
    url                 TEXT,
    metadata            TEXT NOT NULL DEFAULT '{}',
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at          TEXT NOT NULL
  );`,
];

export async function migrate(env: { thevault_db: D1Database }): Promise<void> {
  for (const sql of MIGRATIONS) {
    await env.thevault_db.prepare(sql).run();
  }
}

// ---------------------------------------------------------------------------
// Prepared statement helpers
// ---------------------------------------------------------------------------
export interface Prepared<T> {
  bind(...values: unknown[]): Promise<D1Result<T>>;
}

export function sql<T = unknown>(env: { thevault_db: D1Database }, template: string): Prepared<T> {
  return {
    bind: (...values: unknown[]) => env.thevault_db.prepare(template).bind(...values).all<T>(),
  };
}

export function sqlOne<T = unknown>(env: { thevault_db: D1Database }, template: string): Prepared<T | null> {
  return {
    bind: (...values: unknown[]) => env.thevault_db.prepare(template).bind(...values).first<T>(),
  };
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export const users = {
  create: (env: Env) => sql<User>(env,
    `INSERT INTO users (id,email,name,role,provider,password_hash,password_salt,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,datetime('now'),datetime('now'))
     ON CONFLICT(email) DO NOTHING RETURNING *`),
  byId: (env: Env) => sqlOne<User>(env, `SELECT * FROM users WHERE id = ?1`),
  byEmail: (env: Env) => sqlOne<User>(env, `SELECT * FROM users WHERE email = ?1`),
  updateAt: (env: Env) => sql<User | null>(env,
    `UPDATE users SET updated_at = datetime('now') WHERE id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------
export const sessions = {
  byId: (env: Env) => sqlOne<Session & { password_hash?: string; password_salt?: string }>(env,
    `SELECT s.*, u.password_hash, u.password_salt
     FROM sessions s JOIN users u ON u.id = s.user_id
     WHERE s.id = ?1 AND s.revoked_at IS NULL AND s.expires_at > datetime('now')`),
  insert: (env: Env) => sqlOne<Session | null>(env,
    `INSERT INTO sessions (id,user_id,expires_at,created_at)
     VALUES (?1,?2,?3,datetime('now')) RETURNING *`),
  revoke: (env: Env) => sqlOne<Session | null>(env,
    `UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?1 RETURNING *`),
  revokeByUserId: (env: Env) => sql<Session | null>(env,
    `UPDATE sessions SET revoked_at = datetime('now') WHERE user_id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Listings
// ---------------------------------------------------------------------------
export const listings = {
  list: (env: Env) => sql<Listing & { owner_name?: string }>(env,
    `SELECT l.*, u.name as owner_name
     FROM listings l JOIN users u ON u.id = l.owner_id
     WHERE l.status = ?1
     ORDER BY l.created_at DESC LIMIT ?2 OFFSET ?3`),
  byId: (env: Env) => sqlOne<Listing & { owner_name?: string }>(env,
    `SELECT l.*, u.name as owner_name FROM listings l JOIN users u ON u.id = l.owner_id WHERE l.id = ?1`),
  insert: (env: Env) => sqlOne<Listing | null>(env,
    `INSERT INTO listings (id,owner_id,title,description,price_cents,category,condition,images,status,metadata,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,datetime('now'),datetime('now')) RETURNING *`),
  update: (env: Env) => sqlOne<Listing | null>(env,
    `UPDATE listings SET
       title = COALESCE(?2, title),
       description = COALESCE(?3, description),
       price_cents = COALESCE(?4, price_cents),
       category = COALESCE(?5, category),
       condition = COALESCE(?6, condition),
       images = COALESCE(?7, images),
       status = COALESCE(?8, status),
       metadata = COALESCE(?9, metadata),
       updated_at = datetime('now')
     WHERE id = ?1 RETURNING *`),
  delete: (env: Env) => sqlOne<Listing | null>(env,
    `DELETE FROM listings WHERE id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Leads
// ---------------------------------------------------------------------------
export const leads = {
  byListingId: (env: Env) => sql<Lead>(env,
    `SELECT * FROM leads WHERE listing_id = ?1 ORDER BY created_at DESC`),
  byId: (env: Env) => sqlOne<Lead>(env, `SELECT * FROM leads WHERE id = ?1`),
  insert: (env: Env) => sqlOne<Lead | null>(env,
    `INSERT INTO leads (id,listing_id,buyer_id,buyer_email,buyer_name,message,status,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,datetime('now'),datetime('now')) RETURNING *`),
  updateStatus: (env: Env) => sqlOne<Lead | null>(env,
    `UPDATE leads SET status = ?2, updated_at = datetime('now') WHERE id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Mint records
// ---------------------------------------------------------------------------
export const mint_records = {
  byId: (env: Env) => sqlOne<MintRecord>(env, `SELECT * FROM mint_records WHERE id = ?1`),
  byListingId: (env: Env) => sql<MintRecord>(env,
    `SELECT * FROM mint_records WHERE listing_id = ?1 ORDER BY created_at DESC`),
  insert: (env: Env) => sqlOne<MintRecord | null>(env,
    `INSERT INTO mint_records (id,listing_id,owner_id,chain_id,contract_address,token_id,status,onchain_uri,offchain_uri,physical_item,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,datetime('now'),datetime('now')) RETURNING *`),
  updateStatus: (env: Env) => sqlOne<MintRecord | null>(env,
    `UPDATE mint_records SET status = ?2, onchain_uri = COALESCE(?3, onchain_uri), offchain_uri = COALESCE(?4, offchain_uri), updated_at = datetime('now')
     WHERE id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Agent jobs
// ---------------------------------------------------------------------------
export const agent_jobs = {
  byId: (env: Env) => sqlOne<AgentJob>(env, `SELECT * FROM agent_jobs WHERE id = ?1`),
  insert: (env: Env) => sqlOne<AgentJob | null>(env,
    `INSERT INTO agent_jobs (id,agent,action,payload,status,created_at,updated_at)
     VALUES (?1,?2,?3,?4,?5,datetime('now'),datetime('now')) RETURNING *`),
  updateStatus: (env: Env) => sqlOne<AgentJob | null>(env,
    `UPDATE agent_jobs SET status = ?2, result = ?3, error = ?4, finished_at = datetime('now'), updated_at = datetime('now')
     WHERE id = ?1 RETURNING *`),
};

// ---------------------------------------------------------------------------
// Checkout sessions
// ---------------------------------------------------------------------------
export const checkout_sessions = {
  byId: (env: Env) => sqlOne<CheckoutSession>(env, `SELECT * FROM checkout_sessions WHERE id = ?1`),
  byPaymentIntent: (env: Env) => sqlOne<CheckoutSession | null>(env,
    `SELECT * FROM checkout_sessions WHERE payment_intent_id = ?1`),
  insert: (env: Env) => sqlOne<CheckoutSession | null>(env,
    `INSERT INTO checkout_sessions (id,listing_id,buyer_id,amount_cents,currency,status,payment_intent_id,client_secret,url,metadata,created_at,expires_at)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,datetime('now'),?11) RETURNING *`),
  updateStatus: (env: Env) => sqlOne<CheckoutSession | null>(env,
    `UPDATE checkout_sessions SET status = ?2, payment_intent_id = COALESCE(?3, payment_intent_id), updated_at = datetime('now')
     WHERE id = ?1 RETURNING *`),
};
