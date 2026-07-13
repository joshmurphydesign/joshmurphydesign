"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { LoginScreen } from "@/components/auth/LoginScreen";

export default function LoginPage() {
  const { user, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && user) router.replace("/home");
  }, [isHydrated, user, router]);

  if (!isHydrated || user) return null;

  return <LoginScreen />;
}
