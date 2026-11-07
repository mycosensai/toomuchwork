import { eq } from "drizzle-orm";
import { systemSettings } from "@db/schema";
import { getDb } from "../queries/connection";

type Db = ReturnType<typeof getDb>;

export async function isSamsonArmed(db: Db = getDb()): Promise<boolean> {
  const [setting] = await db
    .select()
    .from(systemSettings)
    .where(eq(systemSettings.key, "samson_armed"))
    .limit(1);
  return setting?.value === "true";
}

export async function assertAgentsAllowed(db: Db = getDb()): Promise<void> {
  if (await isSamsonArmed(db)) {
    throw new Error("SAMSON is armed. Agent execution is frozen.");
  }
}
