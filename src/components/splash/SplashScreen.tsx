"use client";

import { motion } from "framer-motion";
import { AscendMark } from "@/components/ui/AscendMark";

export function SplashScreen({ durationMs = 1400 }: { durationMs?: number }) {
  const durationS = durationMs / 1000;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ink-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4, ease: "easeInOut" } }}
    >
      {/* Ambient field — a slow, subtle breathe keeps the screen alive if hydration runs long, without looping distractingly */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.7, 0.85] }}
        transition={{ opacity: { times: [0, 0.3, 0.65, 1], duration: 5, ease: "easeInOut", repeat: Infinity } }}
        style={{
          background:
            "radial-gradient(55% 42% at 50% 30%, rgba(46,123,255,0.34) 0%, rgba(0,0,0,0) 70%), radial-gradient(45% 36% at 74% 76%, rgba(83,214,255,0.16) 0%, rgba(0,0,0,0) 70%)",
        }}
      />
      <div className="noise-overlay pointer-events-none absolute inset-0" />

      {/* Mark stands free — a soft bloom behind it instead of boxing it in a card */}
      <div className="relative flex h-40 w-40 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ background: "radial-gradient(closest-side, rgba(46,123,255,0.38), rgba(46,123,255,0) 72%)" }}
        />
        <motion.div
          initial={{ scale: 0.55, opacity: 0, y: 8 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        >
          <AscendMark size={108} />
        </motion.div>
      </div>

      <div className="relative mt-6 overflow-hidden">
        <motion.h1
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ delay: 0.32, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-3xl tracking-wide text-ascend-gradient"
        >
          ASCEND
        </motion.h1>
      </div>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.45 }}
        className="relative mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-chalk-500"
      >
        <span>Show Up.</span>
        <span className="text-chalk-700">|</span>
        <span className="text-ascend-sky">Stand Out.</span>
        <span className="text-chalk-700">|</span>
        <span>Rise Together.</span>
      </motion.p>

      {/* A real progress fill timed to the splash's minimum hold — motion with a job, not decoration */}
      <div className="relative mt-9 h-[3px] w-32 overflow-hidden rounded-full bg-white/8">
        <motion.div
          className="h-full w-full origin-left rounded-full bg-ascend-gradient"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.15, duration: Math.max(0.4, durationS - 0.15), ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
