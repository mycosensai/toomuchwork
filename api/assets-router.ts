/**
 * R2 Assets Router — Cloudflare R2 image/file storage
 * Provides upload, serve, and delete endpoints for user-uploaded content
 */
import { z } from "zod";
import { createRouter, authedQuery, adminQuery } from "./middleware";
import { env } from "./lib/env";

export const assetsRouter = createRouter({
  // ─── Upload file to R2 ───
  upload: authedQuery
    .input(z.object({
      filename: z.string().min(1).max(255),
      contentType: z.string().min(1),
      base64Data: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const bucket = env.r2Assets;
      if (!bucket) throw new Error("R2 storage not configured");

      const timestamp = Date.now();
      const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const key = `uploads/${ctx.user!.id}/${timestamp}_${safeName}`;

      const binary = Uint8Array.from(atob(input.base64Data), c => c.charCodeAt(0));

      await bucket.put(key, binary, {
        httpMetadata: { contentType: input.contentType },
        customMetadata: {
          uploadedBy: String(ctx.user!.id),
          uploadedAt: new Date().toISOString(),
        },
      });

      // Return the public URL
      const publicUrl = `https://thevaultdfw.win/assets/${key}`;

      return { ok: true, key, url: publicUrl };
    }),

  // ─── Delete file from R2 ───
  delete: adminQuery
    .input(z.object({ key: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const bucket = env.r2Assets;
      if (!bucket) throw new Error("R2 storage not configured");
      await bucket.delete(input.key);
      return { ok: true };
    }),

  // ─── List files in a directory ───
  list: adminQuery
    .input(z.object({ prefix: z.string().default("uploads/"), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      const bucket = env.r2Assets;
      if (!bucket) throw new Error("R2 storage not configured");

      const objects = await bucket.list({
        prefix: input.prefix,
        limit: input.limit,
      });

      return {
        objects: objects.objects.map(o => ({
          key: o.key,
          size: o.size,
          uploaded: o.uploaded,
          contentType: o.httpMetadata?.contentType,
        })),
        truncated: objects.truncated,
        cursor: objects.cursor,
      };
    }),
});
