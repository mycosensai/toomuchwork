/** Cloudflare Workers Environment bindings and helper env object. */

export interface CloudflareEnv {
  APP_SECRET?: string;
  APP_ID?: string;
  DATABASE_URL?: string;
  KIMI_AUTH_URL?: string;
  KIMI_OPEN_URL?: string;
  OWNER_UNION_ID?: string;
  STRIPE_SECRET_KEY?: string;
  VITE_STRIPE_PUBLISHABLE_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_BASE_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  X_CLIENT_ID?: string;
  X_CLIENT_SECRET?: string;
  APPLE_CLIENT_ID?: string;
  APPLE_CLIENT_SECRET?: string;
  NODE_ENV?: string;
  VAULT_DOMAIN?: string;
  RESEND_API_KEY?: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SIGNING_SECRET?: string;
  SOLANA_TREASURY?: string;
  SOLANA_RPC_URL?: string;
  SOL_USD_RATE?: string;
  USDC_USD_RATE?: string;
  TREASURY_WALLET?: string;
  CLOUDFLARE_API_TOKEN?: string;
  ADMIN_EMAILS?: string;
  DB?: any;
}

let cfEnv: CloudflareEnv = {};

export function getRawEnv(): Record<string, unknown> {
  return cfEnv as unknown as Record<string, unknown>;
}

export function setCloudflareEnv(env: Record<string, unknown>) {
  cfEnv = { ...(env as any) } as CloudflareEnv;
}

export const env = {
  get appId(): string {
    return cfEnv.APP_ID || "";
  },
  get appSecret(): string {
    const secret = cfEnv.APP_SECRET;
    if (!secret) {
      throw new Error("APP_SECRET is required but not configured");
    }
    return secret;
  },
  get isProduction(): boolean {
    const nodeEnv = cfEnv.NODE_ENV;
    if (nodeEnv) return nodeEnv === "production";
    const domain = cfEnv.VAULT_DOMAIN as string | undefined;
    const host = typeof globalThis !== "undefined" ? (globalThis as any).location?.hostname : undefined;
    return !host || host === domain || domain === "thevaultdfw.win";
  },
  get databaseUrl(): string {
    return cfEnv.DATABASE_URL || "";
  },
  get kimiAuthUrl(): string {
    return cfEnv.KIMI_AUTH_URL || "";
  },
  get kimiOpenUrl(): string {
    return cfEnv.KIMI_OPEN_URL || "";
  },
  get ownerUnionId(): string {
    return cfEnv.OWNER_UNION_ID || "";
  },
  get stripeSecretKey(): string {
    return cfEnv.STRIPE_SECRET_KEY || "";
  },
  get stripePublishableKey(): string {
    return cfEnv.VITE_STRIPE_PUBLISHABLE_KEY || "";
  },
  get openaiApiKey(): string {
    return cfEnv.OPENAI_API_KEY || "";
  },
  get openaiBaseUrl(): string {
    return cfEnv.OPENAI_BASE_URL || "https://api.openai.com/v1";
  },
  get googleClientId(): string {
    return cfEnv.GOOGLE_CLIENT_ID || "";
  },
  get googleClientSecret(): string {
    return cfEnv.GOOGLE_CLIENT_SECRET || "";
  },
  get githubClientId(): string {
    return cfEnv.GITHUB_CLIENT_ID || "";
  },
  get githubClientSecret(): string {
    return cfEnv.GITHUB_CLIENT_SECRET || "";
  },
  get xClientId(): string {
    return cfEnv.X_CLIENT_ID || "";
  },
  get xClientSecret(): string {
    return cfEnv.X_CLIENT_SECRET || "";
  },
  get appleClientId(): string {
    return cfEnv.APPLE_CLIENT_ID || "";
  },
  get appleClientSecret(): string {
    return cfEnv.APPLE_CLIENT_SECRET || "";
  },
  get vaultDomain(): string {
    return cfEnv.VAULT_DOMAIN || "";
  },
  get resendApiKey(): string {
    return cfEnv.RESEND_API_KEY || "";
  },
  get clerkSecretKey(): string {
    return cfEnv.CLERK_SECRET_KEY || "";
  },
  get clerkWebhookSecret(): string {
    return cfEnv.CLERK_WEBHOOK_SIGNING_SECRET || "";
  },
  get solanaTreasury(): string {
    return cfEnv.SOLANA_TREASURY || "";
  },
  get solanaRpcUrl(): string {
    return cfEnv.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  },
  get solUsdRate(): string {
    return cfEnv.SOL_USD_RATE || "";
  },
  get usdcUsdRate(): string {
    return cfEnv.USDC_USD_RATE || "1.00";
  },
  get treasuryWallet(): string {
    return cfEnv.TREASURY_WALLET || "";
  },
  get cloudflareApiToken(): string {
    return cfEnv.CLOUDFLARE_API_TOKEN || "";
  },
  get adminEmails(): string[] {
    const raw = cfEnv.ADMIN_EMAILS || "ratchetkrewelabs@gmail.com,dakotavanalstyne318@gmail.com";
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  },
};
