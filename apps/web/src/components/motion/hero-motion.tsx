"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
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
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, -80]);
  const glowOneY = useTransform(scrollY, [0, 600], [0, 120]);
  const glowTwoY = useTransform(scrollY, [0, 600], [0, -60]);
  const glowTwoX = useTransform(scrollY, [0, 600], [0, 40]);
  const glowOpacity = useTransform(scrollY, [0, 400], [1, 0.75]);

  if (reduceMotion) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-[#382315] via-[#1f140e] to-[#0a0705]" />
    );
  }

  return (
    <>
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-[#382315] via-[#1f140e] to-[#0a0705]"
        initial={{ scale: 1.08, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: kineticEase }}
        style={{ y: bgY, opacity: glowOpacity }}
      />
      <motion.div
        className="pointer-events-none absolute -right-32 top-1/4 h-[420px] w-[420px] rounded-full bg-[#dfb257]/10 blur-[100px]"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ y: glowOneY }}
      />
      <motion.div
        className="pointer-events-none absolute -left-24 bottom-0 h-[360px] w-[360px] rounded-full bg-[#dfb257]/15 blur-[90px]"
        animate={{ opacity: [0.3, 0.55, 0.3], x: [0, 20, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        style={{ x: glowTwoX, y: glowTwoY }}
      />
    </>
  );
}
