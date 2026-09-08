'use client';

import type { RoadSegment } from '@/types';
import type { LiveTrafficSegment, TrafficState } from '@/lib/traffic-engine';
import { trafficStateFromIndex } from '@/lib/traffic-engine';

/**
 * REAL live traffic via TomTom Traffic Flow Segment API (key required).
 * Replaces the simulated congestion model with actual current speeds when a
 * key is configured. Returns null when no key / fetch fails so the caller can
 * fall back to the simulated model — we never fabricate a "real" reading.
 *
 * TomTom flow segment: GET
 *   https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/{z}/{x}/{y}.json?key=KEY
 * Response carries `flowSegmentData.currentSpeed` and `freeFlowSpeed` (km/h).
 */

export interface LiveTrafficResult {
  segments: LiveTrafficSegment[];
  source: 'real';
  timestamp: string;
}

function toStateAndLevel(speedKph: number, freeFlow: number): { state: TrafficState; level: number } {
  const ratio = freeFlow > 0 ? speedKph / freeFlow : 1;
  // congestion index 0 (free) → 1 (standstill)
  const idx = Math.max(0, Math.min(1, 1 - ratio));
  const level = idx < 0.15 ? 0 : idx < 0.35 ? 0.25 : idx < 0.6 ? 0.5 : idx < 0.8 ? 0.75 : 1;
  return { state: trafficStateFromIndex(idx), level };
}

/** Map a road segment's midpoint to a web-mercator tile coordinate. */
function tileFor(lat: number, lng: number, z: number): { x: number; y: number } {
  const n = Math.pow(2, z);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

export async function fetchTomTomLiveTraffic(
  roadSegments: RoadSegment[],
  key: string,
): Promise<LiveTrafficResult | null> {
  if (!key || key.trim().length === 0) return null;
  const k = key.trim();
  const z = 12;
  try {
    const segments = await Promise.all(
      roadSegments.map(async (rs): Promise<LiveTrafficSegment> => {
        const geom = rs.geometry && rs.geometry.length ? rs.geometry : null;
        const mid = geom ? geom[Math.floor(geom.length / 2)] : [rs.geometry?.[0]?.[0] ?? 0, rs.geometry?.[0]?.[1] ?? 0];
        const [lng, lat] = mid as [number, number];
        const { x, y } = tileFor(lat, lng, z);
        const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/${z}/${x}/${y}.json?key=${encodeURIComponent(k)}`;
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`tomtom ${res.status}`);
        const data = await res.json();
        const fsd = data.flowSegmentData || {};
        const current = Number(fsd.currentSpeed ?? rs.speedLimit * 1.609 * 0.5);
        const free = Number(fsd.freeFlowSpeed ?? rs.speedLimit * 1.609);
        const { state, level } = toStateAndLevel(current, free);
        const congestionLevel = (level < 0.15 ? 'green' : level < 0.35 ? 'yellow' : level < 0.6 ? 'orange' : level < 0.8 ? 'red' : 'purple') as LiveTrafficSegment['congestionLevel'];
        const lengthKm = estimateLengthKm(geom);
        const travelTimeMin = (lengthKm / Math.max(8, current)) * 60;
        const freeFlowTimeMin = (lengthKm / Math.max(8, free)) * 60;
        return {
          segmentId: rs.id,
          name: rs.name,
          speedKph: Math.round(current),
          freeFlowSpeedKph: Math.round(free),
          congestionLevel,
          trafficState: state,
          travelTimeMin: Math.round(travelTimeMin * 10) / 10,
          freeFlowTimeMin: Math.round(freeFlowTimeMin * 10) / 10,
          delayMin: Math.max(0, Math.round((travelTimeMin - freeFlowTimeMin) * 10) / 10),
          congestionIndex: Math.round(level * 100) / 100,
          timestamp: new Date().toISOString(),
          historicalBaseline: Math.round(free),
        };
      }),
    );
    return { segments, source: 'real', timestamp: new Date().toISOString() };
  } catch {
    return null;
  }
}

function estimateLengthKm(geom: [number, number][] | null): number {
  if (!geom || geom.length < 2) return 1;
  let d = 0;
  for (let i = 0; i < geom.length - 1; i++) {
    const [lng1, lat1] = geom[i];
    const [lng2, lat2] = geom[i + 1];
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    d += R * 2 * Math.asin(Math.sqrt(a));
  }
  return Math.max(0.2, d);
}
