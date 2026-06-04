import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { listings, stripeSessions } from "@db/schema";
import { eq } from "drizzle-orm";
import { env } from "./lib/env";
import { logAudit, getClientIP } from "./security";
import Stripe from "stripe";

const stripe = env.stripeSecretKey
  ? new Stripe(env.stripeSecretKey, { apiVersion: "2026-03-25.dahlia" })
  : null;

/**
 * The Vault Stripe branding
 * Matches the site's obsidian/gold luxury aesthetic
 */
const VAULT_BRANDING = {
  display_name: "The Vault",
  font_family: "noto_serif" as const,
  border_style: "rounded" as const,
  background_color: "#080808",
  button_color: "#C9A84C",
};

export const stripeRouter = createRouter({
  createSession: authedQuery
    .input(
      z.object({
        listingId: z.number(),
        successUrl: z.string().url(),
        cancelUrl: z.string().url(),
        offerPrice: z.number().positive().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        throw new Error("Stripe is not configured");
      }

      const db = getDb();
      const [listing] = await db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) throw new Error("Listing not found");
      if (listing.status === "sold") throw new Error("Item already sold");

      const price = input.offerPrice || Number(listing.price);
      const commission = price * (Number(listing.commissionRate) / 100);

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: listing.title,
                description: listing.description?.substring(0, 500) || undefined,
                images: listing.images?.slice(0, 5) || undefined,
              },
              unit_amount: Math.round(price * 100),
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        branding_settings: {
          display_name: VAULT_BRANDING.display_name,
          font_family: VAULT_BRANDING.font_family,
          border_style: VAULT_BRANDING.border_style,
          background_color: VAULT_BRANDING.background_color,
          button_color: VAULT_BRANDING.button_color,
        },
        metadata: {
          listingId: String(listing.id),
          userId: ctx.user?.id ? String(ctx.user.id) : "guest",
          commission: String(commission),
        },
      });

      await db.insert(stripeSessions).values({
        sessionId: session.id,
        userId: ctx.user?.id || null,
        listingId: listing.id,
        amount: String(price),
        commission: String(commission),
        status: "pending",
        metadata: JSON.stringify(session.metadata || {}),
      });

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "stripe.createSession",
        userId: ctx.user?.id,
        action: "checkout_initiated",
        details: `listing:${listing.id} amount:${price}`,
      });

      return { sessionId: session.id, url: session.url };
    }),

  verifySession: publicQuery
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ input, ctx }) => {
      if (!stripe) {
        return { status: "unconfigured", session: null };
      }

      const session = await stripe.checkout.sessions.retrieve(input.sessionId);
      const db = getDb();

      if (session.payment_status === "paid") {
        await db
          .update(stripeSessions)
          .set({ status: "completed" })
          .where(eq(stripeSessions.sessionId, input.sessionId));

        const [sessRecord] = await db
          .select()
          .from(stripeSessions)
          .where(eq(stripeSessions.sessionId, input.sessionId))
          .limit(1);

        if (sessRecord) {
          await db
            .update(listings)
            .set({ status: "sold" })
            .where(eq(listings.id, sessRecord.listingId));

          logAudit({
            ip: getClientIP(ctx.req),
            method: "GET",
            path: "stripe.verifySession",
            action: "payment_verified",
            details: `listing:${sessRecord.listingId} session:${input.sessionId}`,
          });
        }
      }

      const [updatedRecord] = await db
        .select()
        .from(stripeSessions)
        .where(eq(stripeSessions.sessionId, input.sessionId))
        .limit(1);

      return {
        status: session.payment_status,
        amount_total: session.amount_total,
        session: updatedRecord || null,
      };
    }),

  getPublishableKey: publicQuery.query(() => {
    return { key: env.stripePublishableKey || "" };
  }),

  /**
   * SECURE Stripe webhook handler
   * Verifies webhook signature using Stripe's SDK before processing
   */
  handleWebhook: publicQuery
    .input(
      z.object({
        payload: z.string(),
        signature: z.string(),
        secret: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      if (!stripe) {
        return { status: "unconfigured" };
      }

      // Verify the webhook signature cryptographically
      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          input.payload,
          input.signature,
          input.secret
        );
      } catch (err) {
        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "stripe.handleWebhook",
          action: "webhook_rejected",
          details: `Invalid signature: ${err instanceof Error ? err.message : "unknown"}`,
        });
        throw new Error(
          `Webhook signature verification failed: ${err instanceof Error ? err.message : "unknown"}`
        );
      }

      // Only process checkout.session.completed events
      if (event.type !== "checkout.session.completed") {
        return { status: "ignored", type: event.type };
      }

      const session = event.data.object as Stripe.Checkout.Session;
      const db = getDb();

      // Update session status
      await db
        .update(stripeSessions)
        .set({ status: "completed" })
        .where(eq(stripeSessions.sessionId, session.id));

      // Mark listing as sold
      const [sessRecord] = await db
        .select()
        .from(stripeSessions)
        .where(eq(stripeSessions.sessionId, session.id))
        .limit(1);

      if (sessRecord) {
        await db
          .update(listings)
          .set({ status: "sold" })
          .where(eq(listings.id, sessRecord.listingId));

        logAudit({
          ip: getClientIP(ctx.req),
          method: "POST",
          path: "stripe.handleWebhook",
          action: "webhook_processed",
          details: `listing:${sessRecord.listingId} session:${session.id}`,
        });
      }

      return { status: "completed", message: "Payment verified and processed" };
    }),

  getBranding: publicQuery.query(() => {
    return {
      displayName: VAULT_BRANDING.display_name,
      backgroundColor: VAULT_BRANDING.background_color,
      buttonColor: VAULT_BRANDING.button_color,
      fontFamily: VAULT_BRANDING.font_family,
      borderStyle: VAULT_BRANDING.border_style,
    };
  }),
});
