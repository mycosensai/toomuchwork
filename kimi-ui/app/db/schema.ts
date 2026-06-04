import {
  mysqlTable,
  mysqlEnum,
  serial,
  varchar,
  text,
  timestamp,
  int,
  decimal,
  json,
  boolean,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── USERS ───
export const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  unionId: varchar("unionId", { length: 255 }).unique(),
  oauthProvider: varchar("oauth_provider", { length: 50 }),
  oauthProviderId: varchar("oauth_provider_id", { length: 255 }),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }),
  avatar: text("avatar"),
  password: varchar("password", { length: 255 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
  lastSignInAt: timestamp("lastSignInAt").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── CATEGORIES ───
export const categories = mysqlTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  icon: varchar("icon", { length: 50 }),
  description: text("description"),
  listingCount: int("listing_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Category = typeof categories.$inferSelect;

// ─── LISTINGS ───
export const listings = mysqlTable("listings", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  categoryId: bigint("category_id", { mode: "number", unsigned: true }).notNull(),
  sellerId: bigint("seller_id", { mode: "number", unsigned: true }),
  price: decimal("price", { precision: 15, scale: 2 }).notNull(),
  commissionRate: decimal("commission_rate", { precision: 4, scale: 2 }).notNull().default("5.00"),
  condition: mysqlEnum("condition", ["mint", "excellent", "very_good", "good", "fair"]).default("very_good"),
  status: mysqlEnum("status", ["active", "sold", "pending", "withdrawn"]).default("active").notNull(),
  badge: mysqlEnum("badge", ["verified", "new", "hot", "offer", "none"]).default("none"),
  images: json("images").$type<string[]>(),
  features: json("features").$type<string[]>(),
  appraisalId: bigint("appraisal_id", { mode: "number", unsigned: true }),
  isBuyNow: boolean("is_buy_now").default(true),
  isConsignment: boolean("is_consignment").default(false),
  viewCount: int("view_count").default(0).notNull(),
  isCertified: boolean("is_certified").default(false),
  tokenContractAddress: varchar("token_contract_address", { length: 255 }),
  certificationId: bigint("certification_id", { mode: "number", unsigned: true }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;

// ─── APPRAISALS ───
export const appraisals = mysqlTable("appraisals", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  condition: varchar("condition", { length: 50 }),
  description: text("description"),
  imageUrl: text("image_url"),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  valueRangeLow: decimal("value_range_low", { precision: 15, scale: 2 }),
  valueRangeHigh: decimal("value_range_high", { precision: 15, scale: 2 }),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium"),
  marketAnalysis: text("market_analysis"),
  comparableSales: json("comparable_sales").$type<Array<{
    title: string;
    price: number;
    source: string;
    url?: string;
    date?: string;
  }>>(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  commissionEstimate: decimal("commission_estimate", { precision: 15, scale: 2 }),
  commissionRate: decimal("commission_rate", { precision: 4, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Appraisal = typeof appraisals.$inferSelect;
export type InsertAppraisal = typeof appraisals.$inferInsert;

// ─── CART ITEMS ───
export const cartItems = mysqlTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  sessionId: varchar("session_id", { length: 255 }),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  quantity: int("quantity").default(1).notNull(),
  offerPrice: decimal("offer_price", { precision: 15, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type CartItem = typeof cartItems.$inferSelect;

// ─── STRIPE SESSIONS ───
export const stripeSessions = mysqlTable("stripe_sessions", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 255 }).notNull().unique(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 15, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled", "refunded"]).default("pending").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── AI AGENT LOGS ───
export const aiAgentLogs = mysqlTable("ai_agent_logs", {
  id: serial("id").primaryKey(),
  agentName: varchar("agent_name", { length: 100 }).notNull(),
  agentType: mysqlEnum("agent_type", ["buyer_finder", "price_analyzer", "appraisal", "negotiator", "general"]).default("general").notNull(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }),
  status: mysqlEnum("status", ["running", "completed", "failed", "queued"]).default("queued").notNull(),
  input: json("input"),
  output: json("output"),
  confidence: decimal("confidence", { precision: 4, scale: 2 }),
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── BLOCKCHAIN CERTIFICATES ───
export const blockchainCerts = mysqlTable("blockchain_certs", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  certificateHash: varchar("certificate_hash", { length: 255 }).notNull().unique(),
  contractAddress: varchar("contract_address", { length: 255 }),
  tokenId: varchar("token_id", { length: 255 }),
  blockHash: varchar("block_hash", { length: 255 }),
  blockNumber: bigint("block_number", { mode: "number" }),
  network: varchar("network", { length: 50 }).default("ethereum_sepolia"),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  itemDescription: text("item_description"),
  metadataUri: text("metadata_uri"),
  status: mysqlEnum("status", ["pending", "minted", "failed"]).default("pending").notNull(),
  certificationFee: decimal("certification_fee", { precision: 10, scale: 6 }).default("0.002"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type BlockchainCert = typeof blockchainCerts.$inferSelect;

// ─── CRYPTO PAYMENTS ───
export const cryptoPayments = mysqlTable("crypto_payments", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  buyerAddress: varchar("buyer_address", { length: 255 }).notNull(),
  sellerAddress: varchar("seller_address", { length: 255 }),
  amount: decimal("amount", { precision: 15, scale: 6 }).notNull(),
  amountUsd: decimal("amount_usd", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 20 }).default("ETH").notNull(),
  network: varchar("network", { length: 50 }).default("ethereum_sepolia"),
  txHash: varchar("tx_hash", { length: 255 }).unique(),
  blockHash: varchar("block_hash", { length: 255 }),
  blockNumber: bigint("block_number", { mode: "number" }),
  status: mysqlEnum("status", ["pending", "confirming", "confirmed", "failed"]).default("pending").notNull(),
  confirmations: int("confirmations").default(0),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CryptoPayment = typeof cryptoPayments.$inferSelect;

// ─── COMMISSION TIERS ───
export const commissionTiers = mysqlTable("commission_tiers", {
  id: serial("id").primaryKey(),
  minAmount: decimal("min_amount", { precision: 15, scale: 2 }).notNull(),
  maxAmount: decimal("max_amount", { precision: 15, scale: 2 }),
  rate: decimal("rate", { precision: 4, scale: 2 }).notNull(),
  label: varchar("label", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── COINBASE CHARGES ───
export const coinbaseCharges = mysqlTable("coinbase_charges", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  coinbaseChargeId: varchar("coinbase_charge_id", { length: 255 }).notNull().unique(),
  coinbaseCode: varchar("coinbase_code", { length: 255 }),
  coinbaseHostedUrl: text("coinbase_hosted_url"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  status: mysqlEnum("status", ["pending", "completed", "expired", "cancelled", "unresolved"]).default("pending").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type CoinbaseCharge = typeof coinbaseCharges.$inferSelect;

// ─── OUTREACH CAMPAIGNS ───
export const outreachCampaigns = mysqlTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }),
  applicationId: bigint("application_id", { mode: "number", unsigned: true }),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  targetProfessionals: int("target_professionals").default(5).notNull(),
  foundLeads: int("found_leads").default(0).notNull(),
  outreachCount: int("outreach_count").default(0).notNull(),
  status: mysqlEnum("status", ["running", "completed", "paused", "failed"]).default("running").notNull(),
  aiStrategy: text("ai_strategy"),
  lastRunAt: timestamp("last_run_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── OUTREACH LOGS ───
export const outreachLogs = mysqlTable("outreach_logs", {
  id: serial("id").primaryKey(),
  campaignId: bigint("campaign_id", { mode: "number", unsigned: true }).notNull(),
  expertId: bigint("expert_id", { mode: "number", unsigned: true }),
  professionalName: varchar("professional_name", { length: 255 }),
  professionalTitle: varchar("professional_title", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  email: varchar("email", { length: 320 }),
  specialty: varchar("specialty", { length: 100 }),
  outreachMethod: mysqlEnum("outreach_method", ["ai_search", "email", "network_referral", "database_match", "cold_contact"]).default("ai_search"),
  message: text("message"),
  response: text("response"),
  status: mysqlEnum("status", ["pending", "contacted", "responded", "interested", "not_interested", "bounced"]).default("pending").notNull(),
  confidence: int("confidence").default(50),
  attemptNumber: int("attempt_number").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── PROFESSIONAL LEADS ───
export const professionalLeads = mysqlTable("professional_leads", {
  id: serial("id").primaryKey(),
  campaignId: bigint("campaign_id", { mode: "number", unsigned: true }).notNull(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }),
  applicationId: bigint("application_id", { mode: "number", unsigned: true }),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  outreachLogId: bigint("outreach_log_id", { mode: "number", unsigned: true }),
  expertId: bigint("expert_id", { mode: "number", unsigned: true }),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }),
  institution: varchar("institution", { length: 255 }),
  email: varchar("email", { length: 320 }),
  specialty: varchar("specialty", { length: 100 }),
  interestLevel: mysqlEnum("interest_level", ["very_interested", "interested", "mildly_interested", "considering"]).default("interested"),
  estimatedOffer: decimal("estimated_offer", { precision: 15, scale: 2 }),
  notes: text("notes"),
  contactMessage: text("contact_message"),
  isDelivered: boolean("is_delivered").default(false),
  deliveredAt: timestamp("delivered_at"),
  status: mysqlEnum("status", ["active", "contacted", "negotiating", "closed", "declined"]).default("active").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── EXPERT PROFILES ───
export const expertProfiles = mysqlTable("expert_profiles", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  institution: varchar("institution", { length: 255 }),
  location: varchar("location", { length: 255 }),
  specialties: json("specialties").$type<string[]>().notNull(),
  credentials: text("credentials"),
  yearsExperience: int("years_experience").default(0),
  reviewCount: int("review_count").default(0),
  rating: decimal("rating", { precision: 3, scale: 1 }).default("5.0"),
  avatar: text("avatar"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpertProfile = typeof expertProfiles.$inferSelect;

// ─── EXPERT APPLICATIONS ───
export const expertApplications = mysqlTable("expert_applications", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  condition: varchar("condition", { length: 50 }),
  description: text("description"),
  provenance: text("provenance"),
  dimensions: varchar("dimensions", { length: 255 }),
  materials: varchar("materials", { length: 255 }),
  markings: text("markings"),
  imageUrls: json("image_urls").$type<string[]>(),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  status: mysqlEnum("status", ["submitted", "assigned", "under_review", "completed", "rejected"]).default("submitted").notNull(),
  assignedExpertIds: json("assigned_expert_ids").$type<number[]>(),
  reviewFee: decimal("review_fee", { precision: 10, scale: 2 }).default("49.99"),
  priority: mysqlEnum("priority", ["standard", "express", "rush"]).default("standard"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ExpertApplication = typeof expertApplications.$inferSelect;

// ─── EXPERT REVIEWS ───
export const expertReviews = mysqlTable("expert_reviews", {
  id: serial("id").primaryKey(),
  applicationId: bigint("application_id", { mode: "number", unsigned: true }).notNull(),
  expertId: bigint("expert_id", { mode: "number", unsigned: true }).notNull(),
  authenticityScore: int("authenticity_score").notNull(),
  valueScore: int("value_score").notNull(),
  conditionScore: int("condition_score").notNull(),
  overallScore: decimal("overall_score", { precision: 5, scale: 2 }).notNull(),
  estimatedValue: decimal("estimated_value", { precision: 15, scale: 2 }),
  valueRangeLow: decimal("value_range_low", { precision: 15, scale: 2 }),
  valueRangeHigh: decimal("value_range_high", { precision: 15, scale: 2 }),
  authenticityVerdict: mysqlEnum("authenticity_verdict", ["genuine", "likely_genuine", "uncertain", "likely_reproduction", "reproduction"]).default("uncertain"),
  conditionNotes: text("condition_notes"),
  authenticityNotes: text("authenticity_notes"),
  valueNotes: text("value_notes"),
  methodology: text("methodology"),
  comparableSales: json("comparable_sales").$type<Array<{
    title: string;
    price: number;
    source: string;
    date: string;
  }>>(),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpertReview = typeof expertReviews.$inferSelect;

// ─── EXPERT CONSENSUS ───
export const expertConsensus = mysqlTable("expert_consensus", {
  id: serial("id").primaryKey(),
  applicationId: bigint("application_id", { mode: "number", unsigned: true }).notNull().unique(),
  consensusAuthenticity: decimal("consensus_authenticity", { precision: 5, scale: 2 }).notNull(),
  consensusValue: decimal("consensus_value", { precision: 5, scale: 2 }).notNull(),
  consensusCondition: decimal("consensus_condition", { precision: 5, scale: 2 }).notNull(),
  consensusOverall: decimal("consensus_overall", { precision: 5, scale: 2 }).notNull(),
  consensusVerdict: mysqlEnum("consensus_verdict", ["genuine", "likely_genuine", "uncertain", "likely_reproduction", "reproduction"]).default("uncertain"),
  estimatedValueLow: decimal("estimated_value_low", { precision: 15, scale: 2 }),
  estimatedValueHigh: decimal("estimated_value_high", { precision: 15, scale: 2 }),
  expertCount: int("expert_count").default(0),
  summaryReport: text("summary_report"),
  certificateUrl: text("certificate_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type ExpertConsensus = typeof expertConsensus.$inferSelect;


// ═══════════════════════════════════════════════
// RETAIL FEATURES — Reviews, Wishlist, Orders, Newsletter, Recently Viewed
// ═══════════════════════════════════════════════

// ─── PRODUCT REVIEWS ───
export const reviews = mysqlTable("reviews", {
  id: serial("id").primaryKey(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userAvatar: text("user_avatar"),
  rating: int("rating").notNull(), // 1-5 stars
  title: varchar("title", { length: 255 }),
  comment: text("comment"),
  isVerifiedPurchase: boolean("is_verified_purchase").default(false),
  helpfulCount: int("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;

// ─── WISHLIST ITEMS ───
export const wishlistItems = mysqlTable("wishlist_items", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }).notNull(),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  sessionId: varchar("session_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type WishlistItem = typeof wishlistItems.$inferSelect;

// ─── ORDERS ───
export const orders = mysqlTable("orders", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  listingTitle: varchar("listing_title", { length: 255 }).notNull(),
  listingImage: text("listing_image"),
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  commission: decimal("commission", { precision: 10, scale: 2 }).default("0.00"),
  paymentMethod: mysqlEnum("payment_method", ["stripe", "coinbase", "solana_wallet", "other"]).default("other"),
  paymentStatus: mysqlEnum("payment_status", ["pending", "completed", "failed", "refunded"]).default("pending"),
  orderStatus: mysqlEnum("order_status", ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"]).default("pending"),
  shippingAddress: text("shipping_address"),
  trackingNumber: varchar("tracking_number", { length: 255 }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Order = typeof orders.$inferSelect;

// ─── NEWSLETTER SUBSCRIBERS ───
export const newsletterSubscribers = mysqlTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  isSubscribed: boolean("is_subscribed").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type NewsletterSubscriber = typeof newsletterSubscribers.$inferSelect;

// ─── RECENTLY VIEWED ───
export const recentlyViewed = mysqlTable("recently_viewed", {
  id: serial("id").primaryKey(),
  userId: bigint("user_id", { mode: "number", unsigned: true }),
  sessionId: varchar("session_id", { length: 255 }),
  listingId: bigint("listing_id", { mode: "number", unsigned: true }).notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export type RecentlyViewed = typeof recentlyViewed.$inferSelect;
