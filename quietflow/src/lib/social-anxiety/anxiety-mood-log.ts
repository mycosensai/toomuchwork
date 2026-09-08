/**
 * Feature 10: Anxiety Mood Log
 * Tap how you feel before/after trips. Emoji-only.
 * No words required.
 */

export type MoodEmoji = '😌' | '😐' | '😰' | '😢' | '😤' | '😊' | '🙂' | '😔' | '😨' | '🤢';

export interface MoodEntry {
  id: string;
  timestamp: string;
  moodBefore: MoodEmoji;
  moodAfter: MoodEmoji | null;
  trigger: 'crowd' | 'noise' | 'traffic' | 'camera' | 'unknown' | 'none';
  tripId: string | null;
  note: string; // emoji only
}

export interface MoodSummary {
  totalEntries: number;
  avgBeforeMood: number; // 0-10
  avgAfterMood: number;
  mostCommonTrigger: string;
  bestMoodAfter: MoodEmoji | null;
  trendDirection: 'improving' | 'stable' | 'declining';
}

const MOOD_SCORE: Record<MoodEmoji, number> = {
  '😌': 9, '😐': 5, '😰': 2, '😢': 1, '😤': 2,
  '😊': 10, '🙂': 7, '😔': 3, '😨': 1, '🤢': 1,
};

let moodLog: MoodEntry[] = [];

export function getMoodLog(): MoodEntry[] {
  return [...moodLog];
}

export function addMoodEntry(entry: Omit<MoodEntry, 'id' | 'timestamp'>): MoodEntry {
  const newEntry: MoodEntry = {
    ...entry,
    id: `mood-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  moodLog.push(newEntry);
  if (moodLog.length > 500) moodLog = moodLog.slice(-500);
  return newEntry;
}

export function computeMoodSummary(): MoodSummary {
  if (moodLog.length === 0) {
    return {
      totalEntries: 0,
      avgBeforeMood: 5,
      avgAfterMood: 5,
      mostCommonTrigger: 'none',
      bestMoodAfter: null,
      trendDirection: 'stable',
    };
  }

  const avgBefore = Math.round(
    moodLog.reduce((s, e) => s + MOOD_SCORE[e.moodBefore], 0) / moodLog.length,
  );
  const afterEntries = moodLog.filter((e) => e.moodAfter);
  const avgAfter = afterEntries.length
    ? Math.round(afterEntries.reduce((s, e) => s + MOOD_SCORE[e.moodAfter!], 0) / afterEntries.length)
    : avgBefore;

  // Most common trigger
  const triggers = moodLog.reduce<Record<string, number>>((acc, e) => {
    acc[e.trigger] = (acc[e.trigger] || 0) + 1;
    return acc;
  }, {});
  const mostCommonTrigger = Object.entries(triggers).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  // Best mood after
  const afterScores = afterEntries.map((e) => MOOD_SCORE[e.moodAfter!]);
  const bestMoodAfter = afterEntries.length
    ? (Object.entries(MOOD_SCORE).find(([, v]) => v === Math.max(...afterScores))?.[0] as MoodEmoji || null)
    : null;

  // Trend: compare first half vs second half
  const mid = Math.floor(moodLog.length / 2);
  const firstHalf = moodLog.slice(0, mid).reduce((s, e) => s + MOOD_SCORE[e.moodBefore], 0);
  const secondHalf = moodLog.slice(mid).reduce((s, e) => s + MOOD_SCORE[e.moodBefore], 0);
  const trendDirection: MoodSummary['trendDirection'] =
    secondHalf > firstHalf + 2 ? 'improving' : secondHalf < firstHalf - 2 ? 'declining' : 'stable';

  return {
    totalEntries: moodLog.length,
    avgBeforeMood: avgBefore,
    avgAfterMood: avgAfter,
    mostCommonTrigger,
    bestMoodAfter,
    trendDirection,
  };
}