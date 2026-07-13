import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeMe } from "@/lib/serialize";
import { initials } from "@/lib/profile";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  bio: z.string().max(280),
  focus: z.array(z.string()).max(6),
  avatarColor: z.string().min(1).max(200),
});

export async function PATCH(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile details." }, { status: 400 });

  const user = await db.user.update({
    where: { id: me.id },
    data: {
      name: parsed.data.name,
      bio: parsed.data.bio,
      focus: JSON.stringify(parsed.data.focus),
      avatarColor: parsed.data.avatarColor,
      avatarInitials: initials(parsed.data.name),
    },
  });

  return NextResponse.json({ user: serializeMe(user) });
}
