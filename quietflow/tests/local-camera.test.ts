import { test } from 'node:test';
import assert from 'node:assert/strict';
import { registerLocalCamera, registerLocalCameras, localCameraToAppCamera, localCameraHlsUrl, CAMERA_BRIDGE_BASE } from '../src/lib/local-camera.ts';
import { buildRouteCameraPlan } from '../src/lib/route-camera-plan.ts';
import type { DiscoveredCamera } from '@/types';

const DALLAS = { lat: 32.7767, lng: -96.797 };
const route: [number, number][] = [[32.8000, -96.8100], [32.8000, -96.7900]];

test('local camera registers over RTSP with no cloud OAuth', () => {
  const r = registerLocalCamera({
    id: 'cam1',
    name: 'Garage Hikvision',
    host: '192.168.1.42',
    lat: 32.8005,
    lng: -96.8000,
    camera_bearing: 180,
    user: 'quietflow',
    pass: 'StrongUn1que!Pass',
    brand: 'cctv',
  });
  assert.equal(r.accepted, true);
  assert.equal(r.onDefaultCredential, false);
  assert.match(r.rtspUrl, /^rtsp:\/\/quietflow:.*@192\.168\.1\.42:554\//);
  assert.equal(r.camera.source, 'local');
  assert.equal(r.camera.protocol, 'rtsp');
});

test('local camera on factory default is refused (no streaming)', () => {
  const r = registerLocalCamera({
    id: 'cam2',
    name: 'Backyard cam',
    host: '192.168.1.43',
    lat: 32.8006,
    lng: -96.8010,
    user: 'admin',
    pass: '12345', // classic Hikvision default
  });
  assert.equal(r.accepted, false);
  assert.equal(r.onDefaultCredential, true);
  assert.match(r.warning ?? '', /factory default/);
});

test('registerLocalCameras splits accepted vs rejected', () => {
  const out = registerLocalCameras([
    { id: 'a', name: 'A', host: '192.168.1.10', lat: 32.8, lng: -96.8, user: 'me', pass: 'g00dPass' },
    { id: 'b', name: 'B', host: '192.168.1.11', lat: 32.8, lng: -96.8, user: 'admin', pass: 'admin' },
  ]);
  assert.equal(out.accepted.length, 1);
  assert.equal(out.rejected.length, 1);
  assert.equal(out.rejected[0].id, 'b');
});

test('local cameras flow into the route plan + God-View (no OAuth)', () => {
  const consented: DiscoveredCamera[] = [];
  const plan = buildRouteCameraPlan({
    start: route[0],
    end: route[1],
    route,
    cameras: consented,
    center: DALLAS,
    localCameras: [
      { id: 'mine', name: 'My Cam', host: '192.168.1.42', lat: 32.8005, lng: -96.8000, camera_bearing: 180, user: 'quietflow', pass: 'StrongUn1que!Pass' },
    ],
  });
  // The local camera should appear in the toward-facing set (points south at the road).
  assert.ok(plan.towardFacingCameras.some((c) => c.id === 'local-mine'));
  assert.equal(plan.localRejected.length, 0);
  // And it should show up as a real (non-synthetic) God-View tile.
  assert.ok(plan.godView.tiles.some((t) => !t.synthetic));
});

test('default-cred local cameras are excluded from the plan', () => {
  const plan = buildRouteCameraPlan({
    start: route[0],
    end: route[1],
    route,
    cameras: [],
    center: DALLAS,
    localCameras: [
      { id: 'bad', name: 'Bad', host: '192.168.1.99', lat: 32.8005, lng: -96.8000, user: 'admin', pass: 'admin' },
    ],
  });
  assert.equal(plan.localRejected.length, 1);
  assert.equal(plan.selectedCameras.length, 0);
});

test('saved local camera maps to a renderable Camera with bridge HLS URL', () => {
  const stored = {
    id: 'mine', name: 'Garage Cam', host: '192.168.1.42',
    lat: 32.8005, lng: -96.8000, camera_bearing: 180,
    user: 'quietflow', rtspPort: 554, rtspPath: 'cam/realmonitor?channel=1&subtype=0',
    brand: 'cctv' as const, addedAt: '2026-08-08T00:00:00.000Z',
  };
  const cam = localCameraToAppCamera(stored);
  assert.equal(cam.id, 'local-mine');
  assert.equal(cam.protocol, 'hls');
  assert.equal(cam.jurisdiction, 'local');
  assert.equal(cam.streamUrl, localCameraHlsUrl('mine'));
  assert.equal(cam.streamUrl, `${CAMERA_BRIDGE_BASE}/hls/mine/index.m3u8`);
  assert.equal(cam.orientation, 'S'); // bearing 180 → South
});

test('localCameraHlsUrl points at the bridge for the camera id', () => {
  assert.equal(localCameraHlsUrl('abc'), `${CAMERA_BRIDGE_BASE}/hls/abc/index.m3u8`);
});
