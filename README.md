# Ascend

**Show Up. Stand Out.**

Ascend is a premium social-accountability platform for athletes — set goals, rally your people, compete with purpose, and track progress through streaks, challenges, duels, and live open events called Power Plays.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for a custom dark, gradient-driven design system
- Framer Motion for entry motion and micro-interactions
- Prisma + Postgres for the database, with session-cookie auth (bcrypt-hashed passwords, server-side sessions, HTTP-only cookies)
- A real API layer (Next.js Route Handlers under `src/app/api`) — progress/streak math, milestone freeze awards, placement-based points, and settlement payouts all run server-side, not just in the client

Out of scope for now: native Health integration (a simulated client-side connection instead), Power Plays/Competitions persistence (seeded/local), and real payment processing (honest peer-to-peer deep-links — Ascend never touches money).

## Core concepts

- **Goal** — a personal target you own
- **Challenge** — group accountability with a squad
- **Duel** — head-to-head 1v1 competition
- **Quest** — a longer improvement journey
- **Power Play** — a live, time-limited, open event anyone can join
- **Rally** — the social/community layer around all of the above

## Screens

Splash → login/signup → Home, Feed, Goal detail, Compete (leaderboards), Create goal/challenge, Power Play, Profile.

## Getting started

Set `DATABASE_URL` in `.env` to a Postgres connection string (see `.env.example` — works with Neon, Supabase, Vercel Postgres, Railway, or a local instance):

```bash
npm install
npm run db:migrate
npm run db:seed   # optional — ports demo data in; login joshuahockey@comcast.net / ascend2026
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First run shows the branded splash, then signup/login. Sessions persist via an HTTP-only cookie, so returning users skip straight to Home.

## Deploying

Set the **Build Command** to `npm run vercel-build` (runs `prisma migrate deploy` before `next build`, so the schema applies automatically on deploy) and set `DATABASE_URL` as an environment variable — ideally your provider's *pooled* connection string, since serverless functions each open their own connection.

## Project structure

```
src/
  app/                 # routes (App Router)
    (app)/             # authenticated app shell + screens
    api/               # Route Handlers — auth, goals, posts, follow, messages, notifications
    login/             # auth screen
  components/          # UI, shell, feed, goal, compete, powerplay, profile, splash, auth
  lib/                 # types, auth + data context, Prisma client, session, serialization
prisma/
  schema.prisma        # data model
  migrations/          # applied schema history
  seed.ts              # demo data seed script
```
