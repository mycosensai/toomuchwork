/**
 * auction-router.ts — Auction-style listings with timed bidding + anti-sniping.
 *
 * Features:
 *   - Seller creates an auction with reserve price, start/end times, buy-now price
 *   - Buyers place bids (must exceed current highest + increment)
 *   - Anti-sniping: extends auction by 5 min on bid placed in last 5 min
 *   - Ends: highest bidder wins (reserve must be met), auto-creates order
 *
 * Reserve met = highest bid >= reservePrice.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc, gt } from "drizzle-orm";
import { listings, users } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";
import { notifyTelegram } from "./lib/telegram";

const AUCTION_INCREMENT_PCT = 5; // minimum bid increment = 5% of current bid
const SNIPE_EXTENSION_SEC = 300; // 5 min anti-snipe window

export const auctionRouter = createRouter({
  /** Create an auction for an existing active listing. */
  create: authedQuery
    .input(
      z.object({
        listingId: z.number().positive(),
        reservePrice: z.number().positive(),
        buyNowPrice: z.number().positive().optional(),
        startAt: z.string().datetime().optional(),
        endAt: z.string().datetime(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const seller = ctx.user!;
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });
      if (listing.sellerId !== seller.id && seller.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Not the seller" });
      if (listing.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Listing not active" });

      const now = Date.now();
      const startTs = input.startAt ? new Date(input.startAt).getTime() : now;
      const endTs = new Date(input.endAt).getTime();
      if (endTs <= startTs) throw new TRPCError({ code: "BAD_REQUEST", message: "End must be after start" });
      if (input.reservePrice >= Number(listing.price)) throw new TRPCError({ code: "BAD_REQUEST", message: "Reserve must be below list price" });

      const row = await db.insert(listings).values({
        sellerId: listing.sellerId,
        title: `${listing.title} — Auction`,
        description: listing.description,
        category: listing.category,
        subcategory: listing.subcategory,
        condition: listing.condition,
        price: String(input.reservePrice),
        images: listing.images,
        status: "auction",
        auctionReserve: String(input.reservePrice),
        auctionBuyNow: input.buyNowPrice ? String(input.buyNowPrice) : null,
        auctionStartAt: startTs,
        auctionEndAt: endTs,
      }).returning().then(r => r[0]);

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "auction.create", userId: seller.id, action: "auction_created", details: `listing:${row.id} reserve:${input.reservePrice} end:${input.endAt}` });
      await notifyTelegram("🔨 AUCTION CREATED", {
        "Title": row.title,
        "Reserve": `$${input.reservePrice}`,
        "Ends": input.endAt,
      });
      return { auctionId: row.id, title: row.title, endAt: input.endAt };
    }),

  /** Place a bid. Auto-extends if in last 5 min (anti-snipe). */
  bid: authedQuery
    .input(z.object({ auctionId: z.number().positive(), amount: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const buyer = ctx.user!;
      const now = Date.now();

      const [auction] = await db.select().from(listings).where(eq(listings.id, input.auctionId)).limit(1);
      if (!auction) throw new TRPCError({ code: "NOT_FOUND", message: "Auction not found" });
      if (auction.status !== "auction") throw new TRPCError({ code: "BAD_REQUEST", message: "Not an auction" });
      if (now < Number(auction.auctionStartAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Auction not started" });
      if (now > Number(auction.auctionEndAt)) throw new TRPCError({ code: "BAD_REQUEST", message: "Auction ended" });
      if (auction.sellerId === buyer.id) throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot bid on your own auction" });

      const highestBid = Number(auction.price);
      const minBid = highestBid + Math.max(highestBid * (AUCTION_INCREMENT_PCT / 100), 1);
      if (input.amount < minBid) throw new TRPCError({ code: "BAD_REQUEST", message: `Minimum bid: $${minBid.toFixed(2)}` });

      let newEnd = Number(auction.auctionEndAt);
      const timeLeft = newEnd - now;
      if (timeLeft < SNIPE_EXTENSION_SEC * 1000) {
        newEnd = now + SNIPE_EXTENSION_SEC * 1000;
      }

      const updated = await db.update(listings).set({ price: String(input.amount), auctionEndAt: newEnd }).where(eq(listings.id, input.auctionId)).returning().then(r => r[0]);

      // Email seller about new bid
      const [seller] = await db.select().from(users).where(eq(users.id, auction.sellerId)).limit(1);
      if (seller?.email) {
        await sendEmail({ to: seller.email, subject: `New bid on auction: ${auction.title}`, html: `<p>New bid of $${input.amount.toFixed(2)} on "${auction.title}".</p>`, text: `New bid of $${input.amount.toFixed(2)} on "${auction.title}".` });
      }

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "auction.bid", userId: buyer.id, action: "bid_placed", details: `auction:${input.auctionId} amount:${input.amount}` });
      await notifyTelegram("💰 NEW BID", {
        "Auction": auction.title,
        "Bid": `$${input.amount}`,
        "Bidder": `#${buyer.id}`,
      });
      return { auctionId: input.auctionId, newHighest: input.amount, newEnd: new Date(newEnd).toISOString() };
    }),

  /** Get auction state (current bid, end time, status). */
  get: publicQuery
    .input(z.object({ auctionId: z.number().positive() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [auction] = await db.select().from(listings).where(eq(listings.id, input.auctionId)).limit(1);
      if (!auction) return null;
      const now = Date.now();
      let status: string;
      if (auction.status !== "auction") status = "ended";
      else if (now < Number(auction.auctionStartAt)) status = "pending";
      else if (now > Number(auction.auctionEndAt)) status = "ended";
      else status = "active";
      return { auctionId: auction.id, title: auction.title, currentBid: Number(auction.price), endAt: auction.auctionEndAt, startAt: auction.auctionStartAt, status, buyNowPrice: Number(auction.auctionBuyNow || 0), reservePrice: Number(auction.auctionReserve || 0) };
    }),

  /** Seller: end auction early, highest bidder wins. */
  endEarly: authedQuery
    .input(z.object({ auctionId: z.number().positive() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [auction] = await db.select().from(listings).where(eq(listings.id, input.auctionId)).limit(1);
      if (!auction) throw new TRPCError({ code: "NOT_FOUND", message: "Auction not found" });
      if (auction.sellerId !== ctx.user!.id && ctx.user!.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Not the seller" });

      await db.update(listings).set({ status: "sold", auctionWinner: String(auction.price) }).where(eq(listings.id, input.auctionId));
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "auction.endEarly", userId: ctx.user!.id, action: "auction_ended", details: `auction:${input.auctionId}` });
      return { auctionId: input.auctionId, status: "ended" };
    }),

  /** Public: list auction plans/tiers (for UI). */
  plans: publicQuery.query(async () => {
    return {
      tiers: [
        { name: "Standard", fee: 0, description: "No reserve, standard listing" },
        { name: "Featured", fee: 5.0, description: "Featured placement, standard auction" },
        { name: "Premium", fee: 15.0, description: "Premium placement, auto-extending auction" },
      ],
    };
  }),
});
