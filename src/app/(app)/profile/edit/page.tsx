"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { cn, categoryEmoji, categoryLabel } from "@/lib/utils";
import type { GoalCategory } from "@/lib/types";

const CATEGORIES: GoalCategory[] = [
  "strength",
  "running",
  "golf",
  "basketball",
  "steps",
  "mobility",
  "nutrition",
  "recovery",
  "consistency",
  "habits",
  "custom",
];

const AVATAR_GRADIENTS = [
  "linear-gradient(135deg,#1379c9,#35c2f2)",
  "linear-gradient(135deg,#0b3f7a,#35c2f2)",
  "linear-gradient(135deg,#ff3b5c,#ffc23d)",
  "linear-gradient(135deg,#c8ff3d,#35c2f2)",
  "linear-gradient(135deg,#ffc23d,#ff3b5c)",
  "linear-gradient(135deg,#ff8a3d,#ffc23d)",
];

export default function EditProfilePage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [focus, setFocus] = useState<GoalCategory[]>(user?.focus ?? []);
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? AVATAR_GRADIENTS[0]);

  if (!user) return null;

  const toggleFocus = (cat: GoalCategory) => {
    setFocus((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 5 ? [...prev, cat] : prev
    );
  };

  const canSave = name.trim().length > 1;

  const save = () => {
    updateProfile({ name: name.trim(), bio: bio.trim(), focus, avatarColor });
    router.replace("/profile");
  };

  return (
    <div className="flex flex-col gap-6 pb-4">
      <TopBar title="Edit profile" onBack />

      <div className="flex flex-col items-center gap-3 px-5">
        <Avatar initials={name ? initials(name) : user.avatarInitials} gradient={avatarColor} size={72} />
        <div className="flex gap-2.5">
          {AVATAR_GRADIENTS.map((g) => (
            <button
              key={g}
              onClick={() => setAvatarColor(g)}
              aria-label="Choose avatar color"
              className={cn(
                "h-8 w-8 rounded-full transition-transform",
                avatarColor === g ? "scale-110 ring-2 ring-offset-2 ring-offset-ink-950 ring-white" : ""
              )}
              style={{ background: g }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 px-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none focus:border-ascend-blue"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Bio</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            className="resize-none rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none focus:border-ascend-blue"
          />
        </label>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
            Athletic focus <span className="text-chalk-700">(up to 5)</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const active = focus.includes(c);
              return (
                <button
                  key={c}
                  onClick={() => toggleFocus(c)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-pill border px-3 py-2 text-xs font-semibold transition-colors",
                    active
                      ? "border-volt-500/40 bg-volt-500/15 text-volt-400"
                      : "border-white/8 bg-white/5 text-chalk-500"
                  )}
                >
                  <span>{categoryEmoji(c)}</span>
                  {categoryLabel(c)}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-5">
        <Button onClick={save} disabled={!canSave} variant="primary" size="lg" className="w-full">
          Save changes
        </Button>
      </div>
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
