"use client";

import { cn } from "@/lib/utils";
import type { Reaction } from "@/lib/types";

const QUICK_EMOJI = "\u{1F525}";

export function ReactionBar({
  reactions,
  onToggle,
}: {
  reactions: Reaction[];
  onToggle: (emoji: string) => void;
}) {
  const iReactedAny = reactions.some((r) => r.userIds.includes("me"));

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reactions.map((r) => {
        const mine = r.userIds.includes("me");
        return (
          <button
            key={r.emoji}
            onClick={() => onToggle(r.emoji)}
            className={cn(
              "flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-semibold transition-colors",
              mine ? "bg-volt-500/15 text-volt-400 border border-volt-500/30" : "bg-white/6 text-chalk-300 border border-white/6"
            )}
          >
            <span>{r.emoji}</span>
            <span>{r.userIds.length}</span>
          </button>
        );
      })}
      {!iReactedAny && (
        <button
          onClick={() => onToggle(QUICK_EMOJI)}
          className="flex items-center gap-1 rounded-pill border border-dashed border-white/15 px-2.5 py-1 text-xs font-semibold text-chalk-500"
        >
          <span>{QUICK_EMOJI}</span>
          React
        </button>
      )}
    </div>
  );
}
