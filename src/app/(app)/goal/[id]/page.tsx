"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { pointsForPlacement } from "@/lib/goal-utils";
import { isStepsGoal, metricIsCumulative, metricIsEntryBased, metricNeedsBaseline, metricNeedsNumericLog } from "@/lib/metric-presets";
import { computeStakePayout, PAYMENT_PROVIDERS, PAYMENT_PROVIDER_META, paymentLink } from "@/lib/payments";
import { useUserMap } from "@/lib/people";
import { checkInStatus } from "@/lib/streak-status";
import { shareText } from "@/lib/share";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StreakBadge } from "@/components/ui/StreakBadge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { GroupRoster } from "@/components/goal/GroupRoster";
import { IconCamera, IconCheck, IconChevronRight, IconShare, IconUserPlus, IconX } from "@/components/ui/Icons";
import { FeedPostCard } from "@/components/feed/FeedPostCard";
import { categoryEmoji, cn, daysUntil, isToday, modeLabel, resizeImageFile, timeAgo } from "@/lib/utils";

function formatValue(n: number): string {
  return n.toLocaleString();
}

const MODE_TONE: Record<string, "blue" | "rival" | "volt" | "gold"> = {
  goal: "blue",
  challenge: "gold",
  duel: "rival",
  quest: "volt",
};

export default function GoalDetailPage() {
  const params = useParams<{ id: string }>();
  const { user } = useAuth();
  const { goals, posts, health, otherUsers, joinGoal, inviteToGoal, logProgress, spendStreakFreeze, settleGoal, markStakePaid, toggleReaction } = useData();
  const userMap = useUserMap();

  const goal = goals.find((g) => g.id === params.id);
  const [daysLeft] = useState(() => daysUntil(goal?.endDate ?? new Date().toISOString()));
  const [logValue, setLogValue] = useState("");
  const [joinStartValue, setJoinStartValue] = useState("");
  const [logModalOpen, setLogModalOpen] = useState(false);
  const [proofPhoto, setProofPhoto] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [selectedInviteeIds, setSelectedInviteeIds] = useState<string[]>([]);
  const [inviting, setInviting] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");

  if (!goal) {
    return (
      <div className="flex flex-col gap-4">
        <TopBar title="Goal" onBack />
        <p className="px-5 text-sm text-chalk-500">This goal doesn&apos;t exist anymore.</p>
      </div>
    );
  }

  const me = goal.participants.find((p) => p.userId === "me");
  const iAmIn = !!me;
  const iAmOwner = !!me?.isOwner;
  const loggedToday = isToday(me?.lastLoggedAt);
  const isEntryBased = metricIsEntryBased(goal.metric.type);
  const myStatus = checkInStatus(me?.lastLoggedAt);
  const chainBroken = !isEntryBased && iAmIn && myStatus === "missed";
  const streakAtRisk = !isEntryBased && iAmIn && myStatus === "pending" && goal.streak > 0;
  const isGroupCommitment = goal.participants.length > 1;
  const notInvited = otherUsers.filter((u) => !goal.participants.some((p) => p.userId === u.id));
  const sortedParticipants = [...goal.participants].sort((a, b) => b.progress - a.progress);
  const relatedPosts = posts
    .filter((p) => p.goalId === goal.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const winner = goal.winnerId ? userMap[goal.winnerId] : undefined;
  const isCompetitive = goal.mode === "challenge" || goal.mode === "duel";
  const winnerPoints = pointsForPlacement(goal.mode, 1);

  const payout = computeStakePayout(goal);
  const iAmWinner = !!payout && payout.winnerId === "me";
  const iOwe = !!payout && !iAmWinner && payout.payerIds.includes("me");
  const iHavePaid = goal.paidByUserIds?.includes("me") ?? false;
  const winnerPaymentHandles = payout ? userMap[payout.winnerId]?.paymentHandles ?? [] : [];

  const metric = goal.metric;
  const needsNumericLog = metricNeedsNumericLog(metric.type);
  const needsBaseline = metricNeedsBaseline(metric.type);
  // Cumulative goals (steps, reps, distance...) are naturally multi-session, and
  // entry-based goals (a score, a lift, a time) are attempts logged whenever they
  // happen — neither is locked to one log per day the way a daily check-in is.
  const isCumulative = metricIsCumulative(metric.type);
  const canLogMore = isCumulative || isEntryBased || !loggedToday;
  const stepsGoal = isStepsGoal(goal);
  const healthProviderLabel = health?.provider === "apple" ? "Apple Health" : health?.provider === "samsung" ? "Samsung Health" : undefined;
  const healthProviderEmoji = health?.provider === "apple" ? "\u{1F34E}" : "\u{231A}";
  // When Health is already auto-syncing this goal, a big primary log button
  // competes with the sync banner for the same number — a quiet text link reads
  // as the secondary path instead.
  const autoSynced = stepsGoal && !!health;

  const openLog = () => {
    if (!canLogMore) return;
    setLogValue("");
    setProofPhoto(null);
    setPhotoError(null);
    setLogModalOpen(true);
  };

  const handlePhotoChange = async (file: File | undefined) => {
    if (!file) return;
    setPhotoError(null);
    try {
      const dataUrl = await resizeImageFile(file);
      setProofPhoto(dataUrl);
    } catch {
      setPhotoError("Couldn't read that photo. Try another one.");
    }
  };

  const submitLog = async () => {
    if (needsNumericLog) {
      const num = Number(logValue);
      if (logValue.trim() === "" || Number.isNaN(num)) return;
      setCheckingIn(true);
      await logProgress(goal.id, num, "manual", proofPhoto ?? undefined);
    } else {
      setCheckingIn(true);
      await logProgress(goal.id, undefined, "manual", proofPhoto ?? undefined);
    }
    setCheckingIn(false);
    setLogValue("");
    setProofPhoto(null);
    setLogModalOpen(false);
  };

  const confirmCheckIn = async (postId: string) => {
    setConfirming(postId);
    await toggleReaction(postId, "\u{2705}");
    setConfirming(null);
  };

  const toggleInvitee = (id: string) => {
    setSelectedInviteeIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const submitInvite = async () => {
    if (selectedInviteeIds.length === 0) return;
    setInviting(true);
    await inviteToGoal(goal.id, selectedInviteeIds);
    setInviting(false);
    setSelectedInviteeIds([]);
    setInviteSheetOpen(false);
  };

  const share = async () => {
    const result = await shareText(
      goal.title,
      goal.streak > 0
        ? `I'm on a ${goal.streak}-day streak on "${goal.title}" — join me on Ascend.`
        : `I'm committing to "${goal.title}" on Ascend — join me.`
    );
    if (result === "copied") {
      setShareState("copied");
      setTimeout(() => setShareState("idle"), 1800);
    }
  };

  const submitJoin = () => {
    if (!needsBaseline) {
      joinGoal(goal.id);
      return;
    }
    const num = Number(joinStartValue);
    if (joinStartValue.trim() === "" || Number.isNaN(num)) return;
    joinGoal(goal.id, num);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar
        title={modeLabel(goal.mode)}
        onBack
        transparent
        right={
          iAmIn ? (
            <div className="flex items-center gap-2">
              {iAmOwner && isGroupCommitment && (
                <button
                  onClick={() => setInviteSheetOpen(true)}
                  aria-label="Invite people"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-chalk-100"
                >
                  <IconUserPlus className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={share}
                aria-label="Share"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/6 text-chalk-100"
              >
                {shareState === "copied" ? <IconCheck className="h-4 w-4 text-volt-400" /> : <IconShare className="h-4 w-4" />}
              </button>
            </div>
          ) : null
        }
      />

      <div className="px-5">
        <div
          className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
          style={{ background: goal.coverGradient }}
        >
          <div className="noise-overlay absolute inset-0" />
          <div className="relative flex items-center justify-between">
            <Pill tone={MODE_TONE[goal.mode] ?? "neutral"} className="bg-black/25 !border-white/20 !text-white">
              {modeLabel(goal.mode)}
            </Pill>
            <span className="text-3xl">{categoryEmoji(goal.category)}</span>
          </div>
          <h1 className="relative mt-5 font-display text-2xl leading-tight text-white">{goal.title}</h1>
          <p className="relative mt-2 text-sm text-white/80">{goal.description}</p>
        </div>
      </div>

      {chainBroken && (
        <div className="px-5">
          <div className="flex items-center gap-3 rounded-2xl border border-rival-500/30 bg-rival-500/10 px-4 py-3.5">
            <span className="text-lg">{"\u{26D3}\u{FE0F}"}</span>
            <p className="flex-1 text-xs font-medium leading-snug text-chalk-100">
              You missed a day — the chain broke. Check in today to start a new streak.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3 px-5">
        <MiniStat label="Target" value={goal.target} sub={goal.unit} />
        <MiniStat label="Days left" value={String(daysLeft)} sub={`of ${goal.durationDays}`} />
        {isEntryBased ? (
          <MiniStat label="Last entry" value={me?.lastLoggedAt ? timeAgo(me.lastLoggedAt) : "—"} sub={me?.lastLoggedAt ? "" : "not yet"} />
        ) : (
          <MiniStat label="Streak" value={String(goal.streak)} sub="days" />
        )}
      </div>

      {isGroupCommitment && !isEntryBased && (
        <div className="px-5">
          <div className="card-surface rounded-[var(--radius-card)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Your group today</p>
            <div className="mt-3">
              <GroupRoster participants={goal.participants} />
            </div>
          </div>
        </div>
      )}

      {isCompetitive && (
        <div className="px-5">
          <div className="card-surface-raised flex items-center justify-between gap-3 rounded-2xl p-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">What&apos;s on the line</p>
              <p className="mt-0.5 font-bold text-chalk-100">
                {goal.stake || "Bragging rights"}
                {goal.stakeAmount ? ` · $${goal.stakeAmount}/person` : ""}
              </p>
              <p className="mt-1 text-xs text-chalk-500">
                Winner earns {winnerPoints} pts automatically.
                {goal.stakeAmount ? " Cash stake is paid peer-to-peer, not through Ascend." : ""}
              </p>
            </div>
            {goal.settledAt ? (
              <Pill tone="gold">{winner ? `${winner.name.split(" ")[0]} won` : "Settled"}</Pill>
            ) : iAmOwner ? (
              <Button onClick={() => settleGoal(goal.id)} variant="outline" size="sm">
                End & settle
              </Button>
            ) : null}
          </div>
        </div>
      )}

      {payout && (iAmWinner || iOwe) && (
        <div className="px-5">
          <div className="card-surface rounded-[var(--radius-card)] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">Payout</p>
            {iAmWinner ? (
              <>
                <p className="mt-0.5 font-display text-xl text-chalk-100">
                  You&apos;re owed ${payout.totalCollected}
                </p>
                <p className="mt-1 text-xs text-chalk-500">
                  ${payout.amountPerPerson} from each of {payout.payerIds.length}{" "}
                  {payout.payerIds.length === 1 ? "person" : "people"} — self-reported once they mark it paid.
                </p>
                <div className="mt-3 flex flex-col gap-2">
                  {payout.payerIds.map((payerId) => {
                    const payer = userMap[payerId];
                    if (!payer) return null;
                    const hasPaid = goal.paidByUserIds?.includes(payerId) ?? false;
                    return (
                      <div key={payerId} className="flex items-center gap-2.5 rounded-2xl bg-white/5 px-3.5 py-2.5">
                        <Avatar initials={payer.avatarInitials} gradient={payer.avatarColor} size={28} />
                        <span className="flex-1 text-sm font-semibold text-chalk-100">{payer.name}</span>
                        <Pill tone={hasPaid ? "volt" : "neutral"}>{hasPaid ? "Paid" : "Owes"}</Pill>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <p className="mt-0.5 font-display text-xl text-chalk-100">
                  You owe {winner?.name ?? "the winner"} ${payout.amountPerPerson}
                </p>
                <p className="mt-1 text-xs text-chalk-500">
                  Ascend can&apos;t verify payments — tap a button below to open the app and pay directly, then
                  mark it paid yourself.
                </p>
                {winnerPaymentHandles.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {PAYMENT_PROVIDERS.filter((p) => winnerPaymentHandles.some((h) => h.provider === p)).map(
                      (provider) => {
                        const handle = winnerPaymentHandles.find((h) => h.provider === provider)!.handle;
                        const meta = PAYMENT_PROVIDER_META[provider];
                        return (
                          <a
                            key={provider}
                            href={paymentLink(provider, handle, payout.amountPerPerson, `${goal.title} on Ascend`)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-pill border border-white/15 px-3.5 py-2 text-xs font-semibold text-chalk-100"
                          >
                            {meta.emoji} Pay via {meta.label}
                          </a>
                        );
                      }
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-chalk-700">
                    {winner?.name ?? "The winner"} hasn&apos;t linked a payment method yet.
                  </p>
                )}
                <Button
                  onClick={() => markStakePaid(goal.id)}
                  variant={iHavePaid ? "ghost" : "volt"}
                  size="sm"
                  className="mt-3 w-full"
                >
                  {iHavePaid ? (
                    <>
                      <IconCheck className="h-4 w-4" /> Marked as paid
                    </>
                  ) : (
                    "Mark as paid"
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-5">
        <div className="card-surface rounded-[var(--radius-card)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-chalk-500">Overall progress</span>
            <span className="font-bold text-chalk-100">{goal.progress}%</span>
          </div>
          <ProgressBar value={goal.progress} className="mt-2" height={10} />

          {iAmIn && stepsGoal && (
            <Link
              href="/profile/health"
              className="mt-4 flex items-center gap-2.5 rounded-2xl bg-white/5 px-3.5 py-3"
            >
              <span className="text-base">{health ? healthProviderEmoji : "\u{1F45F}"}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-chalk-100">
                  {health ? `Synced from ${healthProviderLabel}` : "Connect to auto-log your steps"}
                </p>
                <p className="text-[11px] text-chalk-500">
                  {health
                    ? health.lastSyncedAt
                      ? `Last synced ${timeAgo(health.lastSyncedAt)}`
                      : "Not yet synced"
                    : "Apple Health or Samsung Health"}
                </p>
              </div>
              <IconChevronRight className="h-4 w-4 shrink-0 text-chalk-700" />
            </Link>
          )}

          {iAmIn ? (
            <div className="mt-4 flex flex-col gap-2">
              {me && needsNumericLog && (
                <p className="text-xs text-chalk-500">
                  {metric.type === "cumulative"
                    ? `${formatValue(me.currentValue ?? 0)} / ${formatValue(metric.targetValue)} ${goal.unit} logged`
                    : isEntryBased
                      ? `Personal best: ${formatValue(me.currentValue ?? me.startValue ?? 0)} ${goal.unit} · started at ${formatValue(me.startValue ?? 0)} ${goal.unit}`
                      : `Currently ${formatValue(me.currentValue ?? me.startValue ?? 0)} ${goal.unit} · started at ${formatValue(me.startValue ?? 0)} ${goal.unit}`}
                </p>
              )}
              {autoSynced ? (
                <button type="button" onClick={openLog} className="self-start text-xs font-semibold text-sky-500">
                  + Log extra steps manually
                </button>
              ) : (
                <Button
                  onClick={openLog}
                  disabled={!canLogMore}
                  variant={!canLogMore ? "ghost" : "volt"}
                  size="md"
                  className="w-full"
                >
                  {!canLogMore ? (
                    <>
                      <IconCheck className="h-4 w-4" /> Checked in today
                    </>
                  ) : isEntryBased ? (
                    "Log an entry"
                  ) : isCumulative && loggedToday ? (
                    "Add more today"
                  ) : chainBroken ? (
                    "Check in — restart the streak"
                  ) : (
                    "Check in"
                  )}
                </Button>
              )}
              {streakAtRisk && (
                <button
                  onClick={() => spendStreakFreeze(goal.id)}
                  disabled={(user?.freezes ?? 0) <= 0}
                  className="text-xs font-semibold text-sky-500 disabled:text-chalk-700"
                >
                  {"\u{2744}\u{FE0F}"} Streak at risk — use a freeze ({user?.freezes ?? 0} left)
                </button>
              )}
              <Link
                href={`/pulse/new?goalId=${goal.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-pill border border-white/15 px-5 py-3 text-sm font-semibold text-chalk-100 transition-transform active:scale-[0.97]"
              >
                <IconCamera className="h-4 w-4" /> Share a highlight
              </Link>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {needsBaseline && (
                <input
                  type="number"
                  inputMode="decimal"
                  value={joinStartValue}
                  onChange={(e) => setJoinStartValue(e.target.value)}
                  placeholder={`Your starting ${goal.unit}`}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                />
              )}
              <Button
                onClick={submitJoin}
                disabled={needsBaseline && joinStartValue.trim() === ""}
                variant="volt"
                size="md"
                className="w-full"
              >
                Join this {modeLabel(goal.mode).toLowerCase()}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5">
        <h2 className="font-display text-lg tracking-wide text-chalk-100">
          Your group <span className="text-chalk-500">({goal.participants.length})</span>
        </h2>
        <div className="flex flex-col gap-2">
          {sortedParticipants.map((p) => {
            const person = userMap[p.userId];
            if (!person) return null;
            return (
              <div key={p.userId} className="card-surface flex items-center gap-3 rounded-2xl p-3">
                <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={36} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-sm font-bold text-chalk-100">
                      {person.name} {p.isOwner && <span className="text-chalk-500">· owner</span>}
                    </p>
                    <span className="text-xs font-bold text-chalk-300">{p.progress}%</span>
                  </div>
                  {needsNumericLog && p.currentValue !== undefined && (
                    <p className="mt-0.5 text-[11px] text-chalk-500">
                      {formatValue(p.currentValue)} {goal.unit}
                    </p>
                  )}
                  <ProgressBar value={p.progress} height={5} className="mt-1.5" />
                </div>
              </div>
            );
          })}
        </div>
        {iAmIn && !isEntryBased && <StreakBadge days={goal.streak} className="self-start" />}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="px-5 font-display text-lg tracking-wide text-chalk-100">Check-ins</h2>
        <div className="flex flex-col gap-2 px-5">
          {relatedPosts.length > 0 ? (
            relatedPosts.map((post) => {
              const canConfirm = isGroupCommitment && post.userId !== "me";
              const confirmCount = post.reactions.find((r) => r.emoji === "\u{2705}")?.userIds.length ?? 0;
              const iConfirmed = post.reactions.some((r) => r.emoji === "\u{2705}" && r.userIds.includes("me"));
              return (
                <div key={post.id} className="flex flex-col gap-2">
                  <FeedPostCard post={post} />
                  {(post.imageUrl || confirmCount > 0) && (
                    <div className="flex flex-wrap items-center gap-1.5 px-1">
                      {post.imageUrl && (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-white/6 px-2.5 py-1 text-[11px] font-semibold text-chalk-500">
                          {"\u{1F4F8}"} Proof attached
                        </span>
                      )}
                      {confirmCount > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-pill bg-volt-500/10 px-2.5 py-1 text-[11px] font-semibold text-volt-400">
                          {"\u{2705}"} Confirmed by {confirmCount}
                        </span>
                      )}
                    </div>
                  )}
                  {canConfirm && (
                    <button
                      onClick={() => confirmCheckIn(post.id)}
                      disabled={confirming === post.id}
                      className={cn(
                        "self-start rounded-pill border px-3.5 py-1.5 text-xs font-semibold transition-colors",
                        iConfirmed
                          ? "border-volt-500/40 bg-volt-500/10 text-volt-400"
                          : "border-white/10 bg-white/5 text-chalk-300"
                      )}
                    >
                      {"\u{2705}"} {iConfirmed ? "Confirmed" : "Confirm this check-in"}
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-sm text-chalk-500">No check-ins yet. Be the first to show up.</p>
          )}
        </div>
      </div>

      {logModalOpen && (
        <BottomSheet onClose={() => setLogModalOpen(false)}>
          <p className="text-center font-display text-lg text-chalk-100">
            {needsNumericLog ? "Log an entry" : "Check in"}
          </p>
          <p className="mt-1 text-center text-sm text-chalk-500">{goal.title}</p>
          {needsNumericLog && (
            <label className="mt-5 flex flex-col gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
                {isCumulative ? `${goal.unit} logged` : isEntryBased ? `New ${goal.unit} attempt` : `Today's ${goal.unit}`}
              </span>
              <input
                autoFocus
                type="number"
                inputMode="decimal"
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitLog()}
                placeholder="0"
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
              />
            </label>
          )}
          <div className="mt-5 flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
              Proof <span className="text-chalk-700">(optional)</span>
            </span>
            {proofPhoto ? (
              <div className="relative overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={proofPhoto} alt="Check-in proof" className="aspect-video w-full object-cover" />
                <button
                  onClick={() => setProofPhoto(null)}
                  aria-label="Remove photo"
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-ink-950/70 text-white"
                >
                  <IconX className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 py-4 text-xs font-semibold text-chalk-500">
                <IconCamera className="h-4 w-4" /> Attach a photo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0])}
                />
              </label>
            )}
            {photoError && <p className="text-xs text-rival-500">{photoError}</p>}
            <p className="text-xs text-chalk-700">A photo makes it real for your group — but it&apos;s never required.</p>
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <Button
              onClick={submitLog}
              disabled={checkingIn || (needsNumericLog && logValue.trim() === "")}
              variant="volt"
              size="md"
              className="w-full"
            >
              {checkingIn ? "Checking in…" : needsNumericLog ? "Log entry" : "Check in"}
            </Button>
            <Button onClick={() => setLogModalOpen(false)} variant="ghost" size="md" className="w-full">
              Cancel
            </Button>
          </div>
        </BottomSheet>
      )}

      {inviteSheetOpen && (
        <BottomSheet onClose={() => setInviteSheetOpen(false)}>
          <p className="text-center font-display text-lg text-chalk-100">Invite people</p>
          <p className="mt-1 text-center text-sm text-chalk-500">{goal.title}</p>
          <div className="mt-5 flex max-h-72 flex-col gap-2 overflow-y-auto">
            {notInvited.length > 0 ? (
              notInvited.map((u) => {
                const selected = selectedInviteeIds.includes(u.id);
                return (
                  <button
                    key={u.id}
                    onClick={() => toggleInvitee(u.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                      selected ? "border-volt-500/40 bg-volt-500/10" : "border-white/8 bg-white/5"
                    )}
                  >
                    <Avatar initials={u.avatarInitials} gradient={u.avatarColor} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-chalk-100">{u.name}</p>
                      <p className="text-xs text-chalk-500">@{u.handle}</p>
                    </div>
                    <div
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full border",
                        selected ? "border-volt-500 bg-volt-500 text-ink-950" : "border-white/20"
                      )}
                    >
                      {selected && "✓"}
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="py-6 text-center text-sm text-chalk-500">Everyone&apos;s already in.</p>
            )}
          </div>
          <div className="mt-5 flex flex-col gap-2.5">
            <Button onClick={submitInvite} disabled={inviting || selectedInviteeIds.length === 0} variant="volt" size="md" className="w-full">
              {inviting ? "Inviting…" : selectedInviteeIds.length > 0 ? `Invite ${selectedInviteeIds.length}` : "Invite"}
            </Button>
            <Button onClick={() => setInviteSheetOpen(false)} variant="ghost" size="md" className="w-full">
              Cancel
            </Button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card-surface flex flex-col items-center gap-0.5 rounded-2xl py-3.5 text-center">
      <p className="font-display text-lg leading-none text-chalk-100">{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
      <p className="text-[10px] text-chalk-700">{sub}</p>
    </div>
  );
}
