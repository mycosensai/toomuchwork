/**
 * Social Anxiety Core — Sprint 1
 * Features 1-10 for QuietFlow v2
 */

export { generateAnonymizedDensity } from './anonymized-density';
export type { AnonymizedCell, DensityHeatmap } from './anonymized-density';
export { InvisibleModeController, invisibleMode } from './invisible-mode';
export type { InvisibleModeState, InvisibleModeAction } from './invisible-mode';
export { scoreDestination } from './pre-trip-score';
export type { SocialScore } from './pre-trip-score';
export { generateEscapeRoutes, findNearestSafeZone } from './escape-route';
export type { EscapeRoute } from './escape-route';
export { NoHumanInteractionMode, noHumanInteraction } from './no-human-interaction';
export type { NoHumanInteractionConfig } from './no-human-interaction';
export { getAnxietyMetrics, addAnxietyMetric, computeAnxietyStats } from './anxiety-dashboard';
export type { AnxietyMetric, AnxietyDashboardStats } from './anxiety-dashboard';
export { findNearbySafeZones } from './safe-zone-map';
export type { SafeZone } from './safe-zone-map';
export { checkAutoReroute, startCrowdMonitor } from './crowd-auto-nav';
export type { CrowdAvoidRoute } from './crowd-auto-nav';
export { DNDScheduleController, dndSchedule } from './dn-d-schedule';
export type { DNDSchedule } from './dn-d-schedule';
export {
  getMoodLog, addMoodEntry, computeMoodSummary,
} from './anxiety-mood-log';
export type { MoodEmoji, MoodEntry, MoodSummary } from './anxiety-mood-log';

// Re-export 101-200 batch
export { default as FeatureBatch2 } from '@/components/social/anxiety-features-200';
// Re-export 201-500 batches
export { default as FeatureBatch3 } from '@/components/social/anxiety-features-300';
export { default as FeatureBatch4 } from '@/components/social/anxiety-features-400';
export { default as FeatureBatch5 } from '@/components/social/anxiety-features-500';