"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-context";
import { USERS } from "@/lib/mock-data";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { cn, categoryEmoji, categoryLabel, modeLabel } from "@/lib/utils";
import type { GoalCategory, GoalMode } from "@/lib/types";

const CATEGORIES: GoalCategory[] = [
  "strength",
  "running",
  "golf",
  "basketball",
  "steps",
  "mobility",
  "nutrition",
  "recovery",
  "consistency",
  "habits",
  "custom",
];

const MODES: { mode: GoalMode; desc: string }[] = [
  { mode: "goal", desc: "A personal target you own" },
  { mode: "challenge", desc: "Group accountability with a squad" },
  { mode: "duel", desc: "Head-to-head, 1v1 competition" },
  { mode: "quest", desc: "A longer improvement journey" },
];

const STEP_LABELS = ["Category", "Details", "Rally", "Publish"];

export default function CreateGoalPage() {
  const router = useRouter();
  const { createGoal } = useData();
  const [step, setStep] = useState(0);

  const [category, setCategory] = useState<GoalCategory | null>(null);
  const [mode, setMode] = useState<GoalMode>("goal");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [target, setTarget] = useState("");
  const [unit, setUnit] = useState("");
  const [durationDays, setDurationDays] = useState(30);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);

  const toggleInvitee = (id: string) => {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const canAdvance = [
    !!category,
    title.trim().length > 1 && target.trim().length > 0 && unit.trim().length > 0,
    true,
    true,
  ][step];

  const publish = () => {
    if (!category) return;
    const goal = createGoal({
      title: title.trim(),
      category,
      mode,
      description: description.trim() || "New goal on Ascend.",
      target: target.trim(),
      unit: unit.trim(),
      durationDays,
      inviteeIds,
    });
    router.replace(`/goal/${goal.id}`);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar
        title="New Goal"
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
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                "h-1.5 w-full rounded-pill",
                i <= step ? "bg-ascend-gradient" : "bg-white/8"
              )}
            />
            <span className={cn("text-[10px] font-semibold", i === step ? "text-chalk-100" : "text-chalk-700")}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-6 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Mode</p>
            <div className="mt-2.5 flex flex-col gap-2">
              {MODES.map((m) => (
                <button
                  key={m.mode}
                  onClick={() => setMode(m.mode)}
                  className={cn(
                    "flex items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors",
                    mode === m.mode
                      ? "border-ascend-blue/40 bg-ascend-blue/10"
                      : "border-white/8 bg-white/5"
                  )}
                >
                  <div>
                    <p className="text-sm font-bold text-chalk-100">{modeLabel(m.mode)}</p>
                    <p className="text-xs text-chalk-500">{m.desc}</p>
                  </div>
                  {mode === m.mode && <Pill tone="blue">Selected</Pill>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Category</p>
            <div className="mt-2.5 grid grid-cols-3 gap-2.5">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-2xl border px-2 py-3.5 transition-colors",
                    category === c ? "border-volt-500/40 bg-volt-500/10" : "border-white/8 bg-white/5"
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

      {step === 1 && (
        <div className="flex flex-col gap-4 px-5">
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 100 Push-Ups Daily"
              className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's the mission?"
              rows={3}
              className="resize-none rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Target">
              <input
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="100"
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
              />
            </Field>
            <Field label="Unit">
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="push-ups / day"
                className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
              />
            </Field>
          </div>
          <Field label={`Duration — ${durationDays} days`}>
            <input
              type="range"
              min={3}
              max={90}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              className="accent-[#1379c9]"
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-3 px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
            Invite people to rally with you
          </p>
          <div className="flex flex-col gap-2">
            {USERS.map((u) => {
              const selected = inviteeIds.includes(u.id);
              return (
                <button
                  key={u.id}
                  onClick={() => toggleInvitee(u.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors",
                    selected ? "border-volt-500/40 bg-volt-500/10" : "border-white/8 bg-white/5"
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
                      selected ? "border-volt-500 bg-volt-500 text-ink-950" : "border-white/20"
                    )}
                  >
                    {selected && "✓"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4 px-5">
          <div
            className="relative overflow-hidden rounded-[var(--radius-card)] p-6"
            style={{ background: "linear-gradient(135deg,#0b3f7a,#35c2f2)" }}
          >
            <div className="noise-overlay absolute inset-0" />
            <div className="relative flex items-center justify-between">
              <Pill tone="neutral" className="!border-white/20 bg-black/25 !text-white">
                {category && categoryLabel(category)}
              </Pill>
              <span className="text-2xl">{category && categoryEmoji(category)}</span>
            </div>
            <h2 className="relative mt-4 font-display text-2xl text-white">{title || "Untitled goal"}</h2>
            <p className="relative mt-1.5 text-sm text-white/80">{description || "New goal on Ascend."}</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <SummaryRow label="Mode" value={modeLabel(mode)} />
            <SummaryRow label="Duration" value={`${durationDays} days`} />
            <SummaryRow label="Target" value={`${target || "—"} ${unit}`} />
            <SummaryRow label="Rally" value={`${inviteeIds.length} invited`} />
          </div>
          <Button onClick={publish} variant="volt" size="lg" className="mt-2 w-full">
            Publish {modeLabel(mode)}
          </Button>
        </div>
      )}

      {step < 3 && (
        <div className="px-5">
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canAdvance}
            variant="primary"
            size="lg"
            className="w-full"
          >
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
