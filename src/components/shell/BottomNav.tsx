"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { IconFeed, IconHome, IconPlus, IconTrophy, IconUser } from "@/components/ui/Icons";
import { AscendMark } from "@/components/ui/AscendMark";

const ITEMS = [
  { href: "/home", label: "Home", icon: IconHome },
  { href: "/feed", label: "Feed", icon: IconFeed },
  { href: "/create", label: "Create", icon: IconPlus, isCenter: true },
  { href: "/compete", label: "Compete", icon: IconTrophy },
  { href: "/profile", label: "Profile", icon: IconUser },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex w-full max-w-md justify-center px-4 pb-4 safe-bottom">
      <div className="flex w-full items-center justify-between rounded-[1.75rem] border border-white/8 bg-ink-900/85 px-2 py-2 backdrop-blur-xl shadow-[var(--shadow-lift)]">
        {ITEMS.map(({ href, label, icon: Icon, isCenter }) => {
          const active = pathname === href || pathname.startsWith(href + "/");

          if (isCenter) {
            return (
              <Link
                key={href}
                href={href}
                aria-label={label}
                className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-ascend-gradient shadow-[var(--shadow-glow-blue)] transition-transform active:scale-95"
              >
                <AscendMark size={30} />
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[10px] font-semibold"
            >
              <Icon
                className={cn("h-5 w-5 transition-colors", active ? "text-volt-400" : "text-chalk-700")}
              />
              <span className={cn(active ? "text-chalk-100" : "text-chalk-700")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
