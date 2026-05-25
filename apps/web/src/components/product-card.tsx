"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { kineticEase } from "./motion/motion-config";

const cardTones = [
  "from-[#15233b] via-[#101b31] to-[#0e1728]",
  "from-[#1a2340] via-[#111a31] to-[#0c1527]",
  "from-[#143039] via-[#10242d] to-[#0b1b23]",
  "from-[#261a3f] via-[#191230] to-[#100c21]",
] as const;

const lightTones = [
  "from-[#ececec] via-white to-[#dcdcdc]",
  "from-[#f0ebe4] via-white to-[#d8d1c7]",
  "from-[#e5ecef] via-white to-[#cfd8de]",
] as const;

export type ProductCardData = {
  id?: string;
  slug?: string;
  label?: string;
  category?: string;
  name: string;
  title?: string;
  price: string;
  thumbnail?: string | null;
};

type ProductCardProps = {
  item: ProductCardData;
  index: number;
  href: string;
  variant?: "dark" | "light" | "compact";
  className?: string;
};

function getTone(index: number, variant: "dark" | "light" | "compact") {
  const tones = variant === "light" ? lightTones : cardTones;
  return tones[index % tones.length];
}

export function ProductCard({ item, index, href, variant = "dark", className = "" }: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const displayName = item.name || item.title || "Product";
  const tone = getTone(index, variant);
  const isDark = variant === "dark" || variant === "compact";

  const content = (
    <>
      <div
        className={`relative mb-6 flex overflow-hidden rounded-xl bg-gradient-to-br ${tone} p-6 ${
          variant === "compact" ? "aspect-[4/5] items-end p-5" : "aspect-[3/4]"
        }`}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={displayName}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <div
              className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${
                isDark ? "border-white/10 bg-white/5 text-white/55" : "border-black/10 bg-white/80 text-neutral-500"
              }`}
            >
              No Image
            </div>
          </div>
        )}
        <div
          className={`absolute inset-0 ${
            item.thumbnail ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent" : "bg-black/10"
          }`}
        />
        {variant !== "light" ? (
          <div className="relative flex h-full w-full flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-500 group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
              <span>{item.label || "Collection"}</span>
              <span>{item.price}</span>
            </div>
            <div>
              {item.category ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">{item.category}</p>
              ) : null}
              <h4 className="mt-3 text-2xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                {displayName}
              </h4>
            </div>
          </div>
        ) : null}
      </div>
      {variant === "light" ? (
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{item.label}</p>
          <h4 className="text-sm font-bold uppercase tracking-tight text-black">{displayName}</h4>
          <p className="text-sm font-medium text-neutral-600">{item.price}</p>
        </div>
      ) : variant === "compact" ? (
        <>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white">{displayName}</h4>
          <p className="text-xs text-white/60">{item.price}</p>
        </>
      ) : (
        <>
          <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{item.label}</p>
          <h4 className="mb-2 text-base font-bold tracking-tight text-white">{displayName}</h4>
          <p className="text-sm font-medium text-white/85">{item.price}</p>
        </>
      )}
    </>
  );

  const linkClass = `group cursor-pointer block ${className}`;

  if (reduceMotion) {
    return (
      <Link href={href} className={linkClass}>
        {content}
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.35, ease: kineticEase }}
    >
      <Link href={href} className={linkClass}>
        {content}
      </Link>
    </motion.div>
  );
}
