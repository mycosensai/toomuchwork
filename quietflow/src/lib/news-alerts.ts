/**
 * News Alerts — citizens-app style real-time incident/news feed
 * for QuietFlow. Sources: simulated (demo), Open511 RSS, NWS alerts,
 * local police/fire scanner, community reports.
 *
 * Types, generators, and utility functions — pure module, no React.
 */

export type NewsCategory =
  | 'crime'
  | 'accident'
  | 'police'
  | 'fire'
  | 'traffic'
  | 'weather'
  | 'community'
  | 'emergency'
  | 'construction';

export type NewsSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface NewsAlert {
  id: string;
  category: NewsCategory;
  severity: NewsSeverity;
  title: string;
  description: string;
  locationName: string;
  lat: number;
  lng: number;
  distanceKm?: number;
  timestamp: string;
  timeAgo: string;
  read: boolean;
  actionText?: string;
  actionPayload?: Record<string, unknown>;
  source: 'scanner' | 'open511' | 'nws' | 'community' | 'demo';
  verified: boolean;
  expiresAt?: string;
}

export interface NewsAlertPrefs {
  enabled: boolean;
  categories: NewsCategory[];
  minSeverity: NewsSeverity;
  hideRead: boolean;
  soundAlerts: boolean;
  pushNotifications: boolean;
  refreshIntervalSec: number;
}

const DEFAULT_NEWS_PREFS: NewsAlertPrefs = {
  enabled: true,
  categories: [], // empty = all
  minSeverity: 'low',
  hideRead: false,
  soundAlerts: false,
  pushNotifications: false,
  refreshIntervalSec: 30,
};

const SEVERITY_RANK: Record<NewsSeverity, number> = {
  critical: 0, high: 1, medium: 2, low: 3,
};

const CATEGORY_LOCATIONS: Record<NewsCategory, Array<{ name: string; lat: number; lng: number }>> = {
  crime: [
    { name: 'Downtown Dallas', lat: 32.783, lng: -96.799 },
    { name: 'Deep Ellum', lat: 32.782, lng: -96.773 },
    { name: 'Oak Lawn', lat: 32.803, lng: -96.810 },
    { name: 'West End', lat: 32.786, lng: -96.810 },
  ],
  accident: [
    { name: 'I-35E near Lemmon', lat: 32.836, lng: -96.822 },
    { name: 'US-75 near Mockingbird', lat: 32.838, lng: -96.781 },
    { name: 'I-30 at Zang Blvd', lat: 32.767, lng: -96.800 },
    { name: 'Loop 12 at Greenville', lat: 32.840, lng: -96.773 },
  ],
  police: [
    { name: 'US-75 / Mockingbird', lat: 32.838, lng: -96.781 },
    { name: 'Downtown Central', lat: 32.780, lng: -96.799 },
    { name: 'Lake Highlands', lat: 32.860, lng: -96.726 },
  ],
  fire: [
    { name: 'White Rock Lake', lat: 32.855, lng: -96.730 },
    { name: 'Preston Hollow', lat: 32.860, lng: -96.810 },
    { name: 'Addison', lat: 32.964, lng: -96.838 },
  ],
  traffic: [
    { name: 'I-35E southbound', lat: 32.78, lng: -96.82 },
    { name: 'US-75 central', lat: 32.80, lng: -96.77 },
    { name: 'I-635 LBJ', lat: 32.82, lng: -96.85 },
  ],
  weather: [
    { name: 'Dallas County', lat: 32.795, lng: -96.796 },
    { name: 'DFW Metro', lat: 32.85, lng: -97.0 },
  ],
  community: [
    { name: 'Fair Park', lat: 32.77, lng: -96.76 },
    { name: 'Klyde Warren Park', lat: 32.787, lng: -96.803 },
    { name: 'White Rock Lake', lat: 32.855, lng: -96.730 },
  ],
  emergency: [
    { name: 'Downtown Emergency', lat: 32.783, lng: -96.799 },
    { name: 'Medical Center', lat: 32.84, lng: -96.84 },
  ],
  construction: [
    { name: 'I-30 Widening', lat: 32.77, lng: -96.80 },
    { name: 'US-75 Express', lat: 32.82, lng: -96.78 },
    { name: 'Preston Road', lat: 32.86, lng: -96.80 },
  ],
};

const TEMPLATES: Record<NewsCategory, Array<{ title: string; description: string; severity: NewsSeverity; actionText?: string }>> = {
  crime: [
    { title: 'Burglary Reported', description: 'Break-in reported at residential address. Suspect last seen fleeing on foot.', severity: 'high' },
    { title: 'Suspicious Activity', description: 'Individual acting suspiciously near storefront. Officers en route.', severity: 'medium' },
    { title: 'Theft from Vehicle', description: 'Car break-in reported in parking lot. Nothing taken per caller.', severity: 'low' },
    { title: 'Armed Robbery', description: 'Armed robbery at convenience store. Suspect has weapon. Avoid area.', severity: 'critical' },
    { title: 'Vandalism', description: 'Graffiti reported on downtown building. Unknown suspect.', severity: 'low' },
  ],
  accident: [
    { title: 'Multi-Vehicle Collision', description: '3-car accident blocking right lane. Emergency responders on scene.', severity: 'high', actionText: 'View route' },
    { title: 'Fender Bender', description: 'Minor collision at intersection. No injuries. Clearing soon.', severity: 'low' },
    { title: 'Fatality Accident', description: 'Fatal crash reported on highway. Full closure expected.', severity: 'critical', actionText: 'Reroute' },
    { title: 'Single Vehicle Crash', description: 'Car off road into ditch. Driver extracted. Lane blocked.', severity: 'high' },
  ],
  police: [
    { title: 'Traffic Stop', description: 'Routine traffic stop on US-75. Expect minor delay.', severity: 'low' },
    { title: 'Pursuit', description: 'Police pursuit in progress. Avoid area immediately.', severity: 'critical' },
    { title: 'Welfare Check', description: 'Welfare check requested at residence. No urgency.', severity: 'low' },
    { title: 'Domestic Disturbance', description: 'Domestic dispute reported. Armed response dispatched.', severity: 'high' },
  ],
  fire: [
    { title: 'Structure Fire', description: 'House fire with heavy smoke. Multiple units responding.', severity: 'critical' },
    { title: 'Vehicle Fire', description: 'Car fire on highway shoulder. Lane blocked.', severity: 'high' },
    { title: 'Brush Fire', description: 'Small brush fire near trail. Contained.', severity: 'medium' },
    { title: 'Fire Alarm', description: 'Commercial building alarm. False alarm confirmed.', severity: 'low' },
  ],
  traffic: [
    { title: 'Road Closure', description: 'Main street closed for construction. Use alternate route.', severity: 'high', actionText: 'Reroute' },
    { title: 'Heavy Delay', description: 'Congestion on I-35E. 20 min delay expected.', severity: 'medium' },
    { title: 'Hazmat Spill', description: 'Chemical spill on I-635. All lanes closed. Hazmat en route.', severity: 'critical', actionText: 'Reroute' },
    { title: 'Signal Outage', description: 'Traffic signal out at intersection. Officer directing.', severity: 'medium' },
  ],
  weather: [
    { title: 'Severe Thunderstorm Warning', description: 'Tornado warning issued for Dallas County. Seek shelter.', severity: 'critical' },
    { title: 'Flood Advisory', description: 'Flash flooding reported on low-lying roads. Avoid underpasses.', severity: 'high' },
    { title: 'Heat Advisory', description: 'Heat index 105°F. Stay hydrated.', severity: 'medium' },
    { title: 'Clear Conditions', description: 'Weather clear. No alerts.', severity: 'low' },
  ],
  community: [
    { title: 'Community Event', description: 'Street festival downtown. Expect crowds.', severity: 'low' },
    { title: 'Power Outage', description: 'Outage affecting 500+ customers. Crews dispatched.', severity: 'medium' },
    { title: 'Water Main Break', description: 'Water main break on Main St. Road closure expected.', severity: 'high' },
  ],
  emergency: [
    { title: 'Medical Emergency', description: 'Cardiac event reported. Ambulance dispatched.', severity: 'high' },
    { title: 'Building Evacuation', description: 'Evacuation in progress. Avoid area.', severity: 'critical' },
  ],
  construction: [
    { title: 'Road Construction', description: 'Lane closure for road work. Expect delays 9AM-3PM.', severity: 'medium' },
    { title: 'Bridge Inspection', description: 'Single-lane closure for bridge inspection.', severity: 'low' },
  ],
};

// ─── Haversine distance (km) ───

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Seeded RNG ───

function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

// ─── Format helpers ───

function formatTimeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Public API ───

/**
 * Generate a realistic set of news alerts around a location.
 * In production, this would call Open511, NWS API, police RSS feeds.
 * For the demo build we use deterministic pseudo-random generation.
 */
export function generateNewsAlerts(
  center: [number, number],
  maxAlerts: number = 20,
): NewsAlert[] {
  const now = new Date();
  const minuteSeed = Math.floor(now.getTime() / 30000); // refresh every 30s
  const rng = seededRandom(minuteSeed + 42);
  const alerts: NewsAlert[] = [];

  const categories = Object.keys(CATEGORY_LOCATIONS) as NewsCategory[];
  const numAlerts = 3 + Math.floor(rng() * 6);

  for (let i = 0; i < numAlerts && alerts.length < maxAlerts; i++) {
    const category = categories[Math.floor(rng() * categories.length)];
    const templates = TEMPLATES[category];
    const template = templates[Math.floor(rng() * templates.length)];
    const locs = CATEGORY_LOCATIONS[category];
    const loc = locs[Math.floor(rng() * locs.length)];
    const dist = haversineKm(center[0], center[1], loc.lat, loc.lng);

    // Only include if within ~20km
    if (dist > 20) continue;

    const ageMinutes = Math.floor(rng() * 60);
    const timestamp = new Date(now.getTime() - ageMinutes * 60000).toISOString();

    // Scale severity toward higher for closer incidents
    let severity = template.severity;
    if (dist < 2 && rng() < 0.3) severity = 'critical' as NewsSeverity;

    alerts.push({
      id: `news-${category}-${i}-${minuteSeed}`,
      category,
      severity: severity as NewsSeverity,
      title: template.title,
      description: template.description,
      locationName: loc.name,
      lat: loc.lat + (rng() - 0.5) * 0.02,
      lng: loc.lng + (rng() - 0.5) * 0.02,
      distanceKm: Math.round(dist * 10) / 10,
      timestamp,
      timeAgo: formatTimeAgo(timestamp),
      read: false,
      actionText: template.actionText,
      source: 'demo',
      verified: rng() > 0.3,
    });
  }

  // Sort by severity then time
  const prio = { critical: 0, high: 1, medium: 2, low: 3 };
  alerts.sort((a, b) => prio[a.severity] - prio[b.severity] || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return alerts;
}

export function getDefaultNewsPrefs(): NewsAlertPrefs {
  return { ...DEFAULT_NEWS_PREFS };
}

export function filterBySeverity(alerts: NewsAlert[], minSeverity: NewsSeverity): NewsAlert[] {
  const minRank = SEVERITY_RANK[minSeverity];
  return alerts.filter((a) => SEVERITY_RANK[a.severity] <= minRank);
}