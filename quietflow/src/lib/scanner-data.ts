// ─── Police/Fire Scanner Data Module ────────────────────────────
// Generates a live police/fire/EMS incident feed for the QuietFlow scanner.
// In production this would hit Open511, RSS, or Broadcastify APIs.
// For the demo build we use a deterministic pseudo-random generator
// seeded from the current minute so incidents feel "live" but stable.

import { ScannerIncident, ScannerConfig } from '@/types';
import { haversineKm } from './camera-discovery';

// ─── DFW-area seed incidents (realistic, static) ────────────────

const POLICE_INCIDENTS = [
  { category: 'traffic_stop', title: 'Traffic Stop', description: 'Routine traffic stop on US-75 near Mockingbird Ln', priority: 'low' as const },
  { category: 'accident', title: 'Multi-car Accident', description: '3-car collision on I-30E near Zang Blvd. One lane blocked.', priority: 'high' as const },
  { category: 'incident', title: 'Shooting Investigation', description: 'Police investigating reported shooting. Avoid area.', priority: 'emergency' as const },
  { category: 'patrol', title: 'Police Activity', description: 'Active police presence near downtown. Expect delays.', priority: 'normal' as const },
  { category: 'accident', title: 'Minor Fender-bender', description: 'Two vehicles side-swiped on NW Hwy near Midpark.', priority: 'normal' as const },
  { category: 'traffic_stop', title: 'Commercial Vehicle Inspection', description: 'Truck inspection zone on I-35E near Royal Lane.', priority: 'low' as const },
  { category: 'incident', title: 'Hazardous Material Spill', description: 'Chemical spill reported on I-635 at Coit Road. Hazmat en route.', priority: 'high' as const },
];

const FIRE_INCIDENTS = [
  { category: 'structure_fire', title: 'Structure Fire', description: 'House fire in progress. Multiple units responding.', priority: 'emergency' as const },
  { category: 'vehicle_fire', title: 'Vehicle Fire', description: 'Car fire on I-30 near Beckley. All lanes blocked.', priority: 'high' as const },
  { category: 'brush_fire', title: 'Brush Fire', description: 'Small brush fire near White Rock Lake trail.', priority: 'normal' as const },
  { category: 'medical_call', title: 'Medical Emergency (Fire Dept)', description: 'Fire medic responding to medical call near Lakewood.', priority: 'normal' as const },
];

const EMS_INCIDENTS = [
  { category: 'medical', title: 'Medical Emergency', description: 'Ambulance response to residential area near White Rock.', priority: 'normal' as const },
  { category: 'medical', title: 'Fall Injury', description: 'Person down at shopping center on N. Central Expressway.', priority: 'high' as const },
  { category: 'medical', title: 'Cardiac Event', description: 'EMS responding to possible cardiac incident near Preston & Northwest Hwy.', priority: 'emergency' as const },
];

// Incident spawn points — spread across the DFW map area (Dallas centroid ~32.795, -96.796)
const INCIDENT_LOCATIONS = [
  { lat: 32.838, lng: -96.781 },   // Mockingbird / US-75
  { lat: 32.767, lng: -96.800 },   // I-30 / Zang
  { lat: 32.820, lng: -96.800 },   // near downtown
  { lat: 32.830, lng: -96.730 },   // White Rock
  { lat: 32.780, lng: -96.790 },   // downtown core
  { lat: 32.783, lng: -96.799 },   // downtown / Elm St
  { lat: 32.859, lng: -96.810 },   // NW Hwy / Loop 12
  { lat: 32.905, lng: -96.779 },   // Forest Ln / US-75
  { lat: 32.813, lng: -96.769 },   // Greenville Ave
  { lat: 32.742, lng: -96.822 },   // Oak Cliff / Jefferson
  { lat: 32.840, lng: -96.830 },   // Love Field area
  { lat: 32.870, lng: -96.755 },   // Skillman area
  { lat: 32.798, lng: -96.815 },   // Oak Lawn / Stemmons
  { lat: 32.860, lng: -96.810 },   // Preston / NW Hwy
  { lat: 32.770, lng: -96.790 },   // South Dallas
];

// Simple seeded RNG for deterministic but time-varying incident generation
function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Generate the current set of mock scanner incidents.
 * Uses the current minute as a seed so the set is stable within a minute
 * but changes between minutes (simulating live refresh).
 */
export function generateMockIncidents(config?: Partial<ScannerConfig>): ScannerIncident[] {
  const now = new Date();
  const minuteSeed = Math.floor(now.getTime() / 60000);
  const rng = seededRandom(minuteSeed);

  const centerLat = config?.centerLat ?? 32.795;
  const centerLng = config?.centerLng ?? -96.796;
  const radiusKm = config?.radiusKm ?? 15;

  const incidents: ScannerIncident[] = [];

  // Pick 4-8 incidents to show live at any given time
  const numIncidents = 4 + Math.floor(rng() * 5);

  const types: Array<'police' | 'fire' | 'ems'> = ['police', 'fire', 'ems'];
  const typeWeights = [0.5, 0.25, 0.25]; // police most common

  for (let i = 0; i < numIncidents; i++) {
    // Weighted random type
    const r = rng();
    let type: 'police' | 'fire' | 'ems';
    if (r < typeWeights[0]) type = 'police';
    else if (r < typeWeights[0] + typeWeights[1]) type = 'fire';
    else type = 'ems';

    const pool = type === 'police' ? POLICE_INCIDENTS
              : type === 'fire' ? FIRE_INCIDENTS
              : EMS_INCIDENTS;

    const template = pool[Math.floor(rng() * pool.length)];
    const loc = INCIDENT_LOCATIONS[Math.floor(rng() * INCIDENT_LOCATIONS.length)];

    // Only include if within the scanner radius
    const dist = haversineKm(centerLat, centerLng, loc.lat, loc.lng);
    if (dist > radiusKm) continue;

    // Age: 0-45 minutes ago
    const ageMinutes = Math.floor(rng() * 45);
    let timestamp = new Date(now.getTime() - ageMinutes * 60000).toISOString();

    // Emergency incidents tend to be fresher
    let age = ageMinutes;
    if (template.priority === 'emergency') {
      age = Math.floor(rng() * 15);
      timestamp = new Date(now.getTime() - age * 60000).toISOString();
    }

    incidents.push({
      id: `mock-${type}-${i}-${minuteSeed}`,
      type,
      category: template.category,
      title: template.title,
      description: template.description,
      priority: template.priority,
      lat: loc.lat + (rng() - 0.5) * 0.01,
      lng: loc.lng + (rng() - 0.5) * 0.01,
      timestamp,
      source: 'QuietFlow Live Scanner',
      verified: true,
      details: {
        distanceKm: dist,
        ageMinutes: age,
      },
    });
  }

  // Sort by priority (emergency first)
  const priorityOrder = { emergency: 0, high: 1, normal: 2, low: 3 };
  return incidents.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

/**
 * Check which incidents are en-route along a set of route waypoints.
 * An incident is "en route" if it is within `maxDistanceKm` of any
 * segment of the route polyline.
 */
export function detectEnRouteIncidents(
  waypoints: [number, number][],
  incidents: ScannerIncident[],
  maxDistanceKm: number = 0.5,
): ScannerIncident[] {
  if (waypoints.length < 2) return [];

  const enRoute: ScannerIncident[] = [];

  for (const inc of incidents) {
    let minDist = Infinity;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const [lat1, lng1] = waypoints[i];
      const [lat2, lng2] = waypoints[i + 1];
      const d = pointToSegmentDistanceKm(inc.lat, inc.lng, lat1, lng1, lat2, lng2);
      if (d < minDist) minDist = d;
    }
    if (minDist <= maxDistanceKm) {
      enRoute.push(inc);
    }
  }

  return enRoute;
}

/**
 * Perpendicular distance from a point to a line segment (in km).
 * Reuses the haversine-based approach from camera-discovery.ts.
 */
function pointToSegmentDistanceKm(
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
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return haversineKm(px, py, projX, projY);
}

/**
 * Check if an incident is severe enough to warrant an en-route warning.
 */
export function isRouteThreat(incident: ScannerIncident): boolean {
  return incident.priority === 'emergency' || incident.priority === 'high';
}
