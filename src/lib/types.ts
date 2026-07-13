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
}

export interface GoalParticipant {
  userId: string;
  progress: number; // 0-100
  joinedAt: string;
  isOwner: boolean;
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
