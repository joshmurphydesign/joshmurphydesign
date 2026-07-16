"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { HeaderIconLink } from "@/components/shell/HeaderIconLink";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { GroupRoster } from "@/components/goal/GroupRoster";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { IconCamera, IconMessage } from "@/components/ui/Icons";
import { metricIsEntryBased } from "@/lib/metric-presets";

export default function GroupsPage() {
  const { goals, posts, threads } = useData();

  const myGoals = useMemo(() => goals.filter((g) => g.participants.some((p) => p.userId === "me")), [goals]);
  // Only daily-obligation commitments (binary check-ins, cumulative running totals)
  // have a "did you show up today" cadence — entry-based goals are attempts logged
  // whenever they happen, so a "missed" badge on them would be misleading.
  const myGroups = useMemo(
    () => myGoals.filter((g) => g.participants.length > 1 && !metricIsEntryBased(g.metric.type)),
    [myGoals]
  );
  const myGoalIds = useMemo(() => new Set(myGoals.map((g) => g.id)), [myGoals]);
  const activity = useMemo(
    () =>
      [...posts]
        .filter((p) => p.goalId && myGoalIds.has(p.goalId))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts, myGoalIds]
  );
  const hasUnreadThreads = threads.some((t) => t.unread);

  return (
    <div className="flex flex-col gap-6">
      <TopBar
        title="Groups"
        right={
          <div className="flex items-center gap-2">
            <HeaderIconLink href="/feed/new" icon={<IconCamera className="h-5 w-5" />} label="New update" />
            <HeaderIconLink
              href="/messages"
              icon={<IconMessage className="h-5 w-5" />}
              label="Messages"
              dot={hasUnreadThreads}
            />
            <NotificationsButton />
          </div>
        }
      />

      {myGroups.length > 0 && (
        <section className="flex flex-col gap-3">
          <SectionHeader title="Your groups" subtitle="Who's shown up today" />
          <div className="flex flex-col gap-3 px-5">
            {myGroups.map((g) => (
              <Link key={g.id} href={`/goal/${g.id}`} className="card-surface rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold text-chalk-100">{g.title}</p>
                  <span className="text-xs font-semibold text-chalk-500">{g.streak} day streak</span>
                </div>
                <div className="mt-3">
                  <GroupRoster participants={g.participants} size={36} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Activity" subtitle="Check-ins from your commitments" />
        <div className="flex flex-col gap-3 px-5">
          {activity.length > 0 ? (
            activity.map((post) => <FeedPostCard key={post.id} post={post} />)
          ) : (
            <p className="py-10 text-center text-sm text-chalk-500">
              No activity yet. Check in on a commitment to get things moving.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
