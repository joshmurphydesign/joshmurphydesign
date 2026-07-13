"use client";

import Link from "next/link";
import { useData } from "@/lib/data-context";
import { metricIsEntryBased } from "@/lib/metric-presets";
import type { Goal } from "@/lib/types";
import { categoryEmoji, categoryLabel, cn, isToday, modeLabel } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { IconCheck, IconPlus } from "@/components/ui/Icons";

const MODE_TONE: Record<string, "blue" | "rival" | "volt" | "gold"> = {
  goal: "blue",
  challenge: "gold",
  duel: "rival",
  quest: "volt",
};

export function GoalCard({ goal }: { goal: Goal }) {
  const { logProgress } = useData();
  const me = goal.participants.find((p) => p.userId === "me");
  const loggedToday = isToday(me?.lastLoggedAt);

  return (
    <Link
      href={`/goal/${goal.id}`}
      className="card-surface block shrink-0 rounded-[var(--radius-card)] p-4 transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-2xl text-lg"
            style={{ background: goal.coverGradient }}
          >
            {categoryEmoji(goal.category)}
          </div>
          <div>
            <p className="text-[15px] font-bold leading-tight text-chalk-100">{goal.title}</p>
            <p className="text-xs text-chalk-500">{categoryLabel(goal.category)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!metricIsEntryBased(goal.metric.type) && <StreakBadge days={goal.streak} />}
          {me && goal.metric.type === "binary" && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!loggedToday) logProgress(goal.id);
              }}
              disabled={loggedToday}
              aria-label={loggedToday ? "Logged today" : "Log today's progress"}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-transform active:scale-90",
                loggedToday ? "bg-volt-500/15 text-volt-400" : "bg-ascend-gradient text-white"
              )}
            >
              {loggedToday ? <IconCheck className="h-3.5 w-3.5" /> : <IconPlus className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-chalk-500">
        <span>Progress</span>
        <span className="font-bold text-chalk-100">{goal.progress}%</span>
      </div>
      <ProgressBar
        value={goal.progress}
        gradientClassName={goal.mode === "duel" ? "bg-rival-gradient" : "bg-ascend-gradient"}
        className="mt-1.5"
      />

      <div className="mt-4 flex items-center justify-between">
        <Pill tone={MODE_TONE[goal.mode] ?? "neutral"}>{modeLabel(goal.mode)}</Pill>
        <AvatarStack userIds={goal.participants.map((p) => p.userId)} max={3} size={24} />
      </div>
    </Link>
  );
}
