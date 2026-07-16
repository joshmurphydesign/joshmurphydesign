export type CheckInStatus = "checked-in" | "pending" | "missed" | "not-started";

/**
 * A member's status against today, derived purely from their last check-in —
 * no extra state to store. "pending" means the chain is still intact but
 * today isn't logged yet; "missed" means a day was skipped and the chain is
 * already broken (the next check-in restarts the streak at 1).
 */
export function checkInStatus(lastLoggedAt: string | undefined, now: number = Date.now()): CheckInStatus {
  if (!lastLoggedAt) return "not-started";
  const last = new Date(lastLoggedAt);
  const today = new Date(now);
  if (last.toDateString() === today.toDateString()) return "checked-in";
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (last.toDateString() === yesterday.toDateString()) return "pending";
  return "missed";
}
