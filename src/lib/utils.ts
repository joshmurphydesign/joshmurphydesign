import type { GoalCategory } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

export function countdown(iso: string): { d: number; h: number; m: number; s: number; done: boolean } {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return { d: 0, h: 0, m: 0, s: 0, done: true };
  const s = Math.floor(diff / 1000);
  return {
    d: Math.floor(s / 86400),
    h: Math.floor((s % 86400) / 3600),
    m: Math.floor((s % 3600) / 60),
    s: Math.floor(s % 60),
    done: false,
  };
}

export function daysUntil(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000));
}

export function isFuture(iso: string): boolean {
  return new Date(iso).getTime() > Date.now();
}

export function isToday(iso?: string): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: "Strength",
  running: "Running",
  steps: "Steps",
  mobility: "Mobility",
  nutrition: "Nutrition",
  recovery: "Recovery",
  habits: "Habits",
  sport: "Sport",
  golf: "Golf",
  basketball: "Basketball",
  soccer: "Soccer",
  tennis: "Tennis",
  baseball: "Baseball",
  swimming: "Swimming",
  cycling: "Cycling",
  boxing: "Boxing",
  custom: "Custom",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const CATEGORY_EMOJI: Record<string, string> = {
  strength: "\u{1F3CB}\u{FE0F}",
  running: "\u{1F3C3}",
  steps: "\u{1F463}",
  mobility: "\u{1F9D8}",
  nutrition: "\u{1F957}",
  recovery: "\u{1F9CA}",
  habits: "\u{2705}",
  sport: "\u{1F3C5}",
  golf: "\u{26F3}",
  basketball: "\u{1F3C0}",
  soccer: "\u{26BD}",
  tennis: "\u{1F3BE}",
  baseball: "\u{26BE}",
  swimming: "\u{1F3CA}",
  cycling: "\u{1F6B4}",
  boxing: "\u{1F94A}",
  custom: "\u{2728}",
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "\u{2728}";
}

/** The top-level tiles on the category-selection screen. Every one maps to a streak, a measurable goal, a repeatable action, or a check-in — "Sport" is the one gateway, leading to SPORT_OPTIONS. */
export const TOP_LEVEL_CATEGORIES: GoalCategory[] = [
  "strength",
  "running",
  "steps",
  "mobility",
  "nutrition",
  "recovery",
  "habits",
  "sport",
  "custom",
];

/** Specific sports offered after a user taps the "Sport" gateway tile. */
export const SPORT_OPTIONS: GoalCategory[] = [
  "basketball",
  "golf",
  "soccer",
  "tennis",
  "baseball",
  "swimming",
  "cycling",
  "boxing",
];

/** Quick-pick focus tags used on signup/profile — excludes "Sport" (needs a sub-choice) and "Custom" (not a real interest). */
export const FOCUS_CATEGORIES: GoalCategory[] = [
  "strength",
  "running",
  "steps",
  "mobility",
  "nutrition",
  "recovery",
  "habits",
];

const MODE_LABELS: Record<string, string> = {
  goal: "Goal",
  challenge: "Challenge",
  duel: "Duel",
  quest: "Quest",
};

export function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}

export function resizeImageFile(file: File, maxDim = 1080, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error("Could not read that image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas unsupported"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
