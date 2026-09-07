/**
 * reviews-router.ts — Enhanced reviews with helpful, images, verified-purchase flag.
 *
 * Existing `reviews` table already has rating/title/comment/helpfulCount.
 * This router adds: image_url, isVerifiedPurchase (auto-true if buyer),
 * and a seller-response field.
 */
import { z } from "zod";
import { createRouter, authedQuery, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { eq, desc } from "drizzle-orm";
import { reviews, orders, listings } from "@db/schema";
import { sendEmail } from "./email-service";
import { TRPCError } from "@trpc/server";
import { logAudit, getClientIP } from "./security";

export const reviewsRouter = createRouter({
  /** Create review — auto-verifies purchase. */
  create: authedQuery
    .input(
      z.object({
        listingId: z.number().positive(),
        rating: z.number().min(1).max(5),
        title: z.string().max(200).optional(),
        comment: z.string().max(5000),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const buyer = ctx.user!;

      // Verify purchase (buyer of this listing)
      const [order] = await db.select().from(orders).where(eq(orders.userId, buyer.id)).where(eq(orders.listingId, input.listingId)).where(eq(orders.orderStatus, "completed")).limit(1);
      const isVerified = !!order;

      const insert = await db.insert(reviews).values({
        userId: buyer.id,
        listingId: input.listingId,
        rating: input.rating,
        title: input.title || null,
        comment: input.comment,
        imageUrl: input.imageUrl || null,
        isVerifiedPurchase: isVerified,
      });
      const reviewId = Number(insert.meta.last_row_id);

      // Notify seller
      const [listing] = await db.select().from(listings).where(eq(listings.id, input.listingId)).limit(1);
      const [seller] = await db.select().from(users).where(eq(users.id, listing.sellerId)).limit(1);
      if (seller?.email) {
        await sendEmail({ to: seller.email, subject: `New review on "${listing.title}"`, html: `<p>${buyer.name} rated ${input.rating}/5: ${input.comment}</p>`, text: `${buyer.name} rated ${input.rating}/5: ${input.comment}` });
      }

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "reviews.create", userId: buyer.id, action: "review_created", details: `listing:${input.listingId}` });
      return { id: reviewId, isVerifiedPurchase: isVerified };
    }),

  /** Add a seller response to a review. */
  respond: authedQuery
    .input(z.object({ reviewId: z.number().positive(), response: z.string().max(2000) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [review] = await db.select().from(reviews).where(eq(reviews.id, input.reviewId)).limit(1);
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "Review not found" });
      if (review.userId && review.userId !== ctx.user!.id && ctx.user!.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Not the seller" });
      await db.update(reviews).set({ sellerResponse: input.response }).where(eq(reviews.id, input.reviewId));
      return { reviewId: input.reviewId };
    }),
});
