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
import { computeProgress, isStepsGoal, metricAllowsRepeatLogging, metricIsCumulative, metricIsEntryBased, metricNeedsBaseline } from "./metric-presets";
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
  GoalMetric,
  GoalMode,
  GoalParticipant,
  HealthConnection,
  HealthProvider,
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
  health: HealthConnection | null;
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
    health: null,
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
  health: HealthConnection | null;
  toggleReaction: (postId: string, emoji: string) => void;
  addComment: (postId: string, text: string) => void;
  joinGoal: (goalId: string, startValue?: number) => void;
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
  }) => Goal;
  markNotificationsRead: () => void;
  createPost: (params: { body: string; imageUrl?: string; goalId?: string }) => void;
  logProgress: (goalId: string, value?: number, source?: "manual" | "health") => void;
  spendStreakFreeze: (goalId: string) => void;
  settleGoal: (goalId: string) => void;
  markStakePaid: (goalId: string) => void;
  toggleFollow: (userId: string) => void;
  sendMessage: (otherUserId: string, text: string) => void;
  markThreadRead: (otherUserId: string) => void;
  threads: ThreadPreview[];
  connectHealth: (provider: HealthProvider) => void;
  disconnectHealth: () => void;
  syncHealth: () => void;
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

  const joinGoal = useCallback((goalId: string, startValue?: number) => {
    setState((prev) => {
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || goal.participants.some((p) => p.userId === "me")) return prev;
      const needsBaseline = metricNeedsBaseline(goal.metric.type);
      const participant: GoalParticipant = {
        userId: "me",
        progress: 0,
        joinedAt: new Date().toISOString(),
        isOwner: false,
        ...(needsBaseline ? { startValue: startValue ?? 0, currentValue: startValue ?? 0 } : {}),
      };
      return {
        ...prev,
        goals: prev.goals.map((g) =>
          g.id !== goalId ? g : { ...g, participants: [...g.participants, participant] }
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
      stakeAmount?: number;
      metric: GoalMetric;
      startingValue?: number;
    }): Goal => {
      const now = new Date();
      const end = new Date(now.getTime() + params.durationDays * 86400 * 1000);
      const needsBaseline = metricNeedsBaseline(params.metric.type);
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
        stakeAmount: params.stakeAmount && params.stakeAmount > 0 ? params.stakeAmount : undefined,
        metric: params.metric,
        participants: [
          {
            userId: "me",
            progress: 0,
            joinedAt: now.toISOString(),
            isOwner: true,
            ...(needsBaseline ? { startValue: params.startingValue ?? 0, currentValue: params.startingValue ?? 0 } : {}),
          },
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
    (goalId: string, value?: number, source: "manual" | "health" = "manual") => {
      const now = Date.now();
      setState((prev) => {
        const goal = prev.goals.find((g) => g.id === goalId);
        if (!goal) return prev;
        const me = goal.participants.find((p) => p.userId === "me");
        if (!me) return prev;

        const metric = goal.metric;
        const isCumulative = metricIsCumulative(metric.type);
        const isEntryBased = metricIsEntryBased(metric.type);
        // Cumulative goals (steps, reps, distance...) are naturally multi-session, and
        // entry-based goals (a score, a lift, a time — a specific number you're working
        // toward) are attempts logged whenever they happen, not a daily habit. Binary is
        // the only metric that's a true once-a-day check-in, so it keeps the daily cap.
        const alreadyLoggedToday = !!me.lastLoggedAt && isSameDay(me.lastLoggedAt, now);
        if (alreadyLoggedToday && !metricAllowsRepeatLogging(metric.type)) return prev;

        let nextCurrentValue = me.currentValue;
        let nextProgress: number;
        let isNewBest = false;
        if (metric.type === "binary") {
          const step = Math.max(1, Math.round(100 / goal.durationDays));
          nextProgress = Math.min(100, me.progress + step);
        } else if (isCumulative) {
          nextCurrentValue = (me.currentValue ?? 0) + (value ?? 0);
          nextProgress = computeProgress(metric, { progress: me.progress, startValue: me.startValue, currentValue: nextCurrentValue });
        } else {
          // Entry-based: each log is an attempt — only a new high (increase) or new low
          // (decrease) actually moves your number. A worse attempt still shows up in
          // activity, but it doesn't undo your personal best or your progress.
          const prevBest = me.currentValue ?? me.startValue ?? 0;
          const attempt = value ?? prevBest;
          nextCurrentValue = metric.type === "increase" ? Math.max(attempt, prevBest) : Math.min(attempt, prevBest);
          isNewBest = nextCurrentValue !== prevBest;
          nextProgress = computeProgress(metric, { progress: me.progress, startValue: me.startValue, currentValue: nextCurrentValue });
        }

        // Entry-based goals don't carry a day-streak — you don't attempt a new 1RM or
        // golf round daily, so there's no "day in a row" to track or protect.
        const nextStreak = isEntryBased
          ? goal.streak
          : alreadyLoggedToday
            ? goal.streak
            : !!me.lastLoggedAt && isYesterday(me.lastLoggedAt, now)
              ? goal.streak + 1
              : 1;

        const nowIso = new Date(now).toISOString();
        const updatedParticipants = goal.participants.map((p) =>
          p.userId === "me" ? { ...p, progress: nextProgress, currentValue: nextCurrentValue, lastLoggedAt: nowIso } : p
        );
        const aggregateProgress = Math.round(
          updatedParticipants.reduce((sum, p) => sum + p.progress, 0) / updatedParticipants.length
        );

        // Streak-freeze milestones only make sense for day-streaks — entry-based
        // goals have no daily obligation to protect.
        const milestone = !isEntryBased && !alreadyLoggedToday && nextStreak > 0 && nextStreak % 7 === 0;
        if (milestone) adjustFreezes(1);

        const hitTarget = nextProgress >= 100 && me.progress < 100;
        const valueLabel =
          metric.type === "binary"
            ? undefined
            : isCumulative
              ? `${nextCurrentValue} ${goal.unit} logged`
              : `${nextCurrentValue} ${goal.unit}`;

        const isHealthSync = source === "health";
        const providerLabel =
          prev.health?.provider === "apple" ? "Apple Health" : prev.health?.provider === "samsung" ? "Samsung Health" : undefined;
        const providerEmoji = prev.health?.provider === "apple" ? "\u{1F34E}" : "\u{231A}";
        // Repeated health syncs update progress every time, but only the first sync of
        // the day (or a moment worth celebrating) is worth a public feed post — otherwise
        // tapping "Sync now" a few times floods the feed with near-identical entries.
        const shouldPostToFeed = !isHealthSync || !alreadyLoggedToday || hitTarget || milestone;

        const post: Post = {
          id: `p-${now}`,
          userId: "me",
          goalId: goal.id,
          type: hitTarget ? "win" : milestone ? "streak" : "progress",
          headline: hitTarget
            ? `Hit the target on ${goal.title}`
            : milestone
              ? `${nextStreak}-day streak on ${goal.title}`
              : isEntryBased
                ? isNewBest
                  ? `New best on ${goal.title}: ${nextCurrentValue} ${goal.unit}`
                  : `Logged an attempt on ${goal.title}`
                : isHealthSync && providerLabel
                  ? `${providerEmoji} ${providerLabel} synced ${goal.title}`
                  : alreadyLoggedToday
                    ? `Added more to ${goal.title}`
                    : `Logged progress on ${goal.title}`,
          body: hitTarget
            ? "Target complete. Show up, stand out — mission accomplished."
            : milestone
              ? `${nextStreak} days in a row. Earned a streak freeze for staying consistent.`
              : isEntryBased
                ? isNewBest
                  ? `New personal best. ${nextProgress}% of the way there.`
                  : `Attempt logged — best stays ${nextCurrentValue} ${goal.unit}.`
                : valueLabel
                  ? `${isHealthSync ? "Auto-synced" : alreadyLoggedToday ? "Another entry" : `Day ${nextStreak} logged`} — ${valueLabel}. ${nextProgress}% of the way there.`
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
          posts: shouldPostToFeed ? [post, ...prev.posts] : prev.posts,
          activity: [
            {
              id: `h-${now}`,
              userId: "me",
              label: isEntryBased
                ? isNewBest
                  ? "Logged a new best"
                  : "Logged an attempt"
                : isHealthSync && providerLabel
                  ? `Auto-synced from ${providerLabel}`
                  : alreadyLoggedToday
                    ? "Logged more progress"
                    : "Logged progress",
              detail: isEntryBased ? `${goal.title} — ${nextCurrentValue} ${goal.unit}` : `${goal.title} — day ${nextStreak}`,
              createdAt: nowIso,
            },
            ...prev.activity,
          ],
        };
      });
    },
    [adjustFreezes]
  );

  // Note: these two actions each fire exactly one setState call against
  // `state` and derive the values they need (delta, eligible goals) from the
  // component's own `state` closure rather than from inside the updater.
  // Chaining a second `setState` off the first (e.g. connectHealth calling
  // syncHealth synchronously) only eagerly runs the *first* queued updater —
  // the second is deferred to the batched render, so reading a variable it
  // was meant to set immediately afterward silently sees stale defaults.
  const syncHealth = useCallback(() => {
    if (!state.health) return;
    const now = Date.now();
    const todayDate = new Date(now).toDateString();
    const isNewDay = state.health.todayDate !== todayDate;
    const previousSteps = isNewDay ? 0 : state.health.todaySteps;
    // Simulated step counter: a bigger jump for a brand-new day, a smaller
    // top-up on repeat syncs within the same day — steps only ever climb.
    const increment = isNewDay ? 900 + Math.floor(Math.random() * 1300) : 350 + Math.floor(Math.random() * 900);
    const eligibleGoalIds = state.goals
      .filter((g) => isStepsGoal(g) && g.participants.some((p) => p.userId === "me"))
      .map((g) => g.id);

    setState((prev) =>
      prev.health
        ? {
            ...prev,
            health: {
              ...prev.health,
              todaySteps: previousSteps + increment,
              todayDate,
              lastSyncedAt: new Date(now).toISOString(),
            },
          }
        : prev
    );
    eligibleGoalIds.forEach((goalId) => logProgress(goalId, increment, "health"));
  }, [state.health, state.goals, logProgress]);

  const connectHealth = useCallback(
    (provider: HealthProvider) => {
      const now = new Date();
      const initialSteps = 900 + Math.floor(Math.random() * 1300);
      const eligibleGoalIds = state.goals
        .filter((g) => isStepsGoal(g) && g.participants.some((p) => p.userId === "me"))
        .map((g) => g.id);

      setState((prev) => ({
        ...prev,
        health: {
          provider,
          connectedAt: now.toISOString(),
          todaySteps: initialSteps,
          todayDate: now.toDateString(),
          lastSyncedAt: now.toISOString(),
        },
        activity: [
          {
            id: `h-${now.getTime()}`,
            userId: "me",
            label: `Connected ${provider === "apple" ? "Apple Health" : "Samsung Health"}`,
            detail: "Steps will auto-sync into eligible goals",
            createdAt: now.toISOString(),
          },
          ...prev.activity,
        ],
      }));
      eligibleGoalIds.forEach((goalId) => logProgress(goalId, initialSteps, "health"));
    },
    [state.goals, logProgress]
  );

  const disconnectHealth = useCallback(() => {
    setState((prev) => ({ ...prev, health: null }));
  }, []);

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

  const markStakePaid = useCallback((goalId: string) => {
    setState((prev) => ({
      ...prev,
      goals: prev.goals.map((g) => {
        if (g.id !== goalId) return g;
        const paid = g.paidByUserIds ?? [];
        return {
          ...g,
          paidByUserIds: paid.includes("me") ? paid.filter((id) => id !== "me") : [...paid, "me"],
        };
      }),
    }));
  }, []);

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
      health: state.health,
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
