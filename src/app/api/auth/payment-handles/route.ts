import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeMe } from "@/lib/serialize";

const bodySchema = z.object({
  handles: z
    .array(
      z.object({
        provider: z.enum(["venmo", "paypal", "cashapp"]),
        handle: z.string().trim().min(1).max(60),
      })
    )
    .max(10),
});

export async function PATCH(request: Request) {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid payment handles." }, { status: 400 });

  const user = await db.user.update({
    where: { id: me.id },
    data: { paymentHandles: JSON.stringify(parsed.data.handles) },
  });

  return NextResponse.json({ user: serializeMe(user) });
}
