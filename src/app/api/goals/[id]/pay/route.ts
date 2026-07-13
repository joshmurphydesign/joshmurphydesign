import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeGoal } from "@/lib/serialize";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goal = await db.goal.findUnique({ where: { id } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });

  const paid = JSON.parse(goal.paidByUserIds) as string[];
  const nextPaid = paid.includes(me.id) ? paid.filter((userId) => userId !== me.id) : [...paid, me.id];

  const updated = await db.goal.update({
    where: { id: goal.id },
    data: { paidByUserIds: JSON.stringify(nextPaid) },
    include: { participants: true },
  });

  return NextResponse.json({ goal: serializeGoal(updated) });
}
