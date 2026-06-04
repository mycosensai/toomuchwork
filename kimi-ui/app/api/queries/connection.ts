/**
 * Unified Database Connection
 * Uses MySQL2 in local dev, D1 (SQLite) in Cloudflare Workers
 */

import { getDb as getMySqlDb } from "./mysql-connection";

// In Cloudflare Workers, DB is set via setDb(binding)
// In Node.js dev, MySQL is used directly
let d1Db: any = null;

export function setD1Database(db: any) {
  d1Db = db;
}

export function getDb(): any {
  // If D1 is available (Cloudflare Worker), use it
  if (d1Db) {
    return d1Db;
  }
  // Otherwise fall back to MySQL (local development)
  return getMySqlDb();
}
