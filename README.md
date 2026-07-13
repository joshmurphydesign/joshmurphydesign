# Ascend

**Iron sharpens iron.**

Ascend is a premium social-accountability platform for athletes — set goals, rally your people, compete with purpose, and track progress through streaks, challenges, duels, and live open events called Power Plays.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 for a custom dark, gradient-driven design system
- Framer Motion for entry motion and micro-interactions
- Client-side auth + data layer backed by `localStorage` (mock backend, no external services)

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

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). First run shows the branded splash, then signup/login. Sessions persist on-device, so returning users skip straight to Home.

## Project structure

```
src/
  app/                 # routes (App Router)
    (app)/             # authenticated app shell + screens
    login/              # auth screen
  components/          # UI, shell, feed, goal, compete, powerplay, profile, splash, auth
  lib/                 # types, mock data, auth + data context (localStorage-backed)
```
