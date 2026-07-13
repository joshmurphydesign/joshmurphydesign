import Link from "next/link";
import type { Goal } from "@/lib/types";
import { categoryEmoji, categoryLabel, modeLabel } from "@/lib/utils";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { AvatarStack } from "@/components/ui/AvatarStack";

const MODE_TONE: Record<string, "violet" | "rival" | "volt" | "gold"> = {
  goal: "violet",
  challenge: "gold",
  duel: "rival",
  quest: "volt",
};

export function GoalCard({ goal }: { goal: Goal }) {
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
        <StreakBadge days={goal.streak} />
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
