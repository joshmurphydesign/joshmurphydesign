export type GoalCategory =
  | "strength"
  | "running"
  | "golf"
  | "basketball"
  | "steps"
  | "mobility"
  | "nutrition"
  | "recovery"
  | "consistency"
  | "habits"
  | "custom";

export type GoalMode = "goal" | "challenge" | "duel" | "quest";

export type GoalStatus = "active" | "completed" | "failed" | "upcoming";

/**
 * How a goal's progress is actually tracked:
 * - "increase": a number climbing from a personal baseline toward a target (e.g. 1-rep max, +20 lb).
 * - "decrease": a number falling from a personal baseline toward a target (e.g. body weight, -10 lb).
 * - "cumulative": a running total logged toward a target sum (e.g. total steps, total reps).
 * - "binary": a plain daily check-in with no numeric value — the original tap-to-log streak mechanic.
 */
export type MetricType = "increase" | "decrease" | "cumulative" | "binary";

export interface GoalMetric {
  type: MetricType;
  /** Magnitude of the target: the delta to gain/lose for increase/decrease, the total for cumulative, unused for binary. */
  targetValue: number;
}

export interface User {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  avatarInitials: string;
  focus: GoalCategory[];
  bio: string;
  score: number;
  streak: number;
  followers: number;
  following: number;
  location?: string;
  points?: number;
  freezes?: number;
}

export interface GoalParticipant {
  userId: string;
  progress: number; // 0-100, derived from the goal's metric
  joinedAt: string;
  isOwner: boolean;
  lastLoggedAt?: string;
  /** Baseline value at join time. Only meaningful for increase/decrease metrics. */
  startValue?: number;
  /** Latest logged value (increase/decrease) or running total (cumulative). */
  currentValue?: number;
}

export interface Goal {
  id: string;
  title: string;
  category: GoalCategory;
  mode: GoalMode;
  description: string;
  target: string;
  unit: string;
  durationDays: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progress: number; // 0-100 aggregate
  participants: GoalParticipant[];
  streak: number;
  coverGradient: string;
  /** How progress is tracked for this goal. Every goal has one — "binary" is the plain tap-to-log default. */
  metric: GoalMetric;
  /** What's on the line — flavor text, e.g. "☕ Loser buys coffee". No points cost to join. */
  stake?: string;
  settledAt?: string;
  winnerId?: string;
  isPublic?: boolean;
}

export interface Reaction {
  emoji: string;
  userIds: string[];
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export type PostType =
  | "progress"
  | "win"
  | "streak"
  | "encouragement"
  | "competition-result"
  | "powerplay";

export interface Post {
  id: string;
  userId: string;
  goalId?: string;
  powerPlayId?: string;
  type: PostType;
  headline: string;
  body: string;
  statValue?: string;
  statLabel?: string;
  imageUrl?: string;
  createdAt: string;
  reactions: Reaction[];
  comments: Comment[];
}

export type CompetitionMetric =
  | "consistency"
  | "improvement"
  | "completion"
  | "streak"
  | "rank"
  | "custom";

export interface LeaderboardEntry {
  userId: string;
  rank: number;
  score: number;
  delta: number; // change since last period
  metricLabel: string;
}

export interface Competition {
  id: string;
  title: string;
  description: string;
  metric: CompetitionMetric;
  category: GoalCategory;
  mode: Extract<GoalMode, "challenge" | "duel">;
  endsAt: string;
  leaderboard: LeaderboardEntry[];
}

export interface PowerPlay {
  id: string;
  title: string;
  tagline: string;
  category: GoalCategory;
  rules: string[];
  startsAt: string;
  endsAt: string;
  unit: string;
  isLive: boolean;
  participantIds: string[];
  leaderboard: LeaderboardEntry[];
  coverGradient: string;
}

export type NotificationType =
  | "rally-invite"
  | "reaction"
  | "comment"
  | "rank-change"
  | "streak-risk"
  | "powerplay-start";

export interface Notification {
  id: string;
  type: NotificationType;
  actorId?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface ActivityHistoryItem {
  id: string;
  userId: string;
  label: string;
  detail: string;
  createdAt: string;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Thread {
  id: string;
  participantIds: [string, string];
  lastMessageAt: string;
}

export type HealthProvider = "apple" | "samsung";

/**
 * A simulated connection to a native health app. Real HealthKit/Samsung Health
 * data is unreachable from a browser — there is no web API for either — so
 * this stands in for that native SDK with a realistic, clearly-labeled sync.
 */
export interface HealthConnection {
  provider: HealthProvider;
  connectedAt: string;
  /** Running step count the connected app reports for todayDate. */
  todaySteps: number;
  /** Calendar day (toDateString()) todaySteps applies to, so a new day resets the count. */
  todayDate: string;
  lastSyncedAt?: string;
}
