"use client";

import { useRouter } from "next/navigation";
import { IconChevronLeft } from "@/components/ui/Icons";
import { cn } from "@/lib/utils";

export function TopBar({
  title,
  onBack,
  right,
  transparent = false,
  className,
}: {
  title?: string;
  onBack?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
  className?: string;
}) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex items-center gap-3 px-5 pb-3 pt-5 safe-top",
        !transparent && "bg-ink-950/85 backdrop-blur-xl",
        className
      )}
    >
      {onBack && (
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/6 text-chalk-100"
        >
          <IconChevronLeft className="h-5 w-5" />
        </button>
      )}
      {title && <h1 className="flex-1 truncate font-display text-lg tracking-wide text-chalk-100">{title}</h1>}
      {!title && <div className="flex-1" />}
      {right}
    </header>
  );
}
