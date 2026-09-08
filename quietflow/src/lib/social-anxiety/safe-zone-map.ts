/**
 * Feature 7: Safe Zone Map
 * Pre-mapped low-crowd locations: parking lots, park benches,
 * library corners, 24h churches. Curated list.
 */

import type { DensityLevel } from '@/types';

export interface SafeZone {
  id: string;
  name: string;
  type: 'parking' | 'park' | 'library' | 'church' | 'hospital' | '24h_business' | 'quiet_cafe' | 'museum' | 'university';
  lat: number;
  lng: number;
  address: string;
  hours: string; // e.g. "24/7" or "6am-10pm"
  avgCrowdLevel: DensityLevel;
  socialPressure: 'none' | 'low' | 'medium' | 'high'; // how much social interaction expected
  quietScore: number; // 0-100
  verified: boolean;
  notes: string; // user-contributed notes, no PII
  createdAt: string;
}

/** Curated safe zones for Dallas area */
export const SAFE_ZONES: SafeZone[] = [
  {
    id: 'sz-001',
    name: 'Dallas Public Library - Main',
    type: 'library',
    lat: 32.7831,
    lng: -96.8067,
    address: '1515 Young St, Dallas, TX 75201',
    hours: '10am-6pm',
    avgCrowdLevel: 'green',
    socialPressure: 'low',
    quietScore: 92,
    verified: true,
    notes: 'Quiet study areas, low interaction',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-002',
    name: 'Klyde Warren Park - North End',
    type: 'park',
    lat: 32.7865,
    lng: -96.8087,
    address: '2012 Woodall Rodgers Fwy, Dallas, TX 75201',
    hours: '24/7',
    avgCrowdLevel: 'yellow',
    socialPressure: 'low',
    quietScore: 78,
    verified: true,
    notes: 'Open green space, easy to find quiet corner',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-003',
    name: '24h Walmart Parking Lot',
    type: 'parking',
    lat: 32.7789,
    lng: -96.8021,
    address: 'Multiple locations',
    hours: '24/7',
    avgCrowdLevel: 'orange',
    socialPressure: 'none',
    quietScore: 55,
    verified: false,
    notes: 'Safe well-lit parking, can sit in car',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-004',
    name: 'First Baptist Dallas',
    type: 'church',
    lat: 32.7795,
    lng: -96.7948,
    address: '1300 Ervay St, Dallas, TX 75201',
    hours: '24/7',
    avgCrowdLevel: 'green',
    socialPressure: 'none',
    quietScore: 95,
    verified: true,
    notes: 'Peaceful sanctuary, always open',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-005',
    name: 'UTD Library - Richardson',
    type: 'library',
    lat: 32.9866,
    lng: -96.9304,
    address: '800 W Campbell Rd, Richardson, TX 75080',
    hours: '24/7',
    avgCrowdLevel: 'green',
    socialPressure: 'low',
    quietScore: 90,
    verified: true,
    notes: 'Student-free after 10pm',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-006',
    name: 'White Rock Lake Trail - East Side',
    type: 'park',
    lat: 32.779,
    lng: -96.733,
    address: '909 W Lawther Dr, Dallas, TX 75218',
    hours: '24/7',
    avgCrowdLevel: 'green',
    socialPressure: 'none',
    quietScore: 88,
    verified: true,
    notes: 'Walking trail, low foot traffic on east side',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-007',
    name: 'Meow Wolf Dallas',
    type: 'museum',
    lat: 32.7786,
    lng: -96.8018,
    address: '1012 N Market St, Dallas, TX 75202',
    hours: '10am-8pm',
    avgCrowdLevel: 'yellow',
    socialPressure: 'low',
    quietScore: 82,
    verified: false,
    notes: 'Immersive art, you can wander alone',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sz-008',
    name: 'Preston Royal Library',
    type: 'library',
    lat: 32.8169,
    lng: -96.7938,
    address: '5707 Preston Rd, Dallas, TX 75209',
    hours: '10am-6pm',
    avgCrowdLevel: 'green',
    socialPressure: 'low',
    quietScore: 91,
    verified: true,
    notes: 'Small branch, very quiet',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Find safe zones near a location, sorted by quiet score.
 */
export function findNearbySafeZones(
  origin: [number, number],
  maxDistanceKm: number = 10,
  minQuietScore: number = 60,
): SafeZone[] {
  return SAFE_ZONES.filter((zone) => {
    const dist = haversineKm(origin[0], origin[1], zone.lat, zone.lng);
    return dist <= maxDistanceKm && zone.quietScore >= minQuietScore;
  }).sort((a, b) => b.quietScore - a.quietScore);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}