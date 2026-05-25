"use client";

import { motion, useReducedMotion } from "framer-motion";
import { kineticEase } from "./motion-config";

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: kineticEase },
  },
};

type HeroMotionProps = {
  children: React.ReactNode;
  className?: string;
};

export function HeroMotion({ children, className }: HeroMotionProps) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={heroStagger}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}

export function HeroItem({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={heroItem} className={className}>
      {children}
    </motion.div>
  );
}

export function HeroBackground() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a2f5a] via-[#0f1a2e] to-[#050a15]" />
    );
  }

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#1a2f5a] via-[#0f1a2e] to-[#050a15]"
        initial={{ scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: kineticEase }}
      />
      <motion.div
        className="pointer-events-none absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#65f3de]/10 blur-[100px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#497cff]/15 blur-[90px]"
        animate={{ opacity: [0.3, 0.55, 0.3], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
