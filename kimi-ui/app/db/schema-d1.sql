-- The Vault D1 (SQLite) Schema
-- Run with: wrangler d1 execute the-vault-db --file=./db/schema-d1.sql

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  unionId TEXT UNIQUE,
  oauth_provider TEXT,
  oauth_provider_id TEXT,
  name TEXT,
  email TEXT,
  avatar TEXT,
  password TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  lastSignInAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  image TEXT
);

-- Listings
CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT,
  description TEXT,
  category_id INTEGER,
  price TEXT NOT NULL,
  condition TEXT,
  images TEXT,
  features TEXT,
  provenance TEXT,
  dimensions TEXT,
  materials TEXT,
  year INTEGER,
  is_buy_now INTEGER DEFAULT 1,
  is_consignment INTEGER DEFAULT 0,
  badge TEXT,
  commission_rate TEXT DEFAULT '5.00',
  seller_id INTEGER,
  status TEXT DEFAULT 'active',
  is_certified INTEGER DEFAULT 0,
  token_contract_address TEXT,
  certification_id INTEGER,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Appraisals
CREATE TABLE IF NOT EXISTS appraisals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  item_name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  condition TEXT,
  images TEXT,
  estimated_value TEXT,
  confidence TEXT,
  market_analysis TEXT,
  comparable_sales TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Cart Items
CREATE TABLE IF NOT EXISTS cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  listing_id INTEGER NOT NULL,
  offer_price TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Stripe Sessions
CREATE TABLE IF NOT EXISTS stripe_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER,
  listing_id INTEGER NOT NULL,
  amount TEXT NOT NULL,
  commission TEXT,
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- AI Agent Logs
CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_name TEXT NOT NULL,
  agent_type TEXT,
  listing_id INTEGER,
  status TEXT DEFAULT 'pending',
  input TEXT,
  output TEXT,
  confidence TEXT,
  message TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Commission Tiers
CREATE TABLE IF NOT EXISTS commission_tiers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  min_price REAL DEFAULT 0,
  max_price REAL,
  rate TEXT NOT NULL,
  label TEXT,
  description TEXT
);

-- Coinbase Charges
CREATE TABLE IF NOT EXISTS coinbase_charges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  coinbase_charge_id TEXT NOT NULL,
  coinbase_code TEXT,
  coinbase_hosted_url TEXT,
  amount TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Blockchain Certs
CREATE TABLE IF NOT EXISTS blockchain_certs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER,
  user_id INTEGER,
  certificate_hash TEXT NOT NULL,
  contract_address TEXT,
  token_id TEXT,
  block_hash TEXT,
  block_number INTEGER,
  network TEXT DEFAULT 'solana_devnet',
  item_name TEXT NOT NULL,
  item_description TEXT,
  metadata_uri TEXT,
  status TEXT DEFAULT 'minted',
  certification_fee TEXT DEFAULT '0.002',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Crypto Payments
CREATE TABLE IF NOT EXISTS crypto_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  buyer_address TEXT NOT NULL,
  seller_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_usd TEXT,
  currency TEXT DEFAULT 'SOL',
  network TEXT DEFAULT 'solana_devnet',
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  confirmations INTEGER DEFAULT 0,
  metadata TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Expert Profiles
CREATE TABLE IF NOT EXISTS expert_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  title TEXT,
  institution TEXT,
  specialty TEXT,
  years_experience INTEGER DEFAULT 0,
  credentials TEXT,
  bio TEXT,
  avatar TEXT,
  is_active INTEGER DEFAULT 1,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Expert Applications
CREATE TABLE IF NOT EXISTS expert_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition TEXT,
  description TEXT,
  provenance TEXT,
  dimensions TEXT,
  materials TEXT,
  markings TEXT,
  image_urls TEXT,
  estimated_value TEXT,
  status TEXT DEFAULT 'submitted',
  assigned_expert_ids TEXT,
  review_fee TEXT DEFAULT '49.99',
  priority TEXT DEFAULT 'standard',
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Expert Reviews
CREATE TABLE IF NOT EXISTS expert_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  expert_id INTEGER NOT NULL,
  expert_name TEXT,
  expert_title TEXT,
  expert_institution TEXT,
  authenticity_score INTEGER,
  value_score INTEGER,
  condition_score INTEGER,
  overall_score INTEGER,
  analysis TEXT,
  detailed_notes TEXT,
  confidence_level TEXT DEFAULT 'medium',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Expert Consensus
CREATE TABLE IF NOT EXISTS expert_consensus (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  application_id INTEGER NOT NULL,
  avg_authenticity INTEGER,
  avg_value INTEGER,
  avg_condition INTEGER,
  avg_overall INTEGER,
  estimated_value TEXT,
  confidence_level TEXT DEFAULT 'medium',
  summary_report TEXT,
  certification_grade TEXT,
  is_blockchain_certified INTEGER DEFAULT 0,
  blockchain_cert_id INTEGER,
  status TEXT DEFAULT 'draft',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER,
  application_id INTEGER,
  user_id INTEGER,
  item_name TEXT NOT NULL,
  category TEXT NOT NULL,
  target_professionals INTEGER DEFAULT 5,
  found_leads INTEGER DEFAULT 0,
  outreach_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running',
  ai_strategy TEXT,
  last_run_at INTEGER,
  completed_at INTEGER,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Outreach Logs
CREATE TABLE IF NOT EXISTS outreach_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  expert_id INTEGER,
  professional_name TEXT,
  professional_title TEXT,
  institution TEXT,
  email TEXT,
  specialty TEXT,
  outreach_method TEXT DEFAULT 'ai_search',
  message TEXT,
  response TEXT,
  status TEXT DEFAULT 'pending',
  confidence INTEGER DEFAULT 50,
  attempt_number INTEGER DEFAULT 1,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Professional Leads
CREATE TABLE IF NOT EXISTS professional_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_id INTEGER NOT NULL,
  listing_id INTEGER,
  application_id INTEGER,
  user_id INTEGER,
  outreach_log_id INTEGER,
  expert_id INTEGER,
  name TEXT NOT NULL,
  title TEXT,
  institution TEXT,
  email TEXT,
  specialty TEXT,
  interest_level TEXT DEFAULT 'interested',
  estimated_offer TEXT,
  notes TEXT,
  contact_message TEXT,
  is_delivered INTEGER DEFAULT 0,
  delivered_at INTEGER,
  status TEXT DEFAULT 'active',
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL,
  user_id INTEGER,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  rating INTEGER NOT NULL,
  title TEXT,
  comment TEXT,
  is_verified_purchase INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  listing_id INTEGER NOT NULL,
  session_id TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  listing_id INTEGER NOT NULL,
  listing_title TEXT NOT NULL,
  listing_image TEXT,
  amount TEXT NOT NULL,
  commission TEXT DEFAULT '0.00',
  payment_method TEXT DEFAULT 'other',
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  tracking_number TEXT,
  notes TEXT,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updatedAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Newsletter Subscribers
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  is_subscribed INTEGER DEFAULT 1,
  createdAt INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Recently Viewed
CREATE TABLE IF NOT EXISTS recently_viewed (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  session_id TEXT,
  listing_id INTEGER NOT NULL,
  viewed_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Seed default commission tiers
INSERT OR IGNORE INTO commission_tiers (id, min_price, max_price, rate, label, description) VALUES
  (1, 0, 999.99, '5.00', 'Standard', 'Under $1,000'),
  (2, 1000, 7499.99, '7.00', 'Premium', '$1,000 - $7,500'),
  (3, 7500, 9999.99, '10.00', 'Elite', '$7,500 - $10,000'),
  (4, 10000, NULL, '5.00', 'Wholesale', 'Over $10,000');

-- Seed default categories
INSERT OR IGNORE INTO categories (id, name, slug, description) VALUES
  (1, 'Fine Jewelry', 'jewelry', 'Rare gemstones, estate pieces, and haute joaillerie'),
  (2, 'Coins & Currency', 'coins', 'Ancient coins, rare banknotes, and bullion'),
  (3, 'Fine Art', 'art', 'Paintings, sculptures, and mixed media works'),
  (4, 'Watches & Timepieces', 'watches', 'Luxury watches, pocket watches, and horological instruments'),
  (5, 'Antiques & Estate', 'antiques', 'Furniture, decorative arts, and historical objects'),
  (6, 'Sports Memorabilia', 'sports', 'Game-worn items, trading cards, and championship artifacts'),
  (7, 'Rare Books', 'books', 'First editions, manuscripts, and literary collectibles');

-- Seed expert profiles
INSERT OR IGNORE INTO expert_profiles (id, name, title, institution, specialty, years_experience, credentials, bio) VALUES
  (1, 'Eleanor Whitmore', 'Senior Jewelry Specialist', 'Christies', 'Fine Jewelry', 28, 'GIA Graduate Gemologist, FGA', 'Former head of jewelry department at major auction house'),
  (2, 'Marcus Chen', 'Numismatic Expert', 'Heritage Auctions', 'Coins & Currency', 22, 'ANA Life Member, PCGS Authorized Dealer', 'Specialist in ancient and rare world coins'),
  (3, 'Isabella Romano', 'Fine Art Appraiser', 'Sothebys', 'Fine Art', 30, 'PhD Art History, IFAA Certified', 'Expert in Impressionist and Modern art valuation'),
  (4, 'James Harrington', 'Master Horologist', 'Patek Philippe', 'Watches & Timepieces', 25, 'WOSTEP Certified, AWCI Member', 'Specialist in complicated movements and rare references'),
  (5, 'Sarah Goldstein', 'Antiques Roadshow Expert', 'Independent', 'Antiques & Estate', 20, 'ISA CAPP, AAA Member', 'Broad expertise across decorative arts and furniture'),
  (6, 'Michael Torres', 'Sports Memorabilia Authenticator', 'PSA/DNA', 'Sports Memorabilia', 18, 'PSA/DNA Lead Authenticator', 'Expert in game-used equipment and vintage cards'),
  (7, 'Dr. Amelia Blackwood', 'Rare Book Specialist', 'Bonhams', 'Rare Books', 24, 'MLIS, ABAA Member', 'Specialist in first editions and literary manuscripts'),
  (8, 'Robert Chang', 'Asian Art Expert', 'Sothebys', 'Fine Art', 27, 'PhD Asian Art, FAR Magazine Contributor', 'Expert in Chinese and Japanese art and antiquities'),
  (9, 'Victoria Steele', 'Estate Jewelry Specialist', 'Independent', 'Fine Jewelry', 19, 'GIA GG, ISA CAPP', 'Focus on Art Deco and Victorian estate pieces'),
  (10, 'David Okafor', 'African & Tribal Art Expert', 'Bonhams', 'Antiques & Estate', 21, 'PhD Anthropology, IFAA', 'Specialist in African masks, textiles, and sculpture'),
  (11, 'Dr. Klaus Weber', 'Horological Historian', 'Antiquorum', 'Watches & Timepieces', 32, 'PhD History of Science, FNAWCC', 'Expert in vintage pocket watches and marine chronometers'),
  (12, 'Linda Park', 'Contemporary Art Specialist', 'Christies', 'Fine Art', 16, 'MA Contemporary Art, CURA Member', 'Focus on post-war and contemporary art market');
