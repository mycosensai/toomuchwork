// ─── Dynamic Traffic Tracking Engine ────────────────────────────────
// Tracks live per-segment speed, congestion, travel time, and ETAs.
// Simulates real-time traffic flow with time-of-day modeling and can
// be swapped for live traffic APIs (TomTom/Mapbox) in production.

import { RoadSegment, DensityLevel } from '@/types';
import { timeOfDayMultiplier } from './density-utils';

export type TrafficState = 'free' | 'light' | 'moderate' | 'heavy' | 'severe';

export interface LiveTrafficSegment {
  segmentId: string;
  name: string;
  speedKph: number;
  freeFlowSpeedKph: number;
  congestionLevel: DensityLevel;
  trafficState: TrafficState;
  travelTimeMin: number;
  freeFlowTimeMin: number;
  delayMin: number;             // extra minutes vs free-flow
  congestionIndex: number;      // 0-1
  timestamp: string;
  construction?: boolean;
  incident?: boolean;
  historicalBaseline: number;   // typical speed at this hour
}

export interface RouteETASegment {
  segmentId: string;
  name: string;
  travelTimeMin: number;
  delayMin: number;
  speedKph: number;
}

export interface RouteETA {
  routeId: string;
  segments: RouteETASegment[];
  totalMinutes: number;
  freeFlowMinutes: number;
  delayMinutes: number;
  congestionIndex: number;      // 0-1 overall
  estimatedArrival: string;     // ISO timestamp
  status: TrafficState;
  routeName: string;
  recalculatedAt: string;
}

export interface TrafficIncidentEvent {
  id: string;
  segmentId: string;
  name: string;
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  delayAddedMin: number;
  startedAt: string;
  active: boolean;
  source: string;
}

export const TRAFFIC_STATE_LABEL: Record<TrafficState, string> = {
  free: 'Free flowing',
  light: 'Light',
  moderate: 'Moderate',
  heavy: 'Heavy',
  severe: 'Severe',
};

const STATE_COLOR: Record<TrafficState, string> = {
  free: '#22c55e',
  light: '#84cc16',
  moderate: '#eab308',
  heavy: '#f97316',
  severe: '#ef4444',
};

const LEVEL_INDEX: Record<DensityLevel, number> = { green: 0, yellow: 0.25, orange: 0.5, red: 0.75, purple: 1 };

export function trafficStateFromIndex(idx: number): TrafficState {
  if (idx < 0.15) return 'free';
  if (idx < 0.35) return 'light';
  if (idx < 0.6) return 'moderate';
  if (idx < 0.8) return 'heavy';
  return 'severe';
}

export function stateColor(state: TrafficState): string {
  return STATE_COLOR[state];
}

/** Deterministic noise from seed. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Compute a live traffic snapshot for each road segment based on
 * time-of-day model + deterministic pseudo-random fluctuation.
 */
export function computeLiveTraffic(roadSegments: RoadSegment[], hour?: number): LiveTrafficSegment[] {
  const h = hour ?? new Date().getHours();
  const isWeekend = [0, 6].includes(new Date().getDay());
  const minute = Math.floor(Date.now() / 60000);

  return roadSegments.map((rs) => {
    const freeFlowSpeedKph = Math.round(rs.speedLimit * 1.609); // mph -> km/h
    const mult = timeOfDayMultiplier(h, undefined, isWeekend);

    // Congestion index from current density + time multiplier + noise
    const baseLevel = LEVEL_INDEX[rs.currentDensity?.densityLevel || 'green'] ?? 0;
    const rushBoost = (h >= 7 && h <= 9) || (h >= 16 && h <= 19) ? 0.25 : 0;
    const fl = noise(rs.id.length + minute) ; // deterministic minute-level fluctuation
    const congIndex = Math.min(1, baseLevel * 0.5 + (mult - 1) * 0.3 + rushBoost + fl * 0.15);
    const idx = Math.max(0, congIndex);

    const speedKph = Math.max(8, Math.round(freeFlowSpeedKph * (1 - idx * 0.75)));
    const segmentLengthKm = estimateSegmentLengthKm(rs.geometry);
    const travelTimeMin = (segmentLengthKm / speedKph) * 60;
    const freeFlowTimeMin = (segmentLengthKm / freeFlowSpeedKph) * 60;
    const delayMin = Math.max(0, travelTimeMin - freeFlowTimeMin);

    const state = trafficStateFromIndex(idx);
    const construction = noise(rs.id.length + 7 + minute) < 0.08;
    const incident = noise(rs.id.length + 13 + minute) < 0.06;

    // Historical baseline (typical speed at this hour without noise)
    const histMult = timeOfDayMultiplier(h, undefined, isWeekend);
    const historicalBaseline = Math.round(freeFlowSpeedKph * (1 - Math.min(0.7, Math.max(0, (histMult - 1) * 0.4 + rushBoost))));

    return {
      segmentId: rs.id,
      name: rs.name,
      speedKph,
      freeFlowSpeedKph,
      congestionLevel: (idx < 0.15 ? 'green' : idx < 0.35 ? 'yellow' : idx < 0.6 ? 'orange' : idx < 0.8 ? 'red' : 'purple') as DensityLevel,
      trafficState: state,
      travelTimeMin: Math.round(travelTimeMin * 10) / 10,
      freeFlowTimeMin: Math.round(freeFlowTimeMin * 10) / 10,
      delayMin: Math.round(delayMin * 10) / 10,
      congestionIndex: Math.round(idx * 100) / 100,
      timestamp: new Date().toISOString(),
      construction,
      incident,
      historicalBaseline,
    };
  });
}

/**
 * Compute ETA for a route through a set of segments, honoring the live
 * traffic snapshot and optionally road incidents.
 */
export function computeRouteETA(
  routeId: string,
  routeName: string,
  segmentIds: string[],
  traffic: LiveTrafficSegment[],
  incidents: TrafficIncidentEvent[],
  start: [number, number],
  end: [number, number],
): RouteETA {
  const segs = traffic.filter((t) => segmentIds.includes(t.segmentId));
  const routeIncidents = incidents.filter((i) => i.active && segmentIds.includes(i.segmentId));

  const etaSegments: RouteETASegment[] = segs.map((s) => {
    let time = s.travelTimeMin;
    // Add incident delay
    const inc = routeIncidents.filter((i) => i.segmentId === s.segmentId);
    const incDelay = inc.reduce((sum, i) => sum + i.delayAddedMin, 0);
    time += incDelay;
    return {
      segmentId: s.segmentId,
      name: s.name,
      travelTimeMin: Math.round(time * 10) / 10,
      delayMin: Math.round((time - s.freeFlowTimeMin) * 10) / 10,
      speedKph: s.speedKph,
    };
  });

  const totalMinutes = etaSegments.reduce((s, seg) => s + seg.travelTimeMin, 0);
  const freeFlowMinutes = segs.reduce((s, seg) => s + seg.freeFlowTimeMin, 0);
  const delayMinutes = Math.max(0, totalMinutes - freeFlowMinutes);
  const avgIndex = segs.length ? segs.reduce((s, seg) => s + seg.congestionIndex, 0) / segs.length : 0;

  return {
    routeId,
    segments: etaSegments,
    totalMinutes: Math.round(totalMinutes * 10) / 10,
    freeFlowMinutes: Math.round(freeFlowMinutes * 10) / 10,
    delayMinutes: Math.round(delayMinutes * 10) / 10,
    congestionIndex: Math.round(avgIndex * 100) / 100,
    estimatedArrival: new Date(Date.now() + totalMinutes * 60000).toISOString(),
    status: trafficStateFromIndex(avgIndex),
    routeName,
    recalculatedAt: new Date().toISOString(),
  };
}

function estimateSegmentLengthKm(geometry: [number, number][]): number {
  if (!geometry || geometry.length < 2) return 1;
  let d = 0;
  for (let i = 0; i < geometry.length - 1; i++) {
    const [lng1, lat1] = geometry[i];
    const [lng2, lat2] = geometry[i + 1];
    d += haversineKm(lat1, lng1, lat2, lng2);
  }
  return Math.max(0.2, d);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

/**
 * Generate simulated traffic incident events along segments (deterministic).
 */
export function generateTrafficIncidents(roadSegments: RoadSegment[], hour?: number): TrafficIncidentEvent[] {
  const h = hour ?? new Date().getHours();
  const minute = Math.floor(Date.now() / 60000);
  const incidents: TrafficIncidentEvent[] = [];

  roadSegments.forEach((rs, i) => {
    const r = noise(rs.id.length + minute + i);
    const isHighway = rs.name.match(/I-\d|US-\d|Tollway/i);
    if (r < (isHighway ? 0.18 : 0.1)) {
      const severityRoll = noise(rs.id.length + 99 + minute);
      const severity: TrafficIncidentEvent['severity'] = severityRoll < 0.3 ? 'minor' : severityRoll < 0.6 ? 'moderate' : severityRoll < 0.85 ? 'major' : 'critical';
      const delayMap = { minor: 3, moderate: 8, major: 15, critical: 25 };
      const types = ['collision', 'disabled vehicle', 'construction', 'road work', 'flare-up', 'obstruction', 'signal malfunction'];
      const type = types[Math.floor(noise(rs.id.length + 200 + minute) * types.length)];
      incidents.push({
        id: `tr-inc-${rs.id}-${minute}`,
        segmentId: rs.id,
        name: rs.name,
        type,
        description: `${capitalize(type)} reported on ${rs.name}`,
        severity,
        delayAddedMin: delayMap[severity],
        startedAt: new Date(Date.now() - Math.floor(noise(minute) * 25) * 60000).toISOString(),
        active: true,
        source: 'traffic model',
      });
    }
  });
  return incidents;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Best time to leave given predicted congestion, returns recommended departure hour. */
export function recommendDeparture(countsByHour: number[]): { hour: number; label: string } {
  let bestHour = 0;
  let best = Infinity;
  countsByHour.forEach((c, i) => { if (c < best) { best = c; bestHour = i; } });
  const ampm = bestHour >= 12 ? 'PM' : 'AM';
  const h = bestHour % 12 || 12;
  return { hour: bestHour, label: `${h}${ampm}` };
}
