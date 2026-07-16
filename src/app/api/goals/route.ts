import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeActivity, serializeGoal } from "@/lib/serialize";
import { metricNeedsBaseline } from "@/lib/metric-presets";
import { GRADIENTS } from "@/lib/goal-utils";

const bodySchema = z.object({
  title: z.string().trim().min(1).max(120),
  category: z.string().min(1).max(40),
  mode: z.enum(["goal", "challenge", "duel", "quest"]),
  description: z.string().max(500),
  target: z.string().min(1).max(60),
  unit: z.string().min(1).max(40),
  durationDays: z.number().int().positive().max(3650),
  inviteeIds: z.array(z.string()).max(50),
  stake: z.string().max(200).optional(),
  stakeAmount: z.number().nonnegative().optional(),
  metric: z.object({
    type: z.enum(["increase", "decrease", "cumulative", "binary"]),
    targetValue: z.number(),
  }),
  startingValue: z.number().optional(),
});

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid goal details." }, { status: 400 });
  const p = parsed.data;

  const now = new Date();
  const end = new Date(now.getTime() + p.durationDays * 86400 * 1000);
  const needsBaseline = metricNeedsBaseline(p.metric.type);

  const goal = await db.goal.create({
    data: {
      title: p.title,
      category: p.category,
      mode: p.mode,
      description: p.description,
      target: p.target,
      unit: p.unit,
      durationDays: p.durationDays,
      startDate: now,
      endDate: end,
      status: "active",
      progress: 0,
      streak: 0,
      coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
      stake: p.stake || undefined,
      stakeAmount: p.stakeAmount && p.stakeAmount > 0 ? p.stakeAmount : undefined,
      metricType: p.metric.type,
      metricTargetValue: p.metric.targetValue,
      participants: {
        create: [
          {
            userId: me.id,
            progress: 0,
            joinedAt: now,
            isOwner: true,
            ...(needsBaseline ? { startValue: p.startingValue ?? 0, currentValue: p.startingValue ?? 0 } : {}),
          },
          ...p.inviteeIds.map((id) => ({ userId: id, progress: 0, joinedAt: now, isOwner: false })),
        ],
      },
    },
    include: { participants: true },
  });

  const activity = await db.activityHistoryItem.create({
    data: {
      userId: me.id,
      label: `Created ${p.title}`,
      detail: p.inviteeIds.length ? `Rallied ${p.inviteeIds.length} to join` : "Solo goal started",
      createdAt: now,
    },
  });

  if (p.inviteeIds.length) {
    await db.notification.createMany({
      data: p.inviteeIds.map((inviteeId) => ({
        userId: inviteeId,
        type: "rally-invite",
        actorId: me.id,
        message: `${me.name} invited you to join "${p.title}".`,
        createdAt: now,
      })),
    });
  }

  return NextResponse.json({ goal: serializeGoal(goal), activity: serializeActivity(activity) });
}
