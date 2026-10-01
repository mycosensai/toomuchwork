/**
 * tickets-router.ts — Support ticket system.
 *
 * Every inquiry (website form, Telegram message, email) becomes an
 * individual ticket with a unique VLT-XXXX number. Creation always:
 *   1. Inserts the ticket row.
 *   2. Sends an acknowledgment to the customer's chat (when known).
 *   3. Notifies the owner's Telegram inbox (Hermes home channel) so the
 *      agent acknowledges receipt there.
 */
import { z } from "zod";
import { createRouter, publicQuery, authedQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { supportTickets } from "@db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { logAudit, getClientIP, sanitizeInput } from "./security";
import { notifyTelegram, sendTelegramMessage } from "./lib/telegram";
import { TRPCError } from "@trpc/server";

const OWNER_INBOX = "5688111406"; // Hermes telegram.home_channel — "my inbox"

/** Build the next ticket number: VLT-1001, VLT-1002, … */
async function nextTicketNo(db: any): Promise<string> {
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(supportTickets);
  const base = 1001 + Number(row?.count || 0);
  return `VLT-${base}`;
}

const createInput = z.object({
  subject: z.string().min(3).max(200),
  message: z.string().min(3).max(5000),
  customerName: z.string().max(120).optional(),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().max(40).optional(),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  channel: z.enum(["website", "telegram", "email"]).default("website"),
  // Telegram-originated fields (set by the inbound webhook)
  telegramUserId: z.string().optional(),
  telegramUsername: z.string().optional(),
  telegramChatId: z.string().optional(),
});

export const ticketsRouter = createRouter({
  /** Create a support ticket from an inquiry. Public (contact form + webhook). */
  create: publicQuery
    .input(createInput)
    .mutation(async ({ input, ctx }) => {
      const db = getDb();
      const ticketNo = await nextTicketNo(db);

      const inserted = await db.insert(supportTickets).values({
        ticketNo,
        channel: input.channel,
        status: "new",
        priority: input.priority,
        subject: sanitizeInput(input.subject),
        message: sanitizeInput(input.message),
        customerName: input.customerName ? sanitizeInput(input.customerName) : undefined,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        telegramUserId: input.telegramUserId,
        telegramUsername: input.telegramUsername,
        telegramChatId: input.telegramChatId,
        assignedAgent: "concierge",
        acknowledged: false,
      });
      const ticketId = Number(inserted.meta.last_row_id);

      logAudit({
        ip: getClientIP(ctx.req),
        method: "POST",
        path: "tickets.create",
        action: `ticket_created_${input.channel}`,
        details: `ticket:${ticketNo} channel:${input.channel}`,
      });

      // 1) Acknowledge the customer (when we have their chat).
      if (input.telegramChatId) {
        await sendTelegramMessage(input.telegramChatId, [
          `<b>🏛 The Vault DFW — Ticket ${ticketNo}</b>`,
          `Your inquiry has been received and assigned a ticket.`,
          ``,
          `<b>Subject:</b> ${sanitizeInput(input.subject)}`,
          `<b>Status:</b> new — an agent will respond shortly.`,
          ``,
          `<i>Keep this number for reference: ${ticketNo}</i>`,
        ].join("\n"));
      }

      // 2) Acknowledge in the owner's inbox — the agent confirms receipt here.
      await notifyTelegram("🎫 NEW SUPPORT TICKET", {
        "Ticket": ticketNo,
        "Channel": input.channel,
        "Subject": sanitizeInput(input.subject),
        "From": input.customerName || input.telegramUsername || input.customerEmail || "Anonymous",
        "Message": sanitizeInput(input.message).slice(0, 200),
        "Status": "acknowledged",
      });

      return { success: true, ticketNo, id: ticketId };
    }),

  /** List tickets (staff / owner). */
  list: authedQuery
    .input(
      z.object({
        status: z.enum(["new", "open", "in_progress", "resolved", "closed"]).optional(),
        page: z.number().default(1),
        limit: z.number().default(25),
      })
    )
    .query(async ({ input }) => {
      const db = getDb();
      const offset = (input.page - 1) * input.limit;
      const where = input.status ? eq(supportTickets.status, input.status) : undefined;
      const rows = where
        ? await db.select().from(supportTickets).where(where).orderBy(desc(supportTickets.createdAt)).limit(input.limit).offset(offset)
        : await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt)).limit(input.limit).offset(offset);
      return { tickets: rows, page: input.page, total: rows.length };
    }),

  /** Fetch one ticket by number. */
  get: authedQuery
    .input(z.object({ ticketNo: z.string().regex(/^VLT-\d+$/) }))
    .query(async ({ input }) => {
      const db = getDb();
      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, input.ticketNo)).limit(1);
      if (!ticket) throw new TRPCError({ code: "NOT_FOUND", message: "Ticket not found" });
      return ticket;
    }),

  /** Update ticket status/priority/assignment. */
  update: authedQuery
    .input(
      z.object({
        ticketNo: z.string().regex(/^VLT-\d+$/),
        status: z.enum(["new", "open", "in_progress", "resolved", "closed"]).optional(),
        priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
        assignedAgent: z.string().max(80).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = getDb();
      const patch: Record<string, unknown> = { updatedAt: new Date() };
      if (input.status) patch.status = input.status;
      if (input.priority) patch.priority = input.priority;
      if (input.assignedAgent) patch.assignedAgent = input.assignedAgent;
      await db.update(supportTickets).set(patch).where(eq(supportTickets.ticketNo, input.ticketNo));

      const [ticket] = await db.select().from(supportTickets).where(eq(supportTickets.ticketNo, input.ticketNo)).limit(1);
      if (ticket) {
        await notifyTelegram("🔁 TICKET UPDATED", {
          "Ticket": ticket.ticketNo,
          "Status": ticket.status,
          "Priority": ticket.priority,
          "Agent": ticket.assignedAgent || "—",
        });
      }
      return { success: true };
    }),
});
