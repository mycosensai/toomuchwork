'use client';

import type { RouteDirectionStep, RouteDirections } from '@/types';
import { haversineKm } from './camera-discovery';

type RouteProvider = 'osrm' | 'mapbox';

interface RouteStepManeuver {
  type?: string;
  modifier?: string;
  instruction?: string;
  exit?: number | string;
}

interface RouteStepRaw {
  distance?: number;
  duration?: number;
  name?: string;
  ref?: string;
  driving_side?: 'left' | 'right';
  maneuver?: RouteStepManeuver;
  geometry?: { coordinates?: unknown };
  voiceInstructions?: Array<{ announcement?: string }>;
  bannerInstructions?: Array<{ primary?: { text?: string } }>;
}

interface RouteLegRaw {
  steps?: RouteStepRaw[];
}

interface RouteRouteRaw {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: unknown };
  legs?: RouteLegRaw[];
}

interface RouteResponseRaw {
  routes?: RouteRouteRaw[];
}

export interface RouteProgress {
  traveledMeters: number;
  remainingMeters: number;
  distanceToRouteMeters: number;
  nearestPoint: [number, number] | null;
}

function isRouteResponse(value: unknown): value is RouteResponseRaw {
  return typeof value === 'object' && value !== null && 'routes' in value;
}

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toPoint(value: unknown): [number, number] | null {
  if (!Array.isArray(value) || value.length < 2) return null;
  const lng = value[0];
  const lat = value[1];
  if (typeof lng !== 'number' || typeof lat !== 'number') return null;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  return [lng, lat];
}

function extractPoints(raw: unknown): [number, number][] {
  if (!Array.isArray(raw)) return [];
  const points: [number, number][] = [];
  for (const value of raw) {
    const point = toPoint(value);
    if (point) points.push(point);
  }
  return points;
}

function collectRouteSteps(route: RouteRouteRaw): RouteStepRaw[] {
  const steps: RouteStepRaw[] = [];
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      steps.push(step);
    }
  }
  return steps;
}

function humanizeInstruction(provider: RouteProvider, step: RouteStepRaw): string {
  if (provider === 'mapbox') {
    const explicit = toString(step.maneuver?.instruction)
      ?? toString(step.voiceInstructions?.[0]?.announcement)
      ?? toString(step.bannerInstructions?.[0]?.primary?.text);
    if (explicit) return explicit;
  }

  const type = (toString(step.maneuver?.type) ?? 'continue').toLowerCase();
  const modifier = toString(step.maneuver?.modifier)?.toLowerCase();
  const roadName = toString(step.name) ?? toString(step.ref);
  const roadSuffix = roadName ? `onto ${roadName}` : 'on the route';
  const modifierPrefix = modifier ? `${capitalize(modifier)} ` : '';

  switch (type) {
    case 'depart':
      return roadName ? `Head ${modifierPrefix}${roadSuffix}` : `Head ${modifierPrefix}toward your destination`.trim();
    case 'arrive':
      return 'You have arrived at your destination';
    case 'turn':
      return roadName ? `Turn ${modifierPrefix}${roadSuffix}` : `Turn ${modifierPrefix}and continue`.trim();
    case 'new name':
      return roadName ? `Continue ${roadSuffix}` : 'Continue straight';
    case 'merge':
      return roadName ? `Merge ${modifierPrefix}${roadSuffix}` : `Merge ${modifierPrefix}with traffic`.trim();
    case 'fork':
      return roadName ? `Keep ${modifierPrefix}${roadSuffix}` : `Keep ${modifierPrefix}at the fork`.trim();
    case 'roundabout':
    case 'rotary': {
      const exit = typeof step.maneuver?.exit === 'number'
        ? String(step.maneuver.exit)
        : toString(step.maneuver?.exit);
      return exit
        ? `At the roundabout, take exit ${exit}${roadName ? ` onto ${roadName}` : ''}`
        : roadName
          ? `At the roundabout, continue onto ${roadName}`
          : 'At the roundabout, continue straight';
    }
    case 'off ramp':
      return roadName ? `Take the ramp ${roadSuffix}` : 'Take the ramp';
    case 'on ramp':
      return roadName ? `Take the ramp ${roadSuffix}` : 'Take the ramp';
    case 'end of road':
      return roadName ? `At the end of the road, continue ${roadSuffix}` : 'At the end of the road, continue straight';
    default:
      return roadName ? `Continue ${roadSuffix}` : 'Continue straight';
  }
}

function buildStep(provider: RouteProvider, step: RouteStepRaw, index: number): RouteDirectionStep {
  const geometry = extractPoints(step.geometry?.coordinates);
  return {
    index,
    instruction: humanizeInstruction(provider, step),
    maneuverType: toString(step.maneuver?.type) ?? 'continue',
    modifier: toString(step.maneuver?.modifier),
    roadName: toString(step.name) ?? toString(step.ref),
    distanceMeters: toNumber(step.distance, 0),
    durationSeconds: toNumber(step.duration, 0),
    geometry,
    drivingSide: step.driving_side,
    exitNumber: typeof step.maneuver?.exit === 'number' || typeof step.maneuver?.exit === 'string'
      ? step.maneuver.exit
      : undefined,
  };
}

function routeLengthMeters(points: [number, number][]): number {
  if (points.length < 2) return 0;
  let meters = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const [lng1, lat1] = points[i];
    const [lng2, lat2] = points[i + 1];
    meters += haversineKm(lat1, lng1, lat2, lng2) * 1000;
  }
  return meters;
}

function parseRouteResponse(response: unknown): RouteRouteRaw | null {
  if (!isRouteResponse(response)) return null;
  const route = response.routes?.[0];
  return route ?? null;
}

export function buildRouteDirections(
  provider: RouteProvider,
  routeName: string,
  response: unknown,
  routeGeometry?: [number, number][],
  origin?: [number, number],
  destination?: [number, number],
): RouteDirections | null {
  const route = parseRouteResponse(response);
  if (!route) return null;

  const geometry = routeGeometry && routeGeometry.length > 1
    ? routeGeometry
    : extractPoints(route.geometry?.coordinates);
  const rawSteps = collectRouteSteps(route);
  const steps = rawSteps.map((step, index) => buildStep(provider, step, index));

  const distanceMeters = toNumber(route.distance, routeLengthMeters(geometry));
  const durationSeconds = toNumber(route.duration, steps.reduce((sum, step) => sum + step.durationSeconds, 0));
  const routeOrigin = origin ?? geometry[0] ?? [0, 0];
  const routeDestination = destination ?? geometry[geometry.length - 1] ?? routeOrigin;

  const normalizedSteps = steps.length > 0
    ? steps
    : [{
        index: 0,
        instruction: routeName ? `Follow the route to ${routeName}` : 'Follow the route',
        maneuverType: 'continue',
        distanceMeters,
        durationSeconds,
        geometry,
      }];

  return {
    provider,
    routeName: routeName || 'Current destination',
    origin: routeOrigin,
    destination: routeDestination,
    distanceMeters,
    durationSeconds,
    geometry,
    steps: normalizedSteps,
    generatedAt: new Date().toISOString(),
  };
}

export function projectRouteProgress(
  geometry: [number, number][],
  location: [number, number],
): RouteProgress {
  if (geometry.length < 2) {
    return { traveledMeters: 0, remainingMeters: 0, distanceToRouteMeters: Number.POSITIVE_INFINITY, nearestPoint: null };
  }

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestTraveled = 0;
  let bestPoint: [number, number] | null = null;
  let cumulativeMeters = 0;

  for (let i = 0; i < geometry.length - 1; i++) {
    const start = geometry[i];
    const end = geometry[i + 1];
    const segmentMeters = haversineKm(start[1], start[0], end[1], end[0]) * 1000;
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const lenSq = dx * dx + dy * dy;
    const px = location[0];
    const py = location[1];
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - start[0]) * dx + (py - start[1]) * dy) / lenSq));
    const projected: [number, number] = [start[0] + dx * t, start[1] + dy * t];
    const distanceMeters = haversineKm(py, px, projected[1], projected[0]) * 1000;

    if (distanceMeters < bestDistance) {
      bestDistance = distanceMeters;
      bestTraveled = cumulativeMeters + segmentMeters * t;
      bestPoint = projected;
    }

    cumulativeMeters += segmentMeters;
  }

  return {
    traveledMeters: bestTraveled,
    remainingMeters: Math.max(0, cumulativeMeters - bestTraveled),
    distanceToRouteMeters: bestDistance,
    nearestPoint: bestPoint,
  };
}

export function getCurrentRouteStep(
  directions: RouteDirections,
  traveledMeters: number,
): {
  currentStep: RouteDirectionStep;
  currentStepIndex: number;
  distanceToStepEndMeters: number;
  remainingMeters: number;
  nextStep: RouteDirectionStep | null;
} | null {
  if (directions.steps.length === 0) return null;

  let cumulative = 0;
  for (let i = 0; i < directions.steps.length; i++) {
    const step = directions.steps[i];
    cumulative += Math.max(step.distanceMeters, 0);
    if (traveledMeters <= cumulative || i === directions.steps.length - 1) {
      return {
        currentStep: step,
        currentStepIndex: i,
        distanceToStepEndMeters: Math.max(0, cumulative - traveledMeters),
        remainingMeters: Math.max(0, directions.distanceMeters - traveledMeters),
        nextStep: directions.steps[i + 1] ?? null,
      };
    }
  }

  const last = directions.steps[directions.steps.length - 1];
  return {
    currentStep: last,
    currentStepIndex: directions.steps.length - 1,
    distanceToStepEndMeters: 0,
    remainingMeters: Math.max(0, directions.distanceMeters - traveledMeters),
    nextStep: null,
  };
}

export function formatRouteDistance(meters: number): string {
  if (!Number.isFinite(meters)) return '—';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(meters >= 10000 ? 0 : 1)} km`;
}

export function formatRouteDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return '—';
  const rounded = Math.max(0, Math.round(seconds));
  const minutes = Math.round(rounded / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return remaining > 0 ? `${hours}h ${remaining}m` : `${hours}h`;
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
