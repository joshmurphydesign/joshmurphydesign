import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { serializeMe } from "@/lib/serialize";

const bodySchema = z.object({
  email: z.string().trim().email().max(200),
  password: z.string().min(1).max(200),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login details." }, { status: 400 });
  }
  const email = parsed.data.email.toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  const valid = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
  if (!user || !valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user: serializeMe(user) });
}
