"use client";

import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { GoalCard } from "@/components/goal/GoalCard";
import { PowerPlayCard } from "@/components/powerplay/PowerPlayCard";
import { Avatar } from "@/components/ui/Avatar";
import { cn, categoryEmoji, categoryLabel, isFuture } from "@/lib/utils";
import Link from "next/link";

export default function DiscoverPage() {
  const { goals, powerPlays, following, toggleFollow, otherUsers } = useData();

  const discoverableGoals = goals.filter(
    (g) => g.isPublic && !g.participants.some((p) => p.userId === "me")
  );
  const discoverablePowerPlays = powerPlays.filter(
    (pp) => !pp.participantIds.includes("me") && (pp.isLive || isFuture(pp.startsAt))
  );

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title="Discover" onBack />

      <section className="flex flex-col gap-3">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Open goals & challenges</h2>
        {discoverableGoals.length > 0 ? (
          <div className="flex flex-col gap-3 px-5">
            {discoverableGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        ) : (
          <p className="px-5 text-sm text-chalk-500">You&apos;ve joined everything open right now.</p>
        )}
      </section>

      {discoverablePowerPlays.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Power Plays</h2>
          <div className="flex gap-3 overflow-x-auto px-5 pb-1">
            {discoverablePowerPlays.map((pp) => (
              <PowerPlayCard key={pp.id} powerPlay={pp} />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Athletes to follow</h2>
        <div className="flex flex-col gap-2 px-5">
          {otherUsers.map((u) => {
            const isFollowing = following.includes(u.id);
            return (
              <div key={u.id} className="card-surface flex items-center gap-3 rounded-2xl p-3">
                <Link href={`/profile/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar initials={u.avatarInitials} gradient={u.avatarColor} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-chalk-100">{u.name}</p>
                    <p className="truncate text-xs text-chalk-500">
                      @{u.handle} · {categoryEmoji(u.focus[0])} {categoryLabel(u.focus[0])}
                    </p>
                  </div>
                </Link>
                <button
                  onClick={() => toggleFollow(u.id)}
                  className={cn(
                    "shrink-0 rounded-pill px-3.5 py-2 text-xs font-bold transition-colors",
                    isFollowing ? "bg-white/8 text-chalk-300" : "bg-ascend-gradient text-white"
                  )}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
