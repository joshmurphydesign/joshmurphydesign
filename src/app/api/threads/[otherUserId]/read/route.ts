import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";

export async function POST(_request: Request, { params }: { params: Promise<{ otherUserId: string }> }) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { otherUserId } = await params;

  const readAt = new Date();
  await db.threadRead.upsert({
    where: { userId_otherUserId: { userId: me.id, otherUserId } },
    update: { readAt },
    create: { userId: me.id, otherUserId, readAt },
  });

  return NextResponse.json({ otherUserId, readAt: readAt.toISOString() });
}
