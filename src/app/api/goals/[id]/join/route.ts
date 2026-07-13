import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeGoal } from "@/lib/serialize";
import { metricNeedsBaseline } from "@/lib/metric-presets";
import type { MetricType } from "@/lib/types";

const bodySchema = z.object({ startValue: z.number().optional() });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const goal = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  if (!goal.participants.some((p) => p.userId === me.id)) {
    const needsBaseline = metricNeedsBaseline(goal.metricType as MetricType);
    await db.goalParticipant.create({
      data: {
        goalId: goal.id,
        userId: me.id,
        progress: 0,
        joinedAt: new Date(),
        isOwner: false,
        ...(needsBaseline
          ? { startValue: parsed.data.startValue ?? 0, currentValue: parsed.data.startValue ?? 0 }
          : {}),
      },
    });
  }

  const updated = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  return NextResponse.json({ goal: serializeGoal(updated!) });
}
