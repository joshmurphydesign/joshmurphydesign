import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeGoal } from "@/lib/serialize";

const bodySchema = z.object({ inviteeIds: z.array(z.string()).min(1).max(50) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const goal = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  const myParticipant = goal.participants.find((p) => p.userId === me.id);
  if (!myParticipant?.isOwner) return NextResponse.json({ error: "Only the owner can invite people." }, { status: 403 });

  const existingIds = new Set(goal.participants.map((p) => p.userId));
  const newInviteeIds = [...new Set(parsed.data.inviteeIds)].filter((inviteeId) => !existingIds.has(inviteeId));

  const now = new Date();
  if (newInviteeIds.length) {
    await db.goalParticipant.createMany({
      data: newInviteeIds.map((inviteeId) => ({ goalId: goal.id, userId: inviteeId, progress: 0, joinedAt: now, isOwner: false })),
    });
    await db.notification.createMany({
      data: newInviteeIds.map((inviteeId) => ({
        userId: inviteeId,
        type: "rally-invite",
        actorId: me.id,
        message: `${me.name} invited you to join "${goal.title}".`,
        createdAt: now,
      })),
    });
  }

  const updated = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  return NextResponse.json({ goal: serializeGoal(updated!) });
}
