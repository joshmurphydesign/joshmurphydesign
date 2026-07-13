"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { Avatar } from "@/components/ui/Avatar";
import { NotificationsButton } from "@/components/shell/NotificationsButton";
import { HeaderIconLink } from "@/components/shell/HeaderIconLink";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { GoalCard } from "@/components/goal/GoalCard";
import { PowerPlayCard } from "@/components/powerplay/PowerPlayCard";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { IconBolt, IconFlame, IconMessage, IconSearch, IconTrophy } from "@/components/ui/Icons";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Still grinding";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const { user } = useAuth();
  const { goals, powerPlays, posts, notifications, competitions, threads } = useData();

  if (!user) return null;

  const hasUnreadThreads = threads.some((t) => t.unread);

  const myGoals = goals.filter((g) => g.participants.some((p) => p.userId === "me"));
  const bestStreak = myGoals.reduce((max, g) => Math.max(max, g.streak), 0);
  const livePowerPlays = powerPlays.filter((p) => p.isLive);
  const upcomingPowerPlays = powerPlays.filter((p) => !p.isLive);
  const orderedPowerPlays = [...livePowerPlays, ...upcomingPowerPlays].slice(0, 3);
  const riskNotifications = notifications.filter((n) => n.type === "streak-risk" || n.type === "rally-invite");
  const rallyPosts = posts.filter((p) => p.userId !== "me").slice(0, 3);
  const bestRank = competitions
    .flatMap((c) => c.leaderboard.filter((e) => e.userId === "me"))
    .sort((a, b) => a.rank - b.rank)[0];

  return (
    <div className="flex flex-col gap-7 pb-4 pt-1">
      <header className="flex items-center justify-between px-5 pt-4">
        <div className="flex items-center gap-3">
          <Avatar initials={user.avatarInitials} gradient={user.avatarColor} size={46} />
          <div>
            <p className="text-xs text-chalk-500">{greeting()}</p>
            <p className="text-lg font-bold leading-tight text-chalk-100">{user.name.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <HeaderIconLink href="/discover" icon={<IconSearch className="h-5 w-5" />} label="Discover" />
          <HeaderIconLink
            href="/messages"
            icon={<IconMessage className="h-5 w-5" />}
            label="Messages"
            dot={hasUnreadThreads}
          />
          <NotificationsButton />
        </div>
      </header>

      <div className="grid grid-cols-3 gap-3 px-5">
        <StatTile icon={<IconFlame className="h-4 w-4" />} value={myGoals.length} label="Active goals" tone="blue" />
        <StatTile icon={<IconTrophy className="h-4 w-4" />} value={`#${bestRank?.rank ?? "-"}`} label="Best rank" tone="gold" />
        <StatTile icon={<span className="text-sm">{"\u{1F525}"}</span>} value={bestStreak} label="Day streak" tone="volt" />
      </div>

      {riskNotifications.length > 0 && (
        <div className="flex flex-col gap-2 px-5">
          {riskNotifications.slice(0, 1).map((n) => (
            <div
              key={n.id}
              className="flex items-center gap-3 rounded-2xl border border-rival-500/25 bg-rival-500/10 px-4 py-3"
            >
              <span className="text-lg">⏳</span>
              <p className="flex-1 text-xs font-medium leading-snug text-chalk-100">{n.message}</p>
            </div>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-3">
        <SectionHeader title="Power Plays" subtitle="Live, open events" href="/feed" />
        <div className="flex gap-3 overflow-x-auto px-5 pb-1">
          {orderedPowerPlays.map((pp) => (
            <PowerPlayCard key={pp.id} powerPlay={pp} />
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Your goals" subtitle="What you're rallying around" href="/create" hrefLabel="New +" />
        {myGoals.length > 0 ? (
          <div className="flex flex-col gap-3 px-5">
            {myGoals.map((g) => (
              <GoalCard key={g.id} goal={g} />
            ))}
          </div>
        ) : (
          <div className="mx-5 card-surface rounded-[var(--radius-card)] p-6 text-center">
            <p className="text-sm text-chalk-300">No active goals yet.</p>
            <Link href="/create" className="mt-3 inline-block text-sm font-bold text-ascend-gradient">
              Set your first goal →
            </Link>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 overflow-x-auto px-5 pb-1">
          <QuickAction href="/create" icon={<IconFlame className="h-4 w-4" />} label="New Goal" />
          <QuickAction href="/compete" icon={<IconTrophy className="h-4 w-4" />} label="Leaderboards" />
          <QuickAction href="/feed" icon={<IconBolt className="h-4 w-4" />} label="Power Plays" />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeader title="Rally activity" subtitle="Your people, right now" href="/feed" />
        <div className="flex flex-col gap-3 px-5">
          {rallyPosts.map((p) => (
            <FeedPostCard key={p.id} post={p} />
          ))}
        </div>
      </section>
    </div>
  );
}

function StatTile({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  tone: "blue" | "gold" | "volt";
}) {
  const toneText = { blue: "text-[#7dc4ef]", gold: "text-gold-500", volt: "text-volt-400" }[tone];
  return (
    <div className="card-surface flex flex-col gap-2 rounded-2xl p-3.5">
      <span className={toneText}>{icon}</span>
      <div>
        <p className="font-display text-xl leading-none text-chalk-100">{value}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 items-center gap-2 rounded-pill border border-white/8 bg-white/5 px-4 py-2.5 text-xs font-semibold text-chalk-100"
    >
      {icon}
      {label}
    </Link>
  );
}
