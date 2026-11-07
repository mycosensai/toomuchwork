import { and, eq } from "drizzle-orm";
import { categories, emailNotifications, listings, stripeSessions } from "@db/schema";
import { getDb } from "../queries/connection";
import { sendEmail } from "../email-service";
import { isSamsonArmed } from "./kill-switch";
import { runScheduledAgentTick } from "./agent-runner";

const RESERVATION_TTL_MS = 30 * 60 * 1000;

function toMillis(value: Date | number | null | undefined): number {
  if (value instanceof Date) return value.getTime();
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  return numeric < 1e12 ? numeric * 1000 : numeric;
}

export async function releaseStaleReservations(): Promise<number> {
  const db = getDb();
  const reserved = await db.select().from(listings).where(eq(listings.status, "reserved"));
  const cutoff = Date.now() - RESERVATION_TTL_MS;
  let released = 0;
  for (const listing of reserved) {
    if (toMillis(listing.updatedAt) >= cutoff) continue;
    const pending = await db
      .select()
      .from(stripeSessions)
      .where(and(eq(stripeSessions.listingId, listing.id), eq(stripeSessions.status, "pending")));
    const freshHold = pending.some((session) => toMillis(session.createdAt) >= cutoff);
    if (freshHold) continue;
    const result = await db
      .update(listings)
      .set({ status: "active", updatedAt: new Date() })
      .where(and(eq(listings.id, listing.id), eq(listings.status, "reserved")));
    released += Number(result.meta?.changes ?? 0);
  }
  return released;
}

export async function reconcileCategoryCounts(): Promise<number> {
  const db = getDb();
  const cats = await db.select().from(categories);
  const active = await db.select().from(listings).where(eq(listings.status, "active"));
  const counts = new Map<number, number>();
  for (const listing of active) {
    counts.set(listing.categoryId, (counts.get(listing.categoryId) ?? 0) + 1);
  }
  let updated = 0;
  for (const category of cats) {
    const next = counts.get(category.id) ?? 0;
    if (next === category.listingCount) continue;
    await db.update(categories).set({ listingCount: next }).where(eq(categories.id, category.id));
    updated += 1;
  }
  return updated;
}

export async function deliverEmailOutbox(limit = 20): Promise<{ sent: number; failed: number }> {
  const db = getDb();
  const pending = await db
    .select()
    .from(emailNotifications)
    .where(eq(emailNotifications.status, "pending"))
    .limit(limit);
  let sent = 0;
  let failed = 0;
  for (const row of pending) {
    const result = await sendEmail({
      to: row.recipientEmail,
      subject: row.subject,
      text: row.bodyText || row.subject,
      html: row.bodyHtml || `<p>${row.bodyText || row.subject}</p>`,
    });
    if (result.success) {
      sent += 1;
      await db
        .update(emailNotifications)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(emailNotifications.id, row.id));
    } else {
      failed += 1;
      await db
        .update(emailNotifications)
        .set({ status: "failed" })
        .where(eq(emailNotifications.id, row.id));
    }
  }
  return { sent, failed };
}

export async function runScheduledMaintenance(): Promise<Record<string, unknown>> {
  const report: Record<string, unknown> = {};
  try {
    report.reservationsReleased = await releaseStaleReservations();
  } catch (error) {
    report.reservationsError = error instanceof Error ? error.message : "failed";
  }
  try {
    report.categoriesUpdated = await reconcileCategoryCounts();
  } catch (error) {
    report.categoriesError = error instanceof Error ? error.message : "failed";
  }
  try {
    report.email = await deliverEmailOutbox();
  } catch (error) {
    report.emailError = error instanceof Error ? error.message : "failed";
  }
  try {
    const armed = await isSamsonArmed();
    report.samsonArmed = armed;
    report.agent = armed ? { ran: false, reason: "samson_armed" } : await runScheduledAgentTick();
  } catch (error) {
    report.agentError = error instanceof Error ? error.message : "failed";
  }
  return report;
}
