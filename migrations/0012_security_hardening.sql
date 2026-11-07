-- 0012_security_hardening.sql
-- Apply manually. Do not run this against production from CI.
--   npx wrangler d1 execute thevault-db --remote --file=migrations/0012_security_hardening.sql
--
-- Number 0012 is the next free id. Production d1_migrations has applied
-- ids 1-6, 8, 10 and 11. Ids 7 and 9 are absent. This repository has no
-- 0007 or 0009 file on main or master, so those rows were never applied
-- from this tree. Do not use `wrangler d1 migrations apply`: local files
-- do not match that history (0011 was applied before 0010, and this repo
-- has a single migrations/0001_users_schema_fix.sql).
--
-- Does not drop appraisals_backup_20260707 or lf_results_20260705.

-- Password reset tokens. Production has no such table.
-- The raw token is emailed once. Only its SHA-256 hex is stored.
-- used_at NULL means unused. A successful reset sets used_at (single use).
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens(user_id);

CREATE TABLE IF NOT EXISTS stripe_event_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  external_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  status TEXT NOT NULL DEFAULT 'processing',
  retries INTEGER NOT NULL DEFAULT 0,
  processed_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  UNIQUE(provider, external_event_id)
);

CREATE TABLE IF NOT EXISTS order_payment_keys (
  stripe_session_id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS premium_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  report_type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  session_id TEXT NOT NULL UNIQUE,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS seller_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  contact_email TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  accent_color TEXT DEFAULT '#C9A84C',
  is_public INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS message_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  thread_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS referral_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  clicks INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue REAL NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS price_comparisons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  avg_price REAL NOT NULL,
  min_price REAL NOT NULL,
  max_price REAL NOT NULL,
  median_price REAL NOT NULL,
  comparison_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS rate_limit_counters (
  bucket TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

CREATE TABLE IF NOT EXISTS disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  raised_by INTEGER NOT NULL,
  reason TEXT NOT NULL,
  evidence TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  notes TEXT,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Admin provisioning keys off users.email, never clerk_email.
-- Everyone else is demoted. The two owners stay admins.
UPDATE users
SET role = 'user'
WHERE email IS NULL
   OR lower(trim(email)) NOT IN (
     'ratchetkrewelabs@gmail.com',
     'dakotavanalstyne318@gmail.com'
   );

UPDATE users
SET role = 'admin'
WHERE lower(trim(email)) IN (
  'ratchetkrewelabs@gmail.com',
  'dakotavanalstyne318@gmail.com'
);

-- Mark those mailboxes verified when the column exists.
-- If this statement fails because email_verified is missing, skip it.
-- The runtime still allows role=admin plus the allowlisted users.email,
-- so an empty clerk_email does not lock these two accounts out.
UPDATE users
SET email_verified = 1
WHERE lower(trim(email)) IN (
  'ratchetkrewelabs@gmail.com',
  'dakotavanalstyne318@gmail.com'
);
