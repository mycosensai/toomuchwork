/**
 * SQLite Schema for Cloudflare D1
 * Converted from MySQL schema for Cloudflare Workers deployment
 */

import {
  sqliteTable,
  integer,
  text,
  real,
} from "drizzle-orm/sqlite-core";

// ─── USERS ───
export const users = sqliteTable("users", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  unionId: text("unionId").unique(),
  oauthProvider: text("oauth_provider"),
  oauthProviderId: text("oauth_provider_id"),
  name: text("name"),
  email: text("email"),
  avatar: text("avatar"),
  password: text("password"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  lastSignInAt: integer("lastSignInAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type User = typeof users.$inferSelect;

// ─── CATEGORIES ───
export const categories = sqliteTable("categories", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  image: text("image"),
});

export type Category = typeof categories.$inferSelect;

// ─── LISTINGS ───
export const listings = sqliteTable("listings", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  slug: text("slug"),
  description: text("description"),
  categoryId: integer("category_id"),
  price: text("price").notNull(),
  condition: text("condition"),
  images: text("images"), // JSON array
  features: text("features"), // JSON array
  provenance: text("provenance"),
  dimensions: text("dimensions"),
  materials: text("materials"),
  year: integer("year"),
  isBuyNow: integer("is_buy_now", { mode: "boolean" }).default(true),
  isConsignment: integer("is_consignment", { mode: "boolean" }).default(false),
  badge: text("badge"),
  commissionRate: text("commission_rate").default("5.00"),
  sellerId: integer("seller_id"),
  status: text("status").default("active"),
  isCertified: integer("is_certified", { mode: "boolean" }).default(false),
  tokenContractAddress: text("token_contract_address"),
  certificationId: integer("certification_id"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export type Listing = typeof listings.$inferSelect;

// ─── APPRAISALS ───
export const appraisals = sqliteTable("appraisals", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  itemName: text("item_name").notNull(),
  category: text("category"),
  description: text("description"),
  condition: text("condition"),
  images: text("images"), // JSON array
  estimatedValue: text("estimated_value"),
  confidence: text("confidence"),
  marketAnalysis: text("market_analysis"),
  comparableSales: text("comparable_sales"), // JSON
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── CART ITEMS ───
export const cartItems = sqliteTable("cart_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  listingId: integer("listing_id").notNull(),
  offerPrice: text("offer_price"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── STRIPE SESSIONS ───
export const stripeSessions = sqliteTable("stripe_sessions", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  userId: integer("user_id"),
  listingId: integer("listing_id").notNull(),
  amount: text("amount").notNull(),
  commission: text("commission"),
  status: text("status").default("pending"),
  metadata: text("metadata"), // JSON
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── AI AGENT LOGS ───
export const aiAgentLogs = sqliteTable("ai_agent_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  agentName: text("agent_name").notNull(),
  agentType: text("agent_type"),
  listingId: integer("listing_id"),
  status: text("status").default("pending"),
  input: text("input"),
  output: text("output"),
  confidence: text("confidence"),
  message: text("message"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── COMMISSION TIERS ───
export const commissionTiers = sqliteTable("commission_tiers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  minPrice: real("min_price").default(0),
  maxPrice: real("max_price"),
  rate: text("rate").notNull(),
  label: text("label"),
  description: text("description"),
});

// ─── COINBASE CHARGES ───
export const coinbaseCharges = sqliteTable("coinbase_charges", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  userId: integer("user_id"),
  coinbaseChargeId: text("coinbase_charge_id").notNull(),
  coinbaseCode: text("coinbase_code"),
  coinbaseHostedUrl: text("coinbase_hosted_url"),
  amount: text("amount").notNull(),
  currency: text("currency").default("USD"),
  status: text("status").default("pending"),
  metadata: text("metadata"), // JSON
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── BLOCKCHAIN CERTS ───
export const blockchainCerts = sqliteTable("blockchain_certs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id"),
  userId: integer("user_id"),
  certificateHash: text("certificate_hash").notNull(),
  contractAddress: text("contract_address"),
  tokenId: text("token_id"),
  blockHash: text("block_hash"),
  blockNumber: integer("block_number"),
  network: text("network").default("solana_devnet"),
  itemName: text("item_name").notNull(),
  itemDescription: text("item_description"),
  metadataUri: text("metadata_uri"),
  status: text("status").default("minted"),
  certificationFee: text("certification_fee").default("0.002"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── CRYPTO PAYMENTS ───
export const cryptoPayments = sqliteTable("crypto_payments", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  buyerAddress: text("buyer_address").notNull(),
  sellerAddress: text("seller_address").notNull(),
  amount: text("amount").notNull(),
  amountUsd: text("amount_usd"),
  currency: text("currency").default("SOL"),
  network: text("network").default("solana_devnet"),
  txHash: text("tx_hash"),
  status: text("status").default("pending"),
  confirmations: integer("confirmations").default(0),
  metadata: text("metadata"), // JSON
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── EXPERT PROFILES ───
export const expertProfiles = sqliteTable("expert_profiles", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  title: text("title"),
  institution: text("institution"),
  specialty: text("specialty"),
  yearsExperience: integer("years_experience").default(0),
  credentials: text("credentials"),
  bio: text("bio"),
  avatar: text("avatar"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── EXPERT APPLICATIONS ───
export const expertApplications = sqliteTable("expert_applications", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  condition: text("condition"),
  description: text("description"),
  provenance: text("provenance"),
  dimensions: text("dimensions"),
  materials: text("materials"),
  markings: text("markings"),
  imageUrls: text("image_urls"), // JSON
  estimatedValue: text("estimated_value"),
  status: text("status").default("submitted"),
  assignedExpertIds: text("assigned_expert_ids"), // JSON
  reviewFee: text("review_fee").default("49.99"),
  priority: text("priority").default("standard"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── EXPERT REVIEWS ───
export const expertReviews = sqliteTable("expert_reviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").notNull(),
  expertId: integer("expert_id").notNull(),
  expertName: text("expert_name"),
  expertTitle: text("expert_title"),
  expertInstitution: text("expert_institution"),
  authenticityScore: integer("authenticity_score"),
  valueScore: integer("value_score"),
  conditionScore: integer("condition_score"),
  overallScore: integer("overall_score"),
  analysis: text("analysis"),
  detailedNotes: text("detailed_notes"),
  confidenceLevel: text("confidence_level").default("medium"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── EXPERT CONSENSUS ───
export const expertConsensus = sqliteTable("expert_consensus", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  applicationId: integer("application_id").notNull(),
  avgAuthenticity: integer("avg_authenticity"),
  avgValue: integer("avg_value"),
  avgCondition: integer("avg_condition"),
  avgOverall: integer("avg_overall"),
  estimatedValue: text("estimated_value"),
  confidenceLevel: text("confidence_level").default("medium"),
  summaryReport: text("summary_report"),
  certificationGrade: text("certification_grade"),
  isBlockchainCertified: integer("is_blockchain_certified", { mode: "boolean" }).default(false),
  blockchainCertId: integer("blockchain_cert_id"),
  status: text("status").default("draft"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── OUTREACH CAMPAIGNS ───
export const outreachCampaigns = sqliteTable("outreach_campaigns", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id"),
  applicationId: integer("application_id"),
  userId: integer("user_id"),
  itemName: text("item_name").notNull(),
  category: text("category").notNull(),
  targetProfessionals: integer("target_professionals").default(5),
  foundLeads: integer("found_leads").default(0),
  outreachCount: integer("outreach_count").default(0),
  status: text("status").default("running"),
  aiStrategy: text("ai_strategy"),
  lastRunAt: integer("last_run_at", { mode: "timestamp" }),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── OUTREACH LOGS ───
export const outreachLogs = sqliteTable("outreach_logs", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  expertId: integer("expert_id"),
  professionalName: text("professional_name"),
  professionalTitle: text("professional_title"),
  institution: text("institution"),
  email: text("email"),
  specialty: text("specialty"),
  outreachMethod: text("outreach_method").default("ai_search"),
  message: text("message"),
  response: text("response"),
  status: text("status").default("pending"),
  confidence: integer("confidence").default(50),
  attemptNumber: integer("attempt_number").default(1),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ─── PROFESSIONAL LEADS ───
export const professionalLeads = sqliteTable("professional_leads", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  campaignId: integer("campaign_id").notNull(),
  listingId: integer("listing_id"),
  applicationId: integer("application_id"),
  userId: integer("user_id"),
  outreachLogId: integer("outreach_log_id"),
  expertId: integer("expert_id"),
  name: text("name").notNull(),
  title: text("title"),
  institution: text("institution"),
  email: text("email"),
  specialty: text("specialty"),
  interestLevel: text("interest_level").default("interested"),
  estimatedOffer: text("estimated_offer"),
  notes: text("notes"),
  contactMessage: text("contact_message"),
  isDelivered: integer("is_delivered", { mode: "boolean" }).default(false),
  deliveredAt: integer("delivered_at", { mode: "timestamp" }),
  status: text("status").default("active"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

// ═══════════════════════════════════════════════
// RETAIL FEATURES — Reviews, Wishlist, Orders, Newsletter
// ═══════════════════════════════════════════════

export const reviews = sqliteTable("reviews", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  listingId: integer("listing_id").notNull(),
  userId: integer("user_id"),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  rating: integer("rating").notNull(),
  title: text("title"),
  comment: text("comment"),
  isVerifiedPurchase: integer("is_verified_purchase", { mode: "boolean" }).default(false),
  helpfulCount: integer("helpful_count").default(0),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const wishlistItems = sqliteTable("wishlist_items", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  listingId: integer("listing_id").notNull(),
  sessionId: text("session_id"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const orders = sqliteTable("orders", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  listingId: integer("listing_id").notNull(),
  listingTitle: text("listing_title").notNull(),
  listingImage: text("listing_image"),
  amount: text("amount").notNull(),
  commission: text("commission").default("0.00"),
  paymentMethod: text("payment_method").default("other"),
  paymentStatus: text("payment_status").default("pending"),
  orderStatus: text("order_status").default("pending"),
  shippingAddress: text("shipping_address"),
  trackingNumber: text("tracking_number"),
  notes: text("notes"),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const newsletterSubscribers = sqliteTable("newsletter_subscribers", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  isSubscribed: integer("is_subscribed", { mode: "boolean" }).default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});

export const recentlyViewed = sqliteTable("recently_viewed", {
  id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  sessionId: text("session_id"),
  listingId: integer("listing_id").notNull(),
  viewedAt: integer("viewed_at", { mode: "timestamp" }).$defaultFn(() => new Date()).notNull(),
});
