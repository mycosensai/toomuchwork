// Proxy route replaces the deprecated middleware pattern.
// Next.js 16 expects proxy.ts (or middleware.ts with a proxy export) for
// edge middleware. This file is intentionally minimal — all API routes
// are file-based under /app/api/ and need no proxy layer.
import { NextResponse } from 'next/server';

export function proxy() {
  return NextResponse.next();
}
