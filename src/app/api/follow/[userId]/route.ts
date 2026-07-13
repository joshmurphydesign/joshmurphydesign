import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = await params;
  if (userId === me.id) return NextResponse.json({ error: "Cannot follow yourself." }, { status: 400 });

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: userId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ isFollowing: false });
  }
  await db.follow.create({ data: { followerId: me.id, followingId: userId } });
  return NextResponse.json({ isFollowing: true });
}
