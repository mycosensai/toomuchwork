/**
 * Name-only capability matrix. Prints whether a name is set. Never prints values.
 */
const features = [
  {
    feature: "database",
    names: ["DB"],
    note: "D1 binding thevault-db. Not an environment variable.",
  },
  {
    feature: "auth",
    names: ["APP_SECRET"],
    note: "JWT signing. Admin allowlist is hardcoded, not ADMIN_EMAILS.",
  },
  {
    feature: "oauth",
    names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "X_CLIENT_ID", "X_CLIENT_SECRET"],
  },
  {
    feature: "stripe",
    names: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "VITE_STRIPE_PUBLISHABLE_KEY"],
  },
  {
    feature: "email",
    names: ["RESEND_API_KEY"],
  },
  {
    feature: "llm",
    names: ["NOUS_API_KEY", "NOUS_BASE_URL"],
  },
  {
    feature: "solana",
    names: ["SOLANA_TREASURY", "SOLANA_RPC_URL", "SOLANA_TREASURY_SECRET"],
    note: "SOL price is a live feed. SOL_USD_RATE is not used for charges.",
  },
  {
    feature: "telegram",
    names: ["TELEGRAM_BOT_TOKEN", "VAULT_TG_BOT_TOKEN"],
    note: "Outbound and inbound tokens are different names.",
  },
  {
    feature: "flags",
    names: ["ENABLE_STRIPE_WEBHOOKS", "ENABLE_RATE_LIMITING", "ENABLE_SECURITY_HEADERS"],
  },
];

for (const feature of features) {
  const present = feature.names.filter((name) => Boolean(process.env[name]));
  const missing = feature.names.filter((name) => !process.env[name]);
  console.log(`${feature.feature}: set=${present.length} missing=${missing.join(",") || "none"}${feature.note ? ` — ${feature.note}` : ""}`);
}
console.log("Capability matrix printed. Values were not read.");
