import Link from "next/link";
import { cn } from "@/lib/utils";

export function HeaderIconLink({
  href,
  icon,
  label,
  dot,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  dot?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/6 text-chalk-100"
    >
      {icon}
      {dot && <span className={cn("absolute right-2 top-2 h-2 w-2 rounded-full bg-rival-500")} />}
    </Link>
  );
}
