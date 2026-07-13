import type { Goal, GoalParticipant, PaymentHandle, PaymentProvider } from "./types";

export const PAYMENT_PROVIDER_META: Record<
  PaymentProvider,
  { label: string; emoji: string; prefix: string; placeholder: string }
> = {
  venmo: { label: "Venmo", emoji: "\u{1F4B8}", prefix: "@", placeholder: "your-venmo-username" },
  paypal: { label: "PayPal", emoji: "\u{1F171}\u{FE0F}", prefix: "", placeholder: "your-paypal.me-name" },
  cashapp: { label: "Cash App", emoji: "\u{1F4B5}", prefix: "$", placeholder: "YourCashtag" },
};

export const PAYMENT_PROVIDERS: PaymentProvider[] = ["venmo", "paypal", "cashapp"];

/** Strips a leading @ or $ so handles are stored consistently regardless of how the user typed them. */
export function normalizeHandle(raw: string): string {
  return raw.trim().replace(/^[@$]/, "");
}

/**
 * Real, standard deep links (venmo.com, paypal.me, cash.app) — no OAuth, no API key, no backend.
 * These just open the provider's own site/app the same way sharing a payment link anywhere else would.
 * Ascend never sees whether the payment actually completes.
 */
export function paymentLink(provider: PaymentProvider, handle: string, amount?: number, note?: string): string {
  const h = normalizeHandle(handle);
  const amt = amount && amount > 0 ? amount.toFixed(2) : undefined;
  if (provider === "venmo") {
    const params = new URLSearchParams({ txn: "pay", audience: "private", recipients: h });
    if (amt) params.set("amount", amt);
    if (note) params.set("note", note);
    return `https://venmo.com/?${params.toString()}`;
  }
  if (provider === "paypal") {
    return amt ? `https://paypal.me/${h}/${amt}` : `https://paypal.me/${h}`;
  }
  // cashapp
  return amt ? `https://cash.app/$${h}/${amt}` : `https://cash.app/$${h}`;
}

export interface StakePayout {
  winnerId: string;
  amountPerPerson: number;
  payerIds: string[];
  totalCollected: number;
}

/** Every non-winning participant owes the winner one share — derived at render time, nothing persisted. */
export function computeStakePayout(
  goal: Pick<Goal, "stakeAmount" | "winnerId" | "settledAt" | "participants">
): StakePayout | null {
  if (!goal.stakeAmount || !goal.winnerId || !goal.settledAt) return null;
  const payerIds = goal.participants
    .map((p: GoalParticipant) => p.userId)
    .filter((id) => id !== goal.winnerId);
  if (payerIds.length === 0) return null;
  return {
    winnerId: goal.winnerId,
    amountPerPerson: goal.stakeAmount,
    payerIds,
    totalCollected: goal.stakeAmount * payerIds.length,
  };
}

export function findHandle(handles: PaymentHandle[] | undefined, provider: PaymentProvider): string | undefined {
  return handles?.find((h) => h.provider === provider)?.handle;
}
