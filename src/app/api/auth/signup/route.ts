import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { serializeMe } from "@/lib/serialize";
import { DEFAULT_AVATAR_COLOR, initials, slugifyHandle } from "@/lib/profile";
import type { GoalCategory } from "@/lib/types";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(200),
  password: z.string().min(4).max(200),
  focus: z.array(z.string()).max(6).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid signup details." }, { status: 400 });
  }
  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const focus = (parsed.data.focus?.length ? parsed.data.focus : ["consistency"]) as GoalCategory[];

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  let handle = slugifyHandle(name);
  if (await db.user.findUnique({ where: { handle } })) {
    handle = `${handle}${Math.floor(1000 + Math.random() * 9000)}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: {
      name,
      handle,
      email,
      passwordHash,
      avatarColor: DEFAULT_AVATAR_COLOR,
      avatarInitials: initials(name),
      focus: JSON.stringify(focus),
      bio: "New to Ascend. Ready to rally.",
      score: 0,
      streak: 0,
      followers: 0,
      following: 0,
      points: 0,
      freezes: 0,
      paymentHandles: "[]",
    },
  });

  await createSession(user.id);
  return NextResponse.json({ user: serializeMe(user) });
}
