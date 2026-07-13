import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/session";
import { serializeMe } from "@/lib/serialize";

export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user: user ? serializeMe(user) : null });
}
