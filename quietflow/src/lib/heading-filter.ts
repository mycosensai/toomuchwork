// ─── Heading Filter (Module 1: Consented Discovery → God-View) ──
//
// Implements the directional camera-selection rule for the route planner:
//   • A camera is "toward-facing" when its pointing bearing (camera_bearing)
//     is within ±toleranceDeg of the bearing from the camera to the nearest
//     point on the route.
//   • We PREFER toward-facing cameras (they actually watch the road you'll
//     travel), but if a segment has NO toward-facing camera, we fall back to
//     showing the away-facing cameras so coverage is continuous and the user
//     still sees "what's there" — never a blank gap.
//
// All cameras here come from consented/public sources (OSM, 511, TxDOT, or
// the user's OWN authorized devices). No private/residential feeds are touched.

import type { DiscoveredCamera } from '@/types';

export interface HeadingSelection {
  /** Cameras whose facing aligns with the route (the preferred set). */
  toward: DiscoveredCamera[];
  /** Cameras that face away (fallback set, used when toward is empty). */
  away: DiscoveredCamera[];
  /** The set actually chosen for display after applying the fallback rule. */
  chosen: DiscoveredCamera[];
  /** True when the fallback (away-facing) set was used. */
  usedFallback: boolean;
  toleranceDeg: number;
}

// ─── Geometry helpers (self-contained; no external deps) ───

const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const EARTH_R = 6371000;

function bearing(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const dLng = (bLng - aLng) * D2R;
  const y = Math.sin(dLng) * Math.cos(bLat * D2R);
  const x =
    Math.cos(aLat * D2R) * Math.sin(bLat * D2R) -
    Math.sin(aLat * D2R) * Math.cos(bLat * D2R) * Math.cos(dLng);
  return (Math.atan2(y, x) * R2D + 360) % 360;
}

/** Smallest absolute difference between two bearings, 0..180. */
function angleDiff(d1: number, d2: number): number {
  const d = Math.abs(((d1 - d2 + 180) % 360) - 180);
  return d;
}

/** Nearest point on a polyline to (lat,lng); returns {lat,lng,bearing}. */
function nearestOnRoute(
  lat: number,
  lng: number,
  route: Array<[number, number]>,
): { lat: number; lng: number; bearing: number } {
  let best = { lat: route[0][0], lng: route[0][1], dist: Infinity, bearing: 0 };
  for (let i = 0; i < route.length - 1; i++) {
    const [x1, y1] = route[i];
    const [x2, y2] = route[i + 1];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const lenSq = dx * dx + dy * dy || 1e-12;
    let t = ((lat - x1) * dx + (lng - y1) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const dLat = (lat - px) * D2R;
    const dLng = (lng - py) * D2R;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(px * D2R) * Math.cos(lat * D2R) * Math.sin(dLng / 2) ** 2;
    const dist = 2 * EARTH_R * Math.asin(Math.sqrt(h));
    if (dist < best.dist) {
      best = { lat: px, lng: py, dist, bearing: bearing(x1, y1, x2, y2) };
    }
  }
  return best;
}

// ─── Core filter ───

/**
 * Split consented/public cameras into toward-facing vs away-facing relative to
 * a route polyline, applying the ±toleranceDeg directional rule with the
 * away-facing fallback when no toward-facing camera exists for a location.
 */
export function filterCamerasByHeading(
  cameras: DiscoveredCamera[],
  route: Array<[number, number]>,
  toleranceDeg = 45,
): HeadingSelection {
  const toward: DiscoveredCamera[] = [];
  const away: DiscoveredCamera[] = [];

  for (const cam of cameras) {
    const near = nearestOnRoute(cam.lat, cam.lng, route);
    // Bearing from the camera TOWARD the route (what the camera would need to
    // point at to watch the road you travel).
    const targetBearing = bearing(cam.lat, cam.lng, near.lat, near.lng);

    if (cam.camera_bearing == null || Number.isNaN(cam.camera_bearing)) {
      // Heading unknown → cannot prove alignment; treat as "toward" so the
      // camera is still considered useful (optimistic, never hides coverage).
      toward.push({ ...cam, target_bearing: targetBearing });
    } else {
      const diff = angleDiff(cam.camera_bearing, targetBearing);
      // Store the alignment score (0..100) for UI ranking.
      const alignment = Math.round((1 - Math.min(diff, 180) / 180) * 100);
      if (diff <= toleranceDeg) {
        toward.push({ ...cam, target_bearing: targetBearing, alignment_score: alignment });
      } else {
        away.push({ ...cam, target_bearing: targetBearing, alignment_score: alignment });
      }
    }
  }

  const usedFallback = toward.length === 0 && away.length > 0;
  const chosen = usedFallback ? away : toward;

  return { toward, away, chosen, usedFallback, toleranceDeg };
}

/**
 * Per-segment selection: for each route segment, pick the best toward-facing
 * camera (if any) else the best away-facing camera. Returns a map of
 * segmentIndex → camera. Lets the route engine render one "watch camera" per
 * leg while preserving the fallback guarantee.
 */
export function selectCameraPerSegment(
  cameras: DiscoveredCamera[],
  route: Array<[number, number]>,
  toleranceDeg = 45,
): Array<{ segmentIndex: number; camera: DiscoveredCamera | null; towardFacing: boolean }> {
  const out: Array<{ segmentIndex: number; camera: DiscoveredCamera | null; towardFacing: boolean }> = [];
  for (let i = 0; i < route.length - 1; i++) {
    const a = route[i];
    const b = route[i + 1];
    const midLat = (a[0] + b[0]) / 2;
    const midLng = (a[1] + b[1]) / 2;
    // Cameras near this segment midpoint.
    const near = cameras
      .map((cam) => {
        const dLat = (cam.lat - midLat) * D2R;
        const dLng = (cam.lng - midLng) * D2R;
        const h =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(midLat * D2R) * Math.cos(cam.lat * D2R) * Math.sin(dLng / 2) ** 2;
        const dist = 2 * EARTH_R * Math.asin(Math.sqrt(h));
        return { cam, dist };
      })
      .filter((x) => x.dist <= 250) // within ~250m of the segment
      .sort((x, y) => x.dist - y.dist);

    const sel = filterCamerasByHeading(near.map((x) => x.cam), route, toleranceDeg);
    const best = sel.toward[0] ?? sel.away[0] ?? null;
    out.push({
      segmentIndex: i,
      camera: best,
      towardFacing: best ? sel.toward.includes(best) : false,
    });
  }
  return out;
}
