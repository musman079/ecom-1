"use client";

import type { HTMLAttributes } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { defaultViewport, staggerContainer, staggerItem } from "./motion-config";

type StaggerProps = HTMLMotionProps<"div"> & {
  as?: "div" | "ul" | "section";
};

export function Stagger({ children, className, as = "div", ...props }: StaggerProps) {
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
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className={className}
      {...props}
    >
      {children}
    </Component>
  );
}

export function StaggerItem({ children, className, ...props }: HTMLMotionProps<"div">) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} {...(props as HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div variants={staggerItem} className={className} {...props}>
      {children}
    </motion.div>
  );
}
