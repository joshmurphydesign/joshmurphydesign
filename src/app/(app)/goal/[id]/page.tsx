"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { pointsForPlacement, useData } from "@/lib/data-context";
import { isStepsGoal, metricIsCumulative, metricNeedsBaseline, metricNeedsNumericLog } from "@/lib/metric-presets";
import { useUserMap } from "@/lib/people";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { IconCamera, IconCheck, IconChevronRight } from "@/components/ui/Icons";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { categoryEmoji, daysUntil, isToday, modeLabel, timeAgo } from "@/lib/utils";

function formatValue(n: number): string {
  return n.toLocaleString();
}

const MODE_TONE: Record<string, "blue" | "rival" | "volt" | "gold"> = {
  goal: "blue",
  challenge: "gold",
  duel: "rival",
  quest: "volt",
};

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { goals, posts, health, joinGoal, logProgress, spendStreakFreeze, settleGoal } = useData();
  const userMap = useUserMap();

  const goal = goals.find((g) => g.id === params.id);
  const [daysLeft] = useState(() => daysUntil(goal?.endDate ?? new Date().toISOString()));
  const [logValue, setLogValue] = useState("");
  const [joinStartValue, setJoinStartValue] = useState("");
  const [manualLogOpen, setManualLogOpen] = useState(false);

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
  const isCompetitive = goal.mode === "challenge" || goal.mode === "duel";
  const winnerPoints = pointsForPlacement(goal.mode, 1);

  const metric = goal.metric;
  const needsNumericLog = metricNeedsNumericLog(metric.type);
  const needsBaseline = metricNeedsBaseline(metric.type);
  // Cumulative goals (steps, reps, distance...) are naturally multi-session, so
  // logging again today just adds another entry instead of being locked out.
  const isCumulative = metricIsCumulative(metric.type);
  const canLogMore = isCumulative || !loggedToday;
  const stepsGoal = isStepsGoal(goal);
  const healthProviderLabel = health?.provider === "apple" ? "Apple Health" : health?.provider === "samsung" ? "Samsung Health" : undefined;
  const healthProviderEmoji = health?.provider === "apple" ? "\u{1F34E}" : "\u{231A}";
  // When Health is already auto-syncing this goal, a permanently-visible manual
  // input competes with the sync banner for the same number — tuck it behind a
  // toggle instead so the auto-sync path reads as primary.
  const autoSynced = stepsGoal && !!health;
  const showManualFields = !autoSynced || manualLogOpen;

  const submitLog = () => {
    if (!needsNumericLog) {
      logProgress(goal.id);
      return;
    }
    const num = Number(logValue);
    if (logValue.trim() === "" || Number.isNaN(num)) return;
    logProgress(goal.id, num);
    setLogValue("");
    if (autoSynced) setManualLogOpen(false);
  };

  const submitJoin = () => {
    if (!needsBaseline) {
      joinGoal(goal.id);
      return;
    }
    const num = Number(joinStartValue);
    if (joinStartValue.trim() === "" || Number.isNaN(num)) return;
    joinGoal(goal.id, num);
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

      {isCompetitive && (
        <div className="px-5">
          <div className="card-surface-raised flex items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">What&apos;s on the line</p>
              <p className="mt-0.5 font-bold text-chalk-100">{goal.stake || "Bragging rights"}</p>
              <p className="mt-1 text-xs text-chalk-500">Winner earns {winnerPoints} pts automatically.</p>
            </div>
            {goal.settledAt ? (
              <Pill tone="gold">{winner ? `${winner.name.split(" ")[0]} won` : "Settled"}</Pill>
            ) : iAmOwner ? (
              <Button onClick={() => settleGoal(goal.id)} variant="outline" size="sm">
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

          {iAmIn && stepsGoal && (
            <Link
              href="/profile/health"
              className="mt-4 flex items-center gap-2.5 rounded-2xl bg-white/5 px-3.5 py-3"
            >
              <span className="text-base">{health ? healthProviderEmoji : "\u{1F45F}"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-chalk-100">
                  {health ? `Synced from ${healthProviderLabel}` : "Connect to auto-log your steps"}
                </p>
                <p className="text-[11px] text-chalk-500">
                  {health
                    ? health.lastSyncedAt
                      ? `Last synced ${timeAgo(health.lastSyncedAt)}`
                      : "Not yet synced"
                    : "Apple Health or Samsung Health"}
                </p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-chalk-700" />
            </Link>
          )}

          {iAmIn ? (
            <div className="mt-4 flex flex-col gap-2">
              {me && needsNumericLog && (
                <p className="text-xs text-chalk-500">
                  {metric.type === "cumulative"
                    ? `${formatValue(me.currentValue ?? 0)} / ${formatValue(metric.targetValue)} ${goal.unit} logged`
                    : `Currently ${formatValue(me.currentValue ?? me.startValue ?? 0)} ${goal.unit} · started at ${formatValue(me.startValue ?? 0)} ${goal.unit}`}
                </p>
              )}
              {showManualFields ? (
                <>
                  {needsNumericLog && canLogMore && (
                    <input
                      type="number"
                      inputMode="decimal"
                      value={logValue}
                      onChange={(e) => setLogValue(e.target.value)}
                      placeholder={isCumulative ? `Add ${goal.unit} logged today` : `Today's ${goal.unit}`}
                      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                    />
                  )}
                  <Button
                    onClick={submitLog}
                    disabled={!canLogMore || (needsNumericLog && logValue.trim() === "")}
                    variant={!canLogMore ? "ghost" : "volt"}
                    size="md"
                    className="w-full"
                  >
                    {!canLogMore ? (
                      <>
                        <IconCheck className="h-4 w-4" /> Logged today
                      </>
                    ) : isCumulative && loggedToday ? (
                      "Add more today"
                    ) : (
                      "Log today's progress"
                    )}
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setManualLogOpen(true)}
                  className="self-start text-xs font-semibold text-sky-500"
                >
                  + Log extra steps manually
                </button>
              )}
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
              {needsBaseline && (
                <input
                  type="number"
                  inputMode="decimal"
                  value={joinStartValue}
                  onChange={(e) => setJoinStartValue(e.target.value)}
                  placeholder={`Your starting ${goal.unit}`}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                />
              )}
              <Button
                onClick={submitJoin}
                disabled={needsBaseline && joinStartValue.trim() === ""}
                variant="volt"
                size="md"
                className="w-full"
              >
                Join this {modeLabel(goal.mode).toLowerCase()}
              </Button>
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
                  {needsNumericLog && p.currentValue !== undefined && (
                    <p className="mt-0.5 text-[11px] text-chalk-500">
                      {formatValue(p.currentValue)} {goal.unit}
                    </p>
                  )}
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
