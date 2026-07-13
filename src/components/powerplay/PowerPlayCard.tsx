import Link from "next/link";
import type { PowerPlay } from "@/lib/types";
import { Pill } from "@/components/ui/Pill";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { IconBolt } from "@/components/ui/Icons";

export function PowerPlayCard({ powerPlay }: { powerPlay: PowerPlay }) {
  return (
    <Link
      href={`/powerplay/${powerPlay.id}`}
      className="relative block shrink-0 overflow-hidden rounded-[var(--radius-card)] p-5 transition-transform active:scale-[0.98]"
      style={{ background: powerPlay.coverGradient, width: 280 }}
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="relative flex items-center justify-between">
        <Pill tone={powerPlay.isLive ? "live" : "neutral"} className={powerPlay.isLive ? "animate-pulse-ring" : ""}>
          <IconBolt className="h-3 w-3" />
          {powerPlay.isLive ? "Live now" : "Upcoming"}
        </Pill>
        <CountdownTimer endsAt={powerPlay.isLive ? powerPlay.endsAt : powerPlay.startsAt} compact className="text-white/90" />
      </div>

      <p className="relative mt-4 font-display text-xl leading-tight text-white">{powerPlay.title}</p>
      <p className="relative mt-1.5 text-xs text-white/75 line-clamp-2">{powerPlay.tagline}</p>

      <div className="relative mt-5 flex items-center justify-between">
        <AvatarStack userIds={powerPlay.participantIds} max={4} size={26} />
        <span className="text-xs font-semibold text-white/85">{powerPlay.participantIds.length} in</span>
      </div>
    </Link>
  );
}
