/**
 * Feature 8: Crowd Auto-Nav
 * Auto-reroutes away from crowds in real-time.
 * Like Waze but for people.
 */

import type { ScannerIncident } from '@/types';
import { buildIncidentAvoidRoute, mergeThreats, scoreSegmentsAgainstIncidents } from '@/lib/route-incidents';

export interface CrowdAvoidRoute {
  routeId: string;
  geometry: [number, number][];
  crowdDensityAvoided: number;
  detourDistanceM: number;
  detourTimeMin: number;
  autoRerouted: boolean;
  triggers: string[];
}

export function checkAutoReroute(
  currentRoute: { origin: [number, number]; destination: [number, number]; geometry: [number, number][] },
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string; speedLimit: number; currentDensity?: { densityLevel: string } | null }>,
  incidents: ScannerIncident[],
  cameras: Array<{ id: string; lat: number; lng: number }>,
  threshold: 'low' | 'medium' | 'high' = 'medium',
): CrowdAvoidRoute | null {
  const threats = mergeThreats(incidents, []);
  const scores = scoreSegmentsAgainstIncidents(roadSegments, threats);

  const highThreatCount = scores.filter((s) => s.threatLevel === 'high' || s.threatLevel === 'critical').length;
  const totalThreats = scores.filter((s) => s.threatLevel !== 'low').length;

  const triggerThreshold = threshold === 'low' ? 1 : threshold === 'medium' ? 3 : 5;

  if (totalThreats < triggerThreshold) {
    return null;
  }

  const avoidRoute = buildIncidentAvoidRoute(
    currentRoute.origin,
    currentRoute.destination,
    roadSegments.map((s) => ({ ...s, currentDensity: s.currentDensity || null })),
    threats,
    cameras,
  );

  const triggers: string[] = [];
  if (highThreatCount > 0) triggers.push(`${highThreatCount} high-threat segments`);
  if (avoidRoute.emergencyAvoided > 0) triggers.push(`${avoidRoute.emergencyAvoided} emergency zones`);
  triggers.push(`${avoidRoute.incidentsAvoided} total incidents avoided`);

  return {
    routeId: avoidRoute.routeId,
    geometry: avoidRoute.geometry,
    crowdDensityAvoided: avoidRoute.incidentsAvoided * 10,
    detourDistanceM: avoidRoute.distanceMeters - (currentRoute.geometry.length * 50),
    detourTimeMin: Math.round(avoidRoute.delayFromIncidents / 60),
    autoRerouted: true,
    triggers,
  };
}

export function startCrowdMonitor(
  getCurrentRoute: () => { origin: [number, number]; destination: [number, number]; geometry: [number, number][] } | null,
  roadSegments: Array<{ id: string; geometry: [number, number][]; name: string; speedLimit: number; currentDensity?: { densityLevel: string } | null }>,
  incidents: ScannerIncident[],
  cameras: Array<{ id: string; lat: number; lng: number }>,
  intervalSec: number,
  onReroute: (route: CrowdAvoidRoute) => void,
): () => void {
  let running = true;
  const interval = setInterval(() => {
    if (!running) return;
    const route = getCurrentRoute();
    if (!route) return;
    const result = checkAutoReroute(route, roadSegments, incidents, cameras);
    if (result) {
      onReroute(result);
    }
  }, intervalSec * 1000);
  return () => { clearInterval(interval); running = false; };
}