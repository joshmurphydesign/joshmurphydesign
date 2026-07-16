import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeActivity, serializePost } from "@/lib/serialize";
import type { PostType } from "@/lib/types";

const bodySchema = z.object({
  body: z.string().trim().min(1).max(2000),
  imageUrl: z.string().max(2_000_000).optional(),
  goalId: z.string().optional(),
  /** Post this commitment as an open invite instead of a routine update — owner-only. */
  isChallengeInvite: z.boolean().optional(),
});

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid post." }, { status: 400 });
  const { body, imageUrl, goalId, isChallengeInvite } = parsed.data;

  const goal = goalId ? await db.goal.findUnique({ where: { id: goalId }, include: { participants: true } }) : null;
  const participant = goal?.participants.find((p) => p.userId === me.id);
  const wantsInvite = isChallengeInvite && goal && participant?.isOwner;
  if (isChallengeInvite && !wantsInvite) {
    return NextResponse.json({ error: "Only the owner can post a challenge invite." }, { status: 403 });
  }

  let type: PostType = "encouragement";
  let headline = "Shared an update";
  let statValue: string | undefined;
  let statLabel: string | undefined;

  if (wantsInvite && goal) {
    type = "challenge-invite";
    headline = `Join the challenge: ${goal.title}`;
  } else if (goal && participant) {
    statValue = `${participant.progress}%`;
    statLabel = "progress";
    if (participant.progress >= 100) {
      type = "win";
      headline = `Hit the target on ${goal.title}`;
    } else if (goal.streak > 0 && goal.streak % 7 === 0) {
      type = "streak";
      headline = `${goal.streak}-day streak on ${goal.title}`;
    } else {
      type = "progress";
      headline = `Checkpoint: ${goal.title}`;
    }
  } else if (imageUrl) {
    headline = "Shared a photo";
  }

  const now = new Date();
  const [post, activity] = await db.$transaction([
    db.post.create({
      data: { userId: me.id, goalId: goal?.id, type, headline, body, statValue, statLabel, imageUrl, createdAt: now },
      include: { reactions: true, comments: true },
    }),
    db.activityHistoryItem.create({
      data: {
        userId: me.id,
        label: wantsInvite ? "Posted an open challenge invite" : imageUrl ? "Shared a photo update" : "Posted to the feed",
        detail: goal ? goal.title : body.slice(0, 48),
        createdAt: now,
      },
    }),
  ]);

  if (wantsInvite && goal && !goal.isPublic) {
    await db.goal.update({ where: { id: goal.id }, data: { isPublic: true } });
  }

  return NextResponse.json({ post: serializePost(post), activity: serializeActivity(activity) });
}
