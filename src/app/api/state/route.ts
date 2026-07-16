import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import {
  serializeActivity,
  serializeGoal,
  serializeMessage,
  serializeNotification,
  serializePost,
} from "@/lib/serialize";

export async function GET() {
  const me = await getSessionUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [goals, posts, notifications, activity, messages, follows, followers, threadReads] = await Promise.all([
    db.goal.findMany({ include: { participants: true }, orderBy: { createdAt: "desc" } }),
    db.post.findMany({ include: { reactions: true, comments: true }, orderBy: { createdAt: "desc" } }),
    db.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }),
    db.activityHistoryItem.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" } }),
    db.message.findMany({ where: { OR: [{ senderId: me.id }, { recipientId: me.id }] }, orderBy: { createdAt: "asc" } }),
    db.follow.findMany({ where: { followerId: me.id } }),
    db.follow.findMany({ where: { followingId: me.id } }),
    db.threadRead.findMany({ where: { userId: me.id } }),
  ]);

  return NextResponse.json({
    goals: goals.map(serializeGoal),
    posts: posts.map(serializePost),
    notifications: notifications.map(serializeNotification),
    activity: activity.map(serializeActivity),
    messages: messages.map(serializeMessage),
    following: follows.map((f) => f.followingId),
    followerIds: followers.map((f) => f.followerId),
    threadReads: Object.fromEntries(threadReads.map((t) => [t.otherUserId, t.readAt.toISOString()])),
  });
}
