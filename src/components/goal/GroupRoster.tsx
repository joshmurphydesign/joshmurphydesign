"use client";

import { useUserMap } from "@/lib/people";
import { Avatar } from "@/components/ui/Avatar";
import { IconCheck, IconX } from "@/components/ui/Icons";
import { checkInStatus } from "@/lib/streak-status";
import { cn } from "@/lib/utils";
import type { GoalParticipant } from "@/lib/types";

const STATUS_STYLE = {
  "checked-in": { badge: "bg-success-500 text-ink-950", label: "Checked in" },
  missed: { badge: "bg-rival-500 text-white", label: "Missed — chain broken" },
  pending: { badge: "bg-white/15 text-chalk-300", label: "Hasn't checked in yet" },
  "not-started": { badge: "bg-white/10 text-chalk-700", label: "Hasn't started" },
} as const;

/** Who's on the team and whether they've shown up today — the "did my group show up" view used on Home and the commitment detail screen. */
export function GroupRoster({ participants, size = 40 }: { participants: GoalParticipant[]; size?: number }) {
  const userMap = useUserMap();

  return (
    <div className="flex flex-wrap gap-3.5">
      {participants.map((p) => {
        const person = userMap[p.userId];
        if (!person) return null;
        const status = checkInStatus(p.lastLoggedAt);
        const style = STATUS_STYLE[status];
        return (
          <div key={p.userId} className="flex flex-col items-center gap-1" title={style.label}>
            <div className="relative">
              <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={size} />
              <span
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-ink-950",
                  style.badge
                )}
              >
                {status === "checked-in" && <IconCheck className="h-3 w-3" />}
                {status === "missed" && <IconX className="h-3 w-3" />}
                {(status === "pending" || status === "not-started") && (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
            </div>
            <span className="max-w-[54px] truncate text-[10px] text-chalk-500">{person.name.split(" ")[0]}</span>
          </div>
        );
      })}
    </div>
  );
}
