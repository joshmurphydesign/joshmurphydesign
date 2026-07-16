"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./auth-context";
import { isStepsGoal } from "./metric-presets";
import { COMPETITIONS, POWER_PLAYS } from "./mock-data";
import { normalizeActivity, normalizeGoal, normalizeMessage, normalizeNotification, normalizePost } from "./normalize";
import type {
  ActivityHistoryItem,
  Competition,
  Goal,
  GoalCategory,
  GoalMetric,
  GoalMode,
  HealthConnection,
  HealthProvider,
  Message,
  Notification,
  Post,
  PowerPlay,
  User,
} from "./types";

// PowerPlay/Competition and Health-connection state intentionally stay
// client-local (mock/simulated) — they're out of scope for this backend
// pass. Everything else (goals, posts, notifications, activity, messages,
// follows) is fetched from and persisted through the real API.
const LOCAL_KEY = "ascend_local_v1";

interface LocalShape {
  powerPlays: PowerPlay[];
  health: HealthConnection | null;
}

function loadLocal(): LocalShape {
  return { powerPlays: POWER_PLAYS, health: null };
}

export interface ThreadPreview {
  otherUserId: string;
  lastMessage: Message;
  unread: boolean;
}

interface DataContextValue {
  goals: Goal[];
  posts: Post[];
  competitions: Competition[];
  powerPlays: PowerPlay[];
  notifications: Notification[];
  activity: ActivityHistoryItem[];
  messages: Message[];
  following: string[];
  health: HealthConnection | null;
  otherUsers: User[];
  isHydrated: boolean;
  toggleReaction: (postId: string, emoji: string) => Promise<void>;
  addComment: (postId: string, text: string) => Promise<void>;
  joinGoal: (goalId: string, startValue?: number) => Promise<void>;
  joinPowerPlay: (powerPlayId: string) => void;
  createGoal: (params: {
    title: string;
    category: GoalCategory;
    mode: GoalMode;
    description: string;
    target: string;
    unit: string;
    durationDays: number;
    inviteeIds: string[];
    stake?: string;
    stakeAmount?: number;
    metric: GoalMetric;
    startingValue?: number;
  }) => Promise<Goal>;
  markNotificationsRead: () => Promise<void>;
  createPost: (params: { body: string; imageUrl?: string; goalId?: string }) => Promise<void>;
  logProgress: (goalId: string, value?: number, source?: "manual" | "health", imageUrl?: string) => Promise<void>;
  spendStreakFreeze: (goalId: string) => Promise<void>;
  settleGoal: (goalId: string) => Promise<void>;
  markStakePaid: (goalId: string) => Promise<void>;
  toggleFollow: (userId: string) => void;
  sendMessage: (otherUserId: string, text: string) => Promise<void>;
  markThreadRead: (otherUserId: string) => Promise<void>;
  threads: ThreadPreview[];
  connectHealth: (provider: HealthProvider) => void;
  disconnectHealth: () => void;
  syncHealth: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

async function parseJson<T>(res: Response): Promise<T> {
  return res.json().catch(() => ({})) as Promise<T>;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user, applyUserPatch } = useAuth();
  const userId = user?.id;

  const [goals, setGoals] = useState<Goal[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activity, setActivity] = useState<ActivityHistoryItem[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [threadReads, setThreadReads] = useState<Record<string, string>>({});
  const [otherUsers, setOtherUsers] = useState<User[]>([]);
  const [serverHydrated, setServerHydrated] = useState(false);

  const [local, setLocal] = useState<LocalShape>(loadLocal);
  const [localHydrated, setLocalHydrated] = useState(false);
  const { powerPlays, health } = local;

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_KEY);
      // One-time hydration from localStorage on mount; SSR has no access to
      // window, so this can't be a lazy useState initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setLocal(JSON.parse(raw) as LocalShape);
    } catch {
      // ignore corrupted state
    } finally {
      setLocalHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!localHydrated) return;
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(local));
  }, [local, localHydrated]);

  useEffect(() => {
    if (!userId) {
      // Resetting to logged-out defaults here (rather than leaving stale data
      // in place) matters if a different account logs in next on the same
      // device — without this, the new session could briefly render the
      // previous user's goals/posts before its own fetch resolves.
      /* eslint-disable react-hooks/set-state-in-effect */
      setGoals([]);
      setPosts([]);
      setNotifications([]);
      setActivity([]);
      setMessages([]);
      setFollowing([]);
      setThreadReads({});
      setOtherUsers([]);
      setServerHydrated(false);
      /* eslint-enable react-hooks/set-state-in-effect */
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch("/api/state").then((r) => parseJson<Record<string, unknown>>(r)),
      fetch("/api/users").then((r) => parseJson<{ users: User[] }>(r)),
    ])
      .then(([state, usersRes]) => {
        if (cancelled) return;
        setGoals(((state.goals as Goal[]) ?? []).map((g) => normalizeGoal(g, userId)));
        setPosts(((state.posts as Post[]) ?? []).map((p) => normalizePost(p, userId)));
        setNotifications(((state.notifications as Notification[]) ?? []).map((n) => normalizeNotification(n, userId)));
        setActivity(((state.activity as ActivityHistoryItem[]) ?? []).map((a) => normalizeActivity(a, userId)));
        setMessages(((state.messages as Message[]) ?? []).map((m) => normalizeMessage(m, userId)));
        setFollowing((state.following as string[]) ?? []);
        setThreadReads((state.threadReads as Record<string, string>) ?? {});
        setOtherUsers(usersRes.users ?? []);
      })
      .finally(() => {
        if (!cancelled) setServerHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const toggleReaction = useCallback(async (postId: string, emoji: string) => {
    const res = await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    const data = await parseJson<{ post?: Post }>(res);
    if (data.post && userId) {
      const post = normalizePost(data.post, userId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
    }
  }, [userId]);

  const addComment = useCallback(async (postId: string, text: string) => {
    const res = await fetch(`/api/posts/${postId}/comment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await parseJson<{ post?: Post }>(res);
    if (data.post && userId) {
      const post = normalizePost(data.post, userId);
      setPosts((prev) => prev.map((p) => (p.id === postId ? post : p)));
    }
  }, [userId]);

  const joinGoal = useCallback(async (goalId: string, startValue?: number) => {
    const res = await fetch(`/api/goals/${goalId}/join`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startValue }),
    });
    const data = await parseJson<{ goal?: Goal }>(res);
    if (data.goal && userId) {
      const goal = normalizeGoal(data.goal, userId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
    }
  }, [userId]);

  const joinPowerPlay = useCallback((powerPlayId: string) => {
    setLocal((prev) => ({
      ...prev,
      powerPlays: prev.powerPlays.map((pp) => {
        if (pp.id !== powerPlayId || pp.participantIds.includes("me")) return pp;
        const nextRank = pp.leaderboard.length + 1;
        return {
          ...pp,
          participantIds: [...pp.participantIds, "me"],
          leaderboard: [
            ...pp.leaderboard,
            { userId: "me", rank: nextRank, score: 0, delta: 0, metricLabel: `0 ${pp.unit}` },
          ],
        };
      }),
    }));
  }, []);

  const createGoal = useCallback(
    async (params: {
      title: string;
      category: GoalCategory;
      mode: GoalMode;
      description: string;
      target: string;
      unit: string;
      durationDays: number;
      inviteeIds: string[];
      stake?: string;
      stakeAmount?: number;
      metric: GoalMetric;
      startingValue?: number;
    }): Promise<Goal> => {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await parseJson<{ goal?: Goal; activity?: ActivityHistoryItem; error?: string }>(res);
      if (!res.ok || !data.goal || !userId) throw new Error(data.error ?? "Unable to create goal.");
      const goal = normalizeGoal(data.goal, userId);
      setGoals((prev) => [goal, ...prev]);
      if (data.activity) setActivity((prev) => [normalizeActivity(data.activity!, userId), ...prev]);
      return goal;
    },
    [userId]
  );

  const markNotificationsRead = useCallback(async () => {
    const res = await fetch("/api/notifications/read", { method: "POST" });
    const data = await parseJson<{ notifications?: Notification[] }>(res);
    if (data.notifications && userId) setNotifications(data.notifications.map((n) => normalizeNotification(n, userId)));
  }, [userId]);

  const createPost = useCallback(async (params: { body: string; imageUrl?: string; goalId?: string }) => {
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await parseJson<{ post?: Post; activity?: ActivityHistoryItem }>(res);
    if (data.post && userId) setPosts((prev) => [normalizePost(data.post!, userId), ...prev]);
    if (data.activity && userId) setActivity((prev) => [normalizeActivity(data.activity!, userId), ...prev]);
  }, [userId]);

  const logProgress = useCallback(
    async (goalId: string, value?: number, source: "manual" | "health" = "manual", imageUrl?: string) => {
      const providerLabel =
        source === "health"
          ? health?.provider === "apple"
            ? "Apple Health"
            : health?.provider === "samsung"
              ? "Samsung Health"
              : undefined
          : undefined;
      const providerEmoji = health?.provider === "apple" ? "\u{1F34E}" : "\u{231A}";

      const res = await fetch(`/api/goals/${goalId}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, source, providerLabel, providerEmoji, imageUrl }),
      });
      const data = await parseJson<{
        goal?: Goal;
        post?: Post;
        activity?: ActivityHistoryItem;
        user?: { points: number; freezes: number };
      }>(res);
      if (data.goal && userId) {
        const goal = normalizeGoal(data.goal, userId);
        setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
      }
      if (data.post && userId) setPosts((prev) => [normalizePost(data.post!, userId), ...prev]);
      if (data.activity && userId) setActivity((prev) => [normalizeActivity(data.activity!, userId), ...prev]);
      if (data.user) applyUserPatch({ points: data.user.points, freezes: data.user.freezes });
    },
    [health, applyUserPatch, userId]
  );

  const spendStreakFreeze = useCallback(
    async (goalId: string) => {
      if ((user?.freezes ?? 0) <= 0) return;
      const res = await fetch(`/api/goals/${goalId}/freeze`, { method: "POST" });
      const data = await parseJson<{
        goal?: Goal;
        activity?: ActivityHistoryItem;
        user?: { points: number; freezes: number };
      }>(res);
      if (data.goal && userId) {
        const goal = normalizeGoal(data.goal, userId);
        setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
      }
      if (data.activity && userId) setActivity((prev) => [normalizeActivity(data.activity!, userId), ...prev]);
      if (data.user) applyUserPatch({ points: data.user.points, freezes: data.user.freezes });
    },
    [user, applyUserPatch, userId]
  );

  const settleGoal = useCallback(
    async (goalId: string) => {
      const res = await fetch(`/api/goals/${goalId}/settle`, { method: "POST" });
      const data = await parseJson<{ goal?: Goal; post?: Post; user?: { points: number; freezes: number } }>(res);
      if (data.goal && userId) {
        const goal = normalizeGoal(data.goal, userId);
        setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
      }
      if (data.post && userId) setPosts((prev) => [normalizePost(data.post!, userId), ...prev]);
      if (data.user) applyUserPatch({ points: data.user.points, freezes: data.user.freezes });
    },
    [applyUserPatch, userId]
  );

  const markStakePaid = useCallback(async (goalId: string) => {
    const res = await fetch(`/api/goals/${goalId}/pay`, { method: "POST" });
    const data = await parseJson<{ goal?: Goal }>(res);
    if (data.goal && userId) {
      const goal = normalizeGoal(data.goal, userId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? goal : g)));
    }
  }, [userId]);

  const toggleFollow = useCallback((otherUserId: string) => {
    setFollowing((prev) => (prev.includes(otherUserId) ? prev.filter((id) => id !== otherUserId) : [...prev, otherUserId]));
    fetch(`/api/follow/${otherUserId}`, { method: "POST" }).catch(() => {});
  }, []);

  const sendMessage = useCallback(async (otherUserId: string, text: string) => {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherUserId, text }),
    });
    const data = await parseJson<{ message?: Message }>(res);
    if (data.message && userId) setMessages((prev) => [...prev, normalizeMessage(data.message!, userId)]);
  }, [userId]);

  const markThreadRead = useCallback(async (otherUserId: string) => {
    const res = await fetch(`/api/threads/${otherUserId}/read`, { method: "POST" });
    const data = await parseJson<{ otherUserId?: string; readAt?: string }>(res);
    if (data.readAt) setThreadReads((prev) => ({ ...prev, [otherUserId]: data.readAt! }));
  }, []);

  // Note: these two actions each fire exactly one API call and derive the
  // values they need (increment, eligible goals) from the component's own
  // `local`/`goals` closures rather than from inside a setState updater.
  const syncHealth = useCallback(() => {
    if (!health) return;
    const now = Date.now();
    const todayDate = new Date(now).toDateString();
    const isNewDay = health.todayDate !== todayDate;
    const previousSteps = isNewDay ? 0 : health.todaySteps;
    // Simulated step counter: a bigger jump for a brand-new day, a smaller
    // top-up on repeat syncs within the same day — steps only ever climb.
    const increment = isNewDay ? 900 + Math.floor(Math.random() * 1300) : 350 + Math.floor(Math.random() * 900);
    const eligibleGoalIds = goals
      .filter((g) => isStepsGoal(g) && g.participants.some((p) => p.userId === "me"))
      .map((g) => g.id);

    setLocal((prev) =>
      prev.health
        ? {
            ...prev,
            health: { ...prev.health, todaySteps: previousSteps + increment, todayDate, lastSyncedAt: new Date(now).toISOString() },
          }
        : prev
    );
    eligibleGoalIds.forEach((goalId) => void logProgress(goalId, increment, "health"));
  }, [health, goals, logProgress]);

  const connectHealth = useCallback(
    (provider: HealthProvider) => {
      const now = new Date();
      const initialSteps = 900 + Math.floor(Math.random() * 1300);
      const eligibleGoalIds = goals
        .filter((g) => isStepsGoal(g) && g.participants.some((p) => p.userId === "me"))
        .map((g) => g.id);

      setLocal((prev) => ({
        ...prev,
        health: {
          provider,
          connectedAt: now.toISOString(),
          todaySteps: initialSteps,
          todayDate: now.toDateString(),
          lastSyncedAt: now.toISOString(),
        },
      }));
      setActivity((prev) => [
        {
          id: `h-${now.getTime()}`,
          userId: "me",
          label: `Connected ${provider === "apple" ? "Apple Health" : "Samsung Health"}`,
          detail: "Steps will auto-sync into eligible goals",
          createdAt: now.toISOString(),
        },
        ...prev,
      ]);
      eligibleGoalIds.forEach((goalId) => void logProgress(goalId, initialSteps, "health"));
    },
    [goals, logProgress]
  );

  const disconnectHealth = useCallback(() => {
    setLocal((prev) => ({ ...prev, health: null }));
  }, []);

  const threads = useMemo<ThreadPreview[]>(() => {
    const byThread = new Map<string, Message[]>();
    for (const m of messages) {
      const list = byThread.get(m.threadId) ?? [];
      list.push(m);
      byThread.set(m.threadId, list);
    }
    return Array.from(byThread.entries())
      .map(([otherUserId, msgs]) => {
        const sorted = [...msgs].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        const lastMessage = sorted[0];
        const readAt = threadReads[otherUserId];
        const unread =
          lastMessage.senderId !== "me" &&
          (!readAt || new Date(lastMessage.createdAt).getTime() > new Date(readAt).getTime());
        return { otherUserId, lastMessage, unread };
      })
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [messages, threadReads]);

  const value = useMemo<DataContextValue>(
    () => ({
      goals,
      posts,
      competitions: COMPETITIONS,
      powerPlays,
      notifications,
      activity,
      messages,
      following,
      health,
      otherUsers,
      isHydrated: serverHydrated && localHydrated,
      toggleReaction,
      addComment,
      joinGoal,
      joinPowerPlay,
      createGoal,
      markNotificationsRead,
      createPost,
      logProgress,
      spendStreakFreeze,
      settleGoal,
      markStakePaid,
      toggleFollow,
      sendMessage,
      markThreadRead,
      threads,
      connectHealth,
      disconnectHealth,
      syncHealth,
    }),
    [
      goals,
      posts,
      powerPlays,
      notifications,
      activity,
      messages,
      following,
      health,
      otherUsers,
      serverHydrated,
      localHydrated,
      toggleReaction,
      addComment,
      joinGoal,
      joinPowerPlay,
      createGoal,
      markNotificationsRead,
      createPost,
      logProgress,
      spendStreakFreeze,
      settleGoal,
      markStakePaid,
      toggleFollow,
      sendMessage,
      markThreadRead,
      threads,
      connectHealth,
      disconnectHealth,
      syncHealth,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
