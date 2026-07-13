import type { GoalMode } from "./types";

export const GRADIENTS = [
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
    return rank <= CHALLENGE_PLACE_POINTS.length ? CHALLENGE_PLACE_POINTS[rank - 1] : CHALLENGE_PARTICIPATION_POINTS;
  }
  return 0;
}
