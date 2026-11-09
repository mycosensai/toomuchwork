-- Unique index on OAuth identity, matching db/schema.ts (users table third arg).
-- Safe for existing rows: SQLite treats NULLs as distinct, so users without
-- OAuth (oauth_provider IS NULL) are unaffected.

CREATE UNIQUE INDEX IF NOT EXISTS users_oauth_unique_idx
  ON users(oauth_provider, oauth_provider_id);
