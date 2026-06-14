/**
 * Worker-safe env access for Cloudflare Pages Functions.
 * Uses bindings-provided env via Pages bindings / lazy process access.
 */

function workerValue(name: string): string {
  return typeof (globalThis as any).process?.env?.[name] === "string"
    ? ((globalThis as any).process.env[name] as string)
    : "";
}

function required(name: string): string {
  const value = workerValue(name);
  if (!value && workerValue("NODE_ENV") === "production") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  appId: workerValue("APP_ID"),
  appSecret: required("APP_SECRET"),
  isProduction: workerValue("NODE_ENV") === "production",
  databaseUrl: workerValue("DATABASE_URL"),
  kimiAuthUrl: workerValue("KIMI_AUTH_URL"),
  kimiOpenUrl: workerValue("KIMI_OPEN_URL"),
  ownerUnionId: workerValue("OWNER_UNION_ID"),
  stripeSecretKey: workerValue("STRIPE_SECRET_KEY"),
  stripePublishableKey: workerValue("VITE_STRIPE_PUBLISHABLE_KEY"),
  coinbaseApiKey: workerValue("COINBASE_API_KEY"),
  coinbaseWebhookSecret: workerValue("COINBASE_WEBHOOK_SECRET"),
  openaiApiKey: workerValue("OPENAI_API_KEY"),
  googleClientId: workerValue("GOOGLE_CLIENT_ID"),
  googleClientSecret: workerValue("GOOGLE_CLIENT_SECRET"),
  xClientId: workerValue("X_CLIENT_ID"),
  xClientSecret: workerValue("X_CLIENT_SECRET"),
  githubClientId: workerValue("GITHUB_CLIENT_ID"),
  githubClientSecret: workerValue("GITHUB_CLIENT_SECRET"),
};
