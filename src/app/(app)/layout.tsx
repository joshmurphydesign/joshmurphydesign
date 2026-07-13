"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/shell/BottomNav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !user) router.replace("/login");
  }, [isHydrated, user, router]);

  if (!isHydrated || !user) {
    return <div className="min-h-dvh bg-ink-950" />;
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-ink-950">
      <div className="flex-1 pb-28">{children}</div>
      <BottomNav />
    </div>
  );
}
