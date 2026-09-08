/**
 * Feature 4: Escape Route Generator
 * One-tap "I need to leave" → pre-computes 3 exit routes
 * sorted by crowd avoidance.
 */

import type { ScannerIncident } from '@/types';
import { haversineKm, mergeThreats, buildIncidentAvoidRoute } from '@/lib/route-incidents';

export interface EscapeRoute {
  routeId: string;
  name: string;
  destination: string;
  distanceMeters: number;
  durationSeconds: number;
  crowdAvoidanceScore: number; // 0-100
  threatsAvoided: number;
  geometry: [number, number][];
  steps: string[];
  safeDestinationType: 'parking' | 'hospital' | 'police' | 'church' | 'library' | '24h_business';
}

interface SafeZone {
  name: string;
  type: EscapeRoute['safeDestinationType'];
  lat: number;
  lng: number;
  radiusM: number;
}

/** Pre-mapped safe zones for escape routing */
const SAFE_ZONES: SafeZone[] = [
  { name: 'Nearest Police Station', type: 'police', lat: 32.78, lng: -96.80, radiusM: 100 },
  { name: '24h Hospital ER', type: 'hospital', lat: 32.77, lng: -96.78, radiusM: 200 },
  { name: 'Public Library', type: 'library', lat: 32.79, lng: -96.81, radiusM: 80 },
  { name: '24h Church', type: 'church', lat: 32.775, lng: -96.79, radiusM: 150 },
  { name: 'Large Parking Lot', type: 'parking', lat: 32.785, lng: -96.785, radiusM: 300 },
];

/**
 * Generate 3 escape routes from a location, sorted by crowd avoidance.
 */
export function generateEscapeRoutes(
  origin: [number, number],
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string; speedLimit: number; currentDensity?: { densityLevel: string } | null }>,
  incidents: ScannerIncident[],
  cameras: Array<{ id: string; lat: number; lng: number }>,
): EscapeRoute[] {
  const threats = mergeThreats(incidents, []);

  const routes: EscapeRoute[] = SAFE_ZONES.map((zone) => {
    const route = buildIncidentAvoidRoute(
      origin,
      [zone.lng, zone.lat],
      roadSegments.map((s) => ({ ...s, currentDensity: s.currentDensity || null })),
      threats,
      cameras,
    );
    const crowdScore = Math.max(0, 100 - route.delayFromIncidents / 6);

    return {
      routeId: route.routeId,
      name: `Escape to ${zone.name}`,
      destination: zone.name,
      distanceMeters: route.distanceMeters,
      durationSeconds: route.durationSeconds,
      crowdAvoidanceScore: Math.round(crowdScore),
      threatsAvoided: route.incidentsAvoided,
      geometry: route.geometry,
      steps: route.steps.map((s) => s.instruction),
      safeDestinationType: zone.type,
    };
  });

  // Sort by crowd avoidance score (highest first = safest)
  routes.sort((a, b) => b.crowdAvoidanceScore - a.crowdAvoidanceScore);

  return routes.slice(0, 3);
}

/**
 * Find nearest safe zone from a location.
 */
export function findNearestSafeZone(
  origin: [number, number],
): SafeZone {
  let nearest = SAFE_ZONES[0];
  let minDist = Infinity;

  for (const zone of SAFE_ZONES) {
    const dist = haversineKm(origin[0], origin[1], zone.lat, zone.lng);
    if (dist < minDist) {
      minDist = dist;
      nearest = zone;
    }
  }

  return nearest;
}