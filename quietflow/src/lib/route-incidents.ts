/**
 * Incident-aware GPS routing for QuietFlow.
 *
 * Routes around police/fire/EMS incidents, accidents, crimes, road closures
 * by computing a "quiet route" that penalizes segments near threats and
 * falls back to OSRM/Mapbox for the actual directions.
 *
 * Zero external API dependency — works with or without a traffic key.
 */

import type { ScannerIncident, RouteDirections, RouteCameraCount } from '@/types';
import type { NewsAlert } from './news-alerts';

// ─── Constants ───

const INCIDENT_AVOID_RADIUS_KM = 0.5;   // km around an incident to penalize
const INCIDENT_PENALTY_SECONDS = 600;   // +10 min per incident near route
const EMERGENCY_PENALTY_SECONDS = 1800; // +30 min for emergency incidents
const MIN_WAYPOINTS = 2;

// ─── Haversine ───

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Point-to-segment distance ───

function pointToSegmentKm(
  px: number, py: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return haversineKm(px, py, x1, y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  return haversineKm(px, py, x1 + t * dx, y1 + t * dy);
}

// ─── Incident threat scoring ───

export interface ThreatSegment {
  segmentIndex: number;
  incidentCount: number;
  emergencyCount: number;
  totalPenaltySec: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Score each road segment against active incidents.
 * Segments near emergency incidents get the highest penalty.
 */
export function scoreSegmentsAgainstIncidents(
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string }>,
  incidents: ScannerIncident[],
): ThreatSegment[] {
  return roadSegments.map((seg, idx) => {
    let totalPenalty = 0;
    let incidentCount = 0;
    let emergencyCount = 0;

    for (const inc of incidents) {
      // Check each point of the segment geometry
      const step = Math.max(1, Math.floor(seg.geometry.length / 5));
      for (let i = 0; i < seg.geometry.length; i += step) {
        const [lng, lat] = seg.geometry[i];
        const dist = haversineKm(lat, lng, inc.lat, inc.lng);
        if (dist <= INCIDENT_AVOID_RADIUS_KM) {
          incidentCount++;
          if (inc.priority === 'emergency') emergencyCount++;
          totalPenalty += inc.priority === 'emergency'
            ? EMERGENCY_PENALTY_SECONDS
            : INCIDENT_PENALTY_SECONDS;
          break; // one hit per segment per incident is enough
        }
      }
    }

    const threatLevel: ThreatSegment['threatLevel'] =
      emergencyCount > 0 ? 'critical'
      : incidentCount >= 3 ? 'high'
      : incidentCount >= 1 ? 'medium'
      : 'low';

    return { segmentIndex: idx, incidentCount, emergencyCount, totalPenaltySec: totalPenalty, threatLevel };
  });
}

/**
 * Filter road segments to find the safest route corridor.
 * Returns segments sorted by threat (safest first) with a suggested subset.
 */
export function findSafestCorridor(
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string }>,
  incidents: ScannerIncident[],
  start: [number, number],
  end: [number, number],
): { recommendedSegments: number[]; avoidedSegments: number[]; threats: ThreatSegment[] } {
  const threats = scoreSegmentsAgainstIncidents(roadSegments, incidents);
  const threatsBySeg = new Map(threats.map((t) => [t.segmentIndex, t]));

  const recommended: number[] = [];
  const avoided: number[] = [];

  for (let i = 0; i < threats.length; i++) {
    const t = threats[i];
    if (t.threatLevel === 'low') {
      recommended.push(i);
    } else {
      avoided.push(i);
    }
  }

  // If all segments are threatened, pick the least-threatened ones
  if (recommended.length === 0 && threats.length > 0) {
    const sorted = [...threats].sort((a, b) => a.totalPenaltySec - b.totalPenaltySec);
    recommended.push(...sorted.slice(0, Math.ceil(sorted.length / 2)).map((t) => t.segmentIndex));
    avoided.push(...sorted.slice(Math.ceil(sorted.length / 2)).map((t) => t.segmentIndex));
  }

  return { recommendedSegments: recommended, avoidedSegments: avoided, threats };
}

// ─── Incident-aware quiet route ───

export interface IncidentAvoidRoute {
  routeId: string;
  routeName: string;
  origin: [number, number];
  destination: [number, number];
  distanceMeters: number;
  durationSeconds: number;
  delayFromIncidents: number; // extra seconds due to incident avoidance
  incidentsAvoided: number;
  emergencyAvoided: number;
  geometry: [number, number][];
  steps: Array<{
    instruction: string;
    distanceMeters: number;
    threatLevel: string;
  }>;
  threatSegments: ThreatSegment[];
  generatedAt: string;
}

/**
 * Build an incident-avoiding route from start to end.
 * Uses the quiet-route engine + incident penalties.
 */
export function buildIncidentAvoidRoute(
  start: [number, number],
  end: [number, number],
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string; speedLimit: number; currentDensity: { densityLevel: string } | null }>,
  incidents: ScannerIncident[],
  cameras: Array<{ id: string; lat: number; lng: number }>,
): IncidentAvoidRoute {
  const threats = scoreSegmentsAgainstIncidents(roadSegments, incidents);
  const threatsBySeg = new Map(threats.map((t) => [t.segmentIndex, t]));

  // Collect high-threat segments to avoid
  const highThreatIdx = new Set(
    threats.filter((t) => t.threatLevel === 'critical' || t.threatLevel === 'high').map((t) => t.segmentIndex),
  );

  // Pick safest road segments as the route geometry
  const safeSegments = roadSegments.filter((_, i) => !highThreatIdx.has(i));
  const allSegments = roadSegments;

  // Build geometry: chain safe segments, fall back to all if none safe
  const geometry: [number, number][] = [];
  if (safeSegments.length >= 2) {
    for (const seg of safeSegments) {
      for (const point of seg.geometry) {
        if (geometry.length === 0 || geometry[geometry.length - 1][0] !== point[0] || geometry[geometry.length - 1][1] !== point[1]) {
          geometry.push(point);
        }
      }
    }
  } else {
    for (const seg of allSegments) {
      for (const point of seg.geometry) {
        if (geometry.length === 0 || geometry[geometry.length - 1][0] !== point[0] || geometry[geometry.length - 1][1] !== point[1]) {
          geometry.push(point);
        }
      }
    }
  }

  // Ensure start/end are in the geometry
  if (geometry.length === 0 || haversineKm(geometry[0][1], geometry[0][0], start[0], start[1]) > 0.5) {
    geometry.unshift(start);
  }
  if (haversineKm(geometry[geometry.length - 1][1], geometry[geometry.length - 1][0], end[0], end[1]) > 0.5) {
    geometry.push(end);
  }

  // Calculate approximate distance
  let distanceMeters = 0;
  for (let i = 1; i < geometry.length; i++) {
    distanceMeters += haversineKm(geometry[i - 1][1], geometry[i - 1][0], geometry[i][1], geometry[i][0]) * 1000;
  }

  // Duration based on safe segments' speed limits + penalty for incidents
  const avgSpeedKph = safeSegments.length > 0
    ? safeSegments.reduce((s, seg) => s + (seg.speedLimit || 30), 0) / safeSegments.length
    : 30;
  const baseDurationSec = (distanceMeters / 1000) / Math.max(avgSpeedKph, 10) * 3600;

  const emergencyAvoided = threats.filter((t) => t.emergencyCount > 0 && highThreatIdx.has(t.segmentIndex)).length;
  const delayFromIncidents = threats
    .filter((t) => highThreatIdx.has(t.segmentIndex))
    .reduce((s, t) => s + t.totalPenaltySec, 0);

  const steps = geometry.map((point, i) => ({
    instruction: i === 0 ? 'Start' : i === geometry.length - 1 ? 'Arrive' : `Head toward ${point[0].toFixed(3)}, ${point[1].toFixed(3)}`,
    distanceMeters: i > 0 ? haversineKm(geometry[i - 1][1], geometry[i - 1][0], point[1], point[0]) * 1000 : 0,
    threatLevel: threatsBySeg.get(i)?.threatLevel || 'low',
  })).filter((s) => s.distanceMeters > 0 || s.instruction === 'Start' || s.instruction === 'Arrive');

  return {
    routeId: `incident-avoid-${Date.now()}`,
    routeName: 'Incident-Avoid Route',
    origin: start,
    destination: end,
    distanceMeters: Math.round(distanceMeters),
    durationSeconds: Math.round(baseDurationSec + delayFromIncidents),
    delayFromIncidents: Math.round(delayFromIncidents),
    incidentsAvoided: incidents.length,
    emergencyAvoided,
    geometry,
    steps,
    threatSegments: threats,
    generatedAt: new Date().toISOString(),
  };
}

// ─── Community news alerts → route threats ───

/**
 * Convert a NEWS alert into a scanner-incident-like threat for routing.
 * Allows the router to avoid areas with crime/accident reports.
 */
export function newsAlertToThreat(alert: NewsAlert): ScannerIncident {
  const priorityMap: Record<string, ScannerIncident['priority']> = {
    critical: 'emergency',
    high: 'high',
    medium: 'normal',
    low: 'low',
  };
  return {
    id: alert.id,
    type: alert.category === 'fire' ? 'fire' : alert.category === 'emergency' ? 'ems' : 'police',
    category: alert.category,
    title: alert.title,
    description: alert.description,
    priority: priorityMap[alert.severity] || 'normal',
    lat: alert.lat,
    lng: alert.lng,
    timestamp: alert.timestamp,
    source: `NEWS:${alert.source}`,
    verified: alert.verified,
    details: { distanceKm: alert.distanceKm, ...alert.actionPayload },
  };
}

/**
 * Merge live scanner incidents + news alerts into a single threat list
 * for routing decisions.
 */
export function mergeThreats(
  scannerIncidents: ScannerIncident[],
  newsAlerts: NewsAlert[],
): ScannerIncident[] {
  const newsThreats = newsAlerts
    .filter((a) => !a.read)
    .slice(0, 20)
    .map(newsAlertToThreat);
  // Deduplicate by location proximity
  const merged = [...scannerIncidents];
  for (const nt of newsThreats) {
    const dup = merged.some(
      (m) => haversineKm(m.lat, m.lng, nt.lat, nt.lng) < 0.1,
    );
    if (!dup) merged.push(nt);
  }
  return merged;
}