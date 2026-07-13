import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializePost } from "@/lib/serialize";

const bodySchema = z.object({ text: z.string().trim().min(1).max(1000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid comment." }, { status: 400 });

  const post = await db.post.findUnique({ where: { id } });
  if (!post) return NextResponse.json({ error: "Post not found." }, { status: 404 });

  await db.comment.create({ data: { postId: id, userId: me.id, text: parsed.data.text, createdAt: new Date() } });

  const updated = await db.post.findUniqueOrThrow({ where: { id }, include: { reactions: true, comments: true } });
  return NextResponse.json({ post: serializePost(updated) });
}
