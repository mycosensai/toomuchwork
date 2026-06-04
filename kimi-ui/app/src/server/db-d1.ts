/**
 * Cloudflare D1 Database Connection
 * Uses SQLite via Drizzle ORM for Cloudflare Workers
 */

import { drizzle } from "drizzle-orm/d1";
import * as schema from "../../db/schema-sqlite";

export type D1Database = any; // Cloudflare D1 binding type

export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

export type DbClient = ReturnType<typeof createDb>;

// Global db instance for Workers
let dbInstance: DbClient | null = null;
let currentD1: D1Database | null = null;

export function getDb(d1?: D1Database): DbClient {
  if (d1 && d1 !== currentD1) {
    currentD1 = d1;
    dbInstance = createDb(d1);
  }
  if (!dbInstance && d1) {
    dbInstance = createDb(d1);
  }
  if (!dbInstance) {
    throw new Error("D1 database not initialized. Pass D1 binding to getDb().");
  }
  return dbInstance;
}

export function setDb(d1: D1Database) {
  currentD1 = d1;
  dbInstance = createDb(d1);
}
