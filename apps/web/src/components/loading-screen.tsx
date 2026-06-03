"use client";

import { motion } from "framer-motion";

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0c0a09]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        {/* USolstice Premium Logo */}
        <h2 className="text-4xl font-black uppercase tracking-[-0.06em] text-white">
          USOLSTICE
        </h2>
        {/* High performance spinner ring */}
        <div className="relative h-12 w-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-2 border-white/5 border-t-[#dfb257]"
          />
        </div>
      </motion.div>
    </div>
  );
}
