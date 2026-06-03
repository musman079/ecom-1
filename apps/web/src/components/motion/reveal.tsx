"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { kineticEase, defaultViewport } from "./motion-config";

type RevealTextProps = {
  children: string;
  className?: string;
  delay?: number;
  mode?: "word" | "letter";
};

export function RevealText({ children, className, delay = 0, mode = "word" }: RevealTextProps) {
  const reduceMotion = useReducedMotion();
  const units = mode === "word" ? children.split(" ") : children.split("");

  if (reduceMotion) {
    return <span className={className}>{children}</span>;
  }

  return (
    <motion.span
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: mode === "word" ? 0.06 : 0.02,
            delayChildren: delay,
          },
        },
      }}
    >
      {units.map((unit, i) => (
        <motion.span
          key={`${unit}-${i}`}
          className="inline-block"
          variants={{
            hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.5, ease: kineticEase },
            },
          }}
        >
          {unit}
          {mode === "word" && i < units.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
};

export function Reveal({ children, className, delay = 0, direction = "up" }: RevealProps) {
  const reduceMotion = useReducedMotion();

  const offsets = {
    up: { y: 40, x: 0 },
    down: { y: -40, x: 0 },
    left: { y: 0, x: 40 },
    right: { y: 0, x: -40 },
  };

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={defaultViewport}
      transition={{ duration: 0.7, delay, ease: kineticEase }}
    >
      {children}
    </motion.div>
  );
}
