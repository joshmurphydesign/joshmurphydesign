"use client";

import { useMemo } from "react";
import { useAuth } from "./auth-context";
import { USERS } from "./mock-data";
import type { User } from "./types";

export function useUserMap(): Record<string, User> {
  const { user } = useAuth();
  return useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of USERS) map[u.id] = u;
    if (user) map.me = user;
    return map;
  }, [user]);
}

export function useResolvedUser(userId: string): User | undefined {
  const map = useUserMap();
  return map[userId];
}
