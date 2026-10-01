/**
 * telegram.ts — Site → Telegram home-channel notifier.
 *
 * Posts site events (new listing, sale, tokenization, webhook) to the
 * Hermes agent's configured Telegram home channel (Hermes config.yaml →
 * telegram.home_channel = 5688111406). Uses the Hermes gateway bot token,
 * set as the TELEGRAM_BOT_TOKEN secret on Cloudflare Pages.
 *
 * Never logs the token. No-op when the secret is absent (local dev).
 */
import { env } from "./env";

const HOME_CHANNEL = "5688111406"; // telegram.home_channel from Hermes config.yaml

interface TgPayload {
  chat_id: string;
  text: string;
  parse_mode?: "HTML";
  disable_web_page_preview?: boolean;
}

/** Build a compact HTML message for a site event. */
export function formatEventMessage(kind: string, fields: Record<string, string>): string {
  const lines = [`<b>🏛 VAULT DFW — ${kind}</b>`];
  for (const [k, v] of Object.entries(fields)) {
    lines.push(`<b>${k}:</b> ${v}`);
  }
  lines.push(`<i>thevaultdfw.win</i>`);
  return lines.join("\n");
}

/** Fire-and-forget POST to the Telegram Bot API. Never throws to callers. */
export async function sendTelegramMessage(chatId: string, text: string, token?: string): Promise<boolean> {
  const botToken = token || env.telegramBotToken;
  if (!botToken || !chatId) return false;

  const body: TgPayload = {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      // Never echo the token in errors — log status only.
      console.error(`[telegram] send failed: ${res.status}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[telegram] send error: ${(e as Error).message}`);
    return false;
  }
}

/** Fire-and-forget POST to the Telegram Bot API. Never throws to callers. */
export async function notifyTelegram(kind: string, fields: Record<string, string>): Promise<boolean> {
  return sendTelegramMessage(HOME_CHANNEL, formatEventMessage(kind, fields));
}
