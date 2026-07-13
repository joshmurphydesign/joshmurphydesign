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
import {
  ACTIVITY_HISTORY,
  COMPETITIONS,
  GOALS,
  MESSAGES,
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
  Message,
  Notification,
  Post,
  PostType,
  PowerPlay,
} from "./types";

const DATA_KEY = "ascend_data_v2";

function isSameDay(a: string, b: number): boolean {
  return new Date(a).toDateString() === new Date(b).toDateString();
}
function isYesterday(a: string, b: number): boolean {
  const prev = new Date(b);
  prev.setDate(prev.getDate() - 1);
  return new Date(a).toDateString() === prev.toDateString();
}

interface PersistedShape {
  goals: Goal[];
  posts: Post[];
  powerPlays: PowerPlay[];
  notifications: Notification[];
  activity: ActivityHistoryItem[];
  messages: Message[];
  following: string[];
  threadReads: Record<string, string>;
}

function loadInitial(): PersistedShape {
  return {
    goals: GOALS,
    posts: POSTS,
    powerPlays: POWER_PLAYS,
    notifications: NOTIFICATIONS,
    activity: ACTIVITY_HISTORY,
    messages: MESSAGES,
    following: [],
    threadReads: {},
  };
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
    stake?: string;
  }) => Goal;
  markNotificationsRead: () => void;
  createPost: (params: { body: string; imageUrl?: string; goalId?: string }) => void;
  logProgress: (goalId: string) => void;
  spendStreakFreeze: (goalId: string) => void;
  settleGoal: (goalId: string) => void;
  toggleFollow: (userId: string) => void;
  sendMessage: (otherUserId: string, text: string) => void;
  markThreadRead: (otherUserId: string) => void;
  threads: ThreadPreview[];
}

const DataContext = createContext<DataContextValue | null>(null);

const GRADIENTS = [
  "linear-gradient(135deg,#0b3f7a,#35c2f2)",
  "linear-gradient(135deg,#1379c9,#3dd6ff)",
  "linear-gradient(135deg,#ffc23d,#ff3b5c)",
  "linear-gradient(135deg,#0f5132,#c8ff3d)",
  "linear-gradient(135deg,#ff3b5c,#0b3f7a)",
];

const DUEL_WIN_POINTS = 100;
const CHALLENGE_PLACE_POINTS = [300, 150, 75];
const CHALLENGE_PARTICIPATION_POINTS = 25;

export function pointsForPlacement(mode: GoalMode, rank: number): number {
  if (mode === "duel") return rank === 1 ? DUEL_WIN_POINTS : 0;
  if (mode === "challenge") {
    return rank <= CHALLENGE_PLACE_POINTS.length
      ? CHALLENGE_PLACE_POINTS[rank - 1]
      : CHALLENGE_PARTICIPATION_POINTS;
  }
  return 0;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { adjustPoints, adjustFreezes, user } = useAuth();
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
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || goal.participants.some((p) => p.userId === "me")) return prev;
      return {
        ...prev,
        goals: prev.goals.map((g) =>
          g.id !== goalId
            ? g
            : {
                ...g,
                participants: [
                  ...g.participants,
                  { userId: "me", progress: 0, joinedAt: new Date().toISOString(), isOwner: false },
                ],
              }
        ),
      };
    });
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
      stake?: string;
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
        stake: params.stake || undefined,
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

  const createPost = useCallback(
    (params: { body: string; imageUrl?: string; goalId?: string }) => {
      const now = new Date();
      setState((prev) => {
        const goal = params.goalId ? prev.goals.find((g) => g.id === params.goalId) : undefined;
        const me = goal?.participants.find((p) => p.userId === "me");

        let type: PostType = "encouragement";
        let headline = "Shared an update";
        let statValue: string | undefined;
        let statLabel: string | undefined;

        if (goal && me) {
          statValue = `${me.progress}%`;
          statLabel = "progress";
          if (me.progress >= 100) {
            type = "win";
            headline = `Hit the target on ${goal.title}`;
          } else if (goal.streak > 0 && goal.streak % 7 === 0) {
            type = "streak";
            headline = `${goal.streak}-day streak on ${goal.title}`;
          } else {
            type = "progress";
            headline = `Checkpoint: ${goal.title}`;
          }
        } else if (params.imageUrl) {
          headline = "Shared a photo";
        }

        const post: Post = {
          id: `p-${now.getTime()}`,
          userId: "me",
          goalId: params.goalId,
          type,
          headline,
          body: params.body,
          statValue,
          statLabel,
          imageUrl: params.imageUrl,
          createdAt: now.toISOString(),
          reactions: [],
          comments: [],
        };

        return {
          ...prev,
          posts: [post, ...prev.posts],
          activity: [
            {
              id: `h-${now.getTime()}`,
              userId: "me",
              label: params.imageUrl ? "Shared a photo update" : "Posted to the feed",
              detail: goal ? goal.title : params.body.slice(0, 48),
              createdAt: now.toISOString(),
            },
            ...prev.activity,
          ],
        };
      });
    },
    []
  );

  const logProgress = useCallback(
    (goalId: string) => {
      const now = Date.now();
      setState((prev) => {
        const goal = prev.goals.find((g) => g.id === goalId);
        if (!goal) return prev;
        const me = goal.participants.find((p) => p.userId === "me");
        if (!me || (me.lastLoggedAt && isSameDay(me.lastLoggedAt, now))) return prev;

        const step = Math.max(1, Math.round(100 / goal.durationDays));
        const nextProgress = Math.min(100, me.progress + step);
        const continuing = !!me.lastLoggedAt && isYesterday(me.lastLoggedAt, now);
        const nextStreak = continuing ? goal.streak + 1 : 1;

        const nowIso = new Date(now).toISOString();
        const updatedParticipants = goal.participants.map((p) =>
          p.userId === "me" ? { ...p, progress: nextProgress, lastLoggedAt: nowIso } : p
        );
        const aggregateProgress = Math.round(
          updatedParticipants.reduce((sum, p) => sum + p.progress, 0) / updatedParticipants.length
        );

        const milestone = nextStreak > 0 && nextStreak % 7 === 0;
        if (milestone) adjustFreezes(1);

        const hitTarget = nextProgress >= 100 && me.progress < 100;
        const post: Post = {
          id: `p-${now}`,
          userId: "me",
          goalId: goal.id,
          type: hitTarget ? "win" : milestone ? "streak" : "progress",
          headline: hitTarget
            ? `Hit the target on ${goal.title}`
            : milestone
              ? `${nextStreak}-day streak on ${goal.title}`
              : `Logged progress on ${goal.title}`,
          body: hitTarget
            ? "Target complete. Show up, stand out — mission accomplished."
            : milestone
              ? `${nextStreak} days in a row. Earned a streak freeze for staying consistent.`
              : `Day ${nextStreak} logged. ${nextProgress}% of the way there.`,
          statValue: `${nextProgress}%`,
          statLabel: "progress",
          createdAt: nowIso,
          reactions: [],
          comments: [],
        };

        return {
          ...prev,
          goals: prev.goals.map((g) =>
            g.id !== goalId
              ? g
              : { ...g, participants: updatedParticipants, progress: aggregateProgress, streak: nextStreak }
          ),
          posts: [post, ...prev.posts],
          activity: [
            {
              id: `h-${now}`,
              userId: "me",
              label: `Logged progress`,
              detail: `${goal.title} — day ${nextStreak}`,
              createdAt: nowIso,
            },
            ...prev.activity,
          ],
        };
      });
    },
    [adjustFreezes]
  );

  const spendStreakFreeze = useCallback(
    (goalId: string) => {
      if ((user?.freezes ?? 0) <= 0) return;
      const now = new Date();
      setState((prev) => {
        const goal = prev.goals.find((g) => g.id === goalId);
        if (!goal) return prev;
        const me = goal.participants.find((p) => p.userId === "me");
        if (!me || (me.lastLoggedAt && isSameDay(me.lastLoggedAt, now.getTime()))) return prev;
        return {
          ...prev,
          goals: prev.goals.map((g) =>
            g.id !== goalId
              ? g
              : {
                  ...g,
                  participants: g.participants.map((p) =>
                    p.userId === "me" ? { ...p, lastLoggedAt: now.toISOString() } : p
                  ),
                }
          ),
          activity: [
            {
              id: `h-${now.getTime()}`,
              userId: "me",
              label: "Used a streak freeze",
              detail: goal.title,
              createdAt: now.toISOString(),
            },
            ...prev.activity,
          ],
        };
      });
      adjustFreezes(-1);
    },
    [user, adjustFreezes]
  );

  const settleGoal = useCallback(
    (goalId: string) => {
      const now = new Date();
      let myAward = 0;
      setState((prev) => {
        const goal = prev.goals.find((g) => g.id === goalId);
        if (!goal || goal.settledAt) return prev;
        const ranked = [...goal.participants].sort((a, b) => b.progress - a.progress);
        const winner = ranked[0];
        const myRank = ranked.findIndex((p) => p.userId === "me");
        if (myRank >= 0) myAward = pointsForPlacement(goal.mode, myRank + 1);
        const winnerPoints = pointsForPlacement(goal.mode, 1);
        const post: Post = {
          id: `p-${now.getTime()}`,
          userId: winner.userId,
          goalId: goal.id,
          type: "competition-result",
          headline: `Won ${goal.title}`,
          body: goal.stake
            ? `Took the top spot — ${goal.stake}. Earned ${winnerPoints} points.`
            : `Took the top spot and earned ${winnerPoints} points.`,
          statValue: `+${winnerPoints}`,
          statLabel: "points",
          createdAt: now.toISOString(),
          reactions: [],
          comments: [],
        };
        return {
          ...prev,
          goals: prev.goals.map((g) =>
            g.id !== goalId
              ? g
              : { ...g, status: "completed", settledAt: now.toISOString(), winnerId: winner.userId }
          ),
          posts: [post, ...prev.posts],
        };
      });
      if (myAward > 0) adjustPoints(myAward);
    },
    [adjustPoints]
  );

  const toggleFollow = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      following: prev.following.includes(userId)
        ? prev.following.filter((id) => id !== userId)
        : [...prev.following, userId],
    }));
  }, []);

  const sendMessage = useCallback((otherUserId: string, text: string) => {
    const message: Message = {
      id: `m-${Date.now()}`,
      threadId: otherUserId,
      senderId: "me",
      text,
      createdAt: new Date().toISOString(),
    };
    setState((prev) => ({ ...prev, messages: [...prev.messages, message] }));
  }, []);

  const markThreadRead = useCallback((otherUserId: string) => {
    const now = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      threadReads: { ...prev.threadReads, [otherUserId]: now },
    }));
  }, []);

  const threads = useMemo<ThreadPreview[]>(() => {
    const byThread = new Map<string, Message[]>();
    for (const m of state.messages) {
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
        const readAt = state.threadReads[otherUserId];
        const unread =
          lastMessage.senderId !== "me" &&
          (!readAt || new Date(lastMessage.createdAt).getTime() > new Date(readAt).getTime());
        return { otherUserId, lastMessage, unread };
      })
      .sort((a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime());
  }, [state.messages, state.threadReads]);

  const value = useMemo<DataContextValue>(
    () => ({
      goals: state.goals,
      posts: state.posts,
      competitions: COMPETITIONS,
      powerPlays: state.powerPlays,
      notifications: state.notifications,
      activity: state.activity,
      messages: state.messages,
      following: state.following,
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
      toggleFollow,
      sendMessage,
      markThreadRead,
      threads,
    }),
    [
      state,
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
      toggleFollow,
      sendMessage,
      markThreadRead,
      threads,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
