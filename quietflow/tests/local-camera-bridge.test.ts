import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildFfmpegArgs } from '../src/lib/local-camera-bridge.ts';
import { registerLocalCamera, toAppCamera } from '../src/lib/local-camera.ts';

test('buildFfmpegArgs produces array args with no shell and correct HLS output', () => {
  const args = buildFfmpegArgs('rtsp://u:p@192.168.1.42:554/stream', '/tmp/hls/cam1', 2, 5);
  assert.ok(Array.isArray(args));
  // RTSP input is present and is an array element (not a shell string).
  assert.ok(args.includes('-i'));
  const i = args.indexOf('-i');
  assert.equal(args[i + 1], 'rtsp://u:p@192.168.1.42:554/stream');
  // HLS muxer + playlist sizing present.
  assert.ok(args.includes('-f'));
  assert.ok(args.includes('hls'));
  assert.ok(args.includes('-hls_time'));
  assert.ok(args.includes('2'));
  assert.ok(args.includes('-hls_list_size'));
  assert.ok(args.includes('5'));
  // Output playlist path.
  assert.ok(args[args.length - 1].endsWith('index.m3u8'));
});

test('buildFfmpegArgs uses tcp transport and deletes stale segments', () => {
  const args = buildFfmpegArgs('rtsp://x@host/stream', '/tmp/hls/c', 2, 4);
  assert.ok(args.includes('-rtsp_transport'));
  assert.ok(args.includes('tcp'));
  assert.ok(args.some((a) => a.includes('delete_segments')));
});

test('registerLocalCamera still refuses default creds (bridge must not stream them)', () => {
  const r = registerLocalCamera({ id: 'b', name: 'B', host: '192.168.1.5', lat: 32.8, lng: -96.8, user: 'admin', pass: 'admin' });
  assert.equal(r.accepted, false);
});

test('toAppCamera yields an HLS Camera for a good-cred local camera', () => {
  const cam = toAppCamera(
    { id: 'garage', name: 'Garage', host: '192.168.1.42', lat: 32.8005, lng: -96.8000, camera_bearing: 180, user: 'quietflow', pass: 'StrongUn1que!Pass' },
    '/hls/local-garage/index.m3u8',
  );
  assert.equal(cam.id, 'local-garage');
  assert.equal(cam.protocol, 'hls');
  assert.equal(cam.streamUrl, '/hls/local-garage/index.m3u8');
  assert.equal(cam.status, 'online');
  assert.equal(cam.brand, 'cctv');
});

test('toAppCamera throws for a camera still on defaults', () => {
  assert.throws(() =>
    toAppCamera(
      { id: 'bad', name: 'Bad', host: '192.168.1.9', lat: 32.8, lng: -96.8, user: 'admin', pass: '12345' },
      '/hls/local-bad/index.m3u8',
    ),
  );
});
