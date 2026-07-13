import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeGoal, serializeMe, serializePost } from "@/lib/serialize";
import { pointsForPlacement } from "@/lib/goal-utils";
import type { GoalMode } from "@/lib/types";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const goal = await db.goal.findUnique({ where: { id }, include: { participants: true } });
  if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
  if (goal.settledAt) return NextResponse.json({ goal: serializeGoal(goal) });

  const ranked = [...goal.participants].sort((a, b) => b.progress - a.progress);
  const winner = ranked[0];
  const winnerPoints = pointsForPlacement(goal.mode as GoalMode, 1);
  const now = new Date();

  const userUpdates = ranked.map((p, idx) => {
    const award = pointsForPlacement(goal.mode as GoalMode, idx + 1);
    return db.user.update({ where: { id: p.userId }, data: award > 0 ? { points: { increment: award } } : {} });
  });

  const [updatedGoal, ...updatedUsers] = await db.$transaction([
    db.goal.update({
      where: { id: goal.id },
      data: { status: "completed", settledAt: now, winnerId: winner.userId },
      include: { participants: true },
    }),
    ...userUpdates,
  ]);

  const post = await db.post.create({
    data: {
      userId: winner.userId,
      goalId: goal.id,
      type: "competition-result",
      headline: `Won ${goal.title}`,
      body: goal.stake
        ? `Took the top spot — ${goal.stake}. Earned ${winnerPoints} points.`
        : `Took the top spot and earned ${winnerPoints} points.`,
      statValue: `+${winnerPoints}`,
      statLabel: "points",
      createdAt: now,
    },
    include: { reactions: true, comments: true },
  });

  const myUpdatedUser = updatedUsers.find((u) => u.id === me.id);

  return NextResponse.json({
    goal: serializeGoal(updatedGoal),
    post: serializePost(post),
    user: myUpdatedUser ? serializeMe(myUpdatedUser) : undefined,
  });
}
