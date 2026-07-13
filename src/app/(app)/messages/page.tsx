"use client";

import Link from "next/link";
import { useData } from "@/lib/data-context";
import { useUserMap } from "@/lib/people";
import { TopBar } from "@/components/shell/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";

export default function MessagesPage() {
  const { threads } = useData();
  const userMap = useUserMap();

  return (
    <div className="flex flex-col gap-3 pb-4">
      <TopBar title="Messages" onBack />
      {threads.length > 0 ? (
        <div className="flex flex-col gap-2 px-5">
          {threads.map((t) => {
            const person = userMap[t.otherUserId];
            if (!person) return null;
            return (
              <Link
                key={t.otherUserId}
                href={`/messages/${t.otherUserId}`}
                className="card-surface flex items-center gap-3 rounded-2xl p-3"
              >
                <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={44} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-bold text-chalk-100">{person.name}</p>
                    <span className="shrink-0 text-[10px] text-chalk-700">{timeAgo(t.lastMessage.createdAt)}</span>
                  </div>
                  <p className={cn("truncate text-xs", t.unread ? "font-semibold text-chalk-100" : "text-chalk-500")}>
                    {t.lastMessage.senderId === "me" ? "You: " : ""}
                    {t.lastMessage.text}
                  </p>
                </div>
                {t.unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rival-500" />}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="mx-5 card-surface rounded-[var(--radius-card)] p-6 text-center">
          <p className="text-sm text-chalk-300">No messages yet.</p>
          <Link href="/discover" className="mt-3 inline-block text-sm font-bold text-ascend-gradient">
            Find people to rally with →
          </Link>
        </div>
      )}
    </div>
  );
}
