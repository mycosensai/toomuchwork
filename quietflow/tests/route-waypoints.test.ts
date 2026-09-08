import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downsampleRoute } from '../src/lib/route-geometry.ts';

// downsampleRoute turns a dense OSRM polyline into the bounded routeWaypoints
// array that QuietRoute, the route camera counter, the live ETA, and en-route
// incident detection all consume. If it drops the true start/end or returns a
// degenerate array, every route-aware feature silently misreports.

function line(n: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => [-96.8 + i * 0.001, 32.79 + i * 0.001] as [number, number]);
}

test('an empty or invalid polyline yields no waypoints', () => {
  assert.deepEqual(downsampleRoute([], 60), []);
  assert.deepEqual(downsampleRoute(undefined as any, 60), []);
  assert.deepEqual(downsampleRoute(null as any, 60), []);
});

test('a polyline shorter than the cap is returned untouched', () => {
  const l = line(10);
  assert.deepEqual(downsampleRoute(l, 60), l);
});

test('a dense polyline is capped at max', () => {
  const l = line(2000);
  const out = downsampleRoute(l, 60);
  assert.equal(out.length, 60);
});

test('the true start and end are always preserved', () => {
  const l = line(2000);
  const out = downsampleRoute(l, 60);
  assert.deepEqual(out[0], l[0], 'start must be the real route origin');
  assert.deepEqual(out[out.length - 1], l[l.length - 1], 'end must be the real destination');
});

test('waypoints stay in route order and are never duplicated end-to-end', () => {
  const l = line(500);
  const out = downsampleRoute(l, 25);
  for (let i = 1; i < out.length; i++) {
    assert.ok(out[i][0] > out[i - 1][0], `waypoint ${i} must advance along the route`);
  }
});

test('a two-point cap degrades to start and end only', () => {
  const l = line(500);
  const out = downsampleRoute(l, 2);
  assert.deepEqual(out, [l[0], l[499]]);
});

test('the result always has >= 2 points so start/end slicing is safe', () => {
  // Consumers do routeWaypoints[0] and routeWaypoints[length-1] after checking
  // length >= 2; a downsample must never produce a single-point route from a
  // real multi-point polyline.
  for (const n of [3, 61, 100, 999]) {
    const out = downsampleRoute(line(n), 60);
    assert.ok(out.length >= 2, `n=${n} produced ${out.length} waypoint(s)`);
  }
});
