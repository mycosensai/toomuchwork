/**
 * Feature 1: Anonymized Density Engine
 * Crowd density without identifying individuals.
 * No faces, no personal info — just density heatmaps.
 */

import type { DensityLevel, BusinessLocation, Camera } from '@/types';

export interface AnonymizedCell {
  lat: number;
  lng: number;
  radiusM: number;
  densityLevel: DensityLevel;
  countEstimate: number; // anonymized count, never individuals
  timestamp: string;
  source: 'synthetic' | 'crowd-report' | 'satellite' | 'camera-aggregate';
}

export interface DensityHeatmap {
  cells: AnonymizedCell[];
  bounds: { north: number; south: number; east: number; west: number };
  generatedAt: string;
}

/**
 * Convert business/camera density into anonymized heatmap cells.
 * Never exposes individual people — only aggregate counts.
 */
export function generateAnonymizedDensity(
  businesses: BusinessLocation[],
  cameras: Camera[],
  center: [number, number],
  radiusKm: number = 5,
): DensityHeatmap {
  const cells: AnonymizedCell[] = [];
  const { lat: cLat, lng: cLng } = { lat: center[0], lng: center[1] };

  // Generate grid cells from business density
  for (const biz of businesses) {
    const dist = haversineM(cLat, cLng, biz.lat, biz.lng);
    if (dist > radiusKm * 1000) continue;

    const level = biz.density?.densityLevel || 'green';
    const countEst = densityToCountEstimate(level);

    cells.push({
      lat: biz.lat,
      lng: biz.lng,
      radiusM: biz.geofenceRadius || 50,
      densityLevel: level,
      countEstimate: countEst,
      timestamp: new Date().toISOString(),
      source: 'crowd-report',
    });
  }

  // Add camera-aggregate cells
  for (const cam of cameras) {
    const dist = haversineM(cLat, cLng, cam.lat, cam.lng);
    if (dist > radiusKm * 1000) continue;

    const vehicleEst = cam.vehicleCountEst || 0;
    const level = vehicleCountToDensityLevel(vehicleEst);

    cells.push({
      lat: cam.lat,
      lng: cam.lng,
      radiusM: 30,
      densityLevel: level,
      countEstimate: vehicleEst,
      timestamp: new Date().toISOString(),
      source: 'camera-aggregate',
    });
  }

  // Fill gaps with synthetic cells (no identity possible)
  const synthetic = generateSyntheticCells(center, radiusKm, cells.length);
  cells.push(...synthetic);

  return {
    cells,
    bounds: {
      north: cLat + radiusKm / 111,
      south: cLat - radiusKm / 111,
      east: cLng + radiusKm / (111 * Math.cos(cLat * Math.PI / 180)),
      west: cLng - radiusKm / (111 * Math.cos(cLat * Math.PI / 180)),
    },
    generatedAt: new Date().toISOString(),
  };
}

function haversineM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function densityToCountEstimate(level: DensityLevel): number {
  const map: Record<DensityLevel, number> = { green: 5, yellow: 15, orange: 30, red: 60, purple: 100 };
  return map[level];
}

function vehicleCountToDensityLevel(count: number): DensityLevel {
  if (count < 10) return 'green';
  if (count < 25) return 'yellow';
  if (count < 45) return 'orange';
  if (count < 70) return 'red';
  return 'purple';
}

function generateSyntheticCells(
  center: [number, number],
  radiusKm: number,
  existingCount: number,
): AnonymizedCell[] {
  const cells: AnonymizedCell[] = [];
  const gridSize = 0.005; // ~500m grid
  const steps = Math.ceil(radiusKm / 0.5);

  for (let dx = -steps; dx <= steps; dx++) {
    for (let dy = -steps; dy <= steps; dy++) {
      const lat = center[0] + dx * gridSize;
      const lng = center[1] + dy * gridSize;
      // Skip if too close to existing cells
      const tooClose = cells.some(
        (c) => haversineM(lat, lng, c.lat, c.lng) < 200,
      );
      if (tooClose) continue;

      const rand = Math.random();
      cells.push({
        lat,
        lng,
        radiusM: 200,
        densityLevel: rand < 0.4 ? 'green' : rand < 0.7 ? 'yellow' : rand < 0.9 ? 'orange' : 'red',
        countEstimate: Math.round(rand * 50),
        timestamp: new Date().toISOString(),
        source: 'synthetic',
      });
    }
  }

  return cells.slice(0, Math.max(0, existingCount));
}