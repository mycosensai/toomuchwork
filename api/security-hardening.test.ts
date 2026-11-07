import { DatabaseSync } from "node:sqlite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { listings, orders, passwordResetTokens, users } from "@db/schema";
import { appRouter } from "./router";
import { setDb } from "./queries/connection";
import { setCloudflareEnv } from "./lib/env";
import { isProvisionedAdmin } from "./lib/admin-access";
import { hashToken } from "./lib/token-hash";
import { solTransferMatches, splTransferMatches } from "./lib/spl-transfer";
import { premiumSessionMatches } from "./lib/premium-pay";
import { clearSolPriceCache, getFreshSolUsd, setSolPriceFetcher } from "./lib/sol-price";
import { publicPublishableKey, redactSecret } from "./lib/redact";
import { assertSensitiveLimit } from "./security";
import type { TrpcContext } from "./context";

function createMemoryD1() {
  const sqlite = new DatabaseSync(":memory:");
  const normalize = (params: unknown[]) => params.map((value) => {
    if (value instanceof Date) return Math.floor(value.getTime() / 1000);
    if (typeof value === "boolean") return value ? 1 : 0;
    if (typeof value === "bigint") return Number(value);
    return value;
  });
  return {
    prepare(sql: string) {
      const stmt = sqlite.prepare(sql);
      const bound = (params: unknown[]) => {
        const values = normalize(params);
        return {
          async run() {
            const info = stmt.run(...(values as []));
            return { success: true, meta: { changes: info.changes, last_row_id: Number(info.lastInsertRowid) } };
          },
          async all() {
            return { results: stmt.all(...(values as [])) };
          },
          async first<T>() {
            return (stmt.get(...(values as [])) as T | undefined) ?? null;
          },
          async raw() {
            const cols = stmt.columns();
            return stmt.all(...(values as [])).map((row) => cols.map((col) => (row as Record<string, unknown>)[col.name]));
          },
        };
      };
      return { bind: (...params: unknown[]) => bound(params) };
    },
    exec(sql: string) {
      sqlite.exec(sql);
    },
  };
}

function caller(user?: TrpcContext["user"], ip = "203.0.113.10") {
  const ctx: TrpcContext = {
    req: new Request("https://thevaultdfw.win/api/trpc", { headers: { "cf-connecting-ip": ip } }),
    resHeaders: new Headers(),
    user,
  };
  return appRouter.createCaller(ctx);
}

const db = createMemoryD1();

beforeEach(() => {
  setCloudflareEnv({
    APP_SECRET: "test-secret-test-secret-test-secret-ok",
    NODE_ENV: "test",
    VAULT_DOMAIN: "thevaultdfw.win",
    STRIPE_SECRET_KEY: "sk_test_example",
    SOL_USD_RATE: "69.52",
    USDC_USD_RATE: "1.00",
  });
  db.exec("DROP TABLE IF EXISTS users");
  db.exec(`CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    unionId TEXT,
    oauth_provider TEXT,
    oauth_provider_id TEXT,
    name TEXT,
    email TEXT,
    avatar TEXT,
    password TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    stripe_account_id TEXT,
    stripe_account_verified INTEGER,
    stripe_subscription_id TEXT,
    stripe_subscription_plan TEXT,
    stripe_subscription_status TEXT,
    stripe_subscription_end INTEGER,
    member_rank TEXT,
    member_points INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    lastSignInAt INTEGER NOT NULL,
    email_verified INTEGER NOT NULL DEFAULT 0,
    totp_secret TEXT,
    backup_codes TEXT
  )`);
  db.exec("DROP TABLE IF EXISTS password_reset_tokens");
  db.exec(`CREATE TABLE password_reset_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    created_at INTEGER
  )`);
  db.exec("DROP TABLE IF EXISTS listings");
  db.exec(`CREATE TABLE listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category_id INTEGER NOT NULL,
    seller_id INTEGER,
    price TEXT NOT NULL,
    commission_rate TEXT NOT NULL DEFAULT '5.00',
    condition TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    badge TEXT,
    images TEXT,
    features TEXT,
    appraisal_id INTEGER,
    is_buy_now INTEGER,
    is_consignment INTEGER,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_certified INTEGER,
    token_contract_address TEXT,
    certification_id INTEGER,
    auction_reserve TEXT,
    auction_buy_now TEXT,
    auction_start_at INTEGER,
    auction_end_at INTEGER,
    auction_winner TEXT,
    active_offer_amount TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  db.exec("DROP TABLE IF EXISTS orders");
  db.exec(`CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    seller_id INTEGER,
    listing_id INTEGER NOT NULL,
    listing_title TEXT NOT NULL,
    listing_image TEXT,
    amount TEXT NOT NULL,
    commission TEXT,
    payment_method TEXT,
    payment_status TEXT,
    order_status TEXT,
    shipping_address TEXT,
    tracking_number TEXT,
    payout_status TEXT,
    payout_amount TEXT,
    stripe_transfer_id TEXT,
    paid_at INTEGER,
    notes TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  db.exec("DROP TABLE IF EXISTS offers");
  db.exec(`CREATE TABLE offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id INTEGER NOT NULL,
    seller_id INTEGER,
    buyer_id INTEGER NOT NULL,
    amount TEXT NOT NULL,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  )`);
  db.exec("DROP TABLE IF EXISTS stripe_sessions");
  db.exec(`CREATE TABLE stripe_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL UNIQUE,
    user_id INTEGER,
    listing_id INTEGER NOT NULL,
    amount TEXT NOT NULL,
    commission TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    metadata TEXT,
    created_at INTEGER NOT NULL
  )`);
  db.exec("DROP TABLE IF EXISTS rate_limit_counters");
  db.exec(`CREATE TABLE rate_limit_counters (
    bucket TEXT NOT NULL,
    window_start INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (bucket, window_start)
  )`);
  setDb(db);
});

describe("admin allowlist", () => {
  it("keeps the two owners even when clerk_email is empty and email_verified is unset", () => {
    expect(isProvisionedAdmin({
      email: "DakotaVanalstyne318@gmail.com",
      role: "admin",
      email_verified: 0,
      clerk_email: "",
    })).toBe(true);
    expect(isProvisionedAdmin({
      email: "ratchetkrewelabs@gmail.com",
      role: "admin",
      clerkEmail: "",
    })).toBe(true);
  });

  it("does not treat an unverified signup or a foreign role=admin row as admin", () => {
    expect(isProvisionedAdmin({ email: "ratchetkrewelabs@gmail.com", role: "user", email_verified: 0 })).toBe(false);
    expect(isProvisionedAdmin({ email: "other@example.com", role: "admin", email_verified: 1, clerk_email: "ratchetkrewelabs@gmail.com" })).toBe(false);
  });

  it("does not grant admin at registration", async () => {
    const api = caller(undefined, "203.0.113.21");
    await api.localAuth.register({
      name: "Owner",
      email: "ratchetkrewelabs@gmail.com",
      password: "Str0ng!Pass",
    });
    const { getDb } = await import("./queries/connection");
    const [row] = await getDb().select().from(users);
    expect(row?.role).toBe("user");
    expect(row?.email_verified).toBe(0);
    await expect(api.admin.stats()).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("password reset tokens", () => {
  it("stores a hash, ignores a different unexpired token, and is single-use", async () => {
    const { getDb } = await import("./queries/connection");
    const database = getDb();
    const inserted = await database.insert(users).values({
      name: "Buyer",
      email: "buyer@example.com",
      password: "old",
      role: "user",
      email_verified: 0,
    });
    const userId = Number(inserted.meta.last_row_id);
    const token = "ab".repeat(32);
    const other = "cd".repeat(32);
    const now = Math.floor(Date.now() / 1000);
    await database.insert(passwordResetTokens).values({
      userId,
      tokenHash: await hashToken(token),
      expiresAt: now + 3600,
    });
    await database.insert(passwordResetTokens).values({
      userId,
      tokenHash: await hashToken(other),
      expiresAt: now + 3600,
    });
    const api = caller(undefined, "203.0.113.22");
    await expect(api.passwordReset.resetPassword({
      token: "ef".repeat(32),
      newPassword: "N3w!Password",
    })).rejects.toBeInstanceOf(TRPCError);
    const [still] = await database.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, await hashToken(token)));
    expect(still?.usedAt).toBeNull();
    expect(still?.tokenHash).not.toBe(token);
    await api.passwordReset.resetPassword({ token, newPassword: "N3w!Password" });
    await expect(api.passwordReset.resetPassword({ token, newPassword: "An0ther!Pass" })).rejects.toBeInstanceOf(TRPCError);
    const [used] = await database.select().from(passwordResetTokens).where(eq(passwordResetTokens.tokenHash, await hashToken(other)));
    expect(used?.usedAt).toBeNull();
  });
});

describe("checkout integrity", () => {
  it("prices orders from the listing and rejects buyer-marked payment", async () => {
    const { getDb } = await import("./queries/connection");
    const database = getDb();
    await database.insert(users).values({ name: "Seller", email: "seller@example.com", role: "user" });
    const buyer = await database.insert(users).values({ name: "Buyer", email: "buyer2@example.com", role: "user" });
    const buyerId = Number(buyer.meta.last_row_id);
    const listing = await database.insert(listings).values({
      title: "Watch",
      categoryId: 1,
      sellerId: 1,
      price: "10000.00",
      commissionRate: "5.00",
      status: "active",
      images: JSON.stringify(["https://example.com/a.jpg"]),
      features: JSON.stringify(["box"]),
    });
    const api = caller({ id: buyerId, email: "buyer2@example.com", role: "user", email_verified: 0 } as TrpcContext["user"], "203.0.113.23");
    const created = await api.orders.create({
      listingId: Number(listing.meta.last_row_id),
      listingTitle: "Tampered",
      amount: 0.5,
      commission: 0,
    });
    const [order] = await database.select().from(orders).where(eq(orders.id, created.id));
    expect(order?.amount).toBe("10000.00");
    expect(order?.paymentStatus).toBe("pending");
    expect(order?.listingTitle).toBe("Watch");
    await expect(api.orders.updateStatus({ orderId: created.id, paymentStatus: "completed" })).rejects.toBeInstanceOf(TRPCError);
  });

  it("ignores a buyer-supplied Stripe price", async () => {
    const { getDb } = await import("./queries/connection");
    const database = getDb();
    await database.insert(users).values({ name: "Seller", email: "seller3@example.com", role: "user" });
    const buyer = await database.insert(users).values({ name: "Buyer", email: "buyer3@example.com", role: "user" });
    const listing = await database.insert(listings).values({
      title: "Coin",
      categoryId: 1,
      sellerId: 1,
      price: "10000",
      commissionRate: "5.00",
      status: "active",
    });
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => {
      const params = new URLSearchParams(String(init?.body ?? ""));
      expect(params.get("line_items[0][price_data][unit_amount]")).toBe("1000000");
      return new Response(JSON.stringify({ id: "cs_test", url: "https://checkout.stripe.com/c/pay/cs_test", metadata: {} }), { status: 200 });
    });
    vi.stubGlobal("fetch", fetchMock);
    const api = caller({ id: Number(buyer.meta.last_row_id), email: "buyer3@example.com", role: "user", email_verified: 0 } as TrpcContext["user"], "203.0.113.24");
    await api.stripe.createSession({
      listingId: Number(listing.meta.last_row_id),
      successUrl: "https://thevaultdfw.win/orders",
      cancelUrl: "https://thevaultdfw.win/cart",
      offerPrice: 0.01,
    });
    vi.unstubAllGlobals();
  });
});

describe("payment parsers and quotes", () => {
  it("accepts SPL transfer and transferChecked to the treasury token account", () => {
    const expected = { buyer: "BuyerWallet", treasuryTokenAccount: "TreasuryAta", mint: "Mint", rawAmount: 100 };
    expect(splTransferMatches({
      program: "spl-token",
      parsed: { type: "transfer", info: { authority: "BuyerWallet", destination: "TreasuryAta", amount: "100" } },
    }, expected)).toBe(true);
    expect(splTransferMatches({
      program: "spl-token",
      parsed: { type: "transferChecked", info: { authority: "BuyerWallet", destination: "TreasuryAta", mint: "Mint", tokenAmount: { amount: "100" } } },
    }, expected)).toBe(true);
    expect(splTransferMatches({
      program: "spl-token",
      parsed: { type: "transfer", info: { authority: "SomeoneElse", destination: "TreasuryWallet", mint: "Mint", amount: "100" } },
    }, expected)).toBe(false);
  });

  it("requires the buyer to be the SOL transfer source", () => {
    expect(solTransferMatches({
      program: "system",
      parsed: { type: "transfer", info: { source: "Buyer", destination: "Treasury", lamports: 10 } },
    }, { buyer: "Buyer", treasuryWallet: "Treasury", lamports: 10 })).toBe(true);
    expect(solTransferMatches({
      program: "system",
      parsed: { type: "transfer", info: { source: "Other", destination: "Treasury", lamports: 10 } },
    }, { buyer: "Buyer", treasuryWallet: "Treasury", lamports: 10 })).toBe(false);
  });

  it("rejects an unrelated paid Checkout Session", () => {
    const result = premiumSessionMatches({
      payment_status: "paid",
      amount_total: 2900,
      currency: "usd",
      metadata: { premiumType: "appraisal", targetId: "9", userId: "4" },
    }, { type: "appraisal", targetId: 3, userId: 4, amountCents: 2900 });
    expect(result.ok).toBe(false);
  });

  it("falls back to the configured SOL rate when the live feed fails", async () => {
    setSolPriceFetcher(async () => {
      throw new Error("feed down");
    });
    clearSolPriceCache();
    const quote = await getFreshSolUsd();
    expect(quote.usd).toBe(69.52);
    expect(quote.source).toBe("configured_fallback");
    setSolPriceFetcher(null);
  });
});

describe("secrets and rate limits", () => {
  it("does not publish secret-shaped Vite values", () => {
    expect(publicPublishableKey("pk_live_123")).toBe("pk_live_123");
    expect(publicPublishableKey("sk_live_123")).toBe("");
    expect(publicPublishableKey("pk_live_secret_key")).toBe("");
  });

  it("strips the treasury secret from error text", () => {
    const secret = "base58secretvalue";
    expect(redactSecret(`mint failed ${secret}`, secret)).toBe("mint failed [redacted]");
    expect(redactSecret("mint failed", secret)).not.toContain(secret);
  });

  it("enforces the auth limit from the D1 counter", async () => {
    const req = new Request("https://thevaultdfw.win/api/trpc/localAuth.login", {
      headers: { "cf-connecting-ip": "198.51.100.8" },
    });
    for (let i = 0; i < 5; i++) await assertSensitiveLimit(req, "auth");
    await expect(assertSensitiveLimit(req, "auth")).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
  });
});
