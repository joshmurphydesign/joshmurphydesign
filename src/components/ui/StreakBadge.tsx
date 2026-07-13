import { cn } from "@/lib/utils";

export function StreakBadge({ days, className }: { days: number; className?: string }) {
  if (days <= 0) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill bg-white/8 px-2.5 py-1 text-xs font-bold text-volt-400",
        className
      )}
    >
      <span aria-hidden>{"\u{1F525}"}</span>
      {days}
    </span>
  );
}
