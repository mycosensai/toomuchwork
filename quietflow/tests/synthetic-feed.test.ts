import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelFromScore,
  levelColor,
  mulberry32,
  generateSyntheticTiles,
  pulse,
  aggregateGodView,
} from '../src/lib/synthetic-feed.ts';
import type { DiscoveredCamera } from '@/types';

test('levelFromScore maps the QuietFlow density vocabulary', () => {
  assert.equal(levelFromScore(0.0), 'green');
  assert.equal(levelFromScore(0.3), 'yellow');
  assert.equal(levelFromScore(0.6), 'orange');
  assert.equal(levelFromScore(0.8), 'red');
  assert.equal(levelFromScore(1.0), 'purple');
  assert.equal(levelFromScore(2.0), 'purple'); // clamp high
  assert.equal(levelFromScore(-1), 'green'); // clamp low
});

test('levelColor returns the QuietFlow palette', () => {
  assert.equal(levelColor('green'), '#22c55e');
  assert.equal(levelColor('purple'), '#a855f7');
});

test('mulberry32 is deterministic for a given seed', () => {
  const a = mulberry32(1337);
  const b = mulberry32(1337);
  assert.equal(a(), b());
  assert.equal(a(), b());
});

test('generateSyntheticTiles fills the surface (no gaps) and stays in 0..1', () => {
  const tiles = generateSyntheticTiles({ lat: 32.8, lng: -96.8 }, { count: 24, seed: 7 });
  assert.equal(tiles.length, 24);
  for (const t of tiles) {
    assert.ok(t.score >= 0 && t.score <= 1, `score in range: ${t.score}`);
    assert.ok(t.synthetic, 'tile is synthetic');
  }
});

test('generateSyntheticTiles is deterministic per seed', () => {
  const t1 = generateSyntheticTiles({ lat: 32.8, lng: -96.8 }, { count: 10, seed: 99 });
  const t2 = generateSyntheticTiles({ lat: 32.8, lng: -96.8 }, { count: 10, seed: 99 });
  assert.equal(t1[0].lat, t2[0].lat);
  assert.equal(t1[3].score, t2[3].score);
});

test('pulse stays within 0.85..1.0', () => {
  for (let ms = 0; ms < 5000; ms += 137) {
    const p = pulse(ms);
    assert.ok(p >= 0.85 && p <= 1.0, `pulse in range: ${p}`);
  }
});

test('aggregateGodView combines consented cameras with synthetic fill', () => {
  const consented = [
    { id: 'c1', name: 'txdot', lat: 32.801, lng: -96.799, confidence: 0.9, source: 'cctv' } as DiscoveredCamera,
  ];
  const overlay = aggregateGodView({ lat: 32.8, lng: -96.8 }, consented, { seed: 3, pulseFactor: 1 });
  assert.equal(overlay.source, 'mixed');
  assert.ok(overlay.tiles.length > 0);
  // The consented camera should appear as a non-synthetic tile.
  assert.ok(overlay.tiles.some((t) => !t.synthetic));
  assert.ok(overlay.meanScore >= 0 && overlay.meanScore <= 1);
});

test('aggregateGodView with no cameras is pure synthetic and still complete', () => {
  const overlay = aggregateGodView({ lat: 32.8, lng: -96.8 }, [], { seed: 5 });
  assert.equal(overlay.source, 'synthetic');
  assert.ok(overlay.tiles.length >= 1);
  assert.ok(overlay.tiles.every((t) => t.synthetic));
});
