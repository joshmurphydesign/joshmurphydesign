import type { Goal, Notification } from "./types";
import { checkInStatus } from "./streak-status";
import { metricIsEntryBased } from "./metric-presets";

/**
 * Ascend has no push/email/cron infrastructure — there's nothing that can wake a phone
 * while the app is closed. What's real and honest to build instead: a live, computed
 * reminder that appears the moment the app is open and a daily commitment is genuinely
 * at risk (checked in yesterday, not yet today). These aren't persisted — they're derived
 * fresh from goal state every render, so they disappear the instant you check in.
 */
export function computeStreakRiskReminders(myGoals: Goal[], now: number = Date.now()): Notification[] {
  return myGoals
    .filter((g) => !metricIsEntryBased(g.metric.type))
    .map((g) => {
      const me = g.participants.find((p) => p.userId === "me");
      if (!me) return null;
      const status = checkInStatus(me.lastLoggedAt, now);
      if (status !== "pending" || g.streak <= 0) return null;
      const notification: Notification = {
        id: `risk-${g.id}`,
        type: "streak-risk",
        message: `${g.title} is at risk — check in today to keep your ${g.streak}-day streak alive.`,
        createdAt: new Date(now).toISOString(),
        read: false,
      };
      return notification;
    })
    .filter((n): n is Notification => n !== null);
}
