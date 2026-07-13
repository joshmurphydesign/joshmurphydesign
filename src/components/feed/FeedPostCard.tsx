"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { useResolvedUser } from "@/lib/people";
import { useData } from "@/lib/data-context";
import { timeAgo } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { ReactionBar } from "./ReactionBar";

const TYPE_LABEL: Record<Post["type"], string> = {
  progress: "Progress",
  win: "Win",
  streak: "Streak",
  encouragement: "Encouragement",
  "competition-result": "Competition",
  powerplay: "Power Play",
};

const TYPE_TONE: Record<Post["type"], "volt" | "violet" | "rival" | "gold" | "neutral"> = {
  progress: "violet",
  win: "gold",
  streak: "volt",
  encouragement: "neutral",
  "competition-result": "rival",
  powerplay: "rival",
};

export function FeedPostCard({ post }: { post: Post }) {
  const author = useResolvedUser(post.userId);
  const { toggleReaction, addComment } = useData();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");

  if (!author) return null;

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(post.id, text);
    setDraft("");
  };

  return (
    <article className="card-surface animate-rise rounded-[var(--radius-card)] p-4">
      <div className="flex items-center justify-between">
        <Link href={author.id === "me" ? "/profile" : `/profile/${author.id}`} className="flex items-center gap-3">
          <Avatar initials={author.avatarInitials} gradient={author.avatarColor} size={38} />
          <div>
            <p className="text-sm font-bold leading-tight text-chalk-100">{author.name}</p>
            <p className="text-xs text-chalk-500">
              @{author.handle} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        <Pill tone={TYPE_TONE[post.type]}>{TYPE_LABEL[post.type]}</Pill>
      </div>

      <div className="mt-3.5">
        <p className="text-[15px] font-bold text-chalk-100">{post.headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-chalk-300">{post.body}</p>
      </div>

      {post.statValue && (
        <div className="mt-3 inline-flex items-baseline gap-1.5 rounded-2xl bg-white/5 px-3 py-2">
          <span className="font-display text-xl text-ascend-gradient">{post.statValue}</span>
          <span className="text-xs text-chalk-500">{post.statLabel}</span>
        </div>
      )}

      {post.goalId && (
        <Link
          href={`/goal/${post.goalId}`}
          className="mt-3 block text-xs font-semibold text-chalk-500 underline decoration-white/20 underline-offset-2"
        >
          View goal →
        </Link>
      )}
      {post.powerPlayId && (
        <Link
          href={`/powerplay/${post.powerPlayId}`}
          className="mt-3 block text-xs font-semibold text-chalk-500 underline decoration-white/20 underline-offset-2"
        >
          View Power Play →
        </Link>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/6 pt-3.5">
        <ReactionBar reactions={post.reactions} onToggle={(emoji) => toggleReaction(post.id, emoji)} />
        <button
          onClick={() => setShowComments((v) => !v)}
          className="text-xs font-semibold text-chalk-500"
        >
          {post.comments.length} comment{post.comments.length === 1 ? "" : "s"}
        </button>
      </div>

      {showComments && (
        <div className="mt-3.5 flex flex-col gap-3 border-t border-white/6 pt-3.5">
          {post.comments.map((c) => (
            <CommentRow key={c.id} userId={c.userId} text={c.text} createdAt={c.createdAt} />
          ))}
          <div className="flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder="Add encouragement..."
              className="flex-1 rounded-pill border border-white/8 bg-white/5 px-3.5 py-2 text-sm text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-violet"
            />
            <button
              onClick={submitComment}
              disabled={!draft.trim()}
              className="rounded-pill bg-ascend-gradient px-3.5 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function CommentRow({ userId, text, createdAt }: { userId: string; text: string; createdAt: string }) {
  const user = useResolvedUser(userId);
  if (!user) return null;
  return (
    <div className="flex gap-2.5">
      <Avatar initials={user.avatarInitials} gradient={user.avatarColor} size={28} />
      <div className="flex-1 rounded-2xl bg-white/5 px-3 py-2">
        <p className="text-xs font-bold text-chalk-100">
          {user.name} <span className="ml-1 font-normal text-chalk-700">{timeAgo(createdAt)}</span>
        </p>
        <p className="mt-0.5 text-sm text-chalk-300">{text}</p>
      </div>
    </div>
  );
}
