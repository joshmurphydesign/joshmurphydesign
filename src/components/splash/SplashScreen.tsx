"use client";

import { motion } from "framer-motion";
import { AscendMark } from "@/components/ui/AscendMark";

export function SplashScreen() {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-ink-950"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5, ease: "easeInOut" } }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 45% at 50% 30%, rgba(19,121,201,0.35) 0%, rgba(0,0,0,0) 70%), radial-gradient(50% 40% at 70% 75%, rgba(53,194,242,0.22) 0%, rgba(0,0,0,0) 70%)",
        }}
      />

      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex h-24 w-24 items-center justify-center rounded-3xl card-surface-raised"
      >
        <AscendMark size={52} />
      </motion.div>

      <motion.h1
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-6 font-display text-3xl tracking-wide text-ascend-gradient"
      >
        ASCEND
      </motion.h1>

      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="relative mt-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-chalk-500"
      >
        <span>Show Up.</span>
        <span className="text-chalk-700">|</span>
        <span className="text-ascend-sky">Stand Out.</span>
        <span className="text-chalk-700">|</span>
        <span>Rise Together.</span>
      </motion.p>

      <motion.div
        initial={{ scaleX: 0, opacity: 0 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ delay: 0.75, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-8 h-1 w-28 origin-left rounded-pill bg-ascend-gradient"
      />
    </motion.div>
  );
}
