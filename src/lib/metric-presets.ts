import type { Goal, GoalCategory, GoalMetric, GoalParticipant, MetricType } from "./types";

export interface MetricPreset {
  key: string;
  label: string;
  categories: GoalCategory[];
  metricType: MetricType;
  unit: string;
  suggestedTarget: number;
  startingPrompt?: string;
  logLabel: string;
}

export const CONSISTENCY_PRESET: MetricPreset = {
  key: "consistency",
  label: "Consistency",
  categories: [
    "strength",
    "running",
    "golf",
    "basketball",
    "steps",
    "mobility",
    "nutrition",
    "recovery",
    "consistency",
    "habits",
    "custom",
  ],
  metricType: "binary",
  unit: "days",
  suggestedTarget: 30,
  logLabel: "Mark today done",
};

export const METRIC_PRESETS: MetricPreset[] = [
  {
    key: "body-weight",
    label: "Body weight",
    categories: ["strength", "nutrition", "consistency"],
    metricType: "decrease",
    unit: "lb",
    suggestedTarget: 10,
    startingPrompt: "What's your starting weight?",
    logLabel: "Log today's weight",
  },
  {
    key: "one-rep-max",
    label: "1-rep max",
    categories: ["strength"],
    metricType: "increase",
    unit: "lb",
    suggestedTarget: 20,
    startingPrompt: "What's your current 1-rep max?",
    logLabel: "Log your latest max",
  },
  {
    key: "total-reps",
    label: "Total reps logged",
    categories: ["strength", "basketball", "habits"],
    metricType: "cumulative",
    unit: "reps",
    suggestedTarget: 3000,
    logLabel: "Add reps",
  },
  {
    key: "race-time",
    label: "Race / split time",
    categories: ["running"],
    metricType: "decrease",
    unit: "min",
    suggestedTarget: 5,
    startingPrompt: "What's your current time?",
    logLabel: "Log your latest time",
  },
  {
    key: "total-distance",
    label: "Total distance",
    categories: ["running", "steps"],
    metricType: "cumulative",
    unit: "mi",
    suggestedTarget: 50,
    logLabel: "Add distance",
  },
  {
    key: "scoring-average",
    label: "Scoring average",
    categories: ["golf"],
    metricType: "decrease",
    unit: "strokes",
    suggestedTarget: 5,
    startingPrompt: "What's your current scoring average?",
    logLabel: "Log today's score",
  },
  {
    key: "total-steps",
    label: "Total steps",
    categories: ["steps"],
    metricType: "cumulative",
    unit: "steps",
    suggestedTarget: 300000,
    logLabel: "Add steps",
  },
  {
    key: "flexibility",
    label: "Flexibility / range",
    categories: ["mobility", "recovery"],
    metricType: "increase",
    unit: "in",
    suggestedTarget: 4,
    startingPrompt: "What's your current reach?",
    logLabel: "Log today's measurement",
  },
  CONSISTENCY_PRESET,
];

/** Relevant presets first (matching the goal's category), everything else after. Consistency always leads. */
export function presetsForCategory(category: GoalCategory | null): MetricPreset[] {
  const relevant = METRIC_PRESETS.filter((p) => p.key !== "consistency" && category && p.categories.includes(category));
  const rest = METRIC_PRESETS.filter((p) => p.key !== "consistency" && !relevant.includes(p));
  return [CONSISTENCY_PRESET, ...relevant, ...rest];
}

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
