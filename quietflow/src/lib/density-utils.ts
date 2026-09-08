import { DensityLevel, DENSITY_COLORS, DENSITY_LABELS, VehicleDetection, VehicleType } from '@/types';

function hashString(input: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  return () => {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function vehicleCountToDensity(count: number): DensityLevel {
  if (count <= 5) return 'green';
  if (count <= 15) return 'yellow';
  if (count <= 30) return 'orange';
  if (count <= 50) return 'red';
  return 'purple';
}

export function getDensityColor(level: DensityLevel): string {
  return DENSITY_COLORS[level];
}

export function getDensityLabel(level: DensityLevel): string {
  return DENSITY_LABELS[level];
}

export function densityToHexWithOpacity(level: DensityLevel, opacity: number = 0.3): string {
  const hex = DENSITY_COLORS[level];
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Returns a human-readable recommendation based on density and forecast.
 */
export function getRecommendation(
  current: DensityLevel,
  bestWindow: { startTime: string; endTime: string; expectedLevel: DensityLevel; confidence: number } | null,
): string {
  if (current === 'green') return 'It\'s very quiet right now — great time to go!';
  if (current === 'yellow') return 'Conditions are comfortable. Should be a pleasant outing.';
  if (bestWindow && bestWindow.confidence > 0.7) {
    const start = new Date(bestWindow.startTime);
    const hour = start.getHours();
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 || 12;
    const windowDesc = `around ${h}${ampm}`;
    return `It's ${DENSITY_LABELS[current].toLowerCase()} now. A quieter window opens ${windowDesc} — consider waiting if you can.`;
  }
  return `Currently ${DENSITY_LABELS[current].toLowerCase()}. Check the Quiet Finder for better windows.`;
}

/** Time-of-day multiplier for a given hour (0-23) and category. Weekday vs weekend. */
export function timeOfDayMultiplier(hour: number, category?: string, isWeekend: boolean = false): number {
  if (isWeekend) {
    if (hour >= 7 && hour < 9) return 0.6;   // later start on weekends
    if (hour >= 9 && hour < 12) return 1.5;  // busy late morning
    if (hour >= 12 && hour < 14) return 1.8; // lunch rush
    if (hour >= 14 && hour < 17) return 1.3; // afternoon
    if (hour >= 17 && hour < 20) return 1.6; // evening
    if (hour >= 20 && hour < 23) return 0.9;
    return 0.3; // night
  }

  // Weekday: category-specific patterns
  const catMult = (() => {
    if (category === 'coffee') {
      if (hour >= 6 && hour < 8) return 2.2;    // morning coffee rush
      if (hour >= 8 && hour < 10) return 1.8;
      if (hour >= 12 && hour < 14) return 1.2;
      if (hour >= 14 && hour < 16) return 0.6;
      return 0.4;
    }
    if (category === 'grocery') {
      if (hour >= 8 && hour < 10) return 1.0;
      if (hour >= 10 && hour < 14) return 1.2;
      if (hour >= 14 && hour < 17) return 1.5;   // afternoon restock
      if (hour >= 17 && hour < 19) return 2.0;   // dinner prep rush
      if (hour >= 19 && hour < 21) return 1.3;
      return 0.2;
    }
    if (category === 'restaurant') {
      if (hour >= 11 && hour < 13) return 1.8;   // lunch
      if (hour >= 17 && hour < 20) return 2.5;   // dinner
      if (hour >= 20 && hour < 22) return 1.5;
      return 0.3;
    }
    if (category === 'library' || category === 'park') {
      if (hour >= 9 && hour < 12) return 1.5;
      if (hour >= 12 && hour < 15) return 1.2;
      if (hour >= 15 && hour < 18) return 1.8;   // after-school
      return 0.2;
    }
    if (category === 'pharmacy') {
      if (hour >= 8 && hour < 10) return 1.0;
      if (hour >= 10 && hour < 14) return 1.2;
      if (hour >= 16 && hour < 19) return 1.8;   // after-work
      return 0.4;
    }
    return 1.0;
  })();

  // Road/highway rush hour patterns
  if (!category && hour >= 7 && hour < 9) return 2.5;  // morning rush
  if (!category && hour >= 17 && hour < 19) return 2.8; // evening rush
  if (!category && hour >= 9 && hour < 12) return 1.2; // mid-morning
  if (!category && hour >= 12 && hour < 14) return 1.5; // lunch
  if (!category && hour >= 19 && hour < 22) return 0.8; // evening
  if (hour >= 0 && hour < 6) return 0.15;  // late night

  return catMult;
}

/**
 * Generate mock historical profile for demo purposes, using time-of-day modeling.
 */
export function generateTypicalProfile(category?: string): number[] {
  const isWeekend = [0, 6].includes(new Date().getDay());
  const rng = mulberry32(hashString(`typical:${category ?? 'all'}:${isWeekend ? 'wknd' : 'wkdy'}`));
  return Array.from({ length: 24 }, (_, hour) => {
    const base = category ? (rng() * 15 + 10) : (rng() * 20 + 15);
    const mult = timeOfDayMultiplier(hour, category, isWeekend);
    const jitter = rng() * 0.3 + 0.85;  // 85-115% noise
    return Math.round(Math.min(100, Math.max(1, base * mult * jitter)));
  });
}

/**
 * Generate a realistic vehicle detection snapshot for a given camera location.
 */
export function generateVehicleDetection(
  cameraId: string,
  hour: number,
  roadType: 'highway' | 'arterial' | 'local',
  baseCount: number = 10,
  isWeekend: boolean = false,
): VehicleDetection {
  const rushMult = timeOfDayMultiplier(hour, undefined, isWeekend);
  const count = Math.max(1, Math.round(baseCount * rushMult * (0.8 + Math.random() * 0.4)));

  // Vehicle type distribution changes by road type and hour
  const carPct = roadType === 'highway' ? 0.40 : roadType === 'arterial' ? 0.50 : 0.55;
  const suvPct = roadType === 'highway' ? 0.35 : 0.25;
  const truckPct = roadType === 'highway' ? 0.15 : roadType === 'arterial' ? 0.10 : 0.03;
  const busPct = hour >= 6 && hour <= 20 ? (roadType === 'highway' ? 0.04 : 0.06) : 0.01;
  const motorcyclePct = 0.03;
  const bicyclePct = roadType === 'local' && hour >= 7 && hour <= 19 ? 0.03 : 0.005;
  const pedestrianPct = roadType === 'local' ? (hour >= 10 && hour <= 20 ? 0.05 : 0.01) : 0;

  const types: Partial<Record<VehicleType, number>> = {
    car: Math.round(count * carPct),
    suv: Math.round(count * suvPct),
    truck: Math.round(count * truckPct),
    bus: Math.round(count * busPct),
    motorcycle: Math.round(count * motorcyclePct),
    bicycle: Math.round(count * bicyclePct),
    pedestrian: Math.round(count * pedestrianPct),
  };

  // Speed modeling: congestion reduces average speed
  const congestionIndex = Math.min(1, count / 60);
  const freeSpeed = roadType === 'highway' ? 105 : roadType === 'arterial' ? 55 : 35;
  const avgSpeed = Math.round(freeSpeed * (1 - congestionIndex * 0.7) * (0.85 + Math.random() * 0.3));

  return {
    cameraId,
    timestamp: new Date().toISOString(),
    count,
    types,
    averageSpeed: Math.max(3, avgSpeed),
    confidence: 0.65 + Math.random() * 0.3,
    congestionIndex: Math.round(congestionIndex * 100) / 100,
    flowRate: Math.round(count * 2.5 + Math.random() * 5),
  };
}

/**
 * Convert a VehicleDetection to a density level estimate.
 */
export function detectionToDensityLevel(detection: VehicleDetection): DensityLevel {
  if (detection.count <= 3) return 'green';
  if (detection.count <= 8) return 'yellow';
  if (detection.count <= 18) return 'orange';
  if (detection.count <= 35) return 'red';
  return 'purple';
}
