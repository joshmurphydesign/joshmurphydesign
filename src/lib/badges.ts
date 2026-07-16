import type { Goal, Post } from "./types";

export interface Badge {
  id: string;
  icon: string;
  label: string;
  sub?: string;
}

// Distinct icon per tier so a badge case reads as a progression, not a repeated 🔥.
const STREAK_TIERS: { days: number; icon: string; label: string }[] = [
  { days: 3, icon: "\u{1F331}", label: "3-Day Streak" },
  { days: 7, icon: "\u{1F525}", label: "1-Week Streak" },
  { days: 14, icon: "\u{26A1}", label: "2-Week Streak" },
  { days: 30, icon: "\u{1F3C5}", label: "30-Day Streak" },
  { days: 60, icon: "\u{1F948}", label: "60-Day Streak" },
  { days: 100, icon: "\u{1F947}", label: "100-Day Streak" },
  { days: 365, icon: "\u{1F48E}", label: "One-Year Streak" },
];

const WIN_TIERS: { count: number; label: string }[] = [
  { count: 1, label: "First Win" },
  { count: 5, label: "5 Wins" },
  { count: 10, label: "10 Wins" },
  { count: 25, label: "25 Wins" },
];

/**
 * Badges earned from real streak/win history — bestStreak never resets on a miss, so a
 * badge stays earned even after the current chain breaks, the way a real achievement should.
 */
export function earnedBadges(myGoals: Goal[], myPosts: Post[]): Badge[] {
  const bestStreakEver = myGoals.reduce((max, g) => Math.max(max, g.bestStreak), 0);
  const winCount = myPosts.filter((p) => p.type === "win").length;
  const completedCount = myGoals.filter((g) => g.status === "completed" || g.progress >= 100).length;

  const badges: Badge[] = [];

  for (const tier of [...STREAK_TIERS].reverse()) {
    if (bestStreakEver < tier.days) continue;
    badges.push({ id: `streak-${tier.days}`, icon: tier.icon, label: tier.label, sub: `Best: ${bestStreakEver} days` });
  }

  for (const tier of [...WIN_TIERS].reverse()) {
    if (winCount < tier.count) continue;
    badges.push({ id: `wins-${tier.count}`, icon: "\u{1F3C6}", label: tier.label, sub: `${winCount} total` });
    break; // only the highest win tier — the streak tiers above are the collectible ladder
  }

  if (completedCount > 0) {
    badges.push({
      id: "completed",
      icon: "\u{1F3C1}",
      label: `${completedCount} Completed`,
      sub: completedCount === 1 ? "1 commitment finished" : `${completedCount} commitments finished`,
    });
  }

  return badges;
}
