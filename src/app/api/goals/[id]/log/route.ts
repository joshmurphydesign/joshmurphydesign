import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeActivity, serializeGoal, serializeMe, serializePost } from "@/lib/serialize";
import { computeProgress, metricAllowsRepeatLogging, metricIsCumulative, metricIsEntryBased } from "@/lib/metric-presets";
import type { MetricType, PostType } from "@/lib/types";

const bodySchema = z.object({
  value: z.number().optional(),
  source: z.enum(["manual", "health"]).optional(),
  providerLabel: z.string().max(60).optional(),
  providerEmoji: z.string().max(8).optional(),
});

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}
function isYesterday(a: Date, b: Date): boolean {
  const prev = new Date(b);
  prev.setDate(prev.getDate() - 1);
  return a.toDateString() === prev.toDateString();
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const { value, providerLabel, providerEmoji } = parsed.data;
  const source = parsed.data.source ?? "manual";

  const goal = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  const participant = goal.participants.find((p) => p.userId === me.id);
  if (!participant) return NextResponse.json({ error: "Not a participant." }, { status: 403 });

  const now = new Date();
  const metricType = goal.metricType as MetricType;
  const isCumulative = metricIsCumulative(metricType);
  const isEntryBased = metricIsEntryBased(metricType);
  const alreadyLoggedToday = !!participant.lastLoggedAt && isSameDay(participant.lastLoggedAt, now);
  if (alreadyLoggedToday && !metricAllowsRepeatLogging(metricType)) {
    return NextResponse.json({ goal: serializeGoal(goal) });
  }

  let nextCurrentValue = participant.currentValue ?? undefined;
  let nextProgress: number;
  let isNewBest = false;

  if (metricType === "binary") {
    const step = Math.max(1, Math.round(100 / goal.durationDays));
    nextProgress = Math.min(100, participant.progress + step);
  } else if (isCumulative) {
    nextCurrentValue = (participant.currentValue ?? 0) + (value ?? 0);
    nextProgress = computeProgress(
      { type: metricType, targetValue: goal.metricTargetValue },
      { progress: participant.progress, startValue: participant.startValue ?? undefined, currentValue: nextCurrentValue }
    );
  } else {
    const prevBest = participant.currentValue ?? participant.startValue ?? 0;
    const attempt = value ?? prevBest;
    nextCurrentValue = metricType === "increase" ? Math.max(attempt, prevBest) : Math.min(attempt, prevBest);
    isNewBest = nextCurrentValue !== prevBest;
    nextProgress = computeProgress(
      { type: metricType, targetValue: goal.metricTargetValue },
      { progress: participant.progress, startValue: participant.startValue ?? undefined, currentValue: nextCurrentValue }
    );
  }

  const nextStreak = isEntryBased
    ? goal.streak
    : alreadyLoggedToday
      ? goal.streak
      : participant.lastLoggedAt && isYesterday(participant.lastLoggedAt, now)
        ? goal.streak + 1
        : 1;

  const milestone = !isEntryBased && !alreadyLoggedToday && nextStreak > 0 && nextStreak % 7 === 0;
  const hitTarget = nextProgress >= 100 && participant.progress < 100;
  const isHealthSync = source === "health";
  const shouldPostToFeed = !isHealthSync || !alreadyLoggedToday || hitTarget || milestone;
  const valueLabel =
    metricType === "binary" ? undefined : isCumulative ? `${nextCurrentValue} ${goal.unit} logged` : `${nextCurrentValue} ${goal.unit}`;

  const postType: PostType = hitTarget ? "win" : milestone ? "streak" : "progress";
  const headline = hitTarget
    ? `Hit the target on ${goal.title}`
    : milestone
      ? `${nextStreak}-day streak on ${goal.title}`
      : isEntryBased
        ? isNewBest
          ? `New best on ${goal.title}: ${nextCurrentValue} ${goal.unit}`
          : `Logged an attempt on ${goal.title}`
        : isHealthSync && providerLabel
          ? `${providerEmoji ?? ""} ${providerLabel} synced ${goal.title}`.trim()
          : alreadyLoggedToday
            ? `Added more to ${goal.title}`
            : `Logged progress on ${goal.title}`;
  const body = hitTarget
    ? "Target complete. Show up, stand out — mission accomplished."
    : milestone
      ? `${nextStreak} days in a row. Earned a streak freeze for staying consistent.`
      : isEntryBased
        ? isNewBest
          ? `New personal best. ${nextProgress}% of the way there.`
          : `Attempt logged — best stays ${nextCurrentValue} ${goal.unit}.`
        : valueLabel
          ? `${isHealthSync ? "Auto-synced" : alreadyLoggedToday ? "Another entry" : `Day ${nextStreak} logged`} — ${valueLabel}. ${nextProgress}% of the way there.`
          : `Day ${nextStreak} logged. ${nextProgress}% of the way there.`;

  const otherParticipants = goal.participants.filter((p) => p.userId !== me.id);
  const aggregateProgress = Math.round(
    (nextProgress + otherParticipants.reduce((sum, p) => sum + p.progress, 0)) / goal.participants.length
  );

  const [, finalGoal, activity, updatedUser] = await db.$transaction([
    db.goalParticipant.update({
      where: { goalId_userId: { goalId: goal.id, userId: me.id } },
      data: { progress: nextProgress, currentValue: nextCurrentValue, lastLoggedAt: now },
    }),
    db.goal.update({
      where: { id: goal.id },
      data: { streak: nextStreak, progress: aggregateProgress },
      include: { participants: true },
    }),
    db.activityHistoryItem.create({
      data: {
        userId: me.id,
        label: isEntryBased
          ? isNewBest
            ? "Logged a new best"
            : "Logged an attempt"
          : isHealthSync && providerLabel
            ? `Auto-synced from ${providerLabel}`
            : alreadyLoggedToday
              ? "Logged more progress"
              : "Logged progress",
        detail: isEntryBased ? `${goal.title} — ${nextCurrentValue} ${goal.unit}` : `${goal.title} — day ${nextStreak}`,
        createdAt: now,
      },
    }),
    db.user.update({ where: { id: me.id }, data: milestone ? { freezes: { increment: 1 } } : {} }),
  ]);

  const createdPost = shouldPostToFeed
    ? await db.post.create({
        data: {
          userId: me.id,
          goalId: goal.id,
          type: postType,
          headline,
          body,
          statValue: `${nextProgress}%`,
          statLabel: "progress",
          createdAt: now,
        },
        include: { reactions: true, comments: true },
      })
    : null;

  return NextResponse.json({
    goal: serializeGoal(finalGoal),
    post: createdPost ? serializePost(createdPost) : undefined,
    activity: serializeActivity(activity),
    user: serializeMe(updatedUser),
  });
}
