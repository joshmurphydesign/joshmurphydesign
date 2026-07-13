"use client";

import { useMemo, useState } from "react";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { PowerPlayCard } from "@/components/powerplay/PowerPlayCard";
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
  const { posts, powerPlays } = useData();
  const [filter, setFilter] = useState("all");

  const sorted = useMemo(
    () => [...posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts]
  );
  const filtered = filter === "all" ? sorted : sorted.filter((p) => p.type === filter);
  const livePowerPlays = powerPlays.filter((p) => p.isLive);

  return (
    <div className="flex flex-col gap-4">
      <TopBar title="Feed" right={<NotificationsButton />} />

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
