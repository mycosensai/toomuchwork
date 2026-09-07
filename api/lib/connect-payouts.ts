/**
 * connect-payouts.ts — Stripe Connect seller payouts.
 *
 * Marketplace model: buyers pay The Vault (platform) → seller gets paid out
 * from platform funds via a Connect TRANSFER to the seller's connected account.
 * Sellers onboard through Stripe-hosted Connect onboarding (bank account + KYC).
 *
 * Flow:
 *  1. seller.payoutOnboarding → create Account (if none) + Account Link →
 *     seller completes onboarding on Stripe-hosted page
 *  2. seller.payoutStatus → checks account (transfers_enabled) → verified flag
 *  3. webhook/order-complete → initiateTransfer → POST /v1/transfers →
 *     money moves from platform balance to seller account → mark paid
 *
 * Uses the platform's own sk_live key (no Connect key needed for transfers
 * from the platform's own balance).
 */
import { env } from "./env";

const STRIPE_API = "https://api.stripe.com/v1";

async function stripeFetch(endpoint: string, body?: URLSearchParams, method = "POST"): Promise<any> {
  if (!env.stripeSecretKey) throw new Error("Stripe not configured");
  const res = await fetch(`${STRIPE_API}${endpoint}`, {
    method: body ? method : "GET",
    headers: {
      Authorization: `Bearer ${env.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body?.toString(),
  });
  if (!res.ok) {
    const err = await res.text();
    let msg = err;
    try { msg = JSON.parse(err).error?.message || err; } catch { /* keep raw */ }
    throw new Error(`Stripe API error: ${msg}`);
  }
  return res.json();
}

/**
 * Ensure the seller has a Connect account (create on first use) and return an
 * Account Link URL for them to complete Stripe-hosted onboarding.
 */
export async function createSellerConnectAccount(opts: {
  sellerId: number;
  email: string;
  /** Full URL the seller returns to after onboarding. */
  returnUrl: string;
  /** Full URL if they abandon onboarding. */
  refreshUrl: string;
}): Promise<{ accountId: string; url: string | null }> {
  // Existing account?
  const accountBody = new URLSearchParams();
  accountBody.set("limit", "100");
  const existing = await stripeFetch("/accounts", accountBody, "GET");
  const match = (existing?.data || []).find(
    (a: any) => a.email?.toLowerCase() === opts.email.toLowerCase()
  );
  let accountId = match?.id || "";

  if (!accountId) {
    const create = await stripeFetch("/accounts", new URLSearchParams({
      type: "express",
      country: "US",
      email: opts.email,
      "capabilities[transfers][]": "1",
    }));
    accountId = create.id;
  }

  const link = await stripeFetch("/account_links", new URLSearchParams({
    account: accountId,
    refresh_url: opts.refreshUrl,
    return_url: opts.returnUrl,
    type: "account_onboarding",
  }));

  return { accountId, url: link.url || null };
}

/**
 * Fetch the seller's Connect account and report whether transfers are enabled
 * (i.e. onboarding + bank details + KYC completed).
 */
export async function getSellerConnectStatus(accountId: string): Promise<{
  transfersEnabled: boolean;
  chargesEnabled: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
}> {
  const acct = await stripeFetch(`/accounts/${accountId}`, undefined, "GET");
  const caps = acct.capabilities || {};
  return {
    transfersEnabled: caps.transfers === "active",
    chargesEnabled: caps.card_payments === "active",
    detailsSubmitted: !!acct.details_submitted,
    payoutsEnabled: !!acct.payouts_enabled,
  };
}

/**
 * Move money from the platform balance to the seller's Connect account.
 * amountCents is the FULL sale proceeds; the platform's commission stays in
 * the platform balance automatically (only the transferred amount leaves).
 * Must be <= available platform balance.
 */
export async function createSellerTransfer(opts: {
  accountId: string;
  amountCents: number;
  currency?: string;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ transferId: string; status: string }> {
  const body = new URLSearchParams({
    amount: String(opts.amountCents),
    currency: opts.currency || "usd",
    destination: opts.accountId,
    description: opts.description,
  });
  for (const [k, v] of Object.entries(opts.metadata || {})) {
    body.set(`metadata[${k}]`, v);
  }
  const transfer = await stripeFetch("/transfers", body);
  return { transferId: transfer.id, status: transfer.status };
}

/**
 * Auto-transfer helper used by the webhook when an order reaches 'delivered'.
 * Best-effort: returns {transferred:false, reason} instead of throwing when
 * the seller isn't onboarded or the amount is not positive, so a delivery
 * webhook never fails because a payout couldn't be made.
 */
export async function autoTransferForOrder(opts: {
  sellerStripeAccountId: string | null | undefined;
  amountCents: number;
  description: string;
  metadata?: Record<string, string>;
}): Promise<{ transferred: boolean; transferId?: string; reason?: string }> {
  if (!opts.sellerStripeAccountId) return { transferred: false, reason: "seller_not_onboarded" };
  if (!(opts.amountCents > 0)) return { transferred: false, reason: "non_positive_amount" };
  try {
    const { transferId } = await createSellerTransfer({
      accountId: opts.sellerStripeAccountId,
      amountCents: opts.amountCents,
      description: opts.description,
      metadata: opts.metadata,
    });
    return { transferred: true, transferId };
  } catch (e: any) {
    return { transferred: false, reason: `stripe_error:${e?.message || "unknown"}` };
  }
}
