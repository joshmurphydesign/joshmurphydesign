"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useUserMap } from "@/lib/people";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconCamera, IconCheck } from "@/components/ui/Icons";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { categoryEmoji, daysUntil, isToday, modeLabel } from "@/lib/utils";

const MODE_TONE: Record<string, "blue" | "rival" | "volt" | "gold"> = {
  goal: "blue",
  challenge: "gold",
  duel: "rival",
  quest: "volt",
};

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { goals, posts, joinGoal, logProgress, spendStreakFreeze, settleStakes } = useData();
  const userMap = useUserMap();
  const [joinError, setJoinError] = useState<string | null>(null);

  const goal = goals.find((g) => g.id === params.id);
  const [daysLeft] = useState(() => daysUntil(goal?.endDate ?? new Date().toISOString()));

  if (!goal) {
    return (
      <div className="flex flex-col gap-4">
        <TopBar title="Goal" onBack />
        <p className="px-5 text-sm text-chalk-500">This goal doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  const me = goal.participants.find((p) => p.userId === "me");
  const iAmIn = !!me;
  const iAmOwner = !!me?.isOwner;
  const loggedToday = isToday(me?.lastLoggedAt);
  const streakAtRisk = iAmIn && !!me?.lastLoggedAt && !loggedToday && goal.streak > 0;
  const sortedParticipants = [...goal.participants].sort((a, b) => b.progress - a.progress);
  const relatedPosts = posts
    .filter((p) => p.goalId === goal.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const winner = goal.winnerId ? userMap[goal.winnerId] : undefined;

  const handleJoin = () => {
    setJoinError(null);
    const ok = joinGoal(goal.id);
    if (!ok) setJoinError("Not enough points to cover this stake.");
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title={modeLabel(goal.mode)} onBack transparent />

      <div className="px-5">
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
          style={{ background: goal.coverGradient }}
        >
          <div className="noise-overlay absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <Pill tone={MODE_TONE[goal.mode] ?? "neutral"} className="bg-black/25 !border-white/20 !text-white">
              {modeLabel(goal.mode)}
            </Pill>
            <span className="text-3xl">{categoryEmoji(goal.category)}</span>
          </div>
          <h1 className="relative mt-5 font-display text-2xl leading-tight text-white">{goal.title}</h1>
          <p className="relative mt-2 text-sm text-white/80">{goal.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 px-5">
        <MiniStat label="Target" value={goal.target} sub={goal.unit} />
        <MiniStat label="Days left" value={String(daysLeft)} sub={`of ${goal.durationDays}`} />
        <MiniStat label="Streak" value={String(goal.streak)} sub="days" />
      </div>

      {!!goal.stake && (
        <div className="px-5">
          <div className="card-surface-raised flex items-center justify-between rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Pot on the line</p>
              <p className="mt-0.5 font-display text-xl text-gold-500">{"\u{1FA99}"} {goal.pot} pts</p>
              {me?.stakePaid !== undefined && (
                <p className="mt-0.5 text-xs text-chalk-500">Your stake: {me.stakePaid} pts</p>
              )}
            </div>
            {goal.settledAt ? (
              <Pill tone="gold">{winner ? `${winner.name.split(" ")[0]} won` : "Settled"}</Pill>
            ) : iAmOwner ? (
              <Button onClick={() => settleStakes(goal.id)} variant="outline" size="sm">
                End & settle
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <div className="px-5">
        <div className="card-surface rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-chalk-500">Overall progress</span>
            <span className="font-bold text-chalk-100">{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} className="mt-2" height={10} />

          {iAmIn ? (
            <div className="mt-4 flex flex-col gap-2">
              <Button
                onClick={() => logProgress(goal.id)}
                disabled={loggedToday}
                variant={loggedToday ? "ghost" : "volt"}
                size="md"
                className="w-full"
              >
                {loggedToday ? (
                  <>
                    <IconCheck className="h-4 w-4" /> Logged today
                  </>
                ) : (
                  "Log today's progress"
                )}
              </Button>
              {streakAtRisk && (
                <button
                  onClick={() => spendStreakFreeze(goal.id)}
                  disabled={(user?.freezes ?? 0) <= 0}
                  className="text-xs font-semibold text-sky-500 disabled:text-chalk-700"
                >
                  {"\u{2744}\u{FE0F}"} Streak at risk — use a freeze ({user?.freezes ?? 0} left)
                </button>
              )}
              <Link
                href={`/feed/new?goalId=${goal.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/15 px-5 py-3 text-sm font-semibold text-chalk-100 transition-transform active:scale-[0.97]"
              >
                <IconCamera className="h-4 w-4" /> Share a photo update
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={handleJoin} variant="volt" size="md" className="w-full">
                {goal.stake ? `Join for ${goal.stake} pts` : `Join this ${modeLabel(goal.mode).toLowerCase()}`}
              </Button>
              {joinError && <p className="text-xs font-semibold text-rival-500">{joinError}</p>}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        <h2 className="font-display text-lg tracking-wide text-chalk-100">
          Participants <span className="text-chalk-500">({goal.participants.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {sortedParticipants.map((p) => {
            const person = userMap[p.userId];
            if (!person) return null;
            return (
              <div key={p.userId} className="card-surface flex items-center gap-3 rounded-2xl p-3">
                <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-chalk-100">
                      {person.name} {p.isOwner && <span className="text-chalk-500">· owner</span>}
                    </p>
                    <span className="text-xs font-bold text-chalk-300">{p.progress}%</span>
                  </div>
                  <ProgressBar value={p.progress} height={5} className="mt-1.5" />
                </div>
              </div>
            );
          })}
        </div>
        {iAmIn && <StreakBadge days={goal.streak} className="self-start" />}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Updates</h2>
        <div className="flex flex-col gap-3 px-5">
          {relatedPosts.length > 0 ? (
            relatedPosts.map((post) => <FeedPostCard key={post.id} post={post} />)
          ) : (
            <p className="text-sm text-chalk-500">No updates posted yet. Be the first to share progress.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-0.5 rounded-2xl py-3.5 text-center">
      <p className="font-display text-lg leading-none text-chalk-100">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
      <p className="text-[10px] text-chalk-700">{sub}</p>
    </div>
  );
}
