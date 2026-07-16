"use client";

import { useMemo } from "react";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { HeaderIconLink } from "@/components/shell/HeaderIconLink";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { IconCamera } from "@/components/ui/Icons";
import { byImportance } from "@/lib/feed-ranking";

export default function PulsePage() {
  const { goals, posts, following, followerIds } = useData();

  const myGoals = useMemo(() => goals.filter((g) => g.participants.some((p) => p.userId === "me")), [goals]);
  const myGoalIds = useMemo(() => new Set(myGoals.map((g) => g.id)), [myGoals]);
  // People you follow or who follow you — the only audience an open challenge
  // invite reaches beyond the group itself, so Pulse stays high-signal rather
  // than a public discovery feed.
  const connections = useMemo(() => new Set([...following, ...followerIds]), [following, followerIds]);
  // The app-wide highlight reel — every post here ties back to a commitment,
  // and importance (wins, streak milestones) is blended with recency so the
  // moments that matter don't get buried under routine check-ins. Open
  // challenge invites from connections are the one exception to "your own
  // goals only" — that's the whole point of posting one.
  const highlights = useMemo(() => {
    const own = posts.filter((p) => p.goalId && myGoalIds.has(p.goalId));
    const invites = posts.filter(
      (p) => p.type === "challenge-invite" && connections.has(p.userId) && !(p.goalId && myGoalIds.has(p.goalId))
    );
    return [...own, ...invites].sort(byImportance);
  }, [posts, myGoalIds, connections]);

  return (
    <div className="flex flex-col gap-6">
      <TopBar
        title="Pulse"
        right={<HeaderIconLink href="/pulse/new" icon={<IconCamera className="h-5 w-5" />} label="Share a highlight" />}
      />

      <div className="px-5">
        <p className="text-xs text-chalk-500">Wins, streak milestones, and proof from your groups and challenges.</p>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {highlights.length > 0 ? (
          highlights.map((post) => <FeedPostCard key={post.id} post={post} />)
        ) : (
          <p className="py-10 text-center text-sm text-chalk-500">
            No highlights yet. Check in on a commitment to get things moving.
          </p>
        )}
      </div>
    </div>
  );
}
