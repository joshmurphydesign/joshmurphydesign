"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "@/components/splash/SplashScreen";

const MIN_SPLASH_MS = 1400;

export default function EntryPage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!isHydrated || !minTimeElapsed) return;
    router.replace(user ? "/home" : "/login");
  }, [isHydrated, minTimeElapsed, user, router]);

  return (
    <AnimatePresence>
      <SplashScreen key="splash" durationMs={MIN_SPLASH_MS} />
    </AnimatePresence>
  );
}
