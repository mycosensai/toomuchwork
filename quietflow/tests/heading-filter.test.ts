import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { DiscoveredCamera } from '@/types';
import { filterCamerasByHeading, selectCameraPerSegment } from '../src/lib/heading-filter.ts';

// Minimal DiscoveredCamera factory.
function cam(id: string, lat: number, lng: number, bearing?: number): DiscoveredCamera {
  return {
    id,
    name: id,
    lat,
    lng,
    camera_bearing: bearing,
    confidence: 0.7,
    source: 'osm',
  } as DiscoveredCamera;
}

// Route: a short west→east segment near lat 32.8, lng -96.8.
const route: [number, number][] = [
  [32.8000, -96.8100],
  [32.8000, -96.7900],
];

// A camera sitting NORTH of the road (lat 32.8005) must point SOUTH (180°)
// to watch traffic traveling east-west along the road.
const CAM_LAT = 32.8005;
const CAM_LNG = -96.8000;

test('toward-facing camera is selected when pointing at the route (south = 180°)', () => {
  const cams = [cam('south', CAM_LAT, CAM_LNG, 180)];
  const res = filterCamerasByHeading(cams, route, 45);
  assert.equal(res.toward.length, 1);
  assert.equal(res.away.length, 0);
  assert.equal(res.usedFallback, false);
  assert.equal(res.chosen[0].id, 'south');
});

test('away-facing camera is excluded when a toward-facing one exists', () => {
  const cams = [
    cam('south', CAM_LAT, CAM_LNG, 180), // points at route
    cam('north', CAM_LAT, CAM_LNG, 0), // points away (north)
  ];
  const res = filterCamerasByHeading(cams, route, 45);
  assert.equal(res.toward.length, 1);
  assert.equal(res.away.length, 1);
  assert.equal(res.toward[0].id, 'south');
  assert.equal(res.chosen[0].id, 'south');
});

test('fallback uses away-facing cameras when no toward-facing camera exists', () => {
  const cams = [cam('north', CAM_LAT, CAM_LNG, 0)]; // only away-facing
  const res = filterCamerasByHeading(cams, route, 45);
  assert.equal(res.toward.length, 0);
  assert.equal(res.away.length, 1);
  assert.equal(res.usedFallback, true);
  assert.equal(res.chosen[0].id, 'north');
});

test('camera with unknown heading is treated as toward (optimistic, no coverage gap)', () => {
  const cams = [cam('unknown', CAM_LAT, CAM_LNG)]; // no camera_bearing
  const res = filterCamerasByHeading(cams, route, 45);
  assert.equal(res.toward.length, 1);
  assert.equal(res.usedFallback, false);
});

test('tolerance widens the toward set', () => {
  // Ideal facing is ~180° (south, toward the road). A camera at 130° is 50° off.
  const cams = [cam('off', CAM_LAT, CAM_LNG, 130)];
  // 30° tolerance: 50° off → excluded. 55° tolerance: within → included.
  assert.equal(filterCamerasByHeading(cams, route, 30).toward.length, 0);
  assert.equal(filterCamerasByHeading(cams, route, 55).toward.length, 1);
});

test('selectCameraPerSegment picks a camera per leg with toward preference', () => {
  const cams = [cam('south', CAM_LAT, CAM_LNG, 180)];
  const sel = selectCameraPerSegment(cams, route, 45);
  assert.ok(sel.length >= 1);
  const withCam = sel.find((s) => s.camera);
  assert.ok(withCam);
  assert.equal(withCam!.towardFacing, true);
});
