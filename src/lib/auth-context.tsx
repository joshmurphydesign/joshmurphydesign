"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { GoalCategory, User } from "./types";

const SESSION_KEY = "ascend_session_v1";

export interface MeProfile extends User {
  email: string;
}

interface AuthContextValue {
  user: MeProfile | null;
  isHydrated: boolean;
  login: (email: string, name?: string) => MeProfile;
  signup: (params: { name: string; email: string; focus: GoalCategory[] }) => MeProfile;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function buildProfile(name: string, email: string, focus: GoalCategory[] = ["consistency"]): MeProfile {
  return {
    id: "me",
    name,
    handle: name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "athlete",
    email,
    avatarColor: "linear-gradient(135deg,#6a4cff,#ff5c3d)",
    avatarInitials: initials(name),
    focus,
    bio: "New to Ascend. Ready to rally.",
    score: 2410,
    streak: 4,
    followers: 12,
    following: 8,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeProfile | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      // One-time hydration from localStorage on mount; SSR has no access to
      // window, so this can't be a lazy useState initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setUser(JSON.parse(raw) as MeProfile);
    } catch {
      // ignore corrupted session
    } finally {
      setIsHydrated(true);
    }
  }, []);

  const persist = useCallback((profile: MeProfile | null) => {
    setUser(profile);
    if (profile) {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(profile));
    } else {
      window.localStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const login = useCallback(
    (email: string, name?: string) => {
      const existingRaw = window.localStorage.getItem(SESSION_KEY);
      if (existingRaw) {
        const existing = JSON.parse(existingRaw) as MeProfile;
        if (existing.email.toLowerCase() === email.toLowerCase()) {
          persist(existing);
          return existing;
        }
      }
      const profile = buildProfile(name || email.split("@")[0], email);
      persist(profile);
      return profile;
    },
    [persist]
  );

  const signup = useCallback(
    (params: { name: string; email: string; focus: GoalCategory[] }) => {
      const profile = buildProfile(params.name, params.email, params.focus);
      persist(profile);
      return profile;
    },
    [persist]
  );

  const logout = useCallback(() => {
    persist(null);
  }, [persist]);

  const value = useMemo(
    () => ({ user, isHydrated, login, signup, logout }),
    [user, isHydrated, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
