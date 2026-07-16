"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-context";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { cn, categoryEmoji, categoryLabel, TOP_LEVEL_CATEGORIES, SPORT_OPTIONS } from "@/lib/utils";
import type { GoalCategory, GoalMode } from "@/lib/types";

const SHAPES: { mode: GoalMode; label: string; desc: string }[] = [
  { mode: "goal", label: "Solo", desc: "Just you, protecting your own streak" },
  { mode: "challenge", label: "Group", desc: "Invite people — everyone's chain is on the line together" },
];

type StepKey = "category" | "sport" | "commitment" | "group" | "confirm";

const STEP_LABEL: Record<StepKey, string> = {
  category: "Category",
  sport: "Sport",
  commitment: "Commitment",
  group: "Group",
  confirm: "Confirm",
};

const STAKE_PRESETS = [
  { key: "bragging", label: "🏆 Bragging rights" },
  { key: "coffee", label: "☕ Loser buys coffee" },
  { key: "dinner", label: "🍽️ Loser buys dinner" },
  { key: "burpees", label: "🔥 Loser does 50 burpees" },
  { key: "chore", label: "🧹 Loser does the chores" },
];

export default function CreateGoalPage() {
  const router = useRouter();
  const { createGoal, otherUsers } = useData();
  const [step, setStep] = useState(0);

  const [category, setCategory] = useState<GoalCategory | null>(null);
  const [isSportFlow, setIsSportFlow] = useState(false);
  const [mode, setMode] = useState<GoalMode>("goal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [editingDuration, setEditingDuration] = useState(false);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [stakePreset, setStakePreset] = useState<string | null>(null);
  const [customStake, setCustomStake] = useState("");

  const isGroup = mode === "challenge";

  // "Sport" is a gateway tile, not a real category — picking it inserts a second
  // picker of specific sports before the flow continues to the commitment step.
  const steps: StepKey[] = isSportFlow
    ? ["category", "sport", "commitment", "group", "confirm"]
    : ["category", "commitment", "group", "confirm"];
  const currentStep = steps[step];

  const selectTopLevelCategory = (c: GoalCategory) => {
    setCategory(c);
    setIsSportFlow(c === "sport");
  };

  const toggleInvitee = (id: string) => {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const finalStake =
    stakePreset === "custom" ? customStake.trim() : STAKE_PRESETS.find((p) => p.key === stakePreset)?.label ?? "";

  const canAdvance =
    currentStep === "category"
      ? !!category
      : currentStep === "sport"
        ? !!category && SPORT_OPTIONS.includes(category)
        : currentStep === "commitment"
          ? title.trim().length >= 2
          : true;

  const publish = async () => {
    if (!category) return;
    const goal = await createGoal({
      title: title.trim(),
      category,
      mode,
      description: description.trim() || "Show up every day.",
      target: "Show up",
      unit: "every day",
      durationDays,
      inviteeIds: isGroup ? inviteeIds : [],
      stake: isGroup ? finalStake || undefined : undefined,
      metric: { type: "binary", targetValue: durationDays },
    });
    router.replace(`/goal/${goal.id}`);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar
        title="New Commitment"
        onBack={step === 0}
        right={
          step > 0 ? (
            <button onClick={() => setStep((s) => s - 1)} className="text-xs font-semibold text-chalk-500">
              Back
            </button>
          ) : null
        }
      />

      <div className="flex items-center gap-2 px-5">
        {steps.map((key, i) => (
          <div key={key} className="flex flex-1 flex-col items-center gap-1.5">
            <div className={cn("h-1.5 w-full rounded-pill", i <= step ? "bg-ascend-gradient" : "bg-white/8")} />
            <span className={cn("text-[10px] font-semibold", i === step ? "text-chalk-100" : "text-chalk-700")}>
              {STEP_LABEL[key]}
            </span>
          </div>
        ))}
      </div>

      {currentStep === "category" && (
        <div className="flex flex-col gap-6 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Who&apos;s on the line</p>
            <div className="mt-2.5 flex flex-col gap-2">
              {SHAPES.map((s) => (
                <button
                  key={s.mode}
                  onClick={() => setMode(s.mode)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    mode === s.mode ? "border-ascend-blue/40 bg-ascend-blue/10" : "border-chalk-300/8 bg-white/5"
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-chalk-100">{s.label}</p>
                    <p className="text-xs text-chalk-500">{s.desc}</p>
                  </div>
                  {mode === s.mode && <Pill tone="blue">Selected</Pill>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">What are you committing to?</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {TOP_LEVEL_CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => selectTopLevelCategory(c)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-colors",
                    (c === "sport" ? isSportFlow : category === c && !isSportFlow)
                      ? "border-volt-500/40 bg-volt-500/10"
                      : "border-chalk-300/8 bg-white/5"
                  )}
                >
                  <span className="text-xl">{categoryEmoji(c)}</span>
                  <span className="text-[11px] font-semibold text-chalk-300">{categoryLabel(c)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {currentStep === "sport" && (
        <div className="flex flex-col gap-3 px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Which sport?</p>
          <div className="grid grid-cols-3 gap-2.5">
            {SPORT_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setCategory(s)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-colors",
                  category === s ? "border-volt-500/40 bg-volt-500/10" : "border-chalk-300/8 bg-white/5"
                )}
              >
                <span className="text-xl">{categoryEmoji(s)}</span>
                <span className="text-[11px] font-semibold text-chalk-300">{categoryLabel(s)}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {currentStep === "commitment" && (
        <div className="flex flex-col gap-4 px-5">
          <Field label="Give it a name">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 100 Push-Ups Daily"
              className="rounded-2xl border border-chalk-300/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does showing up look like?"
              rows={3}
              className="resize-none rounded-2xl border border-chalk-300/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            />
          </Field>
          <p className="text-xs text-chalk-500">
            Every commitment is a daily check-in. Tap in each day to keep your chain alive — miss a day and it
            resets.
          </p>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Length</span>
              {editingDuration ? (
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => setEditingDuration(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingDuration(false)}
                  className="w-20 rounded-lg border border-chalk-300/8 bg-white/5 px-2 py-1 text-right text-xs font-bold text-chalk-100 outline-none focus:border-ascend-blue"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditingDuration(true)}
                  className="text-xs font-bold text-chalk-100 underline decoration-chalk-500 decoration-dotted underline-offset-4"
                >
                  {durationDays} days
                </button>
              )}
            </div>
            <input
              type="range"
              min={3}
              max={90}
              value={Math.min(90, Math.max(3, durationDays))}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="accent-[#2e7bff]"
            />
            <p className="text-xs text-chalk-700">Drag for up to 90 days, or tap the number to set any length.</p>
          </div>
          {isGroup && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
                What happens if the chain breaks? <span className="text-chalk-700">(optional)</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {STAKE_PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setStakePreset((prev) => (prev === p.key ? null : p.key))}
                    className={cn(
                      "rounded-pill border px-3.5 py-2 text-xs font-semibold transition-colors",
                      stakePreset === p.key
                        ? "border-volt-500/40 bg-volt-500/10 text-volt-400"
                        : "border-chalk-300/8 bg-white/5 text-chalk-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStakePreset((prev) => (prev === "custom" ? null : "custom"))}
                  className={cn(
                    "rounded-pill border px-3.5 py-2 text-xs font-semibold transition-colors",
                    stakePreset === "custom"
                      ? "border-volt-500/40 bg-volt-500/10 text-volt-400"
                      : "border-chalk-300/8 bg-white/5 text-chalk-300"
                  )}
                >
                  ✏️ Custom
                </button>
              </div>
              {stakePreset === "custom" && (
                <input
                  value={customStake}
                  onChange={(e) => setCustomStake(e.target.value)}
                  placeholder="e.g. Whoever breaks the chain does the dishes for a week"
                  className="rounded-2xl border border-chalk-300/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                />
              )}
              <p className="text-xs text-chalk-500">Real stakes and penalties are coming later — for now, this is honor-system consequence.</p>
            </div>
          )}
        </div>
      )}

      {currentStep === "group" && (
        <div className="flex flex-col gap-3 px-5">
          {isGroup ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
                Invite your accountability group
              </p>
              <div className="flex flex-col gap-2">
                {otherUsers.map((u) => {
                  const selected = inviteeIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleInvitee(u.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                        selected ? "border-volt-500/40 bg-volt-500/10" : "border-chalk-300/8 bg-white/5"
                      )}
                    >
                      <Avatar initials={u.avatarInitials} gradient={u.avatarColor} size={36} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-chalk-100">{u.name}</p>
                        <p className="text-xs text-chalk-500">@{u.handle}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-5 w-5 items-center justify-center rounded-full border",
                          selected ? "border-volt-500 bg-volt-500 text-white" : "border-chalk-300/20"
                        )}
                      >
                        {selected && "✓"}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="card-surface rounded-[var(--radius-card)] p-6 text-center">
              <p className="text-sm font-bold text-chalk-100">Solo commitment</p>
              <p className="mt-1 text-xs text-chalk-500">No group to answer to — just you and the chain.</p>
            </div>
          )}
        </div>
      )}

      {currentStep === "confirm" && (
        <div className="flex flex-col gap-4 px-5">
          <div
            className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
            style={{ background: "linear-gradient(135deg,#1e3a66,#2e7bff)" }}
          >
            <div className="noise-overlay absolute inset-0" />
            <div className="relative flex items-center justify-between">
              <Pill tone="neutral" className="!border-chalk-300/20 bg-black/25 !text-white">
                {category && categoryLabel(category)}
              </Pill>
              <span className="text-2xl">{category && categoryEmoji(category)}</span>
            </div>
            <h2 className="relative mt-4 font-display text-2xl text-white">{title || "Untitled commitment"}</h2>
            <p className="relative mt-1.5 text-sm text-white/80">{description || "Show up every day."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryRow label="Shape" value={isGroup ? "Group" : "Solo"} />
            <SummaryRow label="Length" value={`${durationDays} days`} />
            <SummaryRow label="Group" value={isGroup ? `${inviteeIds.length} invited` : "Just you"} />
            {isGroup && finalStake && (
              <div className="card-surface col-span-2 rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">
                  If the chain breaks
                </p>
                <p className="mt-0.5 font-bold text-chalk-100">{finalStake}</p>
              </div>
            )}
          </div>
          <Button onClick={publish} variant="volt" size="lg" className="mt-2 w-full">
            Start the streak
          </Button>
        </div>
      )}

      {currentStep !== "confirm" && (
        <div className="px-5">
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance} variant="primary" size="lg" className="w-full">
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">{label}</span>
      {children}
    </label>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="card-surface rounded-2xl p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">{label}</p>
      <p className="mt-0.5 font-bold text-chalk-100">{value}</p>
    </div>
  );
}
