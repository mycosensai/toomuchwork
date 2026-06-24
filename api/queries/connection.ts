import { drizzle } from "drizzle-orm/d1";
import * as schema from "@db/schema";

let dbInstance: any = null;
let rawD1: any = null;

export function setDb(d1: any) {
  rawD1 = d1;
  dbInstance = drizzle(d1, { schema });
}

export function getDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Call setDb() first.");
  }
  return dbInstance;
}

export function getRawDb() {
  return rawD1;
}