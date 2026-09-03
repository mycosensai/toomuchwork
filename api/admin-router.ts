import { z } from "zod";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { users, listings, appraisals, stripeSessions, aiAgentLogs, agentProjects, agentTasks, agentCycles, agentFleetState, agentLogs, sellerPayouts, orders } from "@db/schema";
import { desc, sql, eq, and } from "drizzle-orm";
import {
  logAudit, getClientIP
} from "./security";
import { env } from "./lib/env";

function requireAdmin(ctx: any) {
  const email = ctx.user?.email?.toLowerCase();
  if (!email) {
    throw new Error("Authentication context missing email");
  }

  const allowed = env.adminEmails;
  if (!allowed.includes(email)) {
    logAudit({
      ip: getClientIP(ctx.req),
      method: "GET",
      path: "admin.forbidden",
      userId: ctx.user?.id,
      action: "admin_access_denied",
      details: `email:${email}`,
    });
    throw new Error("Forbidden");
  }
}

export const adminRouter = createRouter({
  stats: adminQuery.query(async ({ ctx }) => {
    requireAdmin(ctx);
    const db = getDb();

    const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
    const [listingCount] = await db.select({ count: sql<number>`count(*)` }).from(listings);
    const [appraisalCount] = await db.select({ count: sql<number>`count(*)` }).from(appraisals);
    const [transactionCount] = await db.select({ count: sql<number>`count(*)` }).from(stripeSessions);
    const [agentCount] = await db.select({ count: sql<number>`count(*)` }).from(aiAgentLogs);

    const recentListings = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.createdAt))
      .limit(10);

    const recentAppraisals = await db
      .select()
      .from(appraisals)
      .orderBy(desc(appraisals.createdAt))
      .limit(10);

    const revenue = await db
      .select({ total: sql<number>`sum(${stripeSessions.amount})` })
      .from(stripeSessions)
      .where(eq(stripeSessions.status, "completed"));

    return {
      counts: {
        users: userCount.count,
        listings: listingCount.count,
        appraisals: appraisalCount.count,
        transactions: transactionCount.count,
        agentRuns: agentCount.count,
      },
      revenue: revenue[0]?.total || 0,
      recentListings,
      recentAppraisals,
    };
  }),

  listUsers: adminQuery
    .input(z.object({ limit: z.number().min(1).max(500).default(100), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const limit = input?.limit || 100;
      const offset = input?.offset || 0;
      logAudit({
        ip: getClientIP(ctx.req),
        method: "GET",
        path: "admin.listUsers",
        userId: ctx.user?.id,
        action: "admin_data_access",
        details: `limit:${limit} offset:${offset}`,
      });
      return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit).offset(offset);
    }),

  listListings: adminQuery
    .input(z.object({ limit: z.number().min(1).max(500).default(100), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const limit = input?.limit || 100;
      const offset = input?.offset || 0;
      logAudit({
        ip: getClientIP(ctx.req),
        method: "GET",
        path: "admin.listListings",
        userId: ctx.user?.id,
        action: "admin_data_access",
      });
      return db.select().from(listings).orderBy(desc(listings.createdAt)).limit(limit).offset(offset);
    }),

  listTransactions: adminQuery
    .input(z.object({ limit: z.number().min(1).max(500).default(100), offset: z.number().min(0).default(0) }).optional())
    .query(async ({ input, ctx }) => {
      const db = getDb();
      const limit = input?.limit || 100;
      const offset = input?.offset || 0;
      logAudit({
        ip: getClientIP(ctx.req),
        method: "GET",
        path: "admin.listTransactions",
        userId: ctx.user?.id,
        action: "admin_data_access",
      });
      return db.select().from(stripeSessions).orderBy(desc(stripeSessions.createdAt)).limit(limit).offset(offset);
    }),

  updateListingStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["active", "sold", "pending", "pending_fee", "reserved", "withdrawn"]) }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      await db.update(listings).set({ status: input.status }).where(eq(listings.id, input.id));
      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "admin.updateListingStatus",
        userId: ctx.user?.id,
        action: "admin_listing_updated",
        details: `listing:${input.id} status:${input.status}`,
      });
      return { success: true };
    }),

  // ─── AGENT MANAGEMENT ───
  listAgentProjects: adminQuery.query(async ({ ctx }) => {
    const db = getDb();
    logAudit({ ip: getClientIP(ctx.req), method: "GET", path: "admin.listAgentProjects", userId: ctx.user?.id, action: "admin_agent_access" });
    return db.select().from(agentProjects).orderBy(agentProjects.priority);
  }),

  getAgentProject: adminQuery
    .input(z.object({ projectId: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = getDb();
      logAudit({ ip: getClientIP(ctx.req), method: "GET", path: "admin.getAgentProject", userId: ctx.user?.id, action: "admin_agent_access", details: `project:${input.projectId}` });
      const [project] = await db.select().from(agentProjects).where(eq(agentProjects.projectId, input.projectId)).limit(1);
      if (!project) throw new Error("Project not found");

      const tasks = await db.select().from(agentTasks).where(eq(agentTasks.projectId, input.projectId)).orderBy(agentTasks.priority);
      const fleet = await db.select().from(agentFleetState).where(eq(agentFleetState.projectId, input.projectId)).limit(1);
      const cycles = await db.select().from(agentCycles).where(eq(agentCycles.projectId, input.projectId)).orderBy(desc(agentCycles.createdAt)).limit(20);
      const logs = await db.select().from(agentLogs).where(eq(agentLogs.projectId, input.projectId)).orderBy(desc(agentLogs.timestamp)).limit(50);

      return { project, tasks, fleet: fleet[0] ?? null, cycles, logs };
    }),

  updateAgentProject: adminQuery
    .input(z.object({
      projectId: z.string(),
      name: z.string().optional(),
      description: z.string().optional(),
      active: z.boolean().optional(),
      priority: z.number().min(1).max(5).optional(),
      cycleBudgetMinutes: z.number().min(1).max(120).optional(),
      verificationCommand: z.string().optional(),
      handsOff: z.array(z.string()).optional(),
      engineerCommand: z.string().optional(),
      model: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const { projectId, ...updates } = input;
      const updateData: Record<string, unknown> = { ...updates, updatedAt: new Date() };
      if (input.handsOff) updateData.handsOff = JSON.stringify(input.handsOff);

      await db.update(agentProjects).set(updateData).where(eq(agentProjects.projectId, projectId));
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "admin.updateAgentProject", userId: ctx.user?.id, action: "admin_agent_updated", details: `project:${projectId}` });
      return { success: true };
    }),

  createAgentTask: adminQuery
    .input(z.object({
      projectId: z.string(),
      title: z.string().min(1),
      description: z.string().optional(),
      priority: z.number().min(1).max(5).default(2),
      interactiveOnly: z.boolean().default(false),
      expectedTouches: z.array(z.string()).default([]),
      assignedAgent: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const existing = await db.select().from(agentTasks).where(eq(agentTasks.projectId, input.projectId)).orderBy(desc(agentTasks.id)).limit(1);
      const prefix = input.projectId.slice(0, 2).toLowerCase();
      const nextNum = existing.length > 0 ? parseInt(existing[0].taskId.split("-")[1] ?? "0", 10) + 1 : 1;
      const taskId = `${prefix}-${String(nextNum).padStart(3, "0")}`;

      await db.insert(agentTasks).values({
        taskId,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        priority: input.priority,
        interactiveOnly: input.interactiveOnly,
        expectedTouches: JSON.stringify(input.expectedTouches),
        assignedAgent: input.assignedAgent,
      });
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "admin.createAgentTask", userId: ctx.user?.id, action: "admin_task_created", details: `project:${input.projectId} task:${taskId}` });
      return { success: true, taskId };
    }),

  runAgentCycle: adminQuery
    .input(z.object({ projectId: z.string(), taskId: z.string().optional() }))
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const [project] = await db.select().from(agentProjects).where(eq(agentProjects.projectId, input.projectId)).limit(1);
      if (!project) throw new Error("Project not found");

      let task;
      if (input.taskId) {
        [task] = await db.select().from(agentTasks).where(eq(agentTasks.taskId, input.taskId)).limit(1);
      } else {
        [task] = await db.select().from(agentTasks).where(and(eq(agentTasks.projectId, input.projectId), eq(agentTasks.status, "pending"))).orderBy(agentTasks.priority).limit(1);
      }
      if (!task) throw new Error("No task available");

      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "admin.runAgentCycle", userId: ctx.user?.id, action: "admin_cycle_triggered", details: `project:${input.projectId} task:${task.taskId}` });
      return { success: true, message: "Cycle triggered - runs asynchronously", taskId: task.taskId };
    }),

  // ─── CLOUDFLARE MANAGEMENT ───
  cloudflareStatus: adminQuery.query(async ({ ctx }) => {
    logAudit({ ip: getClientIP(ctx.req), method: "GET", path: "admin.cloudflareStatus", userId: ctx.user?.id, action: "admin_cf_access" });
    const apiToken = env.cloudflareApiToken;
    const accountId = "2ad733f9d698170c202b12924868c60e";

    if (!apiToken) {
      return { configured: false, error: "CLOUDFLARE_API_TOKEN not set" };
    }

    try {
      const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects`, {
        headers: { Authorization: `Bearer ${apiToken}` }
      });
      const data = await res.json();
      return { configured: true, projects: data.result };
    } catch (err) {
      return { configured: true, error: err instanceof Error ? err.message : "API call failed" };
    }
  }),

  cloudflareDeploy: adminQuery
    .input(z.object({ projectName: z.string().default("thevault") }))
    .mutation(async ({ input, ctx }) => {
      logAudit({ ip: getClientIP(ctx.req), method: "POST", path: "admin.cloudflareDeploy", userId: ctx.user?.id, action: "admin_cf_deploy" });
      const apiToken = env.cloudflareApiToken;
      const accountId = "2ad733f9d698170c202b12924868c60e";

      if (!apiToken) return { success: false, error: "CLOUDFLARE_API_TOKEN not set" };

      // Trigger a new deployment via Git push simulation
      try {
        const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects/${input.projectName}/deployments`, {
          method: "POST",
          headers: { Authorization: `Bearer ${apiToken}`, "Content-Type": "application/json" },
          body: JSON.stringify({ branch: "master", config: { production_branch: "master" } })
        });
        const data = await res.json();
        return { success: data.success, deployment: data.result };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : "Deploy failed" };
      }
    }),

  cloudflareBindings: adminQuery
    .input(z.object({ projectName: z.string().default("thevault") }))
    .query(async ({ input, ctx }) => {
      logAudit({ ip: getClientIP(ctx.req), method: "GET", path: "admin.cloudflareBindings", userId: ctx.user?.id, action: "admin_cf_bindings" });
      const apiToken = env.cloudflareApiToken;
      const accountId = "2ad733f9d698170c202b12924868c60e";

      if (!apiToken) return { configured: false, error: "CLOUDFLARE_API_TOKEN not set" };

      // Note: Cloudflare API doesn't expose function bindings directly
      // This returns the wrangler.toml config as reference
      return {
              message: "D1 bindings are configured in wrangler.toml and applied on Git-based builds",
              bindings: [
                { name: "DB", type: "d1_database", target: "thevault-db", database_id: "375949ce-7c7d-4822-8235-461446769258" }
              ]
            };
          }),

      // ─── Seller Payouts (fulfillment closure) ───
      listPayouts: adminQuery
        .input(z.object({ status: z.string().optional() }))
        .query(async ({ input, ctx }) => {
          requireAdmin(ctx);
          const db = getDb();
          const q = db.select().from(sellerPayouts);
          if (input.status) {
            return q.where(eq(sellerPayouts.status, input.status)).orderBy(desc(sellerPayouts.createdAt)).limit(200);
          }
          return q.orderBy(desc(sellerPayouts.createdAt)).limit(200);
        }),

      // Mark a payout as paid (manual release until Stripe Connect is configured).
      markPayoutPaid: adminQuery
        .input(z.object({ payoutId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          requireAdmin(ctx);
          const db = getDb();
          const [payout] = await db.select().from(sellerPayouts).where(eq(sellerPayouts.id, input.payoutId)).limit(1);
          if (!payout) throw new Error("Payout not found");

          await db
            .update(sellerPayouts)
            .set({ status: "paid", paidAt: new Date() })
            .where(eq(sellerPayouts.id, input.payoutId));

          // Mirror onto the order row so the seller's order view reflects payout.
          if (payout.saleTransactionId) {
            await db
              .update(orders)
              .set({ payoutStatus: "paid", paidAt: new Date() })
              .where(eq(orders.id, payout.saleTransactionId));
          }

          logAudit({
            ip: getClientIP(ctx.req),
            method: "POST",
            path: "admin.markPayoutPaid",
            userId: ctx.user?.id,
            action: "payout_marked_paid",
            details: `payout:${input.payoutId} amount:${payout.amount}`,
          });

            return { success: true, payoutId: input.payoutId };
          }),
      });
