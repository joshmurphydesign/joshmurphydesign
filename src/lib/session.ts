import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { db } from "./db";
import type { User as DbUser } from "@prisma/client";

const SESSION_COOKIE = "ascend_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createSession(userId: string): Promise<void> {
  const session = await db.session.create({
    data: { id: randomUUID(), userId, expiresAt: new Date(Date.now() + SESSION_TTL_MS) },
  });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: session.expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (sessionId) {
    await db.session.deleteMany({ where: { id: sessionId } });
  }
  jar.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<DbUser | null> {
  const jar = await cookies();
  const sessionId = jar.get(SESSION_COOKIE)?.value;
  if (!sessionId) return null;
  const session = await db.session.findUnique({ where: { id: sessionId }, include: { user: true } });
  if (!session || session.expiresAt.getTime() < Date.now()) return null;
  return session.user;
}

export async function requireSessionUser(): Promise<DbUser> {
  const user = await getSessionUser();
  if (!user) throw new AuthError();
  return user;
}

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
  }
}
