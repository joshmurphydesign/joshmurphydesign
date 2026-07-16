"use client";

import Link from "next/link";
import { useData } from "@/lib/data-context";
import { useUserMap } from "@/lib/people";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { IconMessage } from "@/components/ui/Icons";
import { GoalCard } from "@/components/goal/GoalCard";
import { ProfileInsights } from "@/components/profile/ProfileInsights";
import { earnedBadges, type Badge } from "@/lib/badges";
import { categoryEmoji, categoryLabel, cn, timeAgo } from "@/lib/utils";
import type { User } from "@/lib/types";

export function ProfileView({ person }: { person: User & { email?: string } }) {
  const { goals, posts, activity, following, toggleFollow } = useData();
  const userMap = useUserMap();
  const isMe = person.id === "me";
  const isFollowing = following.includes(person.id);

  const myGoals = goals.filter((g) => g.participants.some((p) => p.userId === person.id));
  const completedGoals = myGoals.filter((g) => g.status === "completed" || g.progress >= 100);
  const personPosts = posts.filter((p) => p.userId === person.id);
  // Goal.bestStreak/streak reflect whoever most recently logged a shared group goal,
  // not a true per-participant figure — reliable for the signed-in user, but other
  // profiles fall back to their static seed streak instead of a possibly-wrong number.
  const bestActiveStreak = isMe ? myGoals.reduce((max, g) => Math.max(max, g.streak), 0) : person.streak;

  const achievements: Badge[] = isMe
    ? earnedBadges(myGoals, personPosts)
    : ([
        bestActiveStreak >= 30 && { id: "streak", icon: "\u{1F525}", label: `${bestActiveStreak}-day streak`, sub: undefined },
        completedGoals.length > 0 && {
          id: "completed",
          icon: "\u{1F3C1}",
          label: `${completedGoals.length} goal${completedGoals.length === 1 ? "" : "s"} completed`,
          sub: undefined,
        },
      ].filter(Boolean) as Badge[]);

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
              <Pill key={f} tone="blue">
                {categoryEmoji(f)} {categoryLabel(f)}
              </Pill>
            ))}
          </div>
          {!isMe && (
            <div className="relative mt-5 flex items-center gap-2.5">
              <button
                onClick={() => toggleFollow(person.id)}
                className={cn(
                  "flex-1 rounded-pill px-4 py-2.5 text-sm font-bold transition-colors",
                  isFollowing ? "bg-white/10 text-chalk-100" : "bg-ascend-gradient text-white"
                )}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
              <Link href={`/messages/${person.id}`} className="flex-1">
                <Button variant="outline" size="md" className="w-full">
                  <IconMessage className="h-4 w-4" /> Message
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2.5 px-5">
        <StatBlock value={person.score.toLocaleString()} label="Score" />
        <StatBlock value={bestActiveStreak} label="Streak" />
        <StatBlock value={person.followers} label="Followers" />
        <StatBlock value={isMe ? following.length : person.following} label="Following" />
      </div>

      {isMe && <ProfileInsights goals={myGoals} posts={personPosts} />}

      {achievements.length > 0 && (
        <section className="flex flex-col gap-2.5">
          <h2 className="px-5 font-ui text-lg tracking-wide text-chalk-100">Milestones</h2>
          <div className="flex gap-2.5 overflow-x-auto px-5 pb-1">
            {achievements.map((a) => (
              <div
                key={a.id}
                className="flex shrink-0 flex-col items-center gap-1.5 rounded-2xl card-surface px-4 py-3.5 text-center"
                style={{ minWidth: 108 }}
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[11px] font-semibold leading-tight text-chalk-300">{a.label}</span>
                {a.sub && <span className="text-[10px] text-chalk-700">{a.sub}</span>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2.5">
        <h2 className="px-5 font-ui text-lg tracking-wide text-chalk-100">
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
          <h2 className="px-5 font-ui text-lg tracking-wide text-chalk-100">Rally circle</h2>
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
          <h2 className="px-5 font-ui text-lg tracking-wide text-chalk-100">History</h2>
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
      <p className="font-stat text-base leading-none text-chalk-100">{value}</p>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
    </div>
  );
}
