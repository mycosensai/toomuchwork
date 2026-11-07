/**
 * payout-router.ts — seller payout endpoints (Stripe Connect).
 *
 *   payout.onboarding  (authed)  — create/fetch seller Connect account + account link
 *   payout.status      (authed)  — is the seller's account verified for transfers?
 *   payout.initiateTransfer (authed) — transfer an ORDER's payoutAmount to the seller
 *
 * Sellers must complete Stripe-hosted Connect onboarding before transfers can
 * be initiated. Transfers move money from the platform balance to the seller's
 * account — the platform commission stays put automatically.
 */
import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { isProvisionedAdmin } from "./lib/admin-access";
import { getDb } from "./queries/connection";
import { eq, and, desc, inArray } from "drizzle-orm";
import { orders, sellerPayouts, users } from "@db/schema";
import { logAudit, getClientIP } from "./security";
import { notifyTelegram } from "./lib/telegram";
import { createSellerConnectAccount, getSellerConnectStatus, createSellerTransfer } from "./lib/connect-payouts";

export const payoutRouter = createRouter({
  /** Seller begins / resumes Connect onboarding. Returns a Stripe-hosted URL. */
  onboarding: authedQuery.mutation(async ({ ctx }) => {
    const db = getDb();
    const seller = ctx.user!;
    const email = seller.email || "";

    const { accountId, url } = await createSellerConnectAccount({
      sellerId: seller.id,
      email,
      returnUrl: `https://thevaultdfw.win/sell?payout=done`,
      refreshUrl: `https://thevaultdfw.win/sell?payout=refresh`,
      existingAccountId: seller.stripeAccountId,
    });

    await db.update(users).set({
      stripeAccountId: accountId,
      updatedAt: new Date(),
    }).where(eq(users.id, seller.id));

    logAudit({
      ip: getClientIP(ctx.req),
      method: "POST",
      path: "payout.onboarding",
      userId: seller.id,
      action: "seller_payout_onboarding_started",
      details: `account:${accountId}`,
    });

    return { success: true, accountId, url };
  }),

  /** Seller payout status — transfers enabled? */
  status: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const seller = ctx.user!;
    if (!seller.stripeAccountId) {
      return { onboarded: false, transfersEnabled: false, message: "Not onboarded yet." };
    }
    const status = await getSellerConnectStatus(seller.stripeAccountId);
    const verified = status.transfersEnabled;
    // Persist verified flag so future calls are cheap
    await db.update(users).set({
      stripeAccountVerified: verified,
      updatedAt: new Date(),
    }).where(eq(users.id, seller.id));
    return {
      onboarded: true,
      transfersEnabled: verified,
      chargesEnabled: status.chargesEnabled,
      detailsSubmitted: status.detailsSubmitted,
      payoutsEnabled: status.payoutsEnabled,
    };
  }),

  /**
   * Orders with payout_status='pending' for the current seller (sold/delivered
   * but money not yet transferred). The panel lists these with a claim button.
   */
  pendingOrders: authedQuery.query(async ({ ctx }) => {
    const db = getDb();
    const seller = ctx.user!;
    const rows = await db
      .select()
      .from(orders)
      .where(and(eq(orders.sellerId, seller.id), eq(orders.payoutStatus, "pending")))
      .orderBy(desc(orders.createdAt))
      .limit(50);
    return rows.map((o) => ({
      id: o.id,
      listingTitle: o.listingTitle,
      payoutAmount: o.payoutAmount,
      orderStatus: o.orderStatus,
      createdAt: o.createdAt,
      paid: o.payoutStatus === "paid",
    }));
  }),

  /**
   * Initiate a real payout (Connect transfer) for a completed order.
   * The platform commission stays in the platform balance automatically —
   * only the seller's payoutAmount moves.
   */
  initiateTransfer: authedQuery
    .input(z.object({ orderId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const seller = ctx.user!;

      const [order] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
      if (!order) throw new Error("Order not found");
      if (order.sellerId !== seller.id && !isProvisionedAdmin(seller)) {
        throw new Error("Unauthorized");
      }
      if (!order.sellerId) throw new Error("Order has no seller");
      if (order.payoutStatus === "paid") {
        return { success: true, alreadyPaid: true, transferId: order.stripeTransferId };
      }
      if (order.paymentStatus !== "completed") throw new Error("Payout requires a settled payment");
      if (order.orderStatus !== "delivered" && order.orderStatus !== "completed") {
        throw new Error("Payout requires a delivered order");
      }

      const [sellerUser] = await db.select().from(users).where(eq(users.id, order.sellerId)).limit(1);
      const accountId = sellerUser?.stripeAccountId;
      if (!accountId) throw new Error("Complete payout onboarding first (payout.onboarding)");

      const claim = await db.update(orders).set({
        payoutStatus: "processing",
        updatedAt: new Date(),
      }).where(and(
        eq(orders.id, order.id),
        eq(orders.payoutStatus, "pending"),
        eq(orders.paymentStatus, "completed"),
        inArray(orders.orderStatus, ["delivered", "completed"]),
      ));
      if (!Number(claim.meta?.changes ?? 0)) {
        throw new Error("Payout is not eligible or is already in progress");
      }

      const status = await getSellerConnectStatus(accountId);
      if (!status.transfersEnabled) {
        await db.update(orders).set({ payoutStatus: "pending", updatedAt: new Date() }).where(eq(orders.id, order.id));
        throw new Error("Seller account not verified for transfers — finish onboarding.");
      }

      const amountCents = Math.round(Number(order.payoutAmount || "0") * 100);
      if (!(amountCents > 0)) {
        await db.update(orders).set({ payoutStatus: "pending", updatedAt: new Date() }).where(eq(orders.id, order.id));
        throw new Error("Payout amount must be positive");
      }

      let transferId = "";
      try {
        const transfer = await createSellerTransfer({
          accountId,
          amountCents,
          description: `The Vault DFW payout — order #${order.id} (${order.listingTitle})`,
          metadata: { orderId: String(order.id), listingId: String(order.listingId) },
          idempotencyKey: `vault-payout-order-${order.id}`,
        });
        transferId = transfer.transferId;
      } catch (error) {
        await db.update(orders).set({ payoutStatus: "pending", updatedAt: new Date() }).where(and(eq(orders.id, order.id), eq(orders.payoutStatus, "processing")));
        throw error;
      }

      await db.update(orders).set({
        payoutStatus: "paid",
        stripeTransferId: transferId,
        paidAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(orders.id, input.orderId));

      // Mirror into seller_payouts ledger (best-effort; table may not have a row yet)
      try {
        await db.insert(sellerPayouts).values({
          sellerId: order.sellerId,
          saleTransactionId: order.listingId,
          amount: String(amountCents / 100),
          stripeTransferId: transferId,
          status: "paid",
          method: "stripe_transfer",
          paidAt: new Date(),
        });
      } catch { /* ledger is advisory; order row is source of truth */ }

      await notifyTelegram("💸 PAYOUT SENT", {
        "Order ID": String(input.orderId),
        "Amount": `$${(amountCents / 100).toFixed(2)}`,
        "Transfer": transferId,
      });
      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "payout.initiateTransfer",
        userId: seller.id,
        action: "seller_payout_transferred",
        details: `order:${input.orderId} transfer:${transferId} amount:${amountCents / 100}`,
      });

      return { success: true, transferId, amount: (amountCents / 100).toFixed(2) };
    }),
});
