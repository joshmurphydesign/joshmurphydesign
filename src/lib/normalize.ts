import type { ActivityHistoryItem, Goal, Message, Notification, Post } from "./types";

// The whole UI is written against a "me" sentinel for the current user's id —
// a convention inherited from the single-local-user prototype. The server
// has no concept of "me": it always deals in real database ids. This module
// is the one boundary where a fetched record's real id, when it matches the
// signed-in user, gets swapped for "me" before it ever reaches component
// state — so every existing `=== "me"` comparison in the app keeps working
// for any real account, not just the seeded demo user.
function swap(id: string, realId: string): string {
  return id === realId ? "me" : id;
}
function swapOpt(id: string | undefined, realId: string): string | undefined {
  return id === undefined ? undefined : swap(id, realId);
}

export function normalizeGoal(goal: Goal, realId: string): Goal {
  return {
    ...goal,
    winnerId: swapOpt(goal.winnerId, realId),
    paidByUserIds: goal.paidByUserIds?.map((id) => swap(id, realId)),
    participants: goal.participants.map((p) => ({ ...p, userId: swap(p.userId, realId) })),
  };
}

export function normalizePost(post: Post, realId: string): Post {
  return {
    ...post,
    userId: swap(post.userId, realId),
    reactions: post.reactions.map((r) => ({ ...r, userIds: r.userIds.map((id) => swap(id, realId)) })),
    comments: post.comments.map((c) => ({ ...c, userId: swap(c.userId, realId) })),
  };
}

export function normalizeNotification(n: Notification, realId: string): Notification {
  return { ...n, actorId: swapOpt(n.actorId, realId) };
}

export function normalizeMessage(m: Message, realId: string): Message {
  return { ...m, senderId: swap(m.senderId, realId) };
}

export function normalizeActivity(a: ActivityHistoryItem, realId: string): ActivityHistoryItem {
  return { ...a, userId: swap(a.userId, realId) };
}
