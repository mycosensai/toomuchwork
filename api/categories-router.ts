import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";
import { categories, listings } from "@db/schema";
import { desc, eq } from "drizzle-orm";

export const categoriesRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select().from(categories).orderBy(desc(categories.name));
    const active = await db.select({ categoryId: listings.categoryId }).from(listings).where(eq(listings.status, "active"));
    const counts = new Map<number, number>();
    for (const listing of active) {
      counts.set(listing.categoryId, (counts.get(listing.categoryId) ?? 0) + 1);
    }
    return rows
      .map((category) => ({ ...category, listingCount: counts.get(category.id) ?? 0 }))
      .sort((a, b) => b.listingCount - a.listingCount);
  }),
});
