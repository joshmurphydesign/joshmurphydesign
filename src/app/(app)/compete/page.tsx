"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { LeaderboardRow } from "@/components/compete/LeaderboardRow";
import { Pill } from "@/components/ui/Pill";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { cn, modeLabel } from "@/lib/utils";

export default function CompetePage() {
  const { competitions } = useData();
  const [activeId, setActiveId] = useState(competitions[0]?.id);
  const active = competitions.find((c) => c.id === activeId) ?? competitions[0];

  if (!active) return null;

  return (
    <div className="flex flex-col gap-5">
      <TopBar title="Compete" right={<NotificationsButton />} />

      <div className="flex gap-2 overflow-x-auto px-5 pb-1">
        {competitions.map((c) => (
          <button
            key={c.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              "shrink-0 rounded-pill px-3.5 py-2 text-xs font-semibold transition-colors",
              active.id === c.id ? "bg-ascend-gradient text-white" : "bg-white/6 text-chalk-500"
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="px-5">
        <div className="card-surface-raised rounded-[var(--radius-card)] p-5">
          <div className="flex items-center justify-between">
            <Pill tone={active.mode === "duel" ? "rival" : "gold"}>{modeLabel(active.mode)}</Pill>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Ends in</p>
              <CountdownTimer endsAt={active.endsAt} compact />
            </div>
          </div>
          <h1 className="mt-3 font-display text-xl leading-tight text-chalk-100">{active.title}</h1>
          <p className="mt-1.5 text-sm text-chalk-500">{active.description}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 px-5">
        {active.leaderboard
          .slice()
          .sort((a, b) => a.rank - b.rank)
          .map((entry) => (
            <LeaderboardRow key={entry.userId} entry={entry} />
          ))}
      </div>
    </div>
  );
}
