/**
 * Feature 6: Anxiety Dashboard
 * Personal metrics: times avoided crowds, quietest route,
 * anxiety spikes avoided. Tracks what matters without judgment.
 */

export interface AnxietyMetric {
  date: string;
  tripsTaken: number;
  crowdsAvoided: number;
  quietRoutesTaken: number;
  anxietySpikesAvoided: number;
  avgQuietScore: number;
  moodBefore: string;
  moodAfter: string | null;
  trigger: string;
  notes: string; // emoji only
}

export interface AnxietyDashboardStats {
  totalTrips: number;
  totalCrowdsAvoided: number;
  totalQuietRoutes: number;
  totalAnxietySpikesAvoided: number;
  avgQuietScore: number;
  streakDays: number;
  bestQuietScore: number;
  worstQuietScore: number;
  weeklyTrend: 'improving' | 'stable' | 'declining';
}

/** In-memory metrics store */
let metrics: AnxietyMetric[] = [];

export function getAnxietyMetrics(): AnxietyMetric[] {
  return [...metrics];
}

export function addAnxietyMetric(metric: AnxietyMetric): void {
  metrics.push(metric);
  // Keep only last 365 days
  if (metrics.length > 365) {
    metrics = metrics.slice(-365);
  }
}

export function computeAnxietyStats(): AnxietyDashboardStats {
  if (metrics.length === 0) {
    return {
      totalTrips: 0,
      totalCrowdsAvoided: 0,
      totalQuietRoutes: 0,
      totalAnxietySpikesAvoided: 0,
      avgQuietScore: 100,
      streakDays: 0,
      bestQuietScore: 100,
      worstQuietScore: 100,
      weeklyTrend: 'stable',
    };
  }

  const totalTrips = metrics.reduce((s, m) => s + m.tripsTaken, 0);
  const totalCrowdsAvoided = metrics.reduce((s, m) => s + m.crowdsAvoided, 0);
  const totalQuietRoutes = metrics.reduce((s, m) => s + m.quietRoutesTaken, 0);
  const totalAnxietySpikesAvoided = metrics.reduce((s, m) => s + m.anxietySpikesAvoided, 0);
  const avgQuietScore = Math.round(
    metrics.reduce((s, m) => s + m.avgQuietScore, 0) / metrics.length,
  );

  // Streak: consecutive days with at least 1 trip
  const days = new Set(metrics.map((m) => m.date.split('T')[0]).sort());
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;
  while (days.has(checkDate)) {
    streak++;
    const d = new Date(checkDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    checkDate = d.toISOString().split('T')[0];
  }

  const scores = metrics.map((m) => m.avgQuietScore);
  const bestQuietScore = Math.max(...scores);
  const worstQuietScore = Math.min(...scores);

  // Weekly trend (last 7 vs prior 7)
  const sorted = [...metrics].sort((a, b) => a.date.localeCompare(b.date));
  const week1 = sorted.slice(-14, -7).reduce((s, m) => s + m.avgQuietScore, 0);
  const week2 = sorted.slice(-7).reduce((s, m) => s + m.avgQuietScore, 0);
  const weeklyTrend: AnxietyDashboardStats['weeklyTrend'] =
    week2 > week1 + 5 ? 'improving' : week2 < week1 - 5 ? 'declining' : 'stable';

  return {
    totalTrips,
    totalCrowdsAvoided,
    totalQuietRoutes,
    totalAnxietySpikesAvoided,
    avgQuietScore,
    streakDays: streak,
    bestQuietScore,
    worstQuietScore,
    weeklyTrend,
  };
}