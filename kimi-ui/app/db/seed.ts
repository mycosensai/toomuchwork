import { getDb } from "../api/queries/connection";
import { categories, listings, commissionTiers } from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed categories
  const existingCats = await db.select().from(categories);
  if (existingCats.length === 0) {
    const cats = [
      { name: "Fine Jewelry", slug: "fine-jewelry", icon: "diamond", description: "Estate and designer jewelry pieces", listingCount: 2840 },
      { name: "Rare Coins", slug: "rare-coins", icon: "coins", description: "Numismatic treasures from all eras", listingCount: 4120 },
      { name: "Antiques", slug: "antiques", icon: "landmark", description: "Historical pieces and antiquities", listingCount: 1680 },
      { name: "Fine Art", slug: "fine-art", icon: "palette", description: "Paintings, sculptures, and prints", listingCount: 980 },
      { name: "Luxury Watches", slug: "luxury-watches", icon: "watch", description: "Swiss and haute horlogerie timepieces", listingCount: 3240 },
      { name: "Sports Memorabilia", slug: "sports-memorabilia", icon: "trophy", description: "Signed items and game-used collectibles", listingCount: 5660 },
      { name: "Estate Jewelry", slug: "estate-jewelry", icon: "gem", description: "Vintage and inherited jewelry collections", listingCount: 1940 },
      { name: "Rare Books", slug: "rare-books", icon: "book-open", description: "First editions and historical manuscripts", listingCount: 720 },
    ];
    await db.insert(categories).values(cats);
    console.log("Categories seeded");
  }

  // Seed commission tiers
  const existingTiers = await db.select().from(commissionTiers);
  if (existingTiers.length === 0) {
    const tiers = [
      { minAmount: "0", maxAmount: "999.99", rate: "5.00", label: "Entry Tier", description: "Best rate for items under $1,000" },
      { minAmount: "1000", maxAmount: "7499.99", rate: "7.00", label: "Standard Tier", description: "Standard rate for mid-range items" },
      { minAmount: "7500", maxAmount: "9999.99", rate: "10.00", label: "Premium Tier", description: "Premium rate for high-value items" },
      { minAmount: "10000", maxAmount: null, rate: "5.00", label: "Elite Tier", description: "Lowest rate for items $10,000+" },
    ];
    await db.insert(commissionTiers).values(tiers);
    console.log("Commission tiers seeded");
  }

  // Seed sample listings
  const existingListings = await db.select().from(listings);
  if (existingListings.length === 0) {
    const allCats = await db.select().from(categories);
    const catMap = new Map(allCats.map(c => [c.slug, c.id]));

    const sampleListings = [
      {
        title: "Art Deco Diamond & Sapphire Bracelet",
        description: "Circa 1924, platinum setting with 4.2ct total diamond weight. Accompanied by GIA certification and full provenance documentation.",
        categoryId: catMap.get("fine-jewelry") || 1,
        price: "28500.00",
        commissionRate: "5.00",
        condition: "excellent" as const,
        badge: "verified" as const,
        images: ["jewelry-1"] as string[],
        features: ["GIA Certified", "Platinum", "Art Deco", "4.2ct Diamonds"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 342,
      },
      {
        title: "1909-S VDB Lincoln Cent MS65 PCGS",
        description: "Key date Lincoln cent in exceptional mint state. One of fewer than 500,000 minted. PCGS graded MS-65 with CAC sticker approval.",
        categoryId: catMap.get("rare-coins") || 2,
        price: "14200.00",
        commissionRate: "5.00",
        condition: "mint" as const,
        badge: "hot" as const,
        images: ["coin-1"] as string[],
        features: ["PCGS MS65", "CAC", "Key Date", "Population < 500K"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 891,
      },
      {
        title: "Patek Philippe Ref. 5711/1A-010",
        description: "Stainless steel Nautilus with original box and papers. Purchased 2019, worn fewer than 10 times. Immaculate condition, full service history.",
        categoryId: catMap.get("luxury-watches") || 5,
        price: "95000.00",
        commissionRate: "5.00",
        condition: "excellent" as const,
        badge: "new" as const,
        images: ["watch-1"] as string[],
        features: ["Box & Papers", "2019", "Full Service History", "Blue Dial"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 1247,
      },
      {
        title: "Van Gogh \"At Eternity's Gate\" Etching",
        description: "Original etching, B. 20, signed in pencil. Third state of three. On cream laid paper with full margins.",
        categoryId: catMap.get("fine-art") || 4,
        price: "185000.00",
        commissionRate: "5.00",
        condition: "very_good" as const,
        badge: "verified" as const,
        images: ["art-1"] as string[],
        features: ["Signed", "Original Etching", "Full Margins", "Provenance"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 567,
      },
      {
        title: "Louis XVI Giltwood Console Table",
        description: "Late 18th century French giltwood console table with original marble top. Excellent provenance from Chateau de Versailles collection.",
        categoryId: catMap.get("antiques") || 3,
        price: "42000.00",
        commissionRate: "5.00",
        condition: "good" as const,
        badge: "verified" as const,
        images: ["antique-1"] as string[],
        features: ["Louis XVI", "Original Marble", "Giltwood", "Versailles Provenance"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 234,
      },
      {
        title: "Babe Ruth Signed Baseball PSA/DNA 9",
        description: "Official American League baseball signed by Babe Ruth. PSA/DNA authenticated grade 9 signature. From the estate of a prominent collector.",
        categoryId: catMap.get("sports-memorabilia") || 6,
        price: "85000.00",
        commissionRate: "5.00",
        condition: "excellent" as const,
        badge: "hot" as const,
        images: ["sports-1"] as string[],
        features: ["PSA/DNA 9", "Official AL Ball", "Estate Provenance", "Authenticated"] as string[],
        status: "active" as const,
        isBuyNow: true,
        viewCount: 1876,
      },
    ];

    await db.insert(listings).values(sampleListings);
    console.log("Sample listings seeded");
  }

  console.log("Seeding complete!");
}

seed().catch(console.error);
