"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { CountdownTimer } from "@/components/ui/CountdownTimer";
import { AvatarStack } from "@/components/ui/AvatarStack";
import { LeaderboardRow } from "@/components/compete/LeaderboardRow";
import { IconBolt, IconCheck } from "@/components/ui/Icons";
import { categoryEmoji, isFuture } from "@/lib/utils";

export default function PowerPlayDetailPage() {
  const params = useParams<{ id: string }>();
  const { powerPlays, joinPowerPlay } = useData();
  const powerPlay = powerPlays.find((p) => p.id === params.id);
  const [wasUpcoming] = useState(() => !!powerPlay && !powerPlay.isLive && isFuture(powerPlay.startsAt));

  if (!powerPlay) {
    return (
      <div className="flex flex-col gap-4">
        <TopBar title="Power Play" onBack />
        <p className="px-5 text-sm text-chalk-500">This event has wrapped up and moved on.</p>
      </div>
    );
  }

  const iAmIn = powerPlay.participantIds.includes("me");
  const upcoming = !powerPlay.isLive && wasUpcoming;
  const ended = !powerPlay.isLive && !upcoming;

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title="Power Play" onBack transparent />

      <div className="px-5">
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
          style={{ background: powerPlay.coverGradient }}
        >
          <div className="noise-overlay absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <Pill tone={powerPlay.isLive ? "live" : "neutral"} className={powerPlay.isLive ? "animate-pulse-ring bg-black/20 !text-white" : "bg-black/25 !border-white/20 !text-white"}>
              <IconBolt className="h-3 w-3" />
              {powerPlay.isLive ? "Live now" : upcoming ? "Upcoming" : "Ended"}
            </Pill>
            <span className="text-3xl">{categoryEmoji(powerPlay.category)}</span>
          </div>
          <h1 className="relative mt-5 font-display text-2xl leading-tight text-white">{powerPlay.title}</h1>
          <p className="relative mt-2 text-sm text-white/80">{powerPlay.tagline}</p>

          <div className="relative mt-5 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-white/60">
                {ended ? "Ended" : upcoming ? "Starts in" : "Time remaining"}
              </p>
              <CountdownTimer endsAt={upcoming ? powerPlay.startsAt : powerPlay.endsAt} />
            </div>
            <AvatarStack userIds={powerPlay.participantIds} max={4} size={30} />
          </div>
        </div>
      </div>

      {!ended && (
        <div className="px-5">
          {iAmIn ? (
            <div className="flex items-center justify-center gap-2 rounded-pill bg-volt-500/15 py-3.5 text-sm font-bold text-volt-400">
              <IconCheck className="h-4 w-4" />
              You&apos;re in this Power Play
            </div>
          ) : (
            <Button onClick={() => joinPowerPlay(powerPlay.id)} variant="volt" size="lg" className="w-full">
              Join the Power Play
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2.5 px-5">
        <h2 className="font-display text-lg tracking-wide text-chalk-100">Rules</h2>
        <div className="card-surface flex flex-col gap-2.5 rounded-[var(--radius-card)] p-4">
          {powerPlay.rules.map((rule, i) => (
            <div key={i} className="flex gap-2.5 text-sm text-chalk-300">
              <span className="font-display text-ascend-gradient">{i + 1}</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Leaderboard</h2>
        <div className="flex flex-col gap-2 px-5">
          {powerPlay.leaderboard
            .slice()
            .sort((a, b) => a.rank - b.rank)
            .map((entry) => (
              <LeaderboardRow key={entry.userId} entry={entry} />
            ))}
        </div>
      </div>
    </div>
  );
}
