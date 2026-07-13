"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useData } from "@/lib/data-context";
import { useResolvedUser } from "@/lib/people";
import { TopBar } from "@/components/shell/TopBar";
import { Avatar } from "@/components/ui/Avatar";
import { cn, timeAgo } from "@/lib/utils";

export default function ThreadPage() {
  const params = useParams<{ id: string }>();
  const { messages, sendMessage, markThreadRead } = useData();
  const person = useResolvedUser(params.id);
  const [draft, setDraft] = useState("");

  const thread = messages
    .filter((m) => m.threadId === params.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  useEffect(() => {
    markThreadRead(params.id);
  }, [params.id, markThreadRead]);

  if (!person) {
    return (
      <div className="flex flex-col gap-4">
        <TopBar title="Message" onBack />
        <p className="px-5 text-sm text-chalk-500">Couldn&apos;t find that athlete.</p>
      </div>
    );
  }

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    sendMessage(params.id, text);
    setDraft("");
  };

  return (
    <div className="flex flex-col gap-4 pb-4">
      <TopBar
        onBack
        right={
          <div className="flex flex-1 items-center gap-2.5">
            <Avatar initials={person.avatarInitials} gradient={person.avatarColor} size={32} />
            <p className="truncate text-[15px] font-bold text-chalk-100">{person.name}</p>
          </div>
        }
      />

      <div className="flex flex-col gap-2.5 px-5">
        {thread.length > 0 ? (
          thread.map((m) => (
            <div
              key={m.id}
              className={cn("flex flex-col", m.senderId === "me" ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  m.senderId === "me" ? "bg-ascend-gradient text-white" : "card-surface text-chalk-100"
                )}
              >
                {m.text}
              </div>
              <span className="mt-1 text-[10px] text-chalk-700">{timeAgo(m.createdAt)}</span>
            </div>
          ))
        ) : (
          <p className="py-10 text-center text-sm text-chalk-500">
            Say hello to {person.name.split(" ")[0]} — start the rally.
          </p>
        )}
      </div>

      <div className="sticky bottom-24 mx-5 mt-2 flex items-center gap-2 rounded-pill border border-white/8 bg-ink-900/95 p-1.5 backdrop-blur-xl">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={`Message ${person.name.split(" ")[0]}...`}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-chalk-100 outline-none placeholder:text-chalk-700"
        />
        <button
          onClick={submit}
          disabled={!draft.trim()}
          className="rounded-pill bg-ascend-gradient px-4 py-2.5 text-xs font-bold text-white disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}
