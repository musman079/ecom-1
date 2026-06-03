"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-28 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-[#171412]/90 text-white/70 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-[#dfb257]/40 hover:text-[#dfb257] md:bottom-8"
          aria-label="Back to top"
        >
          <span className="material-symbols-outlined text-xl">keyboard_arrow_up</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
