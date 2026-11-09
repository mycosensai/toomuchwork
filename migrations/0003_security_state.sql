-- Cloudflare Workers-safe security state (replaces per-isolate in-memory Maps).
-- Applied with the other hand-written migrations (users fix, webhook_events).

-- Distributed rate-limit counters, keyed by client IP / bucket key.
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL DEFAULT 0,
  last_seen INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limits_last_seen_idx ON rate_limits(last_seen);

-- Individually revoked JWTs (e.g. logout / token compromise).
CREATE TABLE IF NOT EXISTS revoked_tokens (
  token TEXT PRIMARY KEY,
  revoked_at INTEGER NOT NULL
);

-- "Revoke all sessions for user X" — tokens issued before revoked_at are invalid.
CREATE TABLE IF NOT EXISTS revoked_user_sessions (
  user_id INTEGER PRIMARY KEY,
  revoked_at INTEGER NOT NULL
);
