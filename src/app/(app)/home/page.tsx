"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { HeaderIconLink } from "@/components/shell/HeaderIconLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GoalCard } from "@/components/goal/GoalCard";
import { GroupRoster } from "@/components/goal/GroupRoster";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { IconCheck, IconMessage } from "@/components/ui/Icons";
import { checkInStatus } from "@/lib/streak-status";
import { metricIsEntryBased } from "@/lib/metric-presets";
import { byImportance } from "@/lib/feed-ranking";
import { cn } from "@/lib/utils";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still grinding";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user } = useAuth();
  const { goals, posts, threads, logProgress } = useData();

  if (!user) return null;

  const hasUnreadThreads = threads.some((t) => t.unread);

  const myGoals = goals.filter((g) => g.participants.some((p) => p.userId === "me"));
  const myGoalIds = new Set(myGoals.map((g) => g.id));
  const latestHighlights = [...posts]
    .filter((p) => p.goalId && myGoalIds.has(p.goalId))
    .sort(byImportance)
    .slice(0, 2);
  // The streak/check-in loop only applies to daily-obligation commitments (binary
  // check-ins and cumulative running totals both carry a real day-streak). Entry-based
  // goals (a PR you're chasing) still show in the list below, but attempts happen
  // whenever they happen — there's no "missed today" for those, so they don't drive
  // the hero streak module or the daily check-in CTA.
  const commitments = myGoals
    .filter((g) => !metricIsEntryBased(g.metric.type))
    .map((g) => {
      const me = g.participants.find((p) => p.userId === "me")!;
      return { goal: g, status: checkInStatus(me.lastLoggedAt) };
    });

  const bestStreak = commitments.reduce((max, c) => Math.max(max, c.goal.streak), 0);
  const missedCount = commitments.filter((c) => c.status === "missed").length;
  const allCaughtUp = commitments.length > 0 && commitments.every((c) => c.status === "checked-in");
  const groupCommitments = commitments.filter((c) => c.goal.participants.length > 1);

  const primary =
    commitments.find((c) => c.status === "missed") ??
    commitments.find((c) => c.status === "pending" || c.status === "not-started") ??
    [...commitments].sort((a, b) => b.goal.streak - a.goal.streak)[0];

  return (
    <div className="flex flex-col gap-7 pb-4 pt-1">
      <header className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-3">
          <Avatar initials={user.avatarInitials} gradient={user.avatarColor} size={46} />
          <div>
            <p className="text-xs text-chalk-500">{greeting()}</p>
            <p className="text-lg font-bold leading-tight text-chalk-100">{user.name.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderIconLink
            href="/messages"
            icon={<IconMessage className="h-5 w-5" />}
            label="Messages"
            dot={hasUnreadThreads}
          />
          <NotificationsButton />
        </div>
      </header>

      <div className="px-5">
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
          style={{ background: "linear-gradient(135deg,#0b3f7a,#35c2f2)" }}
        >
          <div className="noise-overlay absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">Current streak</p>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-display text-5xl leading-none text-white">{bestStreak}</span>
                <span className="text-sm font-semibold text-white/80">{bestStreak === 1 ? "day" : "days"}</span>
              </div>
            </div>
            <span className="text-4xl">{"\u{1F525}"}</span>
          </div>
          <p className="relative mt-3 text-sm text-white/85">
            {commitments.length === 0
              ? "Start a commitment to begin your streak."
              : missedCount > 0
                ? `${missedCount} chain${missedCount > 1 ? "s" : ""} broke. Check in today to start again.`
                : allCaughtUp
                  ? "You showed up today. The chain holds."
                  : "Check in today to keep the chain alive."}
          </p>
        </div>
      </div>

      {primary && (
        <div className="px-5">
          <div className="card-surface rounded-[var(--radius-card)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wide",
                    primary.status === "missed" ? "text-rival-500" : "text-chalk-500"
                  )}
                >
                  {primary.status === "missed" ? "Chain broken" : primary.status === "checked-in" ? "Checked in" : "Today's commitment"}
                </p>
                <Link href={`/goal/${primary.goal.id}`} className="mt-0.5 block truncate font-bold text-chalk-100">
                  {primary.goal.title}
                </Link>
                <p className="mt-0.5 text-xs text-chalk-500">
                  {primary.status === "missed"
                    ? "You missed a day — check in now to start a new chain."
                    : primary.status === "checked-in"
                      ? "Nice. See you tomorrow."
                      : primary.goal.streak > 0
                        ? `Don't lose your ${primary.goal.streak}-day streak.`
                        : "Check in to start your streak."}
                </p>
              </div>
            </div>
            {primary.status === "checked-in" ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-pill bg-volt-500/15 py-3 text-sm font-bold text-volt-400">
                <IconCheck className="h-4 w-4" /> Checked in today
              </div>
            ) : (
              <button
                onClick={() => logProgress(primary.goal.id)}
                className="mt-4 w-full rounded-pill bg-ascend-gradient py-3.5 text-sm font-bold text-white shadow-[var(--shadow-glow-blue)] transition-transform active:scale-[0.97]"
              >
                Check in now
              </button>
            )}
          </div>
        </div>
      )}

      {groupCommitments.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Your groups" subtitle="Who's shown up today" />
          <div className="flex flex-col gap-4 px-5">
            {groupCommitments.slice(0, 3).map(({ goal }) => (
              <Link key={goal.id} href={`/goal/${goal.id}`} className="card-surface rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-chalk-100">{goal.title}</p>
                  <span className="text-xs font-semibold text-chalk-500">{goal.streak} day streak</span>
                </div>
                <div className="mt-3">
                  <GroupRoster participants={goal.participants} size={36} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {latestHighlights.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Latest highlights" subtitle="Wins and streaks from your groups" href="/feed" hrefLabel="See all" />
          <div className="flex flex-col gap-3 px-5">
            {latestHighlights.map((post) => (
              <FeedPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your commitments" subtitle="What you've promised to show up for" href="/create" hrefLabel="New +" />
        {myGoals.length > 0 ? (
          <div className="flex flex-col gap-3 px-5">
            {myGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        ) : (
          <div className="mx-5 card-surface rounded-[var(--radius-card)] p-6 text-center">
            <p className="text-sm text-chalk-300">No commitments yet.</p>
            <Link href="/create" className="mt-3 inline-block text-sm font-bold text-ascend-gradient">
              Start your first streak →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
