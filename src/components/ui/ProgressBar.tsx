import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  gradientClassName = "bg-ascend-gradient",
  trackClassName,
  className,
  height = 8,
}: {
  value: number;
  gradientClassName?: string;
  trackClassName?: string;
  className?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("w-full overflow-hidden rounded-pill bg-white/8", trackClassName, className)}
      style={{ height }}
    >
      <div
        className={cn("h-full rounded-pill transition-[width] duration-700 ease-out", gradientClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
