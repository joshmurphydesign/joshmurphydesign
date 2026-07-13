import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const hoursAgo = (h: number) => new Date(Date.now() - h * 3600 * 1000);
const daysAgo = (d: number) => hoursAgo(d * 24);
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600 * 1000);
const daysFromNow = (d: number) => hoursFromNow(d * 24);

function coverArt(from: string, to: string, emoji: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${from}'/><stop offset='1' stop-color='${to}'/></linearGradient></defs><rect width='800' height='1000' fill='url(#g)'/><text x='400' y='560' font-size='280' text-anchor='middle' dominant-baseline='middle'>${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// The demo account you can actually log in as. Everyone else is a seeded
// NPC — their accounts exist so goals/posts/DMs have someone to be from,
// but they don't have a usable password.
const DEMO_EMAIL = "joshuahockey@comcast.net";
const DEMO_PASSWORD = "ascend2026";

interface SeedUser {
  id: string;
  name: string;
  handle: string;
  avatarColor: string;
  avatarInitials: string;
  focus: string[];
  bio: string;
  score: number;
  streak: number;
  followers: number;
  following: number;
  location?: string;
  points: number;
  freezes: number;
  paymentHandles?: { provider: string; handle: string }[];
}

const NPC_USERS: SeedUser[] = [
  {
    id: "u-maya",
    name: "Maya Chen",
    handle: "mayasprints",
    avatarColor: "linear-gradient(135deg,#1379c9,#35c2f2)",
    avatarInitials: "MC",
    focus: ["running", "consistency"],
    bio: "5K PR chaser. Sunrise miles only. Coach @ Ridgeline TC.",
    score: 4820,
    streak: 41,
    followers: 1204,
    following: 318,
    location: "Denver, CO",
    points: 1340,
    freezes: 2,
  },
  {
    id: "u-dre",
    name: "Andre Walsh",
    handle: "drewalsh",
    avatarColor: "linear-gradient(135deg,#ff3b5c,#ffc23d)",
    avatarInitials: "AW",
    focus: ["strength", "basketball"],
    bio: "Strength coach. Rim protector on weekends. 405 club.",
    score: 5310,
    streak: 63,
    followers: 2011,
    following: 220,
    location: "Austin, TX",
    points: 1820,
    freezes: 1,
    paymentHandles: [{ provider: "cashapp", handle: "AndreWalsh" }],
  },
  {
    id: "u-sam",
    name: "Sam Ibarra",
    handle: "samplays",
    avatarColor: "linear-gradient(135deg,#35c2f2,#0b3f7a)",
    avatarInitials: "SI",
    focus: ["golf", "mobility"],
    bio: "Scratch handicap in progress. Mobility over everything.",
    score: 3120,
    streak: 12,
    followers: 640,
    following: 402,
    location: "Scottsdale, AZ",
    points: 640,
    freezes: 0,
  },
  {
    id: "u-priya",
    name: "Priya Nair",
    handle: "priyalifts",
    avatarColor: "linear-gradient(135deg,#c8ff3d,#3dd6ff)",
    avatarInitials: "PN",
    focus: ["strength", "nutrition"],
    bio: "Powerlifter. 3x meet competitor. Macros nerd.",
    score: 6042,
    streak: 88,
    followers: 3402,
    following: 190,
    location: "Brooklyn, NY",
    points: 2450,
    freezes: 3,
    paymentHandles: [{ provider: "paypal", handle: "priyalifts" }],
  },
  {
    id: "u-jonah",
    name: "Jonah Ricci",
    handle: "jricci",
    avatarColor: "linear-gradient(135deg,#ffc23d,#ff3b5c)",
    avatarInitials: "JR",
    focus: ["steps", "habits", "recovery"],
    bio: "10K steps or it didn't happen. Recovery is training.",
    score: 2790,
    streak: 27,
    followers: 512,
    following: 349,
    location: "Chicago, IL",
    points: 890,
    freezes: 1,
    paymentHandles: [{ provider: "venmo", handle: "jonah-ricci" }],
  },
  {
    id: "u-tasha",
    name: "Tasha Brooks",
    handle: "tashab",
    avatarColor: "linear-gradient(135deg,#0b3f7a,#35c2f2)",
    avatarInitials: "TB",
    focus: ["running", "strength"],
    bio: "Marathon #4 loading. Hybrid athlete. Show up, stand out.",
    score: 5590,
    streak: 55,
    followers: 1877,
    following: 264,
    location: "Portland, OR",
    points: 1975,
    freezes: 2,
  },
  {
    id: "u-devon",
    name: "Devon Okafor",
    handle: "devono",
    avatarColor: "linear-gradient(135deg,#ff8a3d,#ffc23d)",
    avatarInitials: "DO",
    focus: ["basketball", "consistency"],
    bio: "Rec league legend. Working on the left hand.",
    score: 1980,
    streak: 9,
    followers: 288,
    following: 501,
    location: "Charlotte, NC",
    points: 410,
    freezes: 0,
  },
];

interface SeedParticipant {
  userId: string;
  progress: number;
  joinedAt: Date;
  isOwner: boolean;
  lastLoggedAt?: Date;
  startValue?: number;
  currentValue?: number;
}

interface SeedGoal {
  id: string;
  title: string;
  category: string;
  mode: string;
  description: string;
  target: string;
  unit: string;
  durationDays: number;
  startDate: Date;
  endDate: Date;
  status: string;
  progress: number;
  streak: number;
  coverGradient: string;
  metricType: string;
  metricTargetValue: number;
  stake?: string;
  stakeAmount?: number;
  isPublic?: boolean;
  participants: SeedParticipant[];
}

const GOALS: SeedGoal[] = [
  {
    id: "g-pushup-streak",
    title: "100 Push-Ups Daily",
    category: "strength",
    mode: "goal",
    description: "Build a bulletproof upper body with a daily 100 push-up minimum, rain or shine.",
    target: "100",
    unit: "push-ups / day",
    durationDays: 30,
    startDate: daysAgo(12),
    endDate: daysFromNow(18),
    status: "active",
    progress: 62,
    streak: 12,
    coverGradient: "linear-gradient(135deg,#0b3f7a,#35c2f2)",
    metricType: "binary",
    metricTargetValue: 30,
    participants: [
      { userId: "me", progress: 62, joinedAt: daysAgo(12), isOwner: true, lastLoggedAt: hoursAgo(14) },
      { userId: "u-dre", progress: 88, joinedAt: daysAgo(12), isOwner: false },
      { userId: "u-priya", progress: 95, joinedAt: daysAgo(11), isOwner: false },
      { userId: "u-devon", progress: 40, joinedAt: daysAgo(9), isOwner: false },
    ],
  },
  {
    id: "g-half-marathon",
    title: "Half Marathon Build",
    category: "running",
    mode: "quest",
    description: "12-week progressive mileage build toward a sub-1:45 half marathon.",
    target: "13.1",
    unit: "mile race",
    durationDays: 84,
    startDate: daysAgo(30),
    endDate: daysFromNow(54),
    status: "active",
    progress: 38,
    streak: 6,
    coverGradient: "linear-gradient(135deg,#1379c9,#3dd6ff)",
    metricType: "binary",
    metricTargetValue: 84,
    participants: [
      { userId: "me", progress: 38, joinedAt: daysAgo(30), isOwner: true, lastLoggedAt: daysAgo(1) },
      { userId: "u-maya", progress: 71, joinedAt: daysAgo(30), isOwner: false },
      { userId: "u-tasha", progress: 64, joinedAt: daysAgo(28), isOwner: false },
    ],
  },
  {
    id: "g-scratch-golf",
    title: "Break 80",
    category: "golf",
    mode: "goal",
    description: "Shave four strokes off the handicap before the fall member-guest.",
    target: "79",
    unit: "strokes",
    durationDays: 60,
    startDate: daysAgo(20),
    endDate: daysFromNow(40),
    status: "active",
    progress: 42,
    streak: 3,
    coverGradient: "linear-gradient(135deg,#0f5132,#c8ff3d)",
    metricType: "decrease",
    metricTargetValue: 6,
    participants: [
      { userId: "u-sam", progress: 50, joinedAt: daysAgo(20), isOwner: true, startValue: 85, currentValue: 82 },
      { userId: "me", progress: 33, joinedAt: daysAgo(18), isOwner: false, lastLoggedAt: daysAgo(3), startValue: 85, currentValue: 83 },
    ],
  },
  {
    id: "g-10k-steps",
    title: "10K Steps Streak",
    category: "steps",
    mode: "challenge",
    description: "Group accountability challenge — hit 10,000 steps every day this month.",
    target: "10,000",
    unit: "steps / day",
    durationDays: 30,
    startDate: daysAgo(9),
    endDate: daysFromNow(21),
    status: "active",
    progress: 80,
    streak: 9,
    coverGradient: "linear-gradient(135deg,#ffc23d,#ff3b5c)",
    stake: "\u{1F964} Loser buys smoothies for the group",
    stakeAmount: 15,
    metricType: "cumulative",
    metricTargetValue: 300000,
    participants: [
      { userId: "u-jonah", progress: 100, joinedAt: daysAgo(9), isOwner: true, currentValue: 300000 },
      { userId: "me", progress: 80, joinedAt: daysAgo(9), isOwner: false, lastLoggedAt: hoursAgo(20), currentValue: 240000 },
      { userId: "u-devon", progress: 66, joinedAt: daysAgo(9), isOwner: false, currentValue: 198000 },
      { userId: "u-tasha", progress: 90, joinedAt: daysAgo(8), isOwner: false, currentValue: 270000 },
    ],
  },
  {
    id: "g-mobility-reset",
    title: "Daily Mobility Reset",
    category: "mobility",
    mode: "goal",
    description: "10 minutes of mobility work every morning before caffeine.",
    target: "10",
    unit: "minutes / day",
    durationDays: 21,
    startDate: daysAgo(5),
    endDate: daysFromNow(16),
    status: "active",
    progress: 55,
    streak: 5,
    coverGradient: "linear-gradient(135deg,#3dd6ff,#c8ff3d)",
    metricType: "binary",
    metricTargetValue: 21,
    participants: [
      { userId: "u-sam", progress: 70, joinedAt: daysAgo(5), isOwner: true },
      { userId: "me", progress: 55, joinedAt: daysAgo(5), isOwner: false, lastLoggedAt: daysAgo(2) },
    ],
  },
  {
    id: "g-bench-duel",
    title: "Bench Press Duel",
    category: "strength",
    mode: "duel",
    description: "Head to head — most weight added to 1RM bench over 6 weeks.",
    target: "+20",
    unit: "lb added",
    durationDays: 42,
    startDate: daysAgo(14),
    endDate: daysFromNow(28),
    status: "active",
    progress: 48,
    streak: 4,
    coverGradient: "linear-gradient(135deg,#ff3b5c,#0b3f7a)",
    stake: "\u{2615} Loser buys coffee",
    isPublic: true,
    metricType: "increase",
    metricTargetValue: 20,
    participants: [
      { userId: "u-priya", progress: 60, joinedAt: daysAgo(14), isOwner: true, startValue: 185, currentValue: 197 },
      { userId: "u-dre", progress: 35, joinedAt: daysAgo(14), isOwner: false, startValue: 225, currentValue: 232 },
    ],
  },
  {
    id: "g-freethrow-duel",
    title: "Free Throw Streak Duel",
    category: "basketball",
    mode: "duel",
    description: "Head to head — most consecutive makes out of 50 attempts, logged daily.",
    target: "50",
    unit: "makes / 50",
    durationDays: 21,
    startDate: daysAgo(2),
    endDate: daysFromNow(19),
    status: "active",
    progress: 20,
    streak: 2,
    coverGradient: "linear-gradient(135deg,#ff8a3d,#ff3b5c)",
    stake: "\u{1F355} Loser buys pizza",
    isPublic: true,
    metricType: "increase",
    metricTargetValue: 50,
    participants: [{ userId: "u-devon", progress: 20, joinedAt: daysAgo(2), isOwner: true, startValue: 0, currentValue: 10 }],
  },
  {
    id: "g-clean15-nutrition",
    title: "Clean 15 Nutrition Challenge",
    category: "nutrition",
    mode: "challenge",
    description: "15 straight days of on-plan meals. Group accountability, no cheat-meal excuses.",
    target: "15",
    unit: "clean days",
    durationDays: 15,
    startDate: daysAgo(4),
    endDate: daysFromNow(11),
    status: "active",
    progress: 27,
    streak: 4,
    coverGradient: "linear-gradient(135deg,#c8ff3d,#0f5132)",
    stake: "\u{1F451} Winner picks the next challenge",
    isPublic: true,
    metricType: "binary",
    metricTargetValue: 15,
    participants: [
      { userId: "u-tasha", progress: 27, joinedAt: daysAgo(4), isOwner: true },
      { userId: "u-maya", progress: 33, joinedAt: daysAgo(4), isOwner: false },
      { userId: "u-sam", progress: 20, joinedAt: daysAgo(3), isOwner: false },
    ],
  },
  {
    id: "g-mindful-mornings",
    title: "Mindful Mornings Quest",
    category: "recovery",
    mode: "quest",
    description: "8 weeks of a 10-minute breathwork + mobility ritual before the day starts.",
    target: "56",
    unit: "morning sessions",
    durationDays: 56,
    startDate: daysAgo(6),
    endDate: daysFromNow(50),
    status: "active",
    progress: 11,
    streak: 6,
    coverGradient: "linear-gradient(135deg,#3dd6ff,#0b3f7a)",
    isPublic: true,
    metricType: "cumulative",
    metricTargetValue: 56,
    participants: [{ userId: "u-jonah", progress: 11, joinedAt: daysAgo(6), isOwner: true, currentValue: 6 }],
  },
];

interface SeedPost {
  id: string;
  userId: string;
  goalId?: string;
  powerPlayId?: string;
  type: string;
  headline: string;
  body: string;
  statValue?: string;
  statLabel?: string;
  imageUrl?: string;
  createdAt: Date;
  reactions: { emoji: string; userIds: string[] }[];
  comments: { id: string; userId: string; text: string; createdAt: Date }[];
}

const POSTS: SeedPost[] = [
  {
    id: "p-1",
    userId: "u-priya",
    goalId: "g-pushup-streak",
    type: "streak",
    headline: "88-day streak alert",
    body: "Day 88 of push-ups done before the sun's even up. This one's a lifestyle now.",
    statValue: "88",
    statLabel: "day streak",
    imageUrl: coverArt("#8fce00", "#c8ff3d", "\u{1F525}"),
    createdAt: hoursAgo(2),
    reactions: [
      { emoji: "\u{1F525}", userIds: ["u-dre", "u-maya", "me"] },
      { emoji: "\u{1F4AA}", userIds: ["u-tasha"] },
    ],
    comments: [{ id: "c-1", userId: "u-dre", text: "This is disgusting (in a good way). Keep going.", createdAt: hoursAgo(1) }],
  },
  {
    id: "p-2",
    userId: "u-maya",
    goalId: "g-half-marathon",
    type: "progress",
    headline: "Tempo run: 6 miles @ 7:42 pace",
    body: "Negative split the last two miles. Half marathon build is clicking.",
    statValue: "6.0 mi",
    statLabel: "tempo",
    createdAt: hoursAgo(5),
    reactions: [{ emoji: "\u{1F3C3}", userIds: ["me", "u-tasha", "u-jonah"] }],
    comments: [],
  },
  {
    id: "p-3",
    userId: "u-devon",
    goalId: "g-10k-steps",
    type: "win",
    headline: "First 10K day of the challenge",
    body: "Late-night walk to close the ring. Don't judge the method, judge the result.",
    imageUrl: coverArt("#0b3f7a", "#35c2f2", "\u{1F463}"),
    createdAt: hoursAgo(7),
    reactions: [{ emoji: "\u{1F44F}", userIds: ["u-jonah", "me"] }],
    comments: [{ id: "c-2", userId: "u-jonah", text: "Whatever it takes. Welcome to the club.", createdAt: hoursAgo(6) }],
  },
  {
    id: "p-4",
    userId: "u-dre",
    goalId: "g-bench-duel",
    type: "competition-result",
    headline: "Closed the gap in the bench duel",
    body: "+8lb this week. Priya's still out front but the duel is heating up.",
    statValue: "+8 lb",
    statLabel: "this week",
    createdAt: hoursAgo(10),
    reactions: [{ emoji: "\u{26A1}", userIds: ["u-priya", "me"] }],
    comments: [],
  },
  {
    id: "p-5",
    userId: "u-tasha",
    type: "encouragement",
    headline: "Shoutout to this whole rally",
    body: "Y'all have made 5am so much easier to get out of bed for. Show up, stand out — truly.",
    createdAt: hoursAgo(14),
    reactions: [{ emoji: "\u{2764}\u{FE0F}", userIds: ["u-maya", "u-dre", "u-priya", "me", "u-jonah"] }],
    comments: [],
  },
  {
    id: "p-6",
    userId: "u-sam",
    goalId: "g-scratch-golf",
    type: "progress",
    headline: "Carded a 76 at Troon",
    body: "New season low. The break-80 goal is finally feeling real.",
    statValue: "76",
    statLabel: "strokes",
    createdAt: daysAgo(1),
    reactions: [{ emoji: "\u{26F3}", userIds: ["me"] }],
    comments: [{ id: "c-3", userId: "me", text: "Let's go! That short game work is paying off.", createdAt: hoursAgo(20) }],
  },
  {
    id: "p-7",
    userId: "u-jonah",
    type: "streak",
    headline: "27 days of 10K+ steps",
    body: "Longest streak I've ever put together. Recovery walks count double.",
    statValue: "27",
    statLabel: "day streak",
    createdAt: daysAgo(1),
    reactions: [{ emoji: "\u{1F525}", userIds: ["u-devon", "u-tasha"] }],
    comments: [],
  },
  {
    id: "p-8",
    userId: "u-priya",
    type: "powerplay",
    powerPlayId: "pp-pushup-48",
    headline: "Powering into the 48-Hour Push-Up Power Play",
    body: "412 reps in and counting. This event brings out something different.",
    statValue: "412",
    statLabel: "reps",
    createdAt: daysAgo(1),
    reactions: [{ emoji: "\u{1F4A5}", userIds: ["u-dre", "me"] }],
    comments: [],
  },
];

const NOTIFICATIONS = [
  { id: "n-1", type: "powerplay-start", actorId: undefined as string | undefined, message: "48-Hour Push-Up Power Play is live — you're in 4th place.", createdAt: hoursAgo(1), read: false },
  { id: "n-2", type: "reaction", actorId: "u-dre", message: "Andre Walsh reacted \u{1F525} to your push-up streak.", createdAt: hoursAgo(3), read: false },
  { id: "n-3", type: "rank-change", actorId: undefined as string | undefined, message: "You moved up to #3 in the 10K Steps Streak challenge.", createdAt: hoursAgo(9), read: true },
  { id: "n-4", type: "streak-risk", actorId: undefined as string | undefined, message: "Your Daily Mobility Reset streak is at risk — log today before midnight.", createdAt: hoursAgo(11), read: false },
  { id: "n-5", type: "rally-invite", actorId: "u-sam", message: "Sam Ibarra invited you to rally on Break 80.", createdAt: daysAgo(2), read: true },
];

const ACTIVITY_HISTORY = [
  { id: "h-1", label: "Logged 100 push-ups", detail: "Day 12 of 100 Push-Ups Daily", createdAt: hoursAgo(14) },
  { id: "h-2", label: "Ran 4.2 miles", detail: "Half Marathon Build — easy pace", createdAt: daysAgo(1) },
  { id: "h-3", label: "Joined Break 80", detail: "Invited by Sam Ibarra", createdAt: daysAgo(18) },
  { id: "h-4", label: "Hit 10,412 steps", detail: "10K Steps Streak — day 9", createdAt: daysAgo(1) },
  { id: "h-5", label: "Completed mobility reset", detail: "10 minutes — hip + ankle focus", createdAt: daysAgo(2) },
];

const MESSAGES = [
  { id: "m-1", threadId: "u-sam", senderId: "u-sam", text: "Hey! Saw you joined Break 80 — down to play Saturday morning if you're free?", createdAt: daysAgo(2) },
  { id: "m-2", threadId: "u-priya", senderId: "u-priya", text: "88 days and counting on the push-up streak \u{1F624} you're right behind me, don't slow down now.", createdAt: hoursAgo(9) },
];

async function main() {
  // Wipe in dependency order so re-running the seed is idempotent.
  await db.threadRead.deleteMany();
  await db.message.deleteMany();
  await db.activityHistoryItem.deleteMany();
  await db.notification.deleteMany();
  await db.comment.deleteMany();
  await db.reactionEntry.deleteMany();
  await db.post.deleteMany();
  await db.goalParticipant.deleteMany();
  await db.goal.deleteMany();
  await db.follow.deleteMany();
  await db.session.deleteMany();
  await db.user.deleteMany();

  const meHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  await db.user.create({
    data: {
      id: "me",
      name: "Josh Murphy",
      handle: "joshmurphy",
      email: DEMO_EMAIL,
      passwordHash: meHash,
      avatarColor: "linear-gradient(135deg,#1379c9,#35c2f2)",
      avatarInitials: "JM",
      focus: JSON.stringify(["strength", "running", "consistency"]),
      bio: "Show up, stand out. Chasing consistency across everything.",
      score: 2410,
      streak: 4,
      followers: 12,
      following: 8,
      points: 500,
      freezes: 1,
      paymentHandles: "[]",
    },
  });

  // NPCs seed with a random, unusable password hash — they aren't meant to
  // be logged into for this pass, only to exist as the other side of goals,
  // posts, and DMs.
  for (const u of NPC_USERS) {
    const npcHash = await bcrypt.hash(randomUUID(), 10);
    await db.user.create({
      data: {
        id: u.id,
        name: u.name,
        handle: u.handle,
        email: `${u.handle}@ascend.demo`,
        passwordHash: npcHash,
        avatarColor: u.avatarColor,
        avatarInitials: u.avatarInitials,
        focus: JSON.stringify(u.focus),
        bio: u.bio,
        score: u.score,
        streak: u.streak,
        followers: u.followers,
        following: u.following,
        location: u.location,
        points: u.points,
        freezes: u.freezes,
        paymentHandles: JSON.stringify(u.paymentHandles ?? []),
      },
    });
  }

  for (const g of GOALS) {
    await db.goal.create({
      data: {
        id: g.id,
        title: g.title,
        category: g.category,
        mode: g.mode,
        description: g.description,
        target: g.target,
        unit: g.unit,
        durationDays: g.durationDays,
        startDate: g.startDate,
        endDate: g.endDate,
        status: g.status,
        progress: g.progress,
        streak: g.streak,
        coverGradient: g.coverGradient,
        metricType: g.metricType,
        metricTargetValue: g.metricTargetValue,
        stake: g.stake,
        stakeAmount: g.stakeAmount,
        isPublic: g.isPublic ?? false,
        participants: {
          create: g.participants.map((p) => ({
            userId: p.userId,
            progress: p.progress,
            joinedAt: p.joinedAt,
            isOwner: p.isOwner,
            lastLoggedAt: p.lastLoggedAt,
            startValue: p.startValue,
            currentValue: p.currentValue,
          })),
        },
      },
    });
  }

  for (const p of POSTS) {
    await db.post.create({
      data: {
        id: p.id,
        userId: p.userId,
        goalId: p.goalId,
        powerPlayId: p.powerPlayId,
        type: p.type,
        headline: p.headline,
        body: p.body,
        statValue: p.statValue,
        statLabel: p.statLabel,
        imageUrl: p.imageUrl,
        createdAt: p.createdAt,
        reactions: {
          create: p.reactions.flatMap((r) => r.userIds.map((userId) => ({ emoji: r.emoji, userId }))),
        },
        comments: {
          create: p.comments.map((c) => ({ id: c.id, userId: c.userId, text: c.text, createdAt: c.createdAt })),
        },
      },
    });
  }

  for (const n of NOTIFICATIONS) {
    await db.notification.create({
      data: { id: n.id, userId: "me", type: n.type, actorId: n.actorId, message: n.message, createdAt: n.createdAt, read: n.read },
    });
  }

  for (const h of ACTIVITY_HISTORY) {
    await db.activityHistoryItem.create({
      data: { id: h.id, userId: "me", label: h.label, detail: h.detail, createdAt: h.createdAt },
    });
  }

  for (const m of MESSAGES) {
    const recipientId = m.senderId === m.threadId ? "me" : m.threadId;
    await db.message.create({
      data: { id: m.id, threadId: m.threadId, senderId: m.senderId, recipientId, text: m.text, createdAt: m.createdAt },
    });
  }

  console.log(`Seeded database. Demo login: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await db.$disconnect();
    process.exit(1);
  });
