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

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: "Strength",
  running: "Running",
  golf: "Golf",
  basketball: "Basketball",
  steps: "Steps",
  mobility: "Mobility",
  nutrition: "Nutrition",
  recovery: "Recovery",
  consistency: "Consistency",
  habits: "Habits",
  custom: "Custom",
};

export function categoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

const CATEGORY_EMOJI: Record<string, string> = {
  strength: "\u{1F3CB}\u{FE0F}",
  running: "\u{1F3C3}",
  golf: "\u{26F3}",
  basketball: "\u{1F3C0}",
  steps: "\u{1F463}",
  mobility: "\u{1F9D8}",
  nutrition: "\u{1F957}",
  recovery: "\u{1F9CA}",
  consistency: "\u{1F525}",
  habits: "\u{2705}",
  custom: "\u{2728}",
};

export function categoryEmoji(category: string): string {
  return CATEGORY_EMOJI[category] ?? "\u{2728}";
}

const MODE_LABELS: Record<string, string> = {
  goal: "Goal",
  challenge: "Challenge",
  duel: "Duel",
  quest: "Quest",
};

export function modeLabel(mode: string): string {
  return MODE_LABELS[mode] ?? mode;
}
