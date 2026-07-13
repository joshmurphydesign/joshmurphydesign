"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { AscendMark } from "@/components/ui/AscendMark";
import { Button } from "@/components/ui/Button";
import { cn, categoryEmoji, categoryLabel } from "@/lib/utils";
import type { GoalCategory } from "@/lib/types";

const FOCUS_OPTIONS: GoalCategory[] = [
  "strength",
  "running",
  "golf",
  "basketball",
  "steps",
  "mobility",
  "nutrition",
  "recovery",
];

export function LoginScreen() {
  const { login, signup } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [focus, setFocus] = useState<GoalCategory[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleFocus = (cat: GoalCategory) => {
    setFocus((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : prev.length < 4 ? [...prev, cat] : prev
    );
  };

  const canSubmit =
    email.trim().length > 3 &&
    password.trim().length >= 4 &&
    (mode === "login" || name.trim().length > 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    if (mode === "signup") {
      signup({ name: name.trim(), email: email.trim(), focus: focus.length ? focus : ["consistency"] });
    } else {
      login(email.trim(), name.trim() || undefined);
    }
    router.replace("/home");
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden bg-ink-950 px-6 pb-10 pt-16 safe-top safe-bottom">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(55% 35% at 15% 0%, rgba(19,121,201,0.28) 0%, rgba(0,0,0,0) 70%), radial-gradient(45% 30% at 100% 15%, rgba(53,194,242,0.18) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative flex items-center gap-3"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl card-surface-raised">
          <AscendMark size={24} />
        </div>
        <div>
          <p className="font-display text-lg leading-none tracking-wide">ASCEND</p>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-chalk-500">Iron sharpens iron</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="relative mt-10"
      >
        <h1 className="font-display text-4xl leading-[1.05] text-chalk-100">
          {mode === "signup" ? (
            <>
              Rally your <span className="text-ascend-gradient">people.</span>
              <br />
              Ascend together.
            </>
          ) : (
            <>
              Welcome back to the <span className="text-ascend-gradient">rally.</span>
            </>
          )}
        </h1>
        <p className="mt-3 max-w-xs text-sm text-chalk-500">
          Set goals, build streaks, and compete with the people who push you further.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.5 }}
        onSubmit={handleSubmit}
        className="relative mt-8 flex flex-1 flex-col gap-4"
      >
        <div className="flex rounded-pill bg-white/5 p-1">
          {(["signup", "login"] as const).map((m) => (
            <button
              type="button"
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex-1 rounded-pill py-2.5 text-sm font-semibold transition-colors",
                mode === m ? "bg-ascend-gradient text-white" : "text-chalk-500"
              )}
            >
              {m === "signup" ? "Create account" : "Log in"}
            </button>
          ))}
        </div>

        {mode === "signup" && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jordan Ellis"
              className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
              autoComplete="name"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@ascend.app"
            className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            autoComplete="email"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="rounded-2xl border border-white/8 bg-white/5 px-4 py-3.5 text-[15px] text-chalk-100 outline-none placeholder:text-chalk-700 focus:border-ascend-blue"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>

        {mode === "signup" && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-chalk-500">
              Athletic focus <span className="text-chalk-700">(pick a few)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map((cat) => {
                const active = focus.includes(cat);
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => toggleFocus(cat)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-pill border px-3 py-2 text-xs font-semibold transition-colors",
                      active
                        ? "border-volt-500/40 bg-volt-500/15 text-volt-400"
                        : "border-white/8 bg-white/5 text-chalk-500"
                    )}
                  >
                    <span>{categoryEmoji(cat)}</span>
                    {categoryLabel(cat)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-auto flex flex-col gap-3 pt-4">
          <Button type="submit" variant="primary" size="lg" disabled={!canSubmit} className="w-full">
            {mode === "signup" ? "Start ascending" : "Log in"}
          </Button>
          <p className="text-center text-[11px] text-chalk-700">
            Your session stays signed in on this device until you log out.
          </p>
        </div>
      </motion.form>
    </div>
  );
}
