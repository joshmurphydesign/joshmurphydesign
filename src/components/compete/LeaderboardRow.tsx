import type { LeaderboardEntry } from "@/lib/types";
import { useResolvedUser } from "@/lib/people";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

const RANK_STYLE: Record<number, string> = {
  1: "bg-gold-500/15 text-gold-500 border border-gold-500/30",
  2: "bg-white/10 text-chalk-100 border border-white/15",
  3: "bg-[#ff8a3d]/15 text-[#ffab6b] border border-[#ff8a3d]/30",
};

export function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const user = useResolvedUser(entry.userId);
  if (!user) return null;
  const isMe = entry.userId === "me";

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3.5 py-3",
        isMe ? "card-surface-raised border border-ascend-blue/30" : "card-surface"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm",
          RANK_STYLE[entry.rank] ?? "bg-white/6 text-chalk-500"
        )}
      >
        {entry.rank}
      </div>
      <Avatar initials={user.avatarInitials} gradient={user.avatarColor} size={38} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-chalk-100">
          {user.name} {isMe && <span className="text-chalk-500">(you)</span>}
        </p>
        <p className="text-xs text-chalk-500">{entry.metricLabel}</p>
      </div>
      {entry.delta !== 0 && (
        <span
          className={cn(
            "text-xs font-bold",
            entry.delta > 0 ? "text-volt-400" : "text-rival-500"
          )}
        >
          {entry.delta > 0 ? "▲" : "▼"} {Math.abs(entry.delta)}
        </span>
      )}
    </div>
  );
}
