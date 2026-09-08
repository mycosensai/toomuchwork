// ─── Route Planner Glue (Module 1 + 3 combined) ──
//
// Ties together:
//   1. consented/public camera discovery (re-uses camera-discovery.ts),
//   2. the ±45° heading filter (heading-filter.ts),
//   3. the aggregated God-View overlay (synthetic-feed.ts).
//
// Produces a route-aware camera plan: for a given start→end, it returns the
// cameras that actually watch the road (toward-facing, with away-facing
// fallback), plus a continuous density overlay for the God-View map.
//
// NO private/residential feeds are accessed. Ring/Nest/Arlo/Wyze only appear
// if the user supplies their OWN OAuth token (handled in camera-discovery.ts).

import type { DiscoveredCamera } from '@/types';
import { filterCamerasByHeading, selectCameraPerSegment } from './heading-filter.ts';
import { aggregateGodView } from './synthetic-feed.ts';
import { registerLocalCameras, type LocalCameraSpec } from './local-camera.ts';

export interface RoutePlanInput {
  start: [number, number];
  end: [number, number];
  /** A route polyline (already-routed). Defaults to a straight start→end leg. */
  route?: Array<[number, number]>;
  /** Consented/public cameras discovered for the area. */
  cameras: DiscoveredCamera[];
  /** YOUR OWN cameras, registered over local RTSP/ONVIF (no cloud OAuth). */
  localCameras?: LocalCameraSpec[];
  /** Center for the God-View overlay. */
  center: { lat: number; lng: number };
  headingToleranceDeg?: number;
  seed?: number;
}

export interface RouteCameraPlan {
  routeGeometry: Array<[number, number]>;
  towardFacingCameras: DiscoveredCamera[];
  awayFacingCameras: DiscoveredCamera[];
  /** Cameras chosen for display after the fallback rule. */
  selectedCameras: DiscoveredCamera[];
  usedFallback: boolean;
  /** One watch-camera per route leg. */
  perSegment: Array<{ segmentIndex: number; camera: DiscoveredCamera | null; towardFacing: boolean }>;
  /** Continuous God-View density overlay (synthetic + real). */
  godView: ReturnType<typeof aggregateGodView>;
  /** Local cameras that were rejected (e.g. still on factory-default creds). */
  localRejected: Array<{ id: string; reason: string }>;
}

/**
 * Build a route-aware camera plan + God-View overlay from consented + YOUR
 * local cameras (no cloud OAuth). Local cameras still on factory-default
 * credentials are excluded and reported so you can harden them.
 */
export function buildRouteCameraPlan(input: RoutePlanInput): RouteCameraPlan {
  const route = input.route ?? [input.start, input.end];
  const tolerance = input.headingToleranceDeg ?? 45;

  // Merge your local cameras (already-authorized, no OAuth) into the set.
  let localRejected: Array<{ id: string; reason: string }> = [];
  let allCameras = input.cameras;
  if (input.localCameras && input.localCameras.length) {
    const reg = registerLocalCameras(input.localCameras);
    localRejected = reg.rejected;
    allCameras = [...input.cameras, ...reg.accepted];
  }

  const selection = filterCamerasByHeading(allCameras, route, tolerance);
  const perSegment = selectCameraPerSegment(allCameras, route, tolerance);
  const godView = aggregateGodView(input.center, allCameras, {
    radiusKm: 6,
    seed: input.seed,
    pulseFactor: 1,
  });

  return {
    routeGeometry: route,
    towardFacingCameras: selection.toward,
    awayFacingCameras: selection.away,
    selectedCameras: selection.chosen,
    usedFallback: selection.usedFallback,
    perSegment,
    godView,
    localRejected,
  };
}
