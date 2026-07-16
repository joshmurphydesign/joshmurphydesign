import type { Post, PostType } from "./types";

// How much a post type matters as a highlight, independent of when it happened.
// Wins/streak milestones/competition results are the moments worth surfacing;
// routine progress check-ins are real but shouldn't crowd them out.
const TYPE_WEIGHT: Record<PostType, number> = {
  win: 5,
  "competition-result": 5,
  streak: 4,
  "challenge-invite": 3,
  progress: 2,
  powerplay: 2,
  encouragement: 1,
};

/**
 * Blends type importance with recency so the feed reads as "what matters,
 * recently" rather than a strict reverse-chronological log. A big win from
 * yesterday can still outrank a routine check-in from an hour ago, but that
 * win fades in favor of newer highlights over the following few days.
 */
export function importanceScore(post: Post, now: number = Date.now()): number {
  const ageHours = (now - new Date(post.createdAt).getTime()) / 3600000;
  const recencyDecay = Math.max(0, 1 - ageHours / 72); // full weight now, fades to 0 over 3 days
  const engagement = post.reactions.reduce((sum, r) => sum + r.userIds.length, 0) + post.comments.length;
  return TYPE_WEIGHT[post.type] * (0.6 + 0.4 * recencyDecay) + Math.min(engagement, 5) * 0.3;
}

export function byImportance(a: Post, b: Post, now: number = Date.now()): number {
  return importanceScore(b, now) - importanceScore(a, now);
}

/** A post worth visually calling out as a highlight rather than routine activity. */
export function isHighlight(post: Post): boolean {
  return post.type === "win" || post.type === "streak" || post.type === "competition-result";
}
