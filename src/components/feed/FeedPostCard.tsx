"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";
import { useResolvedUser } from "@/lib/people";
import { useData } from "@/lib/data-context";
import { categoryEmoji, cn, timeAgo } from "@/lib/utils";
import { isHighlight } from "@/lib/feed-ranking";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";
import { ReactionBar } from "./ReactionBar";

const CHEER_EMOJI = "\u{1F525}";

const TYPE_LABEL: Record<Post["type"], string> = {
  progress: "Progress",
  win: "Win",
  streak: "Streak",
  encouragement: "Encouragement",
  "competition-result": "Competition",
  powerplay: "Power Play",
  "challenge-invite": "Open Invite",
};

const TYPE_TONE: Record<Post["type"], "volt" | "blue" | "rival" | "gold" | "neutral"> = {
  progress: "blue",
  win: "gold",
  streak: "volt",
  encouragement: "neutral",
  "competition-result": "rival",
  powerplay: "rival",
  "challenge-invite": "blue",
};

export function FeedPostCard({ post }: { post: Post }) {
  const author = useResolvedUser(post.userId);
  const { goals, toggleReaction, addComment, joinGoal } = useData();
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [showHeart, setShowHeart] = useState(false);
  const [joining, setJoining] = useState(false);
  const lastTapRef = useRef(0);

  if (!author) return null;

  const linkedGoal = post.goalId ? goals.find((g) => g.id === post.goalId) : undefined;
  const iCheered = post.reactions.some((r) => r.emoji === CHEER_EMOJI && r.userIds.includes("me"));
  const highlight = isHighlight(post);
  const isInvite = post.type === "challenge-invite";
  const alreadyIn = !linkedGoal || linkedGoal.participants.some((p) => p.userId === "me");

  const handleJoin = async () => {
    if (!linkedGoal) return;
    setJoining(true);
    await joinGoal(linkedGoal.id);
    setJoining(false);
  };

  const submitComment = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(post.id, text);
    setDraft("");
  };

  const handleImageTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 320) {
      if (!iCheered) toggleReaction(post.id, CHEER_EMOJI);
      setShowHeart(true);
      window.setTimeout(() => setShowHeart(false), 650);
    }
    lastTapRef.current = now;
  };

  return (
    <article
      className={cn(
        "card-surface animate-rise overflow-hidden rounded-[var(--radius-card)]",
        highlight && "ring-1 ring-volt-500/30 shadow-[var(--shadow-glow-volt)]"
      )}
    >
      <div className="flex items-center justify-between p-4 pb-0">
        <Link href={author.id === "me" ? "/profile" : `/profile/${author.id}`} className="flex items-center gap-3">
          <Avatar initials={author.avatarInitials} gradient={author.avatarColor} size={38} />
          <div>
            <p className="text-sm font-bold leading-tight text-chalk-100">{author.name}</p>
            <p className="text-xs text-chalk-500">
              @{author.handle} · {timeAgo(post.createdAt)}
            </p>
          </div>
        </Link>
        <Pill tone={TYPE_TONE[post.type]}>
          {highlight && "\u{2728} "}
          {TYPE_LABEL[post.type]}
        </Pill>
      </div>

      {post.imageUrl && (
        <div className="relative mt-3 select-none" onClick={handleImageTap}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.imageUrl}
            alt={post.headline}
            className="aspect-[4/5] w-full object-cover"
            draggable={false}
          />
          {showHeart && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-7xl animate-heart-pop">
              {CHEER_EMOJI}
            </span>
          )}
          {linkedGoal && (
            <Link
              href={`/goal/${linkedGoal.id}`}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-pill bg-ink-950/70 px-3 py-1.5 text-xs font-semibold text-chalk-100 backdrop-blur"
            >
              <span>{categoryEmoji(linkedGoal.category)}</span>
              {linkedGoal.title}
              {post.statValue && <span className="text-chalk-500">· {post.statValue}</span>}
            </Link>
          )}
        </div>
      )}

      <div className={cn("p-4", post.imageUrl && "pt-3.5")}>
        <p className="text-[15px] font-bold text-chalk-100">{post.headline}</p>
        <p className="mt-1 text-sm leading-relaxed text-chalk-300">{post.body}</p>

        {!post.imageUrl && post.statValue && (
          <div className="mt-3 inline-flex items-baseline gap-1.5 rounded-2xl bg-white/5 px-3 py-2">
            <span className="font-display text-xl text-ascend-gradient">{post.statValue}</span>
            <span className="text-xs text-chalk-500">{post.statLabel}</span>
          </div>
        )}

        {isInvite && linkedGoal && (
          <div className="mt-3 flex items-center gap-2">
            {alreadyIn ? (
              <Pill tone="volt">{"\u{2705}"} You&apos;re in</Pill>
            ) : (
              <Button onClick={handleJoin} disabled={joining} variant="volt" size="sm">
                {joining ? "Joining…" : `Join · ${linkedGoal.participants.length} in`}
              </Button>
            )}
            <Link href={`/goal/${linkedGoal.id}`} className="text-xs font-semibold text-chalk-500 underline decoration-white/20 underline-offset-2">
              View details →
            </Link>
          </div>
        )}

        {!isInvite && !post.imageUrl && linkedGoal && (
          <Link
            href={`/goal/${linkedGoal.id}`}
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
                className="flex-1 rounded-pill border border-white/8 bg-white/5 px-3.5 py-2 text-sm text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
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
      </div>
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
