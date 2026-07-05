import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { siteConfig, coldEmailTemplates, coldEmailProspects, coldEmailSends, users, forumPosts, messages } from "@db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { env } from "./lib/env";

export const siteConfigRouter = createRouter({
  // ─── Get all config ───
  list: adminQuery.query(async () => {
    const db = getDb();
    const configs = await db.select().from(siteConfig).orderBy(siteConfig.key);
    return configs;
  }),

  // ─── Get single config ───
  get: adminQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [config] = await db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, input.key))
        .limit(1);
      return config || null;
    }),

  // ─── Set config ───
  set: adminQuery
    .input(z.object({
      key: z.string().min(1).max(100),
      value: z.string(),
      description: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();

      const existing = await db
        .select()
        .from(siteConfig)
        .where(eq(siteConfig.key, input.key))
        .limit(1);

      if (existing[0]) {
        await db
          .update(siteConfig)
          .set({
            value: input.value,
            description: input.description || existing[0].description,
            updatedBy: ctx.user!.id,
            updatedAt: new Date(),
          })
          .where(eq(siteConfig.key, input.key));
      } else {
        await db.insert(siteConfig).values({
          key: input.key,
          value: input.value,
          description: input.description || null,
          updatedBy: ctx.user!.id,
        });
      }

      return { ok: true };
    }),

  // ─── Delete config ───
  delete: adminQuery
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(siteConfig).where(eq(siteConfig.key, input.key));
      return { ok: true };
    }),

  // ─── Email config (SMTP settings stored in config) ───
  emailConfig: adminQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(siteConfig).orderBy(siteConfig.key);
    return {
      smtpHost: all.find(c => c.key === "smtp_host")?.value || env.resendApiKey ? "resend" : "",
      smtpPort: all.find(c => c.key === "smtp_port")?.value || "587",
      smtpUser: all.find(c => c.key === "smtp_user")?.value || "",
      smtpPass: all.find(c => c.key === "smtp_pass")?.value ? "***SET***" : "",
      fromEmail: all.find(c => c.key === "from_email")?.value || "blakelaurent@thevaultdfw.win",
      fromName: all.find(c => c.key === "from_name")?.value || "The Vault DFW",
      resendConfigured: !!env.resendApiKey,
    };
  }),

  // ─── Dashboard stats (comprehensive) ───
  dashboard: adminQuery.query(async () => {
    const db = getDb();

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [forumCount] = await db.select({ count: sql<number>`count(*)` }).from(forumPosts);
    const [msgCount] = await db.select({ count: sql<number>`count(*)` }).from(messages);
    const [unreadMsgCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(eq(messages.isRead, false));
    const [emailPending] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coldEmailSends)
      .where(eq(coldEmailSends.status, "queued"));
    const [emailSent] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coldEmailSends)
      .where(eq(coldEmailSends.status, "sent"));

    return {
      users: Number(userCount?.count || 0),
      forumPosts: Number(forumCount?.count || 0),
      totalMessages: Number(msgCount?.count || 0),
      unreadMessages: Number(unreadMsgCount?.count || 0),
      emailQueued: Number(emailPending?.count || 0),
      emailSent: Number(emailSent?.count || 0),
    };
  }),
});
