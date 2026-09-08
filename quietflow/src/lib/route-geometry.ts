// ─── Route geometry helpers ───────────────────────────────────────
//
// Pure functions shared by the map (which fetches routes) and the route-aware
// panels (which consume routeWaypoints). Kept free of React/DOM so it is
// directly unit-testable under `node --test`.

/**
 * Reduce a dense routing polyline to at most `max` evenly-spaced points,
 * always preserving the exact first and last coordinate.
 *
 * OSRM's `overview=full` returns hundreds to thousands of coordinates. Route
 * consumers do per-waypoint distance math against every camera and business,
 * so feeding the raw polyline in makes that work quadratic for no added
 * accuracy.
 */
export function downsampleRoute(coords: [number, number][], max = 60): [number, number][] {
  if (!Array.isArray(coords) || coords.length === 0) return [];
  if (coords.length <= max) return coords;
  if (max <= 2) return [coords[0], coords[coords.length - 1]];

  const out: [number, number][] = [];
  // Distribute max-1 samples across the polyline, then append the true end.
  const step = (coords.length - 1) / (max - 1);
  for (let i = 0; i < max - 1; i++) {
    out.push(coords[Math.round(i * step)]);
  }
  out.push(coords[coords.length - 1]);
  return out;
}
