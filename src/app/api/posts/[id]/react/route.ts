import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializePost } from "@/lib/serialize";

const bodySchema = z.object({ emoji: z.string().min(1).max(8) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });

  const post = await db.post.findUnique({ where: { id }, include: { reactions: true } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  const existing = post.reactions.find((r) => r.emoji === parsed.data.emoji && r.userId === me.id);
  if (existing) {
    await db.reactionEntry.delete({ where: { id: existing.id } });
  } else {
    await db.reactionEntry.create({ data: { postId: id, emoji: parsed.data.emoji, userId: me.id } });
  }

  const updated = await db.post.findUniqueOrThrow({ where: { id }, include: { reactions: true, comments: true } });
  return NextResponse.json({ post: serializePost(updated) });
}
