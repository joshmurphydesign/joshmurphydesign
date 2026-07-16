import type {
  User as DbUser,
  Goal as DbGoal,
  GoalParticipant as DbGoalParticipant,
  Post as DbPost,
  ReactionEntry as DbReactionEntry,
  Comment as DbComment,
  Notification as DbNotification,
  ActivityHistoryItem as DbActivityHistoryItem,
  Message as DbMessage,
} from "@prisma/client";
import type {
  ActivityHistoryItem,
  Comment,
  Goal,
  GoalParticipant,
  GoalCategory,
  GoalMode,
  GoalStatus,
  Message,
  MetricType,
  Notification,
  NotificationType,
  PaymentHandle,
  Post,
  PostType,
  Reaction,
  User,
} from "./types";
import type { MeProfile } from "./auth-context";

export function serializeUser(u: DbUser): User {
  return {
    id: u.id,
    name: u.name,
    handle: u.handle,
    avatarColor: u.avatarColor,
    avatarInitials: u.avatarInitials,
    focus: JSON.parse(u.focus) as GoalCategory[],
    bio: u.bio,
    score: u.score,
    streak: u.streak,
    followers: u.followers,
    following: u.following,
    location: u.location ?? undefined,
    points: u.points,
    freezes: u.freezes,
    paymentHandles: JSON.parse(u.paymentHandles) as PaymentHandle[],
  };
}

export function serializeMe(u: DbUser): MeProfile {
  return { ...serializeUser(u), email: u.email };
}

export function serializeParticipant(p: DbGoalParticipant): GoalParticipant {
  return {
    userId: p.userId,
    progress: p.progress,
    joinedAt: p.joinedAt.toISOString(),
    isOwner: p.isOwner,
    lastLoggedAt: p.lastLoggedAt?.toISOString(),
    startValue: p.startValue ?? undefined,
    currentValue: p.currentValue ?? undefined,
  };
}

export function serializeGoal(g: DbGoal & { participants: DbGoalParticipant[] }): Goal {
  return {
    id: g.id,
    title: g.title,
    category: g.category as GoalCategory,
    mode: g.mode as GoalMode,
    description: g.description,
    target: g.target,
    unit: g.unit,
    durationDays: g.durationDays,
    startDate: g.startDate.toISOString(),
    endDate: g.endDate.toISOString(),
    status: g.status as GoalStatus,
    progress: g.progress,
    participants: g.participants.map(serializeParticipant),
    streak: g.streak,
    bestStreak: g.bestStreak,
    coverGradient: g.coverGradient,
    metric: { type: g.metricType as MetricType, targetValue: g.metricTargetValue },
    stake: g.stake ?? undefined,
    stakeAmount: g.stakeAmount ?? undefined,
    paidByUserIds: JSON.parse(g.paidByUserIds) as string[],
    settledAt: g.settledAt?.toISOString(),
    winnerId: g.winnerId ?? undefined,
    isPublic: g.isPublic,
  };
}

export function serializePost(p: DbPost & { reactions: DbReactionEntry[]; comments: DbComment[] }): Post {
  const reactionMap = new Map<string, string[]>();
  for (const r of p.reactions) {
    const list = reactionMap.get(r.emoji) ?? [];
    list.push(r.userId);
    reactionMap.set(r.emoji, list);
  }
  const reactions: Reaction[] = Array.from(reactionMap.entries()).map(([emoji, userIds]) => ({ emoji, userIds }));
  const comments: Comment[] = p.comments
    .map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt.toISOString() }))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return {
    id: p.id,
    userId: p.userId,
    goalId: p.goalId ?? undefined,
    powerPlayId: p.powerPlayId ?? undefined,
    type: p.type as PostType,
    headline: p.headline,
    body: p.body,
    statValue: p.statValue ?? undefined,
    statLabel: p.statLabel ?? undefined,
    imageUrl: p.imageUrl ?? undefined,
    createdAt: p.createdAt.toISOString(),
    reactions,
    comments,
  };
}

export function serializeNotification(n: DbNotification): Notification {
  return {
    id: n.id,
    type: n.type as NotificationType,
    actorId: n.actorId ?? undefined,
    message: n.message,
    createdAt: n.createdAt.toISOString(),
    read: n.read,
  };
}

export function serializeActivity(h: DbActivityHistoryItem): ActivityHistoryItem {
  return {
    id: h.id,
    userId: h.userId,
    label: h.label,
    detail: h.detail,
    createdAt: h.createdAt.toISOString(),
  };
}

export function serializeMessage(m: DbMessage): Message {
  return {
    id: m.id,
    threadId: m.threadId,
    senderId: m.senderId,
    text: m.text,
    createdAt: m.createdAt.toISOString(),
  };
}
