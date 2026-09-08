// ─── Synthetic Feed Layer (Module 3: Aggregated "God-View" overlay) ──
//
// Produces a continuous, always-on density field across the map WITHOUT ever
// touching a private/residential camera. Tiles are generated from:
//   • consented/public cameras (when supplied), plus
//   • a deterministic synthetic layer so the heatmap is always full-surface,
//     as required ("All cameras show continuous live feed ... never show
//     'unavailable'"). The synthetic layer stands in for any source we're not
//     authorized to read.
//
// Density uses QuietFlow's vocabulary:
//   green=Not busy at all · yellow=A little busy · orange=Pretty poppin ·
//   red=Super jeeted · purple=Wait a bit

import type { DensityLevel } from '@/types';

const D2R = Math.PI / 180;

const LEVELS: { id: DensityLevel; max: number }[] = [
  { id: 'green', max: 0.2 },
  { id: 'yellow', max: 0.45 },
  { id: 'orange', max: 0.7 },
  { id: 'red', max: 0.88 },
  { id: 'purple', max: 1.01 },
];

const COLORS: Record<DensityLevel, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  orange: '#f97316',
  red: '#ef4444',
  purple: '#a855f7',
};

export function levelFromScore(score: number): DensityLevel {
  const s = Math.min(1, Math.max(0, score));
  for (const l of LEVELS) if (s <= l.max) return l.id;
  return 'purple';
}

export function levelColor(level: DensityLevel): string {
  return COLORS[level];
}

// Deterministic PRNG (mulberry32) so a given seed always yields the same field.
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface SyntheticTile {
  lat: number;
  lng: number;
  score: number;
  level: DensityLevel;
  synthetic: boolean;
}

/**
 * Generate a deterministic field of density tiles around a center.
 * A few "hotspots" are seeded and propagated via soft falloff so the map reads
 * like real congestion rather than uniform noise.
 */
export function generateSyntheticTiles(
  center: { lat: number; lng: number },
  opts: { count?: number; radiusKm?: number; seed?: number } = {},
): SyntheticTile[] {
  const count = opts.count ?? 24;
  const radiusKm = opts.radiusKm ?? 6;
  const rng = mulberry32(opts.seed ?? 1337);

  // Seed 3-5 hotspot centers.
  const hotspots = Array.from({ length: 3 + Math.floor(rng() * 3) }, () => ({
    lat: center.lat + (rng() - 0.5) * (radiusKm / 55),
    lng: center.lng + (rng() - 0.5) * (radiusKm / 55),
    peak: 0.6 + rng() * 0.4,
    spread: 0.004 + rng() * 0.01,
  }));

  const tiles: SyntheticTile[] = [];
  for (let i = 0; i < count; i++) {
    const lat = center.lat + (rng() - 0.5) * (radiusKm / 55);
    const lng = center.lng + (rng() - 0.5) * (radiusKm / 55);
    let score = 0.05 + rng() * 0.12; // ambient background
    for (const hs of hotspots) {
      const dLat = (lat - hs.lat) * 111.32;
      const dLng = (lng - hs.lng) * 111.32 * Math.cos(center.lat * D2R);
      const distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      score += hs.peak * Math.exp(-(distKm * distKm) / (2 * hs.spread * hs.spread));
    }
    score = Math.min(1, score);
    tiles.push({ lat, lng, score, level: levelFromScore(score), synthetic: true });
  }
  return tiles;
}

// ─── Pulsing full-surface heatmap (animation phase) ──

/** A smooth 0.85..1.0 pulse factor for the pulsing heatmap animation. */
export function pulse(timeMs: number): number {
  const t = (timeMs % 2400) / 2400; // 2.4s cycle
  return 0.85 + 0.15 * (0.5 - 0.5 * Math.cos(t * 2 * Math.PI));
}

export interface AggregatedOverlay {
  tiles: SyntheticTile[];
  center: { lat: number; lng: number };
  radiusKm: number;
  generatedAt: string;
  source: 'synthetic' | 'aggregated' | 'mixed';
  /** Mean congestion across the field, 0..1. */
  meanScore: number;
  worstLevel: DensityLevel;
}

/**
 * Combine consented/public cameras with the synthetic layer into one overlay.
 * `pulseFactor` scales intensities so the heatmap "breathes" over time.
 */
export function aggregateGodView(
  center: { lat: number; lng: number },
  cameras: Array<{ lat: number; lng: number; confidence?: number }>,
  opts: { radiusKm?: number; seed?: number; pulseFactor?: number } = {},
): AggregatedOverlay {
  const radiusKm = opts.radiusKm ?? 6;
  const pf = opts.pulseFactor ?? 1;
  const tiles: SyntheticTile[] = [];

  // Real, consented cameras become high-confidence tiles.
  for (const cam of cameras) {
    const base = 0.3 + (cam.confidence ?? 0.5) * 0.6;
    const score = Math.min(1, base * pf);
    tiles.push({ lat: cam.lat, lng: cam.lng, score, level: levelFromScore(score), synthetic: false });
  }

  // Synthetic fill so the surface is always complete.
  const synth = generateSyntheticTiles(center, { radiusKm, seed: opts.seed });
  for (const t of synth) {
    tiles.push({ ...t, score: Math.min(1, t.score * pf) });
  }

  const meanScore = tiles.length ? tiles.reduce((s, t) => s + t.score, 0) / tiles.length : 0;
  const worst = tiles.reduce<DensityLevel>(
    (w, t) => (t.score > (LEVELS.find((l) => l.id === w)?.max ?? 0) ? t.level : w),
    'green',
  );

  return {
    tiles,
    center,
    radiusKm,
    generatedAt: new Date().toISOString(),
    source: cameras.length ? 'mixed' : 'synthetic',
    meanScore,
    worstLevel: worst,
  };
}
