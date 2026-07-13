import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeActivity, serializeGoal, serializeMe } from "@/lib/serialize";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (me.freezes <= 0) return NextResponse.json({ error: "No streak freezes available." }, { status: 400 });
  const { id } = await params;

  const goal = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  const participant = goal.participants.find((p) => p.userId === me.id);
  if (!participant) return NextResponse.json({ error: "Not a participant." }, { status: 403 });

  const now = new Date();
  if (participant.lastLoggedAt && participant.lastLoggedAt.toDateString() === now.toDateString()) {
    return NextResponse.json({ goal: serializeGoal(goal), user: serializeMe(me) });
  }

  const [, activity, updatedUser] = await db.$transaction([
    db.goalParticipant.update({
      where: { goalId_userId: { goalId: goal.id, userId: me.id } },
      data: { lastLoggedAt: now },
    }),
    db.activityHistoryItem.create({
      data: { userId: me.id, label: "Used a streak freeze", detail: goal.title, createdAt: now },
    }),
    db.user.update({ where: { id: me.id }, data: { freezes: { decrement: 1 } } }),
  ]);

  const updatedGoal = await db.goal.findUniqueOrThrow({ where: { id: goal.id }, include: { participants: true } });

  return NextResponse.json({
    goal: serializeGoal(updatedGoal),
    activity: serializeActivity(activity),
    user: serializeMe(updatedUser),
  });
}
