"use client";

import { useMemo } from "react";
import { useAuth } from "./auth-context";
import { useData } from "./data-context";
import type { User } from "./types";

export function useUserMap(): Record<string, User> {
  const { user } = useAuth();
  const { otherUsers } = useData();
  return useMemo(() => {
    const map: Record<string, User> = {};
    for (const u of otherUsers) map[u.id] = u;
    // The signed-in user's real database id is intentionally not "me" — see
    // normalize.ts — so it's overridden here to match how every other
    // fetched record refers to the current user.
    if (user) map.me = { ...user, id: "me" };
    return map;
  }, [user, otherUsers]);
}

export function useResolvedUser(userId: string): User | undefined {
  const map = useUserMap();
  return map[userId];
}
