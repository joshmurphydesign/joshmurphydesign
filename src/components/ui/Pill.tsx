import { cn } from "@/lib/utils";

export function Pill({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "volt" | "violet" | "rival" | "gold" | "live";
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: "bg-ink-700 text-chalk-300 border border-white/5",
    volt: "bg-volt-500/15 text-volt-400 border border-volt-500/30",
    violet: "bg-ascend-violet/15 text-[#b6a6ff] border border-ascend-violet/30",
    rival: "bg-rival-500/15 text-[#ff8fae] border border-rival-500/30",
    gold: "bg-gold-500/15 text-gold-500 border border-gold-500/30",
    live: "bg-rival-500 text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
