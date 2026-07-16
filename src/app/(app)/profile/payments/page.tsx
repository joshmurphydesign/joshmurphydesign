"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PAYMENT_PROVIDERS, PAYMENT_PROVIDER_META, findHandle, normalizeHandle, paymentLink } from "@/lib/payments";
import type { PaymentProvider } from "@/lib/types";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";

export default function PaymentMethodsPage() {
  const { user, updatePaymentHandles } = useAuth();
  const [editing, setEditing] = useState<PaymentProvider | null>(null);
  const [draft, setDraft] = useState("");

  if (!user) return null;
  const handles = user.paymentHandles ?? [];

  const startEdit = (provider: PaymentProvider) => {
    setEditing(provider);
    setDraft(findHandle(handles, provider) ?? "");
  };

  const save = (provider: PaymentProvider) => {
    const clean = normalizeHandle(draft);
    if (!clean) return;
    void updatePaymentHandles([...handles.filter((h) => h.provider !== provider), { provider, handle: clean }]);
    setEditing(null);
    setDraft("");
  };

  const remove = (provider: PaymentProvider) => {
    void updatePaymentHandles(handles.filter((h) => h.provider !== provider));
    if (editing === provider) setEditing(null);
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title="Payment methods" onBack />

      <div className="px-5">
        <p className="text-sm text-chalk-500">
          Add your Venmo, PayPal, or Cash App so people you beat in a cash-stake challenge or duel know where to
          send you money. These are just the public handles you&apos;d share anyway — Ascend never sees your
          balance or moves money. Payment happens directly between you and them in the linked app.
        </p>
      </div>

      <div className="flex flex-col gap-3 px-5">
        {PAYMENT_PROVIDERS.map((provider) => {
          const meta = PAYMENT_PROVIDER_META[provider];
          const handle = findHandle(handles, provider);
          const isEditing = editing === provider;
          return (
            <div key={provider} className="card-surface rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-xl">
                  {meta.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-chalk-100">{meta.label}</p>
                  <p className="text-xs text-chalk-500">{handle ? `${meta.prefix}${handle}` : "Not linked"}</p>
                </div>
                {!isEditing && (
                  <Button onClick={() => startEdit(provider)} variant="outline" size="sm">
                    {handle ? "Edit" : "Add"}
                  </Button>
                )}
              </div>

              {isEditing && (
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={meta.placeholder}
                    className="rounded-2xl border border-chalk-300/8 bg-white/5 px-4 py-3 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => save(provider)}
                      disabled={!draft.trim()}
                      variant="volt"
                      size="sm"
                      className="flex-1"
                    >
                      Save
                    </Button>
                    <Button onClick={() => setEditing(null)} variant="ghost" size="sm" className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!isEditing && handle && (
                <div className="mt-3 flex gap-2">
                  <a
                    href={paymentLink(provider, handle)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 rounded-pill border border-chalk-300/15 px-4 py-2.5 text-center text-xs font-semibold text-chalk-100"
                  >
                    Preview
                  </a>
                  <button
                    onClick={() => remove(provider)}
                    className="flex-1 rounded-pill border border-rival-500/30 bg-rival-500/15 px-4 py-2.5 text-center text-xs font-semibold text-[#ff8fa0]"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
