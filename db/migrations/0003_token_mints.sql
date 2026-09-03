-- Migration: token_mints table for on-chain Solana SPL tokenization
CREATE TABLE IF NOT EXISTS token_mints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  cert_id INTEGER,
  mint_address TEXT NOT NULL UNIQUE,
  treasury_address TEXT NOT NULL,
  token_name TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 0,
  total_supply TEXT NOT NULL DEFAULT '1',
  metadata_uri TEXT,
  tx_signature TEXT,
  status TEXT NOT NULL DEFAULT 'minted',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_token_mints_listing ON token_mints(listing_id);
CREATE INDEX IF NOT EXISTS idx_token_mints_mint ON token_mints(mint_address);
