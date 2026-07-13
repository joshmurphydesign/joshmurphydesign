export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function slugifyHandle(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "").slice(0, 16) || "athlete";
}

export const DEFAULT_AVATAR_COLOR = "linear-gradient(135deg,#1379c9,#35c2f2)";
