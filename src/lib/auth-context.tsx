"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GoalCategory, PaymentHandle, User } from "./types";
import { initials } from "./profile";

export interface MeProfile extends User {
  email: string;
}

interface AuthContextValue {
  user: MeProfile | null;
  isHydrated: boolean;
  login: (email: string, password: string) => Promise<MeProfile>;
  signup: (params: { name: string; email: string; password: string; focus: GoalCategory[] }) => Promise<MeProfile>;
  logout: () => Promise<void>;
  updateProfile: (params: { name: string; bio: string; focus: GoalCategory[]; avatarColor: string }) => Promise<void>;
  updatePaymentHandles: (handles: PaymentHandle[]) => Promise<void>;
  /** Mirrors a points/freezes total the server already computed and persisted — no API call of its own. */
  applyUserPatch: (patch: Partial<Pick<MeProfile, "points" | "freezes">>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function parseJsonResponse(res: Response): Promise<{ user?: MeProfile; error?: string }> {
  return res.json().catch(() => ({}));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(parseJsonResponse)
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setIsHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await parseJsonResponse(res);
    if (!res.ok || !data.user) throw new Error(data.error ?? "Unable to log in.");
    setUser(data.user);
    return data.user;
  }, []);

  const signup = useCallback(
    async (params: { name: string; email: string; password: string; focus: GoalCategory[] }) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await parseJsonResponse(res);
      if (!res.ok || !data.user) throw new Error(data.error ?? "Unable to create account.");
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
  }, []);

  const updateProfile = useCallback(
    async (params: { name: string; bio: string; focus: GoalCategory[]; avatarColor: string }) => {
      setUser((prev) =>
        prev ? { ...prev, name: params.name, bio: params.bio, focus: params.focus, avatarColor: params.avatarColor, avatarInitials: initials(params.name) } : prev
      );
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await parseJsonResponse(res);
      if (res.ok && data.user) setUser(data.user);
    },
    []
  );

  const updatePaymentHandles = useCallback(async (handles: PaymentHandle[]) => {
    setUser((prev) => (prev ? { ...prev, paymentHandles: handles } : prev));
    const res = await fetch("/api/auth/payment-handles", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handles }),
    });
    const data = await parseJsonResponse(res);
    if (res.ok && data.user) setUser(data.user);
  }, []);

  const applyUserPatch = useCallback((patch: Partial<Pick<MeProfile, "points" | "freezes">>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const value = useMemo(
    () => ({ user, isHydrated, login, signup, logout, updateProfile, updatePaymentHandles, applyUserPatch }),
    [user, isHydrated, login, signup, logout, updateProfile, updatePaymentHandles, applyUserPatch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
