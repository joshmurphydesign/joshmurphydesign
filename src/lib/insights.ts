import type { Goal, Post } from "./types";
import { metricIsEntryBased } from "./metric-presets";

export interface ConsistencyDay {
  date: string;
  checkedIn: boolean;
}

export interface Insights {
  /** 0-100, averaged across daily-obligation commitments: check-in days / days elapsed. */
  completionRate: number;
  /** All-time longest streak across every commitment, from Goal.bestStreak. */
  longestStreak: number;
  /** Last 14 calendar days, oldest first — did any daily commitment get a check-in that day. */
  consistency: ConsistencyDay[];
}

function dayKey(iso: string): string {
  return new Date(iso).toDateString();
}

/**
 * Every manual check-in creates a feed post (see api/goals/[id]/log), so posts double as
 * a per-day check-in ledger — there's no separate log table to query instead.
 */
export function computeInsights(myGoals: Goal[], myPosts: Post[], now: number = Date.now()): Insights {
  const dailyGoals = myGoals.filter((g) => !metricIsEntryBased(g.metric.type));
  const dailyGoalIds = new Set(dailyGoals.map((g) => g.id));
  const checkInPosts = myPosts.filter((p) => p.goalId && dailyGoalIds.has(p.goalId));

  const longestStreak = myGoals.reduce((max, g) => Math.max(max, g.bestStreak), 0);

  const rates = dailyGoals.map((g) => {
    const start = new Date(g.startDate).getTime();
    const end = Math.min(now, new Date(g.endDate).getTime());
    const daysElapsed = Math.max(1, Math.floor((end - start) / 86400000) + 1);
    const checkInDays = new Set(checkInPosts.filter((p) => p.goalId === g.id).map((p) => dayKey(p.createdAt))).size;
    return Math.min(100, Math.round((checkInDays / daysElapsed) * 100));
  });
  const completionRate = rates.length ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length) : 0;

  const checkInDaySet = new Set(checkInPosts.map((p) => dayKey(p.createdAt)));
  const consistency: ConsistencyDay[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now - i * 86400000).toDateString();
    consistency.push({ date, checkedIn: checkInDaySet.has(date) });
  }

  return { completionRate, longestStreak, consistency };
}
