/**
 * Feature 3: Pre-Trip Social Score
 * Scores a destination BEFORE you leave — how many people,
 * peak time, best quiet window. No interaction needed.
 */

import type { BusinessLocation, DensityLevel } from '@/types';

export interface SocialScore {
  locationId: string;
  locationName: string;
  overallScore: number;        // 0-100, higher = quieter
  crowdEstimate: 'empty' | 'light' | 'moderate' | 'busy' | 'packed';
  peakHours: string[];
  bestWindow: { start: string; end: string } | null;
  factors: {
    historicalDensity: number;
    dayOfWeekPenalty: number;
    weatherPenalty: number;
    eventPenalty: number;
    timeOfDayPenalty: number;
  };
  generatedAt: string;
}

/**
 * Score a single business/destination for social anxiety users.
 */
export function scoreDestination(
  location: BusinessLocation,
  now: Date = new Date(),
): SocialScore {
  const dayOfWeek = now.getDay();
  const hour = now.getHours();

  // Historical density factor (0-100, lower is better)
  const historicalDensity = densityLevelToScore(location.density?.densityLevel || 'green');

  // Day-of-week penalty (weekends = more people)
  const weekendPenalty = (dayOfWeek === 0 || dayOfWeek === 6) ? 15 : 0;

  // Time-of-day penalty (lunch/rush hours)
  let timePenalty = 0;
  if (hour >= 12 && hour <= 14) timePenalty = 20; // lunch rush
  if (hour >= 17 && hour <= 19) timePenalty = 25; // dinner rush
  if (hour >= 8 && hour <= 9) timePenalty = 10;   // morning rush

  // Weather penalty (rain = fewer people = better for us)
  const weatherBonus = -5; // rain makes crowds smaller

  // Event penalty (would need event API integration)
  const eventPenalty = 0;

  const totalPenalty = weekendPenalty + timePenalty + eventPenalty + weatherBonus;
  const overallScore = Math.max(0, Math.min(100, 100 - historicalDensity + totalPenalty));

  const crowdEstimate = scoreToCrowdLevel(overallScore);

  // Find best quiet window from quietWindows data
  const bestWindow = location.quietWindows?.length
    ? location.quietWindows.reduce((best, w) => {
        const wScore = densityLevelToScore(w.expectedLevel as DensityLevel);
        const bScore = best ? densityLevelToScore(best.expectedLevel as DensityLevel) : 100;
        return wScore < bScore ? w : best;
      }, location.quietWindows[0] as typeof location.quietWindows[0] | null)
    : null;

  return {
    locationId: location.id,
    locationName: location.name,
    overallScore,
    crowdEstimate,
    peakHours: estimatePeakHours(location),
    bestWindow: bestWindow
      ? { start: bestWindow.startTime, end: bestWindow.endTime }
      : null,
    factors: {
      historicalDensity,
      dayOfWeekPenalty: weekendPenalty,
      weatherPenalty: weatherBonus,
      eventPenalty,
      timeOfDayPenalty: timePenalty,
    },
    generatedAt: new Date().toISOString(),
  };
}

function densityLevelToScore(level: DensityLevel): number {
  const map: Record<DensityLevel, number> = { green: 10, yellow: 30, orange: 55, red: 80, purple: 95 };
  return map[level];
}

function scoreToCrowdLevel(score: number): SocialScore['crowdEstimate'] {
  if (score >= 85) return 'empty';
  if (score >= 65) return 'light';
  if (score >= 45) return 'moderate';
  if (score >= 25) return 'busy';
  return 'packed';
}

function estimatePeakHours(location: BusinessLocation): string[] {
  const peaks: string[] = [];
  if (location.category === 'restaurant') {
    peaks.push('12:00-14:00', '18:00-20:00');
  } else if (location.category === 'grocery') {
    peaks.push('17:00-19:00', '10:00-12:00');
  } else {
    peaks.push('12:00-13:00', '17:00-18:00');
  }
  return peaks;
}