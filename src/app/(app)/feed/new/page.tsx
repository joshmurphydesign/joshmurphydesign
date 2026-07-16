"use client";

import { Suspense, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { IconCamera, IconX } from "@/components/ui/Icons";
import { categoryEmoji, cn, resizeImageFile } from "@/lib/utils";

export default function NewPostPage() {
  return (
    <Suspense fallback={<TopBar title="Share a Highlight" onBack />}>
      <ComposerScreen />
    </Suspense>
  );
}

function ComposerScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetGoalId = searchParams.get("goalId");
  const { goals, createPost } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [goalId, setGoalId] = useState<string | null>(presetGoalId);
  const [imageError, setImageError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const myGoals = goals.filter((g) => g.participants.some((p) => p.userId === "me"));
  const attachedGoal = goalId ? goals.find((g) => g.id === goalId) : undefined;
  const me = attachedGoal?.participants.find((p) => p.userId === "me");

  // A highlight always ties back to a commitment — that's what keeps the feed
  // high-signal instead of turning into general-purpose posting.
  const canPost = !!goalId && (caption.trim().length > 0 || !!imageUrl) && !posting;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setImageError(null);
    try {
      const dataUrl = await resizeImageFile(file);
      setImageUrl(dataUrl);
    } catch {
      setImageError("Couldn't read that photo. Try another one.");
    }
  };

  const submit = () => {
    if (!canPost) return;
    setPosting(true);
    createPost({
      body: caption.trim() || "Shared a photo update.",
      imageUrl: imageUrl ?? undefined,
      goalId: goalId ?? undefined,
    });
    router.replace("/feed");
  };

  return (
    <div className="flex flex-col gap-5 pb-4">
      <TopBar
        title="Share a Highlight"
        onBack
        right={
          <Button onClick={submit} disabled={!canPost} variant="volt" size="sm">
            Post
          </Button>
        }
      />

      <div className="px-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        {imageUrl ? (
          <div className="relative overflow-hidden rounded-[var(--radius-card)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt="Post preview" className="aspect-[4/5] w-full object-cover" />
            <button
              onClick={() => setImageUrl(null)}
              aria-label="Remove photo"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-ink-950/70 text-chalk-100 backdrop-blur"
            >
              <IconX className="h-4 w-4" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-pill bg-ink-950/70 px-3 py-2 text-xs font-semibold text-chalk-100 backdrop-blur"
            >
              <IconCamera className="h-4 w-4" /> Replace
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-white/15 bg-white/5 text-chalk-500"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-ascend-gradient">
              <IconCamera className="h-6 w-6 text-white" />
            </div>
            <span className="text-sm font-semibold text-chalk-300">Add a photo</span>
            <span className="text-xs text-chalk-700">Show the work — a rep, a route, a receipt.</span>
          </button>
        )}
        {imageError && <p className="mt-2 text-xs font-semibold text-rival-500">{imageError}</p>}
      </div>

      <div className="px-5">
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="What's the highlight?"
          rows={3}
          className="w-full resize-none rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
        />
      </div>

      <div className="flex flex-col gap-2.5 px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
          Which commitment is this? <span className="text-chalk-700">(required)</span>
        </p>
        {myGoals.length === 0 ? (
          <p className="text-xs text-chalk-700">
            Highlights always tie back to a commitment — join or start one first.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {myGoals.map((g) => {
              const selected = g.id === goalId;
              return (
                <button
                  key={g.id}
                  onClick={() => setGoalId(selected ? null : g.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-2 text-xs font-semibold transition-colors",
                    selected ? "border-volt-500/40 bg-volt-500/10 text-volt-400" : "border-white/8 bg-white/5 text-chalk-300"
                  )}
                >
                  <span>{categoryEmoji(g.category)}</span>
                  {g.title}
                </button>
              );
            })}
          </div>
        )}
        {attachedGoal && me && (
          <div className="card-surface flex items-center justify-between rounded-2xl p-3.5">
            <div>
              <p className="text-sm font-bold text-chalk-100">{attachedGoal.title}</p>
              <p className="text-xs text-chalk-500">
                Day {attachedGoal.streak || 1} · {me.progress}% progress
              </p>
            </div>
            <span className="text-2xl">{categoryEmoji(attachedGoal.category)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
