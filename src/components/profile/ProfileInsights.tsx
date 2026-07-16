"use client";

import { useMemo } from "react";
import { computeInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";
import type { Goal, Post } from "@/lib/types";

export function ProfileInsights({ goals, posts }: { goals: Goal[]; posts: Post[] }) {
  const insights = useMemo(() => computeInsights(goals, posts), [goals, posts]);

  if (goals.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="px-5 font-ui text-lg tracking-wide text-chalk-100">Insights</h2>
      <div className="grid grid-cols-2 gap-2.5 px-5">
        <InsightStat value={`${insights.completionRate}%`} label="Completion rate" />
        <InsightStat value={String(insights.longestStreak)} label="Longest streak" sub="days" />
      </div>
      <div className="px-5">
        <div className="card-surface rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Last 14 days</p>
            <p className="text-[10px] text-chalk-700">Any check-in</p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-1">
            {insights.consistency.map((day, i) => {
              const isToday = i === insights.consistency.length - 1;
              return (
                <span
                  key={day.date}
                  aria-label={`${day.date}: ${day.checkedIn ? "checked in" : "no check-in"}`}
                  className={cn(
                    "h-6 flex-1 rounded-md",
                    day.checkedIn ? "bg-success-500" : "bg-white/8",
                    isToday && "ring-2 ring-offset-2 ring-offset-ink-900 ring-chalk-300/30"
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function InsightStat({ value, label, sub }: { value: string; label: string; sub?: string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-0.5 rounded-2xl py-4 text-center">
      <p className="font-stat text-xl leading-none text-chalk-100">
        {value}
        {sub && <span className="ml-1 text-xs font-semibold text-chalk-500">{sub}</span>}
      </p>
      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
    </div>
  );
}
