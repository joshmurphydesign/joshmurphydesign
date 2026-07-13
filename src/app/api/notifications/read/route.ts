import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeNotification } from "@/lib/serialize";

export async function POST() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.notification.updateMany({ where: { userId: me.id, read: false }, data: { read: true } });
  const notifications = await db.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } });

  return NextResponse.json({ notifications: notifications.map(serializeNotification) });
}
