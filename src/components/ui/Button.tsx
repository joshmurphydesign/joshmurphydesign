import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "volt" | "ghost" | "outline" | "danger";
type Size = "md" | "lg" | "sm";

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const base =
    "font-ui inline-flex items-center justify-center gap-2 rounded-pill font-semibold transition-transform active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none";

  const sizes: Record<Size, string> = {
    sm: "px-4 py-2 text-sm",
    md: "px-5 py-3 text-sm",
    lg: "px-6 py-4 text-base",
  };

  const variants: Record<Variant, string> = {
    primary: "bg-ascend-gradient text-white shadow-[var(--shadow-glow-blue)]",
    volt: "bg-volt-gradient text-white shadow-[var(--shadow-glow-volt)]",
    ghost: "bg-white/5 text-chalk-100 hover:bg-white/10",
    outline: "border border-chalk-300/15 text-chalk-100 hover:bg-white/5",
    danger: "bg-rival-500/15 text-[#ff8fa0] border border-rival-500/30",
  };

  return (
    <button className={cn(base, sizes[size], variants[variant], className)} {...props}>
      {children}
    </button>
  );
}
