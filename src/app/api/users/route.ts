import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { serializeUser } from "@/lib/serialize";

export async function GET() {
  const me = await getSessionUser();
  const users = await db.user.findMany();
  const others = me ? users.filter((u) => u.id !== me.id) : users;
  return NextResponse.json({ users: others.map(serializeUser) });
}
