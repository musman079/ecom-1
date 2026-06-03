"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

type CounterProps = {
  value: number;
  duration?: number; // duration in seconds
  delay?: number; // delay in seconds
  prefix?: string;
  suffix?: string;
  className?: string;
};

export function Counter({
  value,
  duration = 2,
  delay = 0,
  prefix = "",
  suffix = "",
  className = "",
}: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      setCount(value);
      return;
    }

    if (!isInView) return;

    let startTime: number | null = null;
    const startValue = 0;
    const endValue = value;
    const delayMs = delay * 1000;

    let animationFrameId: number;

    const startAnimation = () => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        // Easing: easeOutQuad (t * (2 - t))
        const easeProgress = progress * (2 - progress);
        const currentValue = Math.floor(easeProgress * (endValue - startValue) + startValue);
        
        setCount(currentValue);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(endValue);
        }
      };
      animationFrameId = requestAnimationFrame(step);
    };

    const timeoutId = setTimeout(startAnimation, delayMs);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isInView, value, duration, delay, reduceMotion]);

  const formattedCount = new Intl.NumberFormat("en-US").format(count);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formattedCount}
      {suffix}
    </span>
  );
}
