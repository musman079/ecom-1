"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { defaultViewport, fadeUp, kineticEase } from "./motion-config";

type FadeInProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  as?: "div" | "section" | "article" | "aside" | "header" | "footer" | "nav" | "main";
};

export function FadeIn({
  children,
  delay = 0,
  duration = 0.6,
  y = 24,
  as = "div",
  className,
  ...props
}: FadeInProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as];

  if (reduceMotion) {
    const Tag = as;
    return (
      <Tag className={className} {...(props as HTMLAttributes<HTMLElement>)}>
        {children}
      </Tag>
    );
  }

  return (
    <Component
      initial={{ opacity: fadeUp.hidden.opacity, y }}
      whileInView={{ opacity: fadeUp.visible.opacity, y: fadeUp.visible.y }}
      viewport={defaultViewport}
      transition={{ duration, delay, ease: kineticEase }}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}
