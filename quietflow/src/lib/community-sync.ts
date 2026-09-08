'use client';

import type { CommunityReport, CorrectionReport } from '@/types';

/**
 * Syncs community density reports with a Cloudflare Worker + D1 backend.
 * Local reports are the source of truth when offline; remote reports are
 * merged so density reflects your whole circle, not just you.
 * Set VITE_COMMUNITY_API (or NEXT_PUBLIC_COMMUNITY_API) to enable.
 */

const ENDPOINT = process.env.NEXT_PUBLIC_COMMUNITY_API || process.env.VITE_COMMUNITY_API || '';
export const communitySyncEnabled = ENDPOINT.length > 0;

export async function pushReport(r: CommunityReport): Promise<boolean> {
  if (!communitySyncEnabled) return false;
  try {
    await fetch(`${ENDPOINT}/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(r),
      signal: AbortSignal.timeout(8000),
    });
    return true;
  } catch {
    return false;
  }
}

export async function pullReports(sinceMs = 6 * 3600 * 1000): Promise<CommunityReport[]> {
  if (!communitySyncEnabled) return [];
  try {
    const since = new Date(Date.now() - sinceMs).toISOString();
    const res = await fetch(`${ENDPOINT}/reports?since=${encodeURIComponent(since)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []) as CommunityReport[];
  } catch {
    return [];
  }
}

export async function pushCorrection(c: CorrectionReport): Promise<boolean> {
  if (!communitySyncEnabled) return false;
  try {
    await fetch(`${ENDPOINT}/corrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(c),
      signal: AbortSignal.timeout(8000),
    });
    return true;
  } catch {
    return false;
  }
}

export async function pullCorrections(sinceMs = 24 * 3600 * 1000): Promise<CorrectionReport[]> {
  if (!communitySyncEnabled) return [];
  try {
    const since = new Date(Date.now() - sinceMs).toISOString();
    const res = await fetch(`${ENDPOINT}/corrections?since=${encodeURIComponent(since)}`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();
    return (data || []) as CorrectionReport[];
  } catch {
    return [];
  }
}
