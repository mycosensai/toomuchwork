import { z } from "zod";
import { desc } from "drizzle-orm";
import { auditLogs } from "@db/schema";
import { createRouter, adminQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const auditLogRouter = createRouter({
  list: adminQuery
    .input(z.object({ limit: z.number().optional(), offset: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      return db
        .select()
        .from(auditLogs)
        .orderBy(desc(auditLogs.checkedAt))
        .limit(input?.limit ?? 50)
        .offset(input?.offset ?? 0);
    }),
});
