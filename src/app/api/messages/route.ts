import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeMessage } from "@/lib/serialize";

const bodySchema = z.object({
  otherUserId: z.string().min(1),
  text: z.string().trim().min(1).max(2000),
});

export async function POST(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid message." }, { status: 400 });

  const message = await db.message.create({
    data: {
      threadId: parsed.data.otherUserId,
      senderId: me.id,
      recipientId: parsed.data.otherUserId,
      text: parsed.data.text,
      createdAt: new Date(),
    },
  });

  return NextResponse.json({ message: serializeMessage(message) });
}
