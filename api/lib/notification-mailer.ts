/**
 * notification-mailer.ts — Reusable email/alert/notification pipeline.
 *
 * Single pipe used by ALL feature routers to:
 *   1. Push an in-app notification to the user's inbox (notifications table)
 *   2. Send an email via Resend (if configured)
 *   3. Optionally queue a push (web-push / telegram) for later
 *
 * This replaces scattered `sendEmail` + inline notification inserts in every router.
 */
import { env } from "../lib/env";
import { getDb } from "../queries/connection";
import { notifications, users } from "@db/schema";
import { eq } from "drizzle-orm";
import { sendEmail, EmailPayload } from "../email-service";

export interface NotificationOpts {
  userId: number;
  type: string;
  title: string;
  body?: string;
  link?: string;
  emailSubject?: string;
  emailHtml?: string;
  emailText?: string;
}

/**
 * Insert an in-app notification and optionally send email.
 * Returns the notification row id.
 */
export async function notify(opts: NotificationOpts): Promise<number> {
  const db = getDb();

  // Insert in-app notification
  const insert = await db.insert(notifications).values({
    userId: opts.userId,
    type: opts.type,
    title: opts.title,
    body: opts.body || null,
    link: opts.link || null,
    isRead: 0,
  });
  const notifId = Number(insert.meta.last_row_id);

  // Fetch user email for email delivery
  const [user] = await db.select().from(users).where(eq(users.id, opts.userId)).limit(1);
  const email = user?.email;

  // Send email if configured
  const emailSubject = opts.emailSubject || opts.title;
  const emailHtml = opts.emailHtml || `<p>${opts.body || opts.title}</p>`;
  const emailText = opts.emailText || `${opts.title}: ${opts.body || ""}`;

  if (email && env.resendApiKey) {
    await sendEmail({
      to: email,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    });
  } else if (email) {
    // Resend not configured; log the would-be email
    console.log(`[Notify] Email to ${email}: ${emailSubject}`);
  }

  return notifId;
}

/**
 * Convenience builders — pre-formatted notification payloads for common events.
 */
export const notifs = {
  offerReceived: (listingTitle: string, buyerName: string, amount: string, orderId: number) => ({
    type: "offer_received",
    title: `New offer on "${listingTitle}"`,
    body: `${buyerName} offered $${amount}`,
    link: `/orders`,
    emailSubject: `New offer on "${listingTitle}"`,
  }),
  offerAccepted: (listingTitle: string, amount: string, orderId: number) => ({
    type: "offer_accepted",
    title: `Offer accepted on "${listingTitle}"`,
    body: `Your ${amount} offer was accepted!`,
    link: `/orders`,
    emailSubject: `Offer accepted on "${listingTitle}"`,
  }),
  offerDeclined: (listingTitle: string, orderId: number) => ({
    type: "offer_declined",
    title: `Offer declined on "${listingTitle}"`,
    body: `Your offer on "${listingTitle}" was declined.`,
    link: `/orders`,
    emailSubject: `Offer declined on "${listingTitle}"`,
  }),
  payoutReady: (amount: string, orderId: number) => ({
    type: "payout_ready",
    title: `Payout ready!`,
    body: `$${amount} is ready to transfer to your bank.`,
    link: `/sale`,
    emailSubject: `Payout ready — $${amount}`,
  }),
  payoutSent: (amount: string, transferId: string, orderId: number) => ({
    type: "payout_sent",
    title: `Payout sent!`,
    body: `$${amount} transferred (ID: ${transferId}). Funds should arrive in 1-2 business days.`,
    link: `/sale`,
    emailSubject: `Payout sent — $${amount}`,
  }),
  bidPlaced: (listingTitle: string, amount: string, auctionId: number) => ({
    type: "bid_placed",
    title: `New bid on "${listingTitle}"`,
    body: `A bid of $${amount} was placed on your auction.`,
    link: `/sale`,
    emailSubject: `New bid on "${listingTitle}"`,
  }),
  auctionEnded: (listingTitle: string, amount: string, auctionId: number) => ({
    type: "auction_ended",
    title: `Auction ended: "${listingTitle}"`,
    body: `Highest bid: $${amount}. Check your dashboard for next steps.`,
    link: `/sale`,
    emailSubject: `Auction ended: "${listingTitle}"`,
  }),
  priceAlertTriggered: (listingTitle: string, targetPrice: string, direction: string) => ({
    type: "price_alert",
    title: `Price alert triggered!`,
    body: `"${listingTitle}" is now ${direction} $${targetPrice}.`,
    link: `/listing`,
    emailSubject: `Price alert: "${listingTitle}"`,
  }),
  membershipTier: (rank: string, name: string) => ({
    type: "membership_tier",
    title: `Welcome, ${rank}!`,
    body: `You've reached the ${rank} tier with ${name}!`,
    link: `/profile`,
    emailSubject: `You're now a ${rank}!`,
  }),
  reviewPosted: (listingTitle: string, rating: number) => ({
    type: "review_posted",
    title: `Review posted on "${listingTitle}"`,
    body: `You gave ${rating}/5 stars.`,
    link: `/listing`,
    emailSubject: `Review posted on "${listingTitle}"`,
  }),
};
