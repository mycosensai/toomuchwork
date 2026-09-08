// ─── QuietRoute Engine ──────────────────────────────────────────
// Route optimization that avoids cameras, people, and busy areas.
// Supports recursive refreshes of traffic/density data.

import { Camera, BusinessLocation, RoadSegment, DensityLevel } from '@/types';
import { haversineKm } from './camera-discovery';
import type { DiscoveredCamera } from '@/types';

/** Map a real OSM-discovered camera into the Camera shape the scorer expects. */
export function discoveredToCamera(d: DiscoveredCamera): Camera {
  return {
    id: d.id,
    name: d.name,
    lat: d.lat,
    lng: d.lng,
    roadName: d.roadName || '',
    orientation: d.direction != null ? String(d.direction) : '',
    streamUrl: d.streamUrl || '',
    protocol: (d.protocol as Camera['protocol']) || 'synthetic',
    jurisdiction: d.operator || '',
    privacyMasks: [],
    status: 'online',
    lastFrameAt: null,
    healthScore: d.confidence,
    resolution: '',
    updateFrequency: 0,
    densityLevel: 'green',
    brand: d.brand,
    model: d.model,
  } as Camera;
}

// ─── Types ──────────────────────────────────────────────────────

export interface QuietRouteWaypoint {
  lat: number;
  lng: number;
  label?: string;
}

export interface QuietRouteSegment {
  from: [number, number];
  to: [number, number];
  distanceKm: number;
  avoidanceScore: number; // 0-1, higher = more avoided (cameras/people/busy)
  camerasNearby: number;
  pedestrianDensity: number;
  roadDensity: number;
}

export interface QuietRouteResult {
  routeId: string;
  waypoints: QuietRouteWaypoint[];
  segments: QuietRouteSegment[];
  totalDistanceKm: number;
  totalAvoidanceScore: number; // average across segments
  cameraCount: number;
  flockCameras: number;
  axonCameras: number;
  otherCameras: number;
  camerasOnRoute: Array<{
    id: string;
    name: string;
    brand: string;
    model?: string;
    lat: number;
    lng: number;
    densityLevel?: DensityLevel;
    isPublic: boolean;
    streamVerified: boolean;
  }>;
  // Metadata for recursive refresh
  lastRefreshed: string;
  refreshIntervalMs: number;
  densitySnapshot: {
    cameraCount: number;
    businessCount: number;
    roadSegmentCount: number;
    avgDensity: number;
  };
}

export interface QuietRouteOptions {
  /** Max distance in km a camera can be from route to count as "on route" */
  cameraAvoidanceRadiusKm: number;
  /** Max distance in km a business (people) can be from route to count */
  pedestrianAvoidanceRadiusKm: number;
  /** Density levels to avoid (higher = more avoided) */
  avoidDensityLevels: DensityLevel[];
  /** Weight for camera avoidance (0-1) */
  cameraWeight: number;
  /** Weight for pedestrian avoidance (0-1) */
  pedestrianWeight: number;
  /** Weight for road density avoidance (0-1) */
  roadWeight: number;
  /** Minimum number of waypoints for the route */
  minWaypoints: number;
  /** Refresh interval in ms for recursive updates */
  refreshIntervalMs: number;
}

const DEFAULT_OPTIONS: QuietRouteOptions = {
  cameraAvoidanceRadiusKm: 0.5,
  pedestrianAvoidanceRadiusKm: 0.3,
  avoidDensityLevels: ['red', 'purple'],
  cameraWeight: 0.4,
  pedestrianWeight: 0.35,
  roadWeight: 0.25,
  minWaypoints: 2,
  refreshIntervalMs: 30000,
};

// ─── Helpers ────────────────────────────────────────────────────

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
  return haversineKm(px, py, x1 + t * dx, y1 + t * dy);
}

function densityScore(level: DensityLevel): number {
  const scores: Record<DensityLevel, number> = { green: 0, yellow: 0.3, orange: 0.5, red: 0.8, purple: 1.0 };
  return scores[level] ?? 0;
}

// ─── Route Optimization ─────────────────────────────────────────

/**
 * Generate a QuietRoute that avoids cameras, people, and busy areas.
 * Uses a simplified A*-like approach: start with a straight line,
 * then iteratively add waypoints to steer away from high-density zones.
 */
export function generateQuietRoute(
  start: [number, number],
  end: [number, number],
  cameras: Camera[],
  businesses: BusinessLocation[],
  roadSegments: RoadSegment[],
  options?: Partial<QuietRouteOptions>,
  extraCameras?: Camera[],
): QuietRouteResult {
  const allCameras = extraCameras && extraCameras.length ? [...cameras, ...extraCameras] : cameras;
  const opts = { ...DEFAULT_OPTIONS, ...(options ?? {}) };
  const routeId = `quiet-route-${start[0].toFixed(3)}-${start[1].toFixed(3)}-${end[0].toFixed(3)}-${end[1].toFixed(3)}`;

  // ── Step 1: Generate candidate waypoints ──
  // Start with the direct path, then add intermediate points
  const directDistance = haversineKm(start[0], start[1], end[0], end[1]);
  const numIntermediate = Math.max(0, Math.ceil(directDistance / 0.5)); // add a waypoint every ~0.5km

  const candidates: QuietRouteWaypoint[] = [{ lat: start[0], lng: start[1], label: 'Start' }];

  if (numIntermediate > 0) {
    for (let i = 1; i <= numIntermediate; i++) {
      const t = i / (numIntermediate + 1);
      // Add slight perpendicular offset to explore alternatives
      const dx = end[0] - start[0];
      const dy = end[1] - start[1];
      const perpX = -dy * 0.1 * Math.sin(i * 0.5);
      const perpY = dx * 0.1 * Math.sin(i * 0.5);
      candidates.push({
        lat: start[0] + dx * t + perpX,
        lng: start[1] + dy * t + perpY,
        label: `Waypoint ${i}`,
      });
    }
  }

  candidates.push({ lat: end[0], lng: end[1], label: 'End' });

  // ── Step 2: Score each candidate waypoint ──
  // Lower score = better (more quiet). We'll filter out high-score waypoints.
  const scoredWaypoints = candidates.map((wp) => ({
    ...wp,
    score: waypointScore(wp.lat, wp.lng, allCameras, businesses, roadSegments, opts),
  }));

  // ── Step 3: Build the route — keep waypoints with score below threshold ──
  const maxAcceptableScore = 0.6;
  const selectedWaypoints = scoredWaypoints.filter((wp) => wp.score <= maxAcceptableScore);

  // Always include start and end
  const hasStart = selectedWaypoints.some((wp) => wp.label === 'Start');
  const hasEnd = selectedWaypoints.some((wp) => wp.label === 'End');
  if (!hasStart) selectedWaypoints.unshift(scoredWaypoints[0]);
  if (!hasEnd) selectedWaypoints.push(scoredWaypoints[scoredWaypoints.length - 1]);

  // If we have too few waypoints, add back the best intermediate ones
  if (selectedWaypoints.length < opts.minWaypoints) {
    const missing = scoredWaypoints.filter((wp) => !selectedWaypoints.includes(wp));
    missing.sort((a, b) => a.score - b.score);
    for (const wp of missing) {
      if (selectedWaypoints.length >= opts.minWaypoints) break;
      selectedWaypoints.push(wp);
    }
    selectedWaypoints.sort((a, b) => {
      const aIdx = scoredWaypoints.indexOf(a);
      const bIdx = scoredWaypoints.indexOf(b);
      return aIdx - bIdx;
    });
  }

  // ── Step 4: Build segments ──
  const segments: QuietRouteSegment[] = [];
  for (let i = 0; i < selectedWaypoints.length - 1; i++) {
    const from = selectedWaypoints[i];
    const to = selectedWaypoints[i + 1];
    const dist = haversineKm(from.lat, from.lng, to.lat, to.lng);
    const segmentCameras = allCameras.filter((cam) => {
      const d = pointToSegmentDistanceKm(cam.lat, cam.lng, from.lat, from.lng, to.lat, to.lng);
      return d <= opts.cameraAvoidanceRadiusKm;
    });
    const segmentBusinesses = businesses.filter((biz) => {
      const d = pointToSegmentDistanceKm(biz.lat, biz.lng, from.lat, from.lng, to.lat, to.lng);
      return d <= opts.pedestrianAvoidanceRadiusKm;
    });
    const segmentRoads = roadSegments.filter((rs) => {
      for (let j = 0; j < rs.geometry.length - 1; j++) {
        const d = pointToSegmentDistanceKm(
          (rs.geometry[j][0] + rs.geometry[j + 1][0]) / 2,
          (rs.geometry[j][1] + rs.geometry[j + 1][1]) / 2,
          from.lat, from.lng, to.lat, to.lng,
        );
        if (d <= 0.3) return true;
      }
      return false;
    });

    const cameraAvoidance = segmentCameras.length > 0 ? 1 - (1 / (1 + segmentCameras.length)) : 0;
    const pedestrianAvoidance = segmentBusinesses.length > 0
      ? segmentBusinesses.reduce((sum, b) => sum + densityScore(b.density?.densityLevel || 'green'), 0) / segmentBusinesses.length
      : 0;
    const roadAvoidance = segmentRoads.length > 0
      ? segmentRoads.reduce((sum, r) => sum + densityScore(r.currentDensity?.densityLevel || 'green'), 0) / segmentRoads.length
      : 0;

    const avoidanceScore = (cameraAvoidance * opts.cameraWeight)
      + (pedestrianAvoidance * opts.pedestrianWeight)
      + (roadAvoidance * opts.roadWeight);

    segments.push({
      from: [from.lat, from.lng],
      to: [to.lat, to.lng],
      distanceKm: dist,
      avoidanceScore,
      camerasNearby: segmentCameras.length,
      pedestrianDensity: pedestrianAvoidance,
      roadDensity: roadAvoidance,
    });
  }

  // ── Step 5: Collect cameras on route ──
  const routeCameras: QuietRouteResult['camerasOnRoute'] = [];
  const flockCameras: string[] = [];
  const axonCameras: string[] = [];
  const otherCameras: string[] = [];

  for (const cam of allCameras) {
    let minDist = Infinity;
    for (const seg of segments) {
      const d = pointToSegmentDistanceKm(cam.lat, cam.lng, seg.from[0], seg.from[1], seg.to[0], seg.to[1]);
      if (d < minDist) minDist = d;
    }
    if (minDist <= opts.cameraAvoidanceRadiusKm) {
      const brand = cam.brand || 'other';
      if (brand === 'flock') flockCameras.push(cam.id);
      else if (brand === 'axon') axonCameras.push(cam.id);
      else otherCameras.push(cam.id);
      routeCameras.push({
        id: cam.id,
        name: cam.name,
        brand,
        model: cam.model,
        lat: cam.lat,
        lng: cam.lng,
        densityLevel: cam.densityLevel,
        isPublic: cam.isPublic ?? false,
        streamVerified: cam.streamVerified ?? false,
      });
    }
  }

  // ── Step 6: Compute summary ──
  const totalDistance = segments.reduce((s, seg) => s + seg.distanceKm, 0);
  const avgAvoidance = segments.length > 0
    ? segments.reduce((s, seg) => s + seg.avoidanceScore, 0) / segments.length
    : 0;
  const avgDensity = roadSegments.length > 0
    ? roadSegments.reduce((s, r) => s + densityScore(r.currentDensity?.densityLevel || 'green'), 0) / roadSegments.length
    : 0;

  return {
    routeId,
    waypoints: selectedWaypoints,
    segments,
    totalDistanceKm: totalDistance,
    totalAvoidanceScore: avgAvoidance,
    cameraCount: routeCameras.length,
    flockCameras: flockCameras.length,
    axonCameras: axonCameras.length,
    otherCameras: otherCameras.length,
    camerasOnRoute: routeCameras,
    lastRefreshed: new Date().toISOString(),
    refreshIntervalMs: opts.refreshIntervalMs,
    densitySnapshot: {
      cameraCount: cameras.length,
      businessCount: businesses.length,
      roadSegmentCount: roadSegments.length,
      avgDensity,
    },
  };
}

/** Score a waypoint based on nearby cameras, people, and busy areas. */
function waypointScore(
  lat: number, lng: number,
  cameras: Camera[],
  businesses: BusinessLocation[],
  roadSegments: RoadSegment[],
  opts: QuietRouteOptions,
): number {
  let score = 0;
  let weightSum = 0;

  // Camera proximity penalty
  for (const cam of cameras) {
    const d = haversineKm(lat, lng, cam.lat, cam.lng);
    if (d <= opts.cameraAvoidanceRadiusKm) {
      const proximity = 1 - (d / opts.cameraAvoidanceRadiusKm);
      score += proximity * opts.cameraWeight;
      weightSum += opts.cameraWeight;
    }
  }

  // Pedestrian/business density penalty
  for (const biz of businesses) {
    const d = haversineKm(lat, lng, biz.lat, biz.lng);
    if (d <= opts.pedestrianAvoidanceRadiusKm) {
      const proximity = 1 - (d / opts.pedestrianAvoidanceRadiusKm);
      const bizScore = densityScore(biz.density?.densityLevel || 'green');
      score += proximity * bizScore * opts.pedestrianWeight;
      weightSum += opts.pedestrianWeight;
    }
  }

  // Road density penalty
  for (const rs of roadSegments) {
    for (let i = 0; i < rs.geometry.length - 1; i++) {
      const d = pointToSegmentDistanceKm(lat, lng, rs.geometry[i][0], rs.geometry[i][1], rs.geometry[i + 1][0], rs.geometry[i + 1][1]);
      if (d <= 0.3) {
        const roadScore = densityScore(rs.currentDensity?.densityLevel || 'green');
        score += roadScore * opts.roadWeight * 0.5; // roads are less penalized than cameras/people
        weightSum += opts.roadWeight * 0.5;
        break;
      }
    }
  }

  return weightSum > 0 ? score / weightSum : 0;
}

/**
 * Recursively refresh route data — re-scores the route with fresh camera/business/road data.
 * Returns an updated QuietRouteResult with new density snapshot.
 */
export function refreshQuietRoute(
  previous: QuietRouteResult,
  cameras: Camera[],
  businesses: BusinessLocation[],
  roadSegments: RoadSegment[],
  options?: Partial<QuietRouteOptions>,
): QuietRouteResult {
  if (previous.waypoints.length < 2) return previous;

  const start: [number, number] = [previous.waypoints[0].lat, previous.waypoints[0].lng];
  const end: [number, number] = [previous.waypoints[previous.waypoints.length - 1].lat, previous.waypoints[previous.waypoints.length - 1].lng];

  const refreshed = generateQuietRoute(start, end, cameras, businesses, roadSegments, options);

  // Preserve the route identity but update all data
  return {
    ...refreshed,
    routeId: previous.routeId,
    waypoints: previous.waypoints, // keep original waypoints, re-score segments
    lastRefreshed: new Date().toISOString(),
    densitySnapshot: {
      cameraCount: cameras.length,
      businessCount: businesses.length,
      roadSegmentCount: roadSegments.length,
      avgDensity: roadSegments.length > 0
        ? roadSegments.reduce((s, r) => s + densityScore(r.currentDensity?.densityLevel || 'green'), 0) / roadSegments.length
        : 0,
    },
  };
}

/**
 * Check if any camera on the route has a security opening (public or verified stream).
 * When true, all cameras on the route become viewable.
 */
export function hasSecurityOpening(camerasOnRoute: QuietRouteResult['camerasOnRoute']): boolean {
  return camerasOnRoute.some((cam) => cam.isPublic || cam.streamVerified);
}

/** Get all viewable cameras (all if security opening exists, otherwise only public/verified). */
export function getViewableCameras(
  camerasOnRoute: QuietRouteResult['camerasOnRoute'],
): QuietRouteResult['camerasOnRoute'] {
  const anyOpen = hasSecurityOpening(camerasOnRoute);
  if (anyOpen) return camerasOnRoute; // security opening: all cameras viewable
  return camerasOnRoute.filter((cam) => cam.isPublic || cam.streamVerified);
}