import type { Goal, GoalMetric, GoalParticipant, MetricType } from "./types";

/** Sign-prefixed magnitude string matching the app's existing target-display convention (e.g. "+20", "-10"). */
export function targetDisplayString(metric: GoalMetric): string {
  if (metric.type === "increase") return `+${metric.targetValue}`;
  if (metric.type === "decrease") return `-${metric.targetValue}`;
  return String(metric.targetValue);
}

/** Derives a participant's 0-100 progress from the goal's metric. Binary progress is driven by day-based logging elsewhere and passed through unchanged. */
export function computeProgress(metric: GoalMetric, participant: Pick<GoalParticipant, "progress" | "startValue" | "currentValue">): number {
  if (metric.type === "binary") return participant.progress;

  const start = participant.startValue ?? 0;
  const current = participant.currentValue ?? start;
  const span = metric.targetValue;
  if (span <= 0) return 0;

  if (metric.type === "cumulative") {
    return Math.max(0, Math.min(100, Math.round((current / span) * 100)));
  }
  if (metric.type === "increase") {
    return Math.max(0, Math.min(100, Math.round(((current - start) / span) * 100)));
  }
  // decrease
  return Math.max(0, Math.min(100, Math.round(((start - current) / span) * 100)));
}

/** A cumulative, step-counted goal — the only shape a simulated Health connection can auto-sync. */
export function isStepsGoal(goal: Pick<Goal, "metric" | "category" | "unit">): boolean {
  return goal.metric.type === "cumulative" && (goal.category === "steps" || /steps?/i.test(goal.unit));
}

// Metric-shape checks used across the create flow, goal detail, cards, and the data
// layer — centralized here so every caller agrees on what each metric type means.
export function metricNeedsNumericLog(type: MetricType): boolean {
  return type !== "binary";
}
export function metricNeedsBaseline(type: MetricType): boolean {
  return type === "increase" || type === "decrease";
}
export function metricIsCumulative(type: MetricType): boolean {
  return type === "cumulative";
}
/**
 * A specific number you're working toward (1-rep max, golf score, race time) rather than
 * a running total or a daily habit. Each log is an attempt, not a check-in — you don't
 * PR every day, so these carry no day-streak and only a new high (increase) or new low
 * (decrease) actually moves your number.
 */
export function metricIsEntryBased(type: MetricType): boolean {
  return type === "increase" || type === "decrease";
}
/** Metric types where multiple logs per day are meaningful — cumulative running totals and entry/attempt-based numbers — as opposed to binary's once-a-day check-in. */
export function metricAllowsRepeatLogging(type: MetricType): boolean {
  return metricIsCumulative(type) || metricIsEntryBased(type);
}
