/**
 * research-feeds.ts — Live RSS/blog feed sources for the BOXED-IN research agent.
 *
 * Integrates the "blog & RSS monitoring" capability into the vault research
 * router. Only feeds that were verified LIVE (2026-09-07) are listed:
 *   - Bring a Trailer (bringatrailer.com/feed) — real for-sale auction
 *     listings = "for-sale listings of similar items" (inside THE BOX).
 *   - Google News RSS (news.google.com/rss/search) — real collectibles-market
 *     news/discussion surfaced via a no-key public RSS search.
 *
 * Everything a feed returns is mapped to the SAME internetResearch row shape
 * as the Reddit/X fetchers and passes through the router's existing BOX
 * enforcement (platform allowlist, censorship, hallucination, relevance).
 * No auth, no keys, worker-compatible (fetch + minimal XML parsing).
 */

export interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  source: string;
}

export interface FeedFindingInput {
  researchId?: string; // filled by caller (genId)
  itemName: string;
  category?: string | null;
  query: string;
  platform: string;
  sourceUrl: string;
  title: string;
  content: string;
  author: string;
  authorUrl: string;
  postDate: string;
  relevanceScore: number;
  confidenceScore: number;
  aiNotes: string;
  findingType: string;
  isBuyingSignal: boolean;
  foundByAgent: string;
}

/** Platform names these feed sources emit — keep in sync with APPROVED_PLATFORMS. */
export const FEED_PLATFORMS = ["bringatrailer", "news"] as const;

const USER_AGENT = "TheVaultResearchBot/1.0 (contact: support@thevaultdfw.win)";

// ─── Minimal RSS 2.0 + Atom parser (no DOMParser in Workers) ───────────────
function decodeEntities(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_m, n) => String.fromCharCode(Number(n)));
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRss(xml: string): FeedItem[] {
  const items: FeedItem[] = [];
  const isAtom = /<feed[\s>]/.test(xml.slice(0, 600));

  if (!isAtom) {
    // RSS 2.0: <item> blocks
    const blocks = xml.match(/<item[\s>][\s\S]*?<\/item>/g) || [];
    for (const b of blocks) {
      const grab = (tag: string) => {
        const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`));
        return m ? decodeEntities(m[1]).trim() : "";
      };
      const title = grab("title");
      const link = grab("link") || (b.match(/<link[^>]+href="([^"]+)"/) || [])[1] || "";
      if (!title && !link) continue;
      items.push({
        title,
        link,
        pubDate: grab("pubDate"),
        description: stripHtml(grab("description")),
        source: new URL(link).hostname.replace(/^www\./, "") || "",
      });
    }
  } else {
    // Atom: <entry> blocks
    const blocks = xml.match(/<entry[\s>][\s\S]*?<\/entry>/g) || [];
    for (const b of blocks) {
      const title = (b.match(/<title[^>]*>([\s\S]*?)<\/title>/) || [])[1] || "";
      const link =
        (b.match(/<link[^>]+href="([^"]+)"/) || [])[1] ||
        (b.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1] ||
        "";
      const updated = (b.match(/<updated[^>]*>([\s\S]*?)<\/updated>/) || [])[1] || "";
      if (!title && !link) continue;
      items.push({
        title: decodeEntities(title).trim(),
        link: decodeEntities(link).trim(),
        pubDate: decodeEntities(updated).trim(),
        description: stripHtml(decodeEntities((b.match(/<summary[^>]*>([\s\S]*?)<\/summary>/) || [])[1] || "")),
        source: link ? (() => { try { return new URL(link).hostname.replace(/^www\./, ""); } catch { return ""; } })() : "",
      });
    }
  }
  return items;
}

export async function fetchFeed(url: string, timeoutMs = 10000): Promise<FeedItem[]> {
  const resp = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!resp.ok) return [];
  const text = await resp.text();
  if (text.length > 2_000_000) return []; // guard against absurd payloads
  return parseRss(text);
}

// ─── Relevance helpers ──────────────────────────────────────────────────────
const STOPWORDS = new Set(["the", "a", "an", "and", "or", "for", "with", "from", "this", "that", "watch", "vintage", "rare", "auction", "sale", "collector"]);

/** Significant search tokens from an item name (alpha, len>2, not stopwords). */
export function itemTokens(itemName: string): string[] {
  return (itemName.toLowerCase().match(/[a-z][a-z-]{2,}/g) || []).filter((t) => !STOPWORDS.has(t));
}

export function isRelevant(title: string, description: string, tokens: string[], category?: string): boolean {
  const hay = `${title} ${description}`.toLowerCase();
  if (tokens.some((t) => hay.includes(t))) return true;
  if (category) {
    // Match category WORDS too ("luxury-watches" should hit "luxury" or "watches"),
    // not only the exact hyphenated slug.
    const catWords = category.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    if (catWords.some((w) => hay.includes(w))) return true;
  }
  return false;
}

const BUYING_RE = /\b(wtb|want to buy|looking for|seeking|interested in buying|in the market|iso\b|buying)\b/i;

// ─── Live feed searches (BOXED-IN: comparables + market discussion only) ────
const BRING_A_TRAILER_FEED = "https://bringatrailer.com/feed/";
const NEWS_RSS = (q: string) =>
  `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;

/** Match score 0-100 for ordering (rough lexical overlap on tokens). */
function scoreMatch(title: string, tokens: string[]): number {
  const t = title.toLowerCase();
  const hits = tokens.filter((tok) => t.includes(tok)).length;
  if (hits === 0) return 40;
  return Math.min(95, 55 + hits * 15);
}

/**
 * Fetch recent Bring a Trailer auction listings relevant to the item.
 * findingType "fs" — real for-sale comparables for value/buyer research.
 */
async function searchBringATrailer(
  itemName: string,
  category: string | undefined,
  tokens: string[],
): Promise<FeedFindingInput[]> {
  const items = await fetchFeed(BRING_A_TRAILER_FEED);
  const out: FeedFindingInput[] = [];
  for (const it of items.slice(0, 25)) {
    if (!isRelevant(it.title, it.description, tokens, category)) continue;
    const score = scoreMatch(it.title, tokens);
    out.push({
      itemName,
      category: category || null,
      query: itemName,
      platform: "bringatrailer",
      sourceUrl: it.link,
      title: it.title.substring(0, 300),
      content: it.description.substring(0, 1000) || `Bring a Trailer auction listing: ${it.title}`,
      author: "bringatrailer",
      authorUrl: "https://bringatrailer.com",
      postDate: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
      relevanceScore: score,
      confidenceScore: 85, // real, verifiable auction listing
      aiNotes: `Bring a Trailer auction listing (comparables source). Live feed item.`,
      findingType: "fs",
      isBuyingSignal: false,
      foundByAgent: "research",
    });
    if (out.length >= 6) break;
  }
  return out;
}

/**
 * Search Google News RSS for collectibles-market discussion of the item.
 * findingType "discussion" / "review" — real articles, never invented.
 */
async function searchNews(
  itemName: string,
  category: string | undefined,
  tokens: string[],
): Promise<FeedFindingInput[]> {
  const base = tokens[0] || itemName.toLowerCase();
  const queries = [
    `${base} auction`,
    category ? `${base} ${category} market` : `${base} collectors market`,
  ];
  const seen = new Set<string>();
  const out: FeedFindingInput[] = [];

  for (const q of queries) {
    const items = await fetchFeed(NEWS_RSS(q));
    for (const it of items) {
      const key = it.link.split("?")[0];
      if (seen.has(key)) continue;
      if (!isRelevant(it.title, it.description, tokens, category)) continue;
      seen.add(key);
      const score = scoreMatch(it.title, tokens);
      const src = it.source || "news";
      out.push({
        itemName,
        category: category || null,
        query: q,
        platform: "news",
        sourceUrl: it.link,
        title: it.title.substring(0, 300),
        content: it.description.substring(0, 1000) || it.title.substring(0, 300),
        author: src,
        authorUrl: it.link,
        postDate: it.pubDate ? new Date(it.pubDate).toISOString() : new Date().toISOString(),
        relevanceScore: score,
        confidenceScore: 80,
        aiNotes: `News item from ${src} surfaced via Google News RSS (query: "${q}").`,
        findingType: BUYING_RE.test(`${it.title} ${it.description}`) ? "wtb" : "discussion",
        isBuyingSignal: BUYING_RE.test(`${it.title} ${it.description}`),
        foundByAgent: "research",
      });
      if (out.length >= 8) break;
    }
    if (out.length >= 8) break;
  }
  return out;
}

/** Main entry: run all live feed sources for an item, bounded and boxed-in. */
export async function searchLiveFeedsForBuyers(
  itemName: string,
  category?: string,
): Promise<FeedFindingInput[]> {
  const tokens = itemTokens(itemName);
  if (tokens.length === 0) return [];
  const [bat, news] = await Promise.all([
    searchBringATrailer(itemName, category, tokens),
    searchNews(itemName, category, tokens),
  ]);
  return [...bat, ...news].slice(0, 14);
}
