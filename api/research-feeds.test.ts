import { describe, it, expect } from "vitest";
import { parseRss, itemTokens, isRelevant } from "./lib/research-feeds";

const RSS_SAMPLE = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Test Feed</title>
  <item>
    <title>1985 Rolex Submariner 16800 Auction</title>
    <link>https://bringatrailer.com/listing/1985-rolex-submariner-16800/</link>
    <pubDate>Mon, 07 Sep 2026 10:00:00 +0000</pubDate>
    <description>&lt;p&gt;No Reserve 1985 Rolex Submariner 16800 with box &amp; papers.&lt;/p&gt;</description>
  </item>
  <item>
    <title>Vintage Omega Speedmaster - discussion</title>
    <link>https://example.com/omega</link>
    <pubDate>Tue, 08 Sep 2026 09:00:00 +0000</pubDate>
    <description><![CDATA[Looking for a pre-moon Speedmaster, any leads?]]></description>
  </item>
</channel></rss>`;

const ATOM_SAMPLE = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>News</title>
  <entry>
    <title>Rolex Unveils Unique Daytonas For Charity Auction</title>
    <link href="https://news.example.com/rolex-daytona"/>
    <updated>2026-09-07T10:00:00Z</updated>
    <summary>Rolex will auction four unique Daytona watches this month.</summary>
  </entry>
</feed>`;

describe("research-feeds parser", () => {
  it("parses RSS 2.0 items with CDATA and entity decoding", () => {
    const items = parseRss(RSS_SAMPLE);
    expect(items.length).toBe(2);
    expect(items[0].title).toContain("Rolex Submariner");
    expect(items[0].link).toContain("bringatrailer.com");
    expect(items[0].description).toContain("box & papers");
    expect(items[0].source).toBe("bringatrailer.com");
    expect(items[1].description).toContain("Looking for a pre-moon Speedmaster");
  });

  it("parses Atom entries", () => {
    const items = parseRss(ATOM_SAMPLE);
    expect(items.length).toBe(1);
    expect(items[0].title).toContain("Daytonas");
    expect(items[0].link).toBe("https://news.example.com/rolex-daytona");
  });

  it("extracts significant item tokens (stopwords dropped)", () => {
    expect(itemTokens("Vintage Rolex Submariner watch")).toEqual(["rolex", "submariner"]);
    expect(itemTokens("the rare and or with a")).toEqual([]);
  });

  it("relevance matches tokens or category", () => {
    const toks = itemTokens("Rolex Submariner");
    expect(isRelevant("1985 Rolex Submariner auction", "", toks)).toBe(true);
    expect(isRelevant("Vintage Omega Speedmaster", "", toks)).toBe(false);
    expect(isRelevant("Vintage diver watches", "", toks, "luxury-watches")).toBe(true);
  });

  it("returns empty on garbage", () => {
    expect(parseRss("<html>not a feed</html>")).toEqual([]);
    expect(parseRss("")).toEqual([]);
  });
});
