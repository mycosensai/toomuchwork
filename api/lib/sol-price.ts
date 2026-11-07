import { env } from "./env";

const TTL_MS = 60_000;
const MAX_STALE_MS = 5 * 60_000;

export type SolQuote = {
  usd: number;
  fetchedAt: number;
  source: string;
};

type Fetcher = () => Promise<number>;

let cache: SolQuote | null = null;
let fetcher: Fetcher = fetchCoingeckoSolUsd;

export function setSolPriceFetcher(next: Fetcher | null): void {
  fetcher = next ?? fetchCoingeckoSolUsd;
  cache = null;
}

export function clearSolPriceCache(): void {
  cache = null;
}

async function fetchCoingeckoSolUsd(): Promise<number> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    { headers: { accept: "application/json" } },
  );
  if (!response.ok) {
    throw new Error(`SOL price feed HTTP ${response.status}`);
  }
  const body = (await response.json()) as { solana?: { usd?: number } };
  const usd = Number(body.solana?.usd);
  if (!Number.isFinite(usd) || usd <= 0) {
    throw new Error("SOL price feed returned no quote");
  }
  return usd;
}

function configuredFallback(now: number): SolQuote | null {
  const usd = Number(env.solUsdRate);
  if (!Number.isFinite(usd) || usd <= 0) return null;
  return { usd, fetchedAt: now, source: "configured_fallback" };
}

/**
 * Live CoinGecko quote when it responds.
 * Production has SOL_USD_RATE and no price-feed API key, so a failed feed
 * falls back to that configured rate and labels the source.
 */
export async function getFreshSolUsd(): Promise<SolQuote> {
  const now = Date.now();
  if (cache && cache.source !== "configured_fallback" && now - cache.fetchedAt < TTL_MS) {
    return { ...cache, source: "cache" };
  }
  try {
    const usd = await fetcher();
    cache = { usd, fetchedAt: now, source: "coingecko" };
    return cache;
  } catch (error) {
    if (cache && cache.source !== "configured_fallback" && now - cache.fetchedAt < MAX_STALE_MS) {
      return { ...cache, source: "cache" };
    }
    const fallback = configuredFallback(now);
    if (fallback) return fallback;
    const message = error instanceof Error ? error.message : "SOL price unavailable";
    throw new Error(message);
  }
}
