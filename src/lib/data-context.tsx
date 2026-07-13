"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ACTIVITY_HISTORY,
  COMPETITIONS,
  GOALS,
  NOTIFICATIONS,
  POSTS,
  POWER_PLAYS,
} from "./mock-data";
import type {
  ActivityHistoryItem,
  Comment,
  Competition,
  Goal,
  GoalCategory,
  GoalMode,
  Notification,
  Post,
  PowerPlay,
} from "./types";

const DATA_KEY = "ascend_data_v1";

interface PersistedShape {
  goals: Goal[];
  posts: Post[];
  powerPlays: PowerPlay[];
  notifications: Notification[];
  activity: ActivityHistoryItem[];
}

function loadInitial(): PersistedShape {
  return {
    goals: GOALS,
    posts: POSTS,
    powerPlays: POWER_PLAYS,
    notifications: NOTIFICATIONS,
    activity: ACTIVITY_HISTORY,
  };
}

interface DataContextValue {
  goals: Goal[];
  posts: Post[];
  competitions: Competition[];
  powerPlays: PowerPlay[];
  notifications: Notification[];
  activity: ActivityHistoryItem[];
  toggleReaction: (postId: string, emoji: string) => void;
  addComment: (postId: string, text: string) => void;
  joinGoal: (goalId: string) => void;
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
  }) => Goal;
  markNotificationsRead: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

const GRADIENTS = [
  "linear-gradient(135deg,#3d2ee0,#ff5c3d)",
  "linear-gradient(135deg,#6a4cff,#3dd6ff)",
  "linear-gradient(135deg,#ffc23d,#ff2d6b)",
  "linear-gradient(135deg,#0f5132,#c8ff3d)",
  "linear-gradient(135deg,#ff2d6b,#3d2ee0)",
];

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedShape>(loadInitial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(DATA_KEY);
      // One-time hydration from localStorage on mount; SSR has no access to
      // window, so this can't be a lazy useState initializer.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setState(JSON.parse(raw) as PersistedShape);
    } catch {
      // ignore corrupted state
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(DATA_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const toggleReaction = useCallback((postId: string, emoji: string) => {
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) => {
        if (post.id !== postId) return post;
        const reactions = post.reactions.map((r) => ({ ...r, userIds: [...r.userIds] }));
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
          const has = existing.userIds.includes("me");
          existing.userIds = has
            ? existing.userIds.filter((id) => id !== "me")
            : [...existing.userIds, "me"];
        } else {
          reactions.push({ emoji, userIds: ["me"] });
        }
        return { ...post, reactions: reactions.filter((r) => r.userIds.length > 0) };
      }),
    }));
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    const comment: Comment = {
      id: `c-${Date.now()}`,
      userId: "me",
      text,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      posts: prev.posts.map((post) =>
        post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
      ),
    }));
  }, []);

  const joinGoal = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((goal) => {
        if (goal.id !== goalId) return goal;
        if (goal.participants.some((p) => p.userId === "me")) return goal;
        return {
          ...goal,
          participants: [
            ...goal.participants,
            { userId: "me", progress: 0, joinedAt: new Date().toISOString(), isOwner: false },
          ],
        };
      }),
    }));
  }, []);

  const joinPowerPlay = useCallback((powerPlayId: string) => {
    setState((prev) => ({
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
    (params: {
      title: string;
      category: GoalCategory;
      mode: GoalMode;
      description: string;
      target: string;
      unit: string;
      durationDays: number;
      inviteeIds: string[];
    }): Goal => {
      const now = new Date();
      const end = new Date(now.getTime() + params.durationDays * 86400 * 1000);
      const goal: Goal = {
        id: `g-${Date.now()}`,
        title: params.title,
        category: params.category,
        mode: params.mode,
        description: params.description,
        target: params.target,
        unit: params.unit,
        durationDays: params.durationDays,
        startDate: now.toISOString(),
        endDate: end.toISOString(),
        status: "active",
        progress: 0,
        streak: 0,
        coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)],
        participants: [
          { userId: "me", progress: 0, joinedAt: now.toISOString(), isOwner: true },
          ...params.inviteeIds.map((id) => ({
            userId: id,
            progress: 0,
            joinedAt: now.toISOString(),
            isOwner: false,
          })),
        ],
      };
      setState((prev) => ({
        ...prev,
        goals: [goal, ...prev.goals],
        activity: [
          {
            id: `h-${Date.now()}`,
            userId: "me",
            label: `Created ${params.title}`,
            detail: params.inviteeIds.length
              ? `Rallied ${params.inviteeIds.length} to join`
              : "Solo goal started",
            createdAt: now.toISOString(),
          },
          ...prev.activity,
        ],
      }));
      return goal;
    },
    []
  );

  const markNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      goals: state.goals,
      posts: state.posts,
      competitions: COMPETITIONS,
      powerPlays: state.powerPlays,
      notifications: state.notifications,
      activity: state.activity,
      toggleReaction,
      addComment,
      joinGoal,
      joinPowerPlay,
      createGoal,
      markNotificationsRead,
    }),
    [state, toggleReaction, addComment, joinGoal, joinPowerPlay, createGoal, markNotificationsRead]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
