"use client";

import type { ComponentType, HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "framer-motion";
import { defaultViewport, staggerContainer, staggerItem } from "./motion-config";

type StaggerProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
  as?: "div" | "ul" | "section";
};

export function Stagger({ children, className, as = "div", ...props }: StaggerProps) {
  const reduceMotion = useReducedMotion();
  const Component = motion[as] as ComponentType<StaggerProps>;

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

type StaggerItemProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: ReactNode;
};

export function StaggerItem({ children, className, ...props }: StaggerItemProps) {
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
