/**
 * Idempotent Stripe webhook effects.
 * Claims external event ids in stripe_event_ledger before side effects.
 * Order creation is keyed by stripe session id in order_payment_keys.
 */

export type D1Like = {
  prepare(query: string): {
    bind(...values: unknown[]): {
      run(): Promise<{ meta?: { changes?: number; last_row_id?: number } }>;
      first<T = Record<string, unknown>>(): Promise<T | null>;
      all<T = Record<string, unknown>>(): Promise<{ results?: T[] }>;
    };
  };
};

export type StripeEventPayload = {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
};

async function changesOf(result: { meta?: { changes?: number } }): Promise<number> {
  return Number(result.meta?.changes ?? 0);
}

export async function claimStripeEvent(db: D1Like, event: StripeEventPayload, rawBody: string): Promise<"claimed" | "processed" | "retry"> {
  const inserted = await db
    .prepare(
      `INSERT INTO stripe_event_ledger (provider, external_event_id, event_type, payload, status, created_at)
       VALUES ('stripe', ?, ?, ?, 'processing', unixepoch())
       ON CONFLICT(provider, external_event_id) DO NOTHING`,
    )
    .bind(event.id, event.type, rawBody)
    .run();
  if ((await changesOf(inserted)) > 0) return "claimed";
  const existing = await db
    .prepare(`SELECT status FROM stripe_event_ledger WHERE provider = 'stripe' AND external_event_id = ? LIMIT 1`)
    .bind(event.id)
    .first<{ status: string }>();
  if (existing?.status === "processed") return "processed";
  return "retry";
}

export async function markStripeEvent(db: D1Like, eventId: string, status: "processed" | "failed"): Promise<void> {
  await db
    .prepare(
      `UPDATE stripe_event_ledger SET status = ?, processed_at = unixepoch() WHERE provider = 'stripe' AND external_event_id = ?`,
    )
    .bind(status, eventId)
    .run();
}

export async function applyStripeEvent(db: D1Like, event: StripeEventPayload): Promise<void> {
  const object = event.data?.object ?? {};
  const sessionId = typeof object.id === "string" ? object.id : "";

  if (event.type === "checkout.session.completed" && sessionId) {
    const feeRow = await db
      .prepare(`SELECT id, listing_id FROM listing_fees WHERE stripe_session_id = ? AND status != 'paid' LIMIT 1`)
      .bind(sessionId)
      .first<{ id: number; listing_id: number | null }>();
    if (feeRow?.id) {
      await db.prepare(`UPDATE listing_fees SET status = 'paid', paid_at = unixepoch() WHERE id = ?`).bind(feeRow.id).run();
      if (feeRow.listing_id) {
        await db
          .prepare(`UPDATE listings SET status = 'active' WHERE id = ? AND status = 'pending_fee'`)
          .bind(feeRow.listing_id)
          .run();
      }
    }

    const sessionRow = await db
      .prepare(`SELECT listing_id, user_id, amount, commission FROM stripe_sessions WHERE session_id = ? LIMIT 1`)
      .bind(sessionId)
      .first<{ listing_id: number; user_id: number | null; amount: string; commission: string }>();

    const paidCents = Number(object.amount_total);
    const expectedCents = sessionRow ? Math.round(Number(sessionRow.amount) * 100) : NaN;
    const amountMatches = sessionRow && Number.isFinite(paidCents) && paidCents === expectedCents;
    const currency = typeof object.currency === "string" ? object.currency : "usd";

    if (sessionRow?.listing_id && amountMatches && currency === "usd") {
      await db.prepare(`UPDATE stripe_sessions SET status = ? WHERE session_id = ?`).bind("completed", sessionId).run();
      const key = await db
        .prepare(`INSERT INTO order_payment_keys (stripe_session_id, created_at) VALUES (?, unixepoch()) ON CONFLICT(stripe_session_id) DO NOTHING`)
        .bind(sessionId)
        .run();
      if ((await changesOf(key)) > 0) {
        const listingRow = await db
          .prepare(`SELECT title, images, seller_id FROM listings WHERE id = ? LIMIT 1`)
          .bind(sessionRow.listing_id)
          .first<{ title: string; images: string | null; seller_id: number | null }>();
        const buyerEmail = typeof object.customer_email === "string" ? object.customer_email : null;
        const shippedAddress =
          typeof object.shipping === "object" && object.shipping ? JSON.stringify(object.shipping) : null;
        const commissionNum = Number(sessionRow.commission) || 0;
        const payoutAmount = (Number(sessionRow.amount) - commissionNum).toFixed(2);
        try {
          await db
            .prepare(
              `INSERT INTO orders (user_id, seller_id, listing_id, listing_title, listing_image, amount, commission, payment_method, payment_status, order_status, shipping_address, payout_status, payout_amount, notes, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'stripe', 'completed', 'confirmed', ?, 'pending', ?, ?, unixepoch(), unixepoch())`,
            )
            .bind(
              sessionRow.user_id,
              listingRow?.seller_id ?? null,
              sessionRow.listing_id,
              listingRow?.title || "Vault Purchase",
              listingRow?.images ?? null,
              sessionRow.amount,
              sessionRow.commission,
              shippedAddress,
              payoutAmount,
              JSON.stringify({ stripe_session_id: sessionId, buyer_email: buyerEmail }),
            )
            .run();
          await db.prepare(`UPDATE listings SET status = 'sold' WHERE id = ?`).bind(sessionRow.listing_id).run();
          if (listingRow?.seller_id) {
            const seller = await db
              .prepare(`SELECT id, email FROM users WHERE id = ? LIMIT 1`)
              .bind(listingRow.seller_id)
              .first<{ id: number; email: string | null }>();
            if (seller?.email) {
              await db
                .prepare(
                  `INSERT INTO email_notifications (user_id, recipient_email, type, subject, body_text, status, created_at)
                   VALUES (?, ?, 'order_placed', ?, ?, 'pending', unixepoch())`,
                )
                .bind(
                  seller.id,
                  seller.email,
                  `Your item sold: ${listingRow.title}`,
                  `Your item "${listingRow.title}" was purchased for $${sessionRow.amount}.`,
                )
                .run();
            }
          }
        } catch (error) {
          await db.prepare(`DELETE FROM order_payment_keys WHERE stripe_session_id = ?`).bind(sessionId).run();
          throw error;
        }
      }
    } else if (sessionRow && !amountMatches) {
      await db.prepare(`UPDATE stripe_sessions SET status = 'amount_mismatch' WHERE session_id = ?`).bind(sessionId).run();
      await db
        .prepare(`UPDATE listings SET status = 'active' WHERE id = ? AND status = 'reserved'`)
        .bind(sessionRow.listing_id)
        .run();
    }
  }

  if (event.type === "checkout.session.expired" && sessionId) {
    await db.prepare(`UPDATE stripe_sessions SET status = 'expired' WHERE session_id = ?`).bind(sessionId).run();
    const sessionRow = await db
      .prepare(`SELECT listing_id FROM stripe_sessions WHERE session_id = ? LIMIT 1`)
      .bind(sessionId)
      .first<{ listing_id: number }>();
    if (sessionRow?.listing_id) {
      await db
        .prepare(`UPDATE listings SET status = 'active' WHERE id = ? AND status = 'reserved'`)
        .bind(sessionRow.listing_id)
        .run();
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;
    const listingFromMeta = Number(metadata.listingId) || 0;
    if (listingFromMeta) {
      await db
        .prepare(`UPDATE listings SET status = 'active' WHERE id = ? AND status = 'reserved'`)
        .bind(listingFromMeta)
        .run();
    }
  }
}
