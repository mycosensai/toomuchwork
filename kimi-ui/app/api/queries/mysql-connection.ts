/**
 * MySQL Connection for Local Development
 * Cloudflare Workers use D1 instead (see db-d1.ts)
 */

import { createPool, type Pool } from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import * as schema from "../../db/schema";

let pool: Pool | null = null;

function getPool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error("DATABASE_URL environment variable is required for MySQL connection");
    }
    pool = createPool({
      uri: databaseUrl,
      connectionLimit: 10,
      queueLimit: 0,
      waitForConnections: true,
    });
  }
  return pool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}

export type DbClient = ReturnType<typeof getDb>;
