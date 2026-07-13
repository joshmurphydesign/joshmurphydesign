"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { HeaderIconLink } from "@/components/shell/HeaderIconLink";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { PowerPlayCard } from "@/components/powerplay/PowerPlayCard";
import { IconCamera, IconMessage, IconSearch } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";
import type { Post } from "@/lib/types";

const FILTERS: { key: string; label: string; match?: Post["type"] }[] = [
  { key: "all", label: "All" },
  { key: "progress", label: "Progress", match: "progress" },
  { key: "win", label: "Wins", match: "win" },
  { key: "streak", label: "Streaks", match: "streak" },
  { key: "competition-result", label: "Competitions", match: "competition-result" },
  { key: "powerplay", label: "Power Plays", match: "powerplay" },
];

export default function FeedPage() {
  const { posts, powerPlays, threads } = useData();
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts]
  );
  const filtered = filter === "all" ? sorted : sorted.filter((p) => p.type === filter);
  const livePowerPlays = powerPlays.filter((p) => p.isLive);
  const hasUnreadThreads = threads.some((t) => t.unread);

  return (
    <div className="flex flex-col gap-4">
      <TopBar
        title="Feed"
        right={
          <div className="flex items-center gap-2">
            <HeaderIconLink href="/feed/new" icon={<IconCamera className="h-5 w-5" />} label="New post" />
            <HeaderIconLink href="/discover" icon={<IconSearch className="h-5 w-5" />} label="Discover" />
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

      {livePowerPlays.length > 0 && (
        <div className="flex gap-3 overflow-x-auto px-5 pb-1">
          {livePowerPlays.map((pp) => (
            <PowerPlayCard key={pp.id} powerPlay={pp} />
          ))}
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto px-5 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-pill px-3.5 py-2 text-xs font-semibold transition-colors",
              filter === f.key ? "bg-ascend-gradient text-white" : "bg-white/6 text-chalk-500"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-5">
        {filtered.map((post) => (
          <FeedPostCard key={post.id} post={post} />
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-chalk-500">Nothing here yet.</p>
        )}
      </div>
    </div>
  );
}
