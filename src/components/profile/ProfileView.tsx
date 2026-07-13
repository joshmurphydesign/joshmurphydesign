"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import { useUserMap } from "@/lib/people";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { GoalCard } from "@/components/goal/GoalCard";
import { categoryEmoji, categoryLabel, timeAgo } from "@/lib/utils";
import type { User } from "@/lib/types";

export function ProfileView({ person }: { person: User & { email?: string } }) {
  const { goals, competitions, powerPlays, activity } = useData();
  const userMap = useUserMap();

  const myGoals = goals.filter((g) => g.participants.some((p) => p.userId === person.id));
  const completedGoals = myGoals.filter((g) => g.status === "completed" || g.progress >= 100);

  const topFinishes = useMemo(() => {
    const all = [
      ...competitions.map((c) => ({ label: c.title, entries: c.leaderboard })),
      ...powerPlays.map((p) => ({ label: p.title, entries: p.leaderboard })),
    ];
    return all
      .map((x) => ({ label: x.label, entry: x.entries.find((e) => e.userId === person.id) }))
      .filter((x): x is { label: string; entry: NonNullable<typeof x.entry> } => !!x.entry && x.entry.rank <= 3)
      .sort((a, b) => a.entry.rank - b.entry.rank);
  }, [competitions, powerPlays, person.id]);

  const achievements = [
    person.streak >= 30 && { icon: "\u{1F525}", label: `${person.streak}-day streak` },
    completedGoals.length > 0 && { icon: "\u{1F3C1}", label: `${completedGoals.length} goal${completedGoals.length === 1 ? "" : "s"} completed` },
    ...topFinishes.slice(0, 3).map((f) => ({ icon: f.entry.rank === 1 ? "\u{1F947}" : f.entry.rank === 2 ? "\u{1F948}" : "\u{1F949}", label: f.label })),
  ].filter(Boolean) as { icon: string; label: string }[];

  const personActivity = activity.filter((a) => a.userId === person.id);

  const rallyCircle = Object.values(userMap).filter((u) => u.id !== person.id).slice(0, 6);

  return (
    <div className="flex flex-col gap-6 pb-4">
      <div className="px-5 pt-2">
        <div className="card-surface-raised relative overflow-hidden rounded-[var(--radius-card)] p-6">
          <div
            className="pointer-events-none absolute inset-0 opacity-25"
            style={{ background: person.avatarColor }}
          />
          <div className="relative flex items-center gap-4">
            <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={64} />
            <div className="min-w-0">
              <p className="truncate text-xl font-bold text-chalk-100">{person.name}</p>
              <p className="text-sm text-chalk-500">
                @{person.handle} {person.location && `· ${person.location}`}
              </p>
            </div>
          </div>
          <p className="relative mt-4 text-sm leading-relaxed text-chalk-300">{person.bio}</p>
          <div className="relative mt-4 flex flex-wrap gap-1.5">
            {person.focus.map((f) => (
              <Pill key={f} tone="violet">
                {categoryEmoji(f)} {categoryLabel(f)}
              </Pill>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 px-5">
        <StatBlock value={person.score.toLocaleString()} label="Score" />
        <StatBlock value={person.streak} label="Streak" />
        <StatBlock value={person.followers} label="Followers" />
        <StatBlock value={person.following} label="Following" />
      </div>

      {achievements.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Achievements</h2>
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-1">
            {achievements.map((a, i) => (
              <div
                key={i}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl card-surface px-4 py-3.5 text-center"
                style={{ minWidth: 108 }}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[11px] font-semibold leading-tight text-chalk-300">{a.label}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">
          Active goals <span className="text-chalk-500">({myGoals.length})</span>
        </h2>
        <div className="flex flex-col gap-3 px-5">
          {myGoals.length > 0 ? (
            myGoals.map((g) => <GoalCard key={g.id} goal={g} />)
          ) : (
            <p className="text-sm text-chalk-500">No active goals right now.</p>
          )}
        </div>
      </section>

      {rallyCircle.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Rally circle</h2>
          <div className="flex gap-3 overflow-x-auto px-5 pb-1">
            {rallyCircle.map((u) => (
              <div key={u.id} className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: 68 }}>
                <Avatar initials={u.avatarInitials} gradient={u.avatarColor} size={52} />
                <span className="truncate text-[11px] font-semibold text-chalk-300">{u.name.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {personActivity.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">History</h2>
          <div className="flex flex-col gap-2 px-5">
            {personActivity.map((h) => (
              <div key={h.id} className="card-surface flex items-center justify-between rounded-2xl p-3.5">
                <div>
                  <p className="text-sm font-semibold text-chalk-100">{h.label}</p>
                  <p className="text-xs text-chalk-500">{h.detail}</p>
                </div>
                <span className="text-[10px] text-chalk-700">{timeAgo(h.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatBlock({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-0.5 rounded-2xl py-3.5">
      <p className="font-display text-base leading-none text-chalk-100">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
    </div>
  );
}
