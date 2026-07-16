"use client";

import { useState } from "react";
import { useData } from "@/lib/data-context";
import { isStepsGoal } from "@/lib/metric-presets";
import type { HealthProvider } from "@/lib/types";
import { TopBar } from "@/components/shell/TopBar";
import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { timeAgo } from "@/lib/utils";

const PROVIDER_META: Record<HealthProvider, { label: string; emoji: string; blurb: string }> = {
  apple: { label: "Apple Health", emoji: "\u{1F34E}", blurb: "Steps from your iPhone and Apple Watch" },
  samsung: { label: "Samsung Health", emoji: "\u{231A}", blurb: "Steps from your Galaxy phone and watch" },
};

export default function HealthConnectPage() {
  const { goals, health, connectHealth, disconnectHealth, syncHealth } = useData();
  const [pendingProvider, setPendingProvider] = useState<HealthProvider | null>(null);
  const [syncing, setSyncing] = useState(false);

  const eligibleGoals = goals.filter(
    (g) => isStepsGoal(g) && g.participants.some((p) => p.userId === "me")
  );

  const handleSync = () => {
    if (syncing) return;
    setSyncing(true);
    syncHealth();
    window.setTimeout(() => setSyncing(false), 600);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title="Connected apps" onBack />

      <div className="px-5">
        <p className="text-sm text-chalk-500">
          Connect a health app to auto-log steps into your step-tracked goals. This preview simulates a
          live connection — no real device data is read or transmitted.
        </p>
      </div>

      {health ? (
        <div className="flex flex-col gap-4 px-5">
          <div className="card-surface-raised rounded-[var(--radius-card)] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-xl">
                  {PROVIDER_META[health.provider].emoji}
                </div>
                <div>
                  <p className="font-bold text-chalk-100">{PROVIDER_META[health.provider].label}</p>
                  <p className="text-xs text-chalk-500">
                    {health.lastSyncedAt ? `Synced ${timeAgo(health.lastSyncedAt)}` : "Not yet synced"}
                  </p>
                </div>
              </div>
              <Pill tone="volt">Connected</Pill>
            </div>

            <div className="mt-5 flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-chalk-500">
                  Today&apos;s steps
                </p>
                <p className="mt-0.5 font-stat text-2xl text-chalk-100">
                  {health.todaySteps.toLocaleString()}
                </p>
              </div>
              <Button onClick={handleSync} disabled={syncing} variant="outline" size="sm">
                {syncing ? "Syncing…" : "Sync now"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
              Auto-synced goals
            </span>
            {eligibleGoals.length > 0 ? (
              <div className="flex flex-col gap-2">
                {eligibleGoals.map((g) => (
                  <div key={g.id} className="card-surface flex items-center justify-between rounded-2xl p-3.5">
                    <p className="text-sm font-bold text-chalk-100">{g.title}</p>
                    <span className="text-xs text-chalk-500">
                      {(g.participants.find((p) => p.userId === "me")?.currentValue ?? 0).toLocaleString()} /{" "}
                      {g.metric.targetValue.toLocaleString()} {g.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-chalk-500">
                No step-tracked goals joined yet. Join one with a &quot;Total steps&quot; tracking method
                and it&apos;ll sync automatically.
              </p>
            )}
          </div>

          <Button onClick={disconnectHealth} variant="danger" size="md" className="w-full">
            Disconnect {PROVIDER_META[health.provider].label}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-5">
          {(Object.keys(PROVIDER_META) as HealthProvider[]).map((provider) => {
            const meta = PROVIDER_META[provider];
            return (
              <div key={provider} className="card-surface flex items-center gap-3 rounded-2xl p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-chalk-100">{meta.label}</p>
                  <p className="text-xs text-chalk-500">{meta.blurb}</p>
                </div>
                <Button onClick={() => setPendingProvider(provider)} variant="volt" size="sm">
                  Connect
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {pendingProvider && (
        <PermissionSheet
          provider={pendingProvider}
          onCancel={() => setPendingProvider(null)}
          onAllow={() => {
            connectHealth(pendingProvider);
            setPendingProvider(null);
          }}
        />
      )}
    </div>
  );
}

function PermissionSheet({
  provider,
  onCancel,
  onAllow,
}: {
  provider: HealthProvider;
  onCancel: () => void;
  onAllow: () => void;
}) {
  const meta = PROVIDER_META[provider];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-t-[28px] border-t border-chalk-300/10 bg-ink-900 p-6 pb-8">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="text-3xl">{meta.emoji}</span>
          <p className="font-display text-lg text-chalk-100">&ldquo;Ascend&rdquo; Would Like to Access</p>
          <p className="text-sm text-chalk-500">{meta.label}</p>
        </div>
        <div className="mt-5 flex flex-col gap-2.5 rounded-2xl bg-white/5 p-4">
          {["Steps", "Distance walked/run", "Activity summary"].map((perm) => (
            <div key={perm} className="flex items-center gap-2.5 text-sm text-chalk-300">
              <span className="h-1.5 w-1.5 rounded-full bg-volt-400" />
              {perm}
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-chalk-700">
          Simulated for this preview — Ascend does not access your real {meta.label} data.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          <Button onClick={onAllow} variant="volt" size="md" className="w-full">
            Allow
          </Button>
          <Button onClick={onCancel} variant="ghost" size="md" className="w-full">
            Don&apos;t Allow
          </Button>
        </div>
      </div>
    </div>
  );
}
