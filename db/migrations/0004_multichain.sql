-- Migration 0004: multi-chain tokenization tables
-- Adds chain_certs (certificates per chain) and chain_token_mints (on-chain mint records)

CREATE TABLE IF NOT EXISTS chain_certs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listingId INTEGER NOT NULL,
  userId INTEGER,
  certificateHash TEXT NOT NULL UNIQUE,
  contractAddress TEXT,
  tokenId TEXT,
  blockHash TEXT,
  blockNumber INTEGER,
  network TEXT NOT NULL DEFAULT 'ethereum',
  chainKey TEXT NOT NULL DEFAULT 'ethereum',
  itemName TEXT NOT NULL,
  itemDescription TEXT,
  metadataUri TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  certificationFee TEXT DEFAULT '0.002',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_chain_certs_listing ON chain_certs(listingId);
CREATE INDEX IF NOT EXISTS idx_chain_certs_chain ON chain_certs(chainKey);
CREATE INDEX IF NOT EXISTS idx_chain_certs_cert_hash ON chain_certs(certificateHash);

CREATE TABLE IF NOT EXISTS chain_token_mints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listingId INTEGER NOT NULL,
  certId INTEGER,
  mintAddress TEXT NOT NULL UNIQUE,
  treasuryAddress TEXT NOT NULL,
  tokenName TEXT NOT NULL,
  tokenSymbol TEXT NOT NULL,
  decimals INTEGER NOT NULL DEFAULT 18,
  totalSupply TEXT DEFAULT '1' NOT NULL,
  metadataUri TEXT,
  txSignature TEXT,
  chainKey TEXT NOT NULL DEFAULT 'ethereum',
  status TEXT NOT NULL DEFAULT 'minted',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch()),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_chain_token_mints_listing ON chain_token_mints(listingId);
CREATE INDEX IF NOT EXISTS idx_chain_token_mints_chain ON chain_token_mints(chainKey);
CREATE INDEX IF NOT EXISTS idx_chain_token_mints_mint ON chain_token_mints(mintAddress);