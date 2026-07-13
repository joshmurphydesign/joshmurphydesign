"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useData } from "@/lib/data-context";
import { USERS } from "@/lib/mock-data";
import { presetsForCategory, targetDisplayString } from "@/lib/metric-presets";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Pill } from "@/components/ui/Pill";
import { cn, categoryEmoji, categoryLabel, modeLabel } from "@/lib/utils";
import type { GoalCategory, GoalMode, MetricType } from "@/lib/types";

const METRIC_TYPE_ICON: Record<MetricType, string> = {
  increase: "\u{1F4C8}",
  decrease: "\u{1F4C9}",
  cumulative: "\u{1F522}",
  binary: "\u{2705}",
};

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

const STAKE_MODES: GoalMode[] = ["challenge", "duel"];

const STAKE_PRESETS = [
  { key: "bragging", label: "🏆 Bragging rights" },
  { key: "coffee", label: "☕ Loser buys coffee" },
  { key: "dinner", label: "🍽️ Loser buys dinner" },
  { key: "burpees", label: "🔥 Loser does 50 burpees" },
  { key: "chore", label: "🧹 Loser does the chores" },
  { key: "playlist", label: "🎧 Winner picks the playlist" },
];

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
  const [editingDuration, setEditingDuration] = useState(false);
  const [inviteeIds, setInviteeIds] = useState<string[]>([]);
  const [stakePreset, setStakePreset] = useState<string | null>(null);
  const [customStake, setCustomStake] = useState("");

  const [trackingKey, setTrackingKey] = useState("consistency");
  const [customType, setCustomType] = useState<MetricType>("cumulative");
  const [customUnit, setCustomUnit] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [startingValue, setStartingValue] = useState("");

  const toggleInvitee = (id: string) => {
    setInviteeIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const finalStake =
    stakePreset === "custom"
      ? customStake.trim()
      : STAKE_PRESETS.find((p) => p.key === stakePreset)?.label ?? "";

  const presets = presetsForCategory(category);
  const isConsistency = trackingKey === "consistency";
  const isCustomNumeric = trackingKey === "custom";
  const selectedPreset = presets.find((p) => p.key === trackingKey);
  const activeMetricType: MetricType = isConsistency ? "binary" : isCustomNumeric ? customType : selectedPreset?.metricType ?? "binary";
  const activeUnit = isConsistency ? unit.trim() : isCustomNumeric ? customUnit.trim() : selectedPreset?.unit ?? "";
  const needsBaseline = activeMetricType === "increase" || activeMetricType === "decrease";

  const selectTracking = (key: string) => {
    setTrackingKey(key);
    const preset = presets.find((p) => p.key === key);
    setTargetAmount(preset?.suggestedTarget ? String(preset.suggestedTarget) : "");
    setStartingValue("");
  };

  const canAdvance = [
    !!category,
    (() => {
      if (title.trim().length < 2) return false;
      if (isConsistency) return target.trim().length > 0 && unit.trim().length > 0;
      const amt = Number(targetAmount);
      if (!targetAmount || !(amt > 0)) return false;
      if (isCustomNumeric && !customUnit.trim()) return false;
      if (needsBaseline && startingValue.trim() === "") return false;
      return true;
    })(),
    true,
    true,
  ][step];

  const publish = () => {
    if (!category) return;
    const metric = isConsistency
      ? { type: "binary" as const, targetValue: durationDays }
      : { type: activeMetricType, targetValue: Math.max(0, Number(targetAmount) || 0) };
    const finalTarget = isConsistency ? target.trim() : targetDisplayString(metric);
    const goal = createGoal({
      title: title.trim(),
      category,
      mode,
      description: description.trim() || "New goal on Ascend.",
      target: finalTarget,
      unit: isConsistency ? unit.trim() : activeUnit,
      durationDays,
      inviteeIds,
      stake: STAKE_MODES.includes(mode) ? finalStake || undefined : undefined,
      metric,
      startingValue: needsBaseline ? Number(startingValue) || 0 : undefined,
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
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
              How should progress be tracked?
            </span>
            <div className="flex flex-wrap gap-2">
              <TrackingChip
                active={isConsistency}
                onClick={() => selectTracking("consistency")}
                icon={METRIC_TYPE_ICON.binary}
                label="Consistency"
              />
              {presets
                .filter((p) => p.key !== "consistency")
                .map((p) => (
                  <TrackingChip
                    key={p.key}
                    active={trackingKey === p.key}
                    onClick={() => selectTracking(p.key)}
                    icon={METRIC_TYPE_ICON[p.metricType]}
                    label={p.label}
                  />
                ))}
              <TrackingChip
                active={isCustomNumeric}
                onClick={() => selectTracking("custom")}
                icon="✏️"
                label="Custom number"
              />
            </div>
          </div>

          {isConsistency ? (
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
          ) : (
            <div className="flex flex-col gap-3">
              {isCustomNumeric && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Direction">
                    <select
                      value={customType}
                      onChange={(e) => setCustomType(e.target.value as MetricType)}
                      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none focus:border-ascend-blue"
                    >
                      <option value="cumulative">Add up to a total</option>
                      <option value="increase">Climb to a higher number</option>
                      <option value="decrease">Work down to a lower number</option>
                    </select>
                  </Field>
                  <Field label="Unit">
                    <input
                      value={customUnit}
                      onChange={(e) => setCustomUnit(e.target.value)}
                      placeholder="lb, miles, reps..."
                      className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                    />
                  </Field>
                </div>
              )}
              <Field
                label={
                  isCustomNumeric
                    ? "Target amount"
                    : `Target ${selectedPreset?.metricType === "cumulative" ? "total" : "change"}${activeUnit ? ` (${activeUnit})` : ""}`
                }
              >
                <input
                  type="number"
                  min={1}
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder={selectedPreset?.suggestedTarget ? String(selectedPreset.suggestedTarget) : "0"}
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                />
              </Field>
              {needsBaseline && (
                <Field label={selectedPreset?.startingPrompt ?? "Your starting value"}>
                  <input
                    type="number"
                    value={startingValue}
                    onChange={(e) => setStartingValue(e.target.value)}
                    placeholder="0"
                    className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                  />
                </Field>
              )}
              <p className="text-xs text-chalk-500">
                Everyone who joins logs their own numbers — progress bars reflect personal starting points,
                not a shared count.
              </p>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Duration</span>
              {editingDuration ? (
                <input
                  type="number"
                  min={1}
                  autoFocus
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Number(e.target.value) || 1))}
                  onBlur={() => setEditingDuration(false)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingDuration(false)}
                  className="w-20 rounded-lg border border-white/8 bg-white/5 px-2 py-1 text-right text-xs font-bold text-chalk-100 outline-none focus:border-ascend-blue"
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
              className="accent-[#1379c9]"
            />
            <p className="text-xs text-chalk-700">Drag for up to 90 days, or tap the number to set any length.</p>
          </div>
          {STAKE_MODES.includes(mode) && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
                What&apos;s on the line? <span className="text-chalk-700">(optional)</span>
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
                        : "border-white/8 bg-white/5 text-chalk-300"
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
                      : "border-white/8 bg-white/5 text-chalk-300"
                  )}
                >
                  ✏️ Custom
                </button>
              </div>
              {stakePreset === "custom" && (
                <input
                  value={customStake}
                  onChange={(e) => setCustomStake(e.target.value)}
                  placeholder="e.g. Loser does the dishes for a week"
                  className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                />
              )}
              <p className="text-xs text-chalk-500">
                No points required to join — everyone just needs to hold up their end. Points are earned
                automatically for the win.
              </p>
            </div>
          )}
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
            <SummaryRow
              label="Target"
              value={
                isConsistency
                  ? `${target || "—"} ${unit}`
                  : `${targetDisplayString({ type: activeMetricType, targetValue: Math.max(0, Number(targetAmount) || 0) })} ${activeUnit}`
              }
            />
            <SummaryRow label="Rally" value={`${inviteeIds.length} invited`} />
            {needsBaseline && (
              <SummaryRow label="Your starting point" value={`${startingValue || "0"} ${activeUnit}`} />
            )}
            {STAKE_MODES.includes(mode) && finalStake && (
              <div className="card-surface col-span-2 rounded-2xl p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">
                  What&apos;s on the line
                </p>
                <p className="mt-0.5 font-bold text-chalk-100">{finalStake}</p>
              </div>
            )}
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

function TrackingChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: string;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-pill border px-3.5 py-2 text-xs font-semibold transition-colors",
        active ? "border-volt-500/40 bg-volt-500/10 text-volt-400" : "border-white/8 bg-white/5 text-chalk-300"
      )}
    >
      <span>{icon}</span>
      {label}
    </button>
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
