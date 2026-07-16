"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { GroupRoster } from "@/components/goal/GroupRoster";
import { categoryEmoji } from "@/lib/utils";
import { metricIsEntryBased } from "@/lib/metric-presets";

export default function GroupsPage() {
  const { goals } = useData();

  const myGoals = useMemo(() => goals.filter((g) => g.participants.some((p) => p.userId === "me")), [goals]);
  // Only daily-obligation commitments (binary check-ins, cumulative running totals)
  // have a "did you show up today" cadence — entry-based goals are attempts logged
  // whenever they happen, so a "missed" badge on them would be misleading.
  const myGroups = useMemo(
    () => myGoals.filter((g) => g.participants.length > 1 && !metricIsEntryBased(g.metric.type)),
    [myGoals]
  );

  return (
    <div className="flex flex-col gap-6">
      <TopBar title="Groups" />

      <div className="px-5">
        <p className="text-xs text-chalk-500">Your accountability groups, streak circles, and challenge rooms.</p>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {myGroups.length > 0 ? (
          myGroups.map((g) => (
            <Link key={g.id} href={`/goal/${g.id}`} className="card-surface rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-lg">{categoryEmoji(g.category)}</span>
                  <p className="truncate text-sm font-bold text-chalk-100">{g.title}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-chalk-500">{g.streak} day streak</span>
              </div>
              <div className="mt-3">
                <GroupRoster participants={g.participants} size={36} />
              </div>
            </Link>
          ))
        ) : (
          <div className="card-surface rounded-[var(--radius-card)] p-6 text-center">
            <p className="text-sm text-chalk-300">No accountability groups yet.</p>
            <Link href="/create" className="mt-3 inline-block text-sm font-bold text-ascend-gradient">
              Start a group commitment →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
