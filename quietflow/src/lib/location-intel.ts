// ─── Location Intel Engine ─────────────────────────────────────────
// GOD VIEW: tracks and scans every trackable category of data about
// any location, returning the most accurate combined intelligence.
// Categories are sourced from mock/derived data by default and can be
// swapped for live APIs in production.

import { BusinessLocation, Camera, RoadSegment, ScannerIncident, DensityLevel } from '@/types';

// ─── Tracked Intel Categories ─────────────────────────────────────

export type IntelCategory =
  | 'crime'            // police activity, incidents, safety score
  | 'air_quality'      // AQI, pollutants
  | 'weather'          // current + forecast
  | 'traffic'          // road density, travel time
  | 'transit'          // bus/rail service levels
  | 'power'            // outages, grid reliability
  | 'noise'            // ambient noise level
  | 'foot_traffic'     // pedestrian density
  | 'real_estate'      // property value trend, rent index
  | 'events'           // nearby events, gatherings
  | 'road_hazards'     // construction, closures, incidents
  | 'demographics'     // population density, median income
  | 'safety'           // combined safety score
  | 'accessibility'    // transit proximity, parking, ADA
  | 'commercial'       // nearby business density
  | 'ratings'          // POI ratings, reviews
  | 'live_feeds'       // camera feeds available
  | 'predictions'      // busy-ness predictions
  | 'security'         // FLOCK/AXON camera coverage;

export const ALL_INTEL_CATEGORIES: IntelCategory[] = [
  'crime', 'safety', 'security', 'air_quality', 'weather', 'traffic',
  'road_hazards', 'transit', 'accessibility', 'power', 'noise',
  'foot_traffic', 'events', 'real_estate', 'demographics', 'commercial',
  'ratings', 'live_feeds', 'predictions',
];

export interface IntelScore {
  value: number;       // 0-100
  level: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  detail: string;
}

export interface IntelCategoryData {
  category: IntelCategory;
  label: string;
  icon: string;
  score: IntelScore;
  data: Record<string, unknown>;
  source: string;
  scannedAt: string;
  confidence: number;   // 0-1
  flags?: Array<{ category: string; label: string; severity: 'info' | 'warning' | 'critical' }>;
}

export interface LocationIntel {
  locationId: string;
  name: string;
  lat: number;
  lng: number;
  categories: IntelCategoryData[];
  overallScore: number;    // 0-100 combined
  overallLevel: IntelScore['level'];
  lastFullScan: string;
  scanCount: number;
  flags: Array<{ category: IntelCategory; label: string; severity: 'info' | 'warning' | 'critical' }>;
}

export interface ScanOptions {
  categories?: IntelCategory[];
  deep?: boolean;         // deep scan includes extra detail + confidence modeling
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
}

// ─── Data Sources (mock/derived; swap for live APIs in prod) ──────

interface IntelSourceContext {
  lat: number;
  lng: number;
  hour: number;
  isWeekend: boolean;
  nearbyCameras: Camera[];
  nearbyRoads: RoadSegment[];
  nearbyScanner: ScannerIncident[];
  business?: BusinessLocation;
}

function levelFromScore(v: number): IntelScore['level'] {
  if (v >= 80) return 'excellent';
  if (v >= 60) return 'good';
  if (v >= 40) return 'fair';
  if (v >= 25) return 'poor';
  return 'critical';
}

function rize(seed: number, min: number, max: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return min + ((x - Math.floor(x)) * (max - min));
}

/** Distance-weighted crime/incident density near a location. */
function crimeScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const nearby = (ctx.nearbyScanner || []).filter((i) => i.priority === 'emergency' || i.priority === 'high').length;
  const base = 100 - nearby * 18;
  // Roads feed into "dangerous" perception
  const roadDanger = (ctx.nearbyRoads || []).filter((r) => r.currentDensity?.densityLevel === 'red' || r.currentDensity?.densityLevel === 'purple').length;
  const value = Math.max(0, Math.min(100, Math.round(base - roadDanger * 4 + rize(ctx.lat * ctx.lng, -6, 6))));
  const flag = value < 40 ? [{ category, label: 'Elevated incident activity', severity: value < 25 ? 'critical' : 'warning' as const }] : [];
  return {
    category, label: 'Crime & Incidents', icon: '🚓',
    score: { value, level: levelFromScore(value), detail: value >= 80 ? 'Very low incident activity in area' : value >= 60 ? 'Low incident activity' : value >= 40 ? 'Moderate incident activity' : 'Elevated incident activity — exercise caution' },
    data: { activePriorityIncidents: nearby, roadDangerousSegments: roadDanger },
    source: 'scanner + incident feed', scannedAt: new Date().toISOString(), confidence: 0.72,
    flags: flag,
  } as IntelCategoryData;
}

function safetyScore(crime: IntelCategoryData, ctx: IntelSourceContext): IntelCategoryData {
  const cameraCoverage = Math.min(1, (ctx.nearbyCameras || []).length / 6);
  const nightFactor = ctx.hour >= 22 || ctx.hour < 6 ? 0.8 : 1;
  const value = Math.max(0, Math.min(100, Math.round(crime.score.value * 0.75 + cameraCoverage * 25 * nightFactor)));
  return {
    category: 'safety', label: 'Safety Score', icon: '🛡️',
    score: { value, level: levelFromScore(value), detail: value >= 80 ? 'Area is very safe' : value >= 60 ? 'Generally safe' : value >= 40 ? 'Moderate safety — be aware' : 'Lower safety rating in area' },
    data: { nightAdjustment: nightFactor, cameraCoverage: Math.round(cameraCoverage * 100) },
    source: 'combined intel', scannedAt: new Date().toISOString(), confidence: 0.7,
    flags: [],
  } as IntelCategoryData;
}

function securityScore(ctx: IntelSourceContext): IntelCategoryData {
  const cam = ctx.nearbyCameras || [];
  const flock = cam.filter((c) => c.brand === 'flock').length;
  const axon = cam.filter((c) => c.brand === 'axon').length;
  const other = cam.length - flock - axon;
  const value = Math.max(0, Math.min(100, Math.round(cam.length * 8 + flock * 4 + axon * 3)));
  return {
    category: 'security', label: 'Security Camera Coverage', icon: '📹',
    score: { value, level: levelFromScore(value), detail: `${cam.length} camera(s) covering this area (${flock} FLOCK, ${axon} AXON)` },
    data: { totalCameras: cam.length, flock, axon, other, liveFeeds: cam.filter((c) => c.status === 'online').length },
    source: 'camera track', scannedAt: new Date().toISOString(), confidence: 0.85,
    flags: [],
  } as IntelCategoryData;
}

function airQualityScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const aqi = Math.round(rize(ctx.lat + ctx.lng, 18, 95) + ((ctx.nearbyRoads?.length || 0) * 1.2));
  const value = Math.max(0, Math.min(100, Math.round(100 - aqi * 1.1)));
  const pm25 = Math.round(aqi * 0.6);
  return {
    category, label: 'Air Quality', icon: '🌬️',
    score: { value, level: levelFromScore(value), detail: aqi <= 50 ? 'Clean air (AQI good)' : aqi <= 100 ? 'Moderate air quality (AQI moderate)' : 'Unhealthy air (AQI elevated)' },
    data: { aqi, pm25, mainPollutant: 'PM2.5', o3: Math.round(30 + aqi * 0.3) },
    source: 'environmental model', scannedAt: new Date().toISOString(), confidence: 0.68,
    flags: aqi > 100 ? [{ category, label: 'Elevated air pollution', severity: 'warning' }] : [],
  } as IntelCategoryData;
}

function weatherScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const temp = 55 + 30 * Math.sin((ctx.hour - 8) / 24 * Math.PI * 2) + rize(ctx.lat, -5, 5);
  const clear = 0.75;
  const value = Math.round(clear * 100);
  const conditions = ctx.isWeekend ? 'sunny' : 'partly cloudy';
  return {
    category, label: 'Weather', icon: '🌤️',
    score: { value, level: 'excellent', detail: `${Math.round(temp)}°F, ${conditions}, pleasant conditions` },
    data: { temperatureF: Math.round(temp), humidity: Math.round(40 + rize(ctx.lng, -10, 20)), windMph: Math.round(3 + rize(ctx.lat, 0, 8)), precipitationChance: Math.round(rize(ctx.lng, 0, 40)), conditions },
    source: 'forecast model', scannedAt: new Date().toISOString(), confidence: 0.6,
    flags: [],
  } as IntelCategoryData;
}

function trafficScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const levels: Record<string, number> = { green: 90, yellow: 70, orange: 45, red: 25, purple: 10 };
  const nearby = ctx.nearbyRoads || [];
  const avg = nearby.length ? nearby.reduce((s, r) => s + (levels[r.currentDensity?.densityLevel || ''] ?? 70), 0) / nearby.length : 70;
  const value = Math.max(0, Math.min(100, Math.round(avg * 0.8 + rize(ctx.lng, -5, 5))));
  return {
    category, label: 'Traffic Conditions', icon: '🚗',
    score: { value, level: levelFromScore(value), detail: value >= 70 ? 'Free-flowing traffic' : value >= 45 ? 'Moderate traffic' : 'Congested traffic' },
    data: { roadSegments: nearby.length, avgCongestionScore: value, rushHour: (ctx.hour >= 7 && ctx.hour <= 9) || (ctx.hour >= 17 && ctx.hour <= 19) },
    source: 'road density track', scannedAt: new Date().toISOString(), confidence: 0.74,
    flags: value < 45 ? [{ category, label: 'Congested traffic nearby', severity: 'warning' }] : [],
  } as IntelCategoryData;
}

function roadHazardScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const incidents = (ctx.nearbyScanner || []).length;
  const construction = ctx.hour >= 9 && ctx.hour <= 16 ? Math.round(rize(ctx.lat + ctx.lng, 0, 2)) : 0;
  const value = Math.max(0, Math.min(100, Math.round(100 - incidents * 12 - construction * 15)));
  return {
    category, label: 'Road Hazards', icon: '⚠️',
    score: { value, level: levelFromScore(value), detail: incidents === 0 ? 'No active hazards nearby' : `${incidents} active incident(s) nearby` },
    data: { activeIncidents: incidents, constructionZones: construction, blockedLanes: Math.round(rize(ctx.lng, 0, incidents)) },
    source: 'scanner + traffic', scannedAt: new Date().toISOString(), confidence: 0.66,
    flags: incidents > 0 ? [{ category, label: `${incidents} road hazard(s)`, severity: incidents > 2 ? 'critical' : 'warning' }] : [],
  } as IntelCategoryData;
}

function transitScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  // Major transit corridors near major road hubs (simulated)
  const value = Math.max(0, Math.min(100, Math.round(55 + rize(ctx.lng * ctx.lat, -25, 35) + (ctx.nearbyRoads?.length || 0) * 2)));
  return {
    category, label: 'Public Transit', icon: '🚆',
    score: { value, level: levelFromScore(value), detail: value >= 70 ? 'Good transit access nearby' : value >= 45 ? 'Moderate transit access' : 'Limited transit access' },
    data: { nearestStops: Math.round(rize(ctx.lat, 1, 8)), railAccess: value > 60, busFrequencyMin: Math.round(rize(ctx.lng, 8, 30)) },
    source: 'transit model', scannedAt: new Date().toISOString(), confidence: 0.6,
    flags: value < 40 ? [{ category, label: 'Limited transit coverage', severity: 'info' }] : [],
  } as IntelCategoryData;
}

function accessibilityScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const parking = ctx.nearbyRoads?.length ? 1 : 0.6;
  const value = Math.round(60 + parking * 30 + rize(ctx.lat, -10, 10));
  return {
    category, label: 'Accessibility', icon: '♿',
    score: { value: Math.max(0, Math.min(100, value)), level: levelFromScore(value), detail: 'Parking available' + (parking > 0.8 ? ', good road access' : '') },
    data: { parkingAvailable: !!parking, adaAccessible: true, evCharging: Math.round(rize(ctx.lng, 0, 4)) },
    source: 'geo model', scannedAt: new Date().toISOString(), confidence: 0.58,
    flags: [],
  } as IntelCategoryData;
}

function powerScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const value = Math.max(0, Math.min(100, Math.round(92 + rize(ctx.lat + ctx.lng, -20, 8))));
  const outage = value < 80 ? Math.round(rize(ctx.lng, 1, 200)) : 0;
  return {
    category, label: 'Power Reliability', icon: '⚡',
    score: { value, level: levelFromScore(value), detail: outage ? `${outage} customers without power nearby` : 'Grid is stable in area' },
    data: { customersOut: outage, gridStatus: outage ? 'minor disruption' : 'stable' },
    source: 'grid model', scannedAt: new Date().toISOString(), confidence: 0.55,
    flags: outage > 0 ? [{ category, label: 'Power disruption detected', severity: 'warning' }] : [],
  } as IntelCategoryData;
}

function noiseScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const traffic = (ctx.nearbyRoads || []).length;
  const db = Math.round(45 + traffic * 3 + rize(ctx.lat, 0, 8) + (ctx.hour >= 6 && ctx.hour <= 21 ? 8 : 0));
  const value = Math.max(0, Math.min(100, Math.round(100 - db + 45)));
  return {
    category, label: 'Noise Level', icon: '🔊',
    score: { value, level: levelFromScore(value), detail: db < 55 ? 'Quiet area' : db < 68 ? 'Moderate ambient noise' : 'Relatively noisy area' },
    data: { decibels: db, trafficContribution: Math.round(traffic * 3) },
    source: 'acoustic model', scannedAt: new Date().toISOString(), confidence: 0.52,
    flags: db > 70 ? [{ category, label: 'High ambient noise', severity: 'warning' }] : [],
  } as IntelCategoryData;
}

function footTrafficScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const bizDensity = ctx.business?.density?.densityLevel;
  const levels: Record<string, number> = { green: 85, yellow: 65, orange: 40, red: 20, purple: 8 };
  const value = bizDensity ? (levels[bizDensity] ?? 65) : Math.round(50 + rize(ctx.lng * ctx.lat, -20, 30));
  return {
    category, label: 'Foot Traffic', icon: '🚶',
    score: { value, level: levelFromScore(value), detail: value >= 70 ? 'Quiet, not busy' : value >= 45 ? 'Moderate foot traffic' : 'Busy with pedestrians' },
    data: { pedestrianEst: ctx.business?.density?.pedestrianEst ?? Math.round(rize(ctx.lat, 5, 60)), densityLevel: bizDensity },
    source: 'density track', scannedAt: new Date().toISOString(), confidence: 0.7,
    flags: value < 45 ? [{ category, label: 'Heavy foot traffic', severity: 'info' }] : [],
  } as IntelCategoryData;
}

function eventScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const eventCount = Math.round(rize(ctx.lng * ctx.lat, 0, 4));
  const value = Math.max(0, Math.min(100, Math.round(100 - eventCount * 16)));
  return {
    category, label: 'Nearby Events', icon: '🎪',
    score: { value, level: levelFromScore(value), detail: eventCount === 0 ? 'No major events in area' : `${eventCount} event(s) could affect crowd levels` },
    data: { activeEvents: eventCount, crowdRisk: eventCount, expectedCrowds: eventCount > 2 ? 'heavy' : 'normal' },
    source: 'events model', scannedAt: new Date().toISOString(), confidence: 0.5,
    flags: eventCount > 2 ? [{ category, label: 'Multiple events — expect crowds', severity: 'warning' }] : [],
  } as IntelCategoryData;
}

function realEstateScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const value = Math.round(55 + rize(ctx.lat * ctx.lng, -20, 30) + (ctx.nearbyCameras?.length || 0) * 2);
  const rentIndex = Math.max(0, Math.min(100, value));
  return {
    category, label: 'Real Estate Trend', icon: '🏠',
    score: { value: Math.max(0, Math.min(100, value)), level: levelFromScore(value), detail: value >= 60 ? 'Rising property values / desirable area' : value >= 40 ? 'Stable property market' : 'Softening property market' },
    data: { rentIndex, pricePerSqFt: Math.round(120 + value * 1.8), trend: value >= 60 ? 'appreciating' : 'stable', walkability: Math.round(rize(ctx.lat, 40, 95)) },
    source: 'real estate model', scannedAt: new Date().toISOString(), confidence: 0.45,
    flags: [],
  } as IntelCategoryData;
}

function demographicScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const value = Math.round(rize(ctx.lat + ctx.lng, 40, 95));
  return {
    category, label: 'Demographics', icon: '👥',
    score: { value, level: 'good', detail: 'Mixed-use urban demographic profile' },
    data: { populationDensity: 'high', medianIncome: `$${Math.round(rize(ctx.lat, 45, 150))}k`, householdCount: Math.round(rize(ctx.lng, 500, 2500)) },
    source: 'census model', scannedAt: new Date().toISOString(), confidence: 0.4,
    flags: [],
  } as IntelCategoryData;
}

function commercialScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const value = Math.round(50 + rize(ctx.lng * ctx.lat, -20, 35));
  return {
    category, label: 'Commercial Activity', icon: '🏪',
    score: { value: Math.max(0, Math.min(100, value)), level: levelFromScore(value), detail: value >= 60 ? 'Vibrant commercial area' : value >= 40 ? 'Moderate commercial activity' : 'Light commercial activity' },
    data: { nearbyBusinesses: ctx.business ? 1 : Math.round(rize(ctx.lat, 3, 25)), retailMix: 'mixed' },
    source: 'POI model', scannedAt: new Date().toISOString(), confidence: 0.5,
    flags: [],
  } as IntelCategoryData;
}

function ratingScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const rating = Math.round((3 + rize(ctx.lng * ctx.lat, 0, 2)) * 10) / 10;
  const value = Math.round(rating / 5 * 100);
  return {
    category, label: 'Ratings & Reviews', icon: '⭐',
    score: { value, level: levelFromScore(value), detail: rating >= 4 ? 'Well-rated location' : rating >= 3.5 ? 'Decent ratings' : 'Mixed reviews' },
    data: { averageRating: rating, reviewCount: Math.round(rize(ctx.lat, 5, 900)) },
    source: 'review model', scannedAt: new Date().toISOString(), confidence: 0.5,
    flags: rating < 3.5 ? [{ category, label: 'Below-average ratings', severity: 'info' }] : [],
  } as IntelCategoryData;
}

function liveFeedScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const cams = (ctx.nearbyCameras || []).filter((c) => c.status === 'online');
  const value = Math.max(0, Math.min(100, Math.round(cams.length * 20)));
  return {
    category, label: 'Live Camera Feeds', icon: '📡',
    score: { value, level: levelFromScore(value), detail: `${cams.length} live feed(s) available nearby` },
    data: { liveCams: cams.length, totalCams: (ctx.nearbyCameras || []).length, hasSecurityOpening: cams.some((c) => c.isPublic || c.streamVerified) },
    source: 'camera track', scannedAt: new Date().toISOString(), confidence: 0.85,
    flags: [],
  } as IntelCategoryData;
}

function predictionScore(ctx: IntelSourceContext, category: IntelCategory): IntelCategoryData {
  const nowLevel = ctx.business?.density?.densityLevel || 'green';
  const levels: Record<string, number> = { green: 15, yellow: 30, orange: 50, red: 70, purple: 85 };
  const current = levels[nowLevel] || 20;
  // Predicted quiet window
  const nextQuietInMin = ctx.business?.quietWindows?.[0] ? Math.round((new Date(ctx.business.quietWindows[0].startTime).getTime() - Date.now()) / 60000) : 45;
  const value = Math.max(0, Math.min(100, 100 - (nextQuietInMin < 30 ? current : current + 30)));
  return {
    category, label: 'Busy-ness Prediction', icon: '🔮',
    score: { value, level: levelFromScore(value), detail: nextQuietInMin >= 0 && nextQuietInMin <= 60 ? `Quiet window in ~${Math.max(0, nextQuietInMin)} min` : 'Currently average busy-ness' },
    data: { currentLevel: nowLevel, nextQuietWindowMin: Math.max(0, nextQuietInMin), confidencePrediction: 0.7 },
    source: 'predictive model', scannedAt: new Date().toISOString(), confidence: 0.65,
    flags: [],
  } as IntelCategoryData;
}

// ─── Intel scanner ────────────────────────────────────────────────

const SCAN_FNS: Record<IntelCategory, (ctx: IntelSourceContext, cat: IntelCategory) => IntelCategoryData> = {
  crime: crimeScore,
  safety: (ctx, cat) => safetyScore(SCAN_FNS['crime'](ctx, 'crime'), ctx),
  security: securityScore,
  air_quality: airQualityScore,
  weather: weatherScore,
  traffic: trafficScore,
  road_hazards: roadHazardScore,
  transit: transitScore,
  accessibility: accessibilityScore,
  power: powerScore,
  noise: noiseScore,
  foot_traffic: footTrafficScore,
  events: eventScore,
  real_estate: realEstateScore,
  demographics: demographicScore,
  commercial: commercialScore,
  ratings: ratingScore,
  live_feeds: liveFeedScore,
  predictions: predictionScore,
};

const CATEGORY_LABELS: Record<IntelCategory, string> = {
  crime: 'Crime & Incidents', safety: 'Safety Score', security: 'Security Coverage',
  air_quality: 'Air Quality', weather: 'Weather', traffic: 'Traffic',
  road_hazards: 'Road Hazards', transit: 'Public Transit', accessibility: 'Accessibility',
  power: 'Power Reliability', noise: 'Noise Level', foot_traffic: 'Foot Traffic',
  events: 'Nearby Events', real_estate: 'Real Estate', demographics: 'Demographics',
  commercial: 'Commercial Activity', ratings: 'Ratings', live_feeds: 'Live Feeds', predictions: 'Predictions',
};

const CATEGORY_ICONS: Record<IntelCategory, string> = {
  crime: '🚓', safety: '🛡️', security: '📹', air_quality: '🌬️', weather: '🌤️',
  traffic: '🚗', road_hazards: '⚠️', transit: '🚆', accessibility: '♿', power: '⚡',
  noise: '🔊', foot_traffic: '🚶', events: '🎪', real_estate: '🏠', demographics: '👥',
  commercial: '🏪', ratings: '⭐', live_feeds: '📡', predictions: '🔮',
};

/**
 * Perform a full intel scan of a location, gathering data across every
 * trackable category. Returns combined intelligence with scores, sources,
 * confidence, and flags for the most accurate picture possible.
 */
export function scanLocation(
  location: BusinessLocation,
  cameras: Camera[],
  roadSegments: RoadSegment[],
  scannerIncidents: ScannerIncident[],
  lat: number,
  lng: number,
  options: ScanOptions = {},
): LocationIntel {
  const now = new Date();
  const hour = now.getHours();
  const isWeekend = [0, 6].includes(now.getDay());
  const radiusKm = options.radiusKm ?? 2;

  const kmsPerDeg = 111;
  const nearbyCameras = cameras.filter((c) => {
    const d = Math.sqrt((c.lat - lat) ** 2 + (c.lng - lng) ** 2) * kmsPerDeg;
    return d <= radiusKm;
  });
  const nearbyRoads = roadSegments.filter((rs) => {
    return rs.geometry.some(([rlng, rlat]) => Math.sqrt((rlat - lat) ** 2 + (rlng - lng) ** 2) * kmsPerDeg <= radiusKm);
  });
  const nearbyScanner = scannerIncidents.filter((i) => {
    const d = Math.sqrt((i.lat - lat) ** 2 + (i.lng - lng) ** 2) * kmsPerDeg;
    return d <= radiusKm;
  });

  const ctx: IntelSourceContext = {
    lat, lng, hour, isWeekend,
    nearbyCameras, nearbyRoads, nearbyScanner,
    business: location,
  };

  const cats = options.categories && options.categories.length ? options.categories : ALL_INTEL_CATEGORIES;
  const categories = cats.map((cat) => SCAN_FNS[cat](ctx, cat));

  const overallScore = Math.round(categories.reduce((s, c) => s + c.score.value, 0) / categories.length);
  const flags = categories.flatMap((c) => (c.flags || []).map((f) => ({ ...f, category: c.category as IntelCategory })));

  return {
    locationId: location.id,
    name: location.name,
    lat, lng,
    categories,
    overallScore,
    overallLevel: levelFromScore(overallScore),
    lastFullScan: new Date().toISOString(),
    scanCount: 1,
    flags,
  };
}

export { CATEGORY_LABELS, CATEGORY_ICONS };
