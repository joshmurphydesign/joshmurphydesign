import { cn } from "@/lib/utils";

export function Avatar({
  initials,
  gradient,
  size = 40,
  ring = false,
  className,
}: {
  initials: string;
  gradient: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-display text-chalk-100",
        ring && "ring-2 ring-ink-950",
        className
      )}
      style={{
        width: size,
        height: size,
        background: gradient,
        fontSize: size * 0.36,
        letterSpacing: "0.02em",
      }}
    >
      {initials}
    </div>
  );
}
