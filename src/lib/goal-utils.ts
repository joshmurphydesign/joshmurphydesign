import type { GoalMode } from "./types";

export const GRADIENTS = [
  "linear-gradient(135deg,#1e3a66,#2e7bff)",
  "linear-gradient(135deg,#2e7bff,#53d6ff)",
  "linear-gradient(135deg,#1e3a66,#ff5a6a)",
  "linear-gradient(135deg,#1e3a66,#53d6ff)",
  "linear-gradient(135deg,#1e3a66,#ff5a6a)",
];

const DUEL_WIN_POINTS = 100;
const CHALLENGE_PLACE_POINTS = [300, 150, 75];
const CHALLENGE_PARTICIPATION_POINTS = 25;

export function pointsForPlacement(mode: GoalMode, rank: number): number {
  if (mode === "duel") return rank === 1 ? DUEL_WIN_POINTS : 0;
  if (mode === "challenge") {
    return rank <= CHALLENGE_PLACE_POINTS.length ? CHALLENGE_PLACE_POINTS[rank - 1] : CHALLENGE_PARTICIPATION_POINTS;
  }
  return 0;
}
