"use client";

import { useEffect, useState } from "react";
import { countdown, pad2 } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CountdownTimer({
  endsAt,
  compact = false,
  className,
}: {
  endsAt: string;
  compact?: boolean;
  className?: string;
}) {
  const [time, setTime] = useState(() => countdown(endsAt));

  useEffect(() => {
    const id = setInterval(() => setTime(countdown(endsAt)), 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (time.done) {
    return <span className={cn("font-display text-sm text-chalk-500", className)}>ENDED</span>;
  }

  if (compact) {
    return (
      <span className={cn("font-display text-sm tabular-nums", className)}>
        {time.d > 0 && `${time.d}D `}
        {pad2(time.h)}:{pad2(time.m)}:{pad2(time.s)}
      </span>
    );
  }

  const units: [number, string][] = [
    [time.d, "D"],
    [time.h, "H"],
    [time.m, "M"],
    [time.s, "S"],
  ];

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {units.map(([val, label]) => (
        <div key={label} className="flex flex-col items-center rounded-xl bg-black/30 px-2.5 py-1.5 min-w-[46px]">
          <span className="font-display text-lg leading-none tabular-nums">{pad2(val)}</span>
          <span className="text-[10px] font-semibold text-chalk-500">{label}</span>
        </div>
      ))}
    </div>
  );
}
