"use client";

import { motion, useReducedMotion } from "framer-motion";
import { kineticEase } from "../motion/motion-config";

type CartLineItemProps = {
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  thumbnail: string | null;
  activeProductId: string | null;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
};

export function CartLineItem({
  productId,
  title,
  sku,
  price,
  quantity,
  stockQuantity,
  thumbnail,
  activeProductId,
  onDecrement,
  onIncrement,
  onRemove,
}: CartLineItemProps) {
  const reduceMotion = useReducedMotion();
  const Wrapper = reduceMotion ? "article" : motion.article;

  return (
    <Wrapper
      layout={!reduceMotion}
      initial={reduceMotion ? false : { opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, x: -24, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.4, ease: kineticEase }}
      className="group flex items-start gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.05]"
    >
      <div className="h-40 w-32 shrink-0 overflow-hidden rounded-xl bg-white/5">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1d2940] to-[#12100e] text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
            No Image
          </div>
        )}
      </div>

      <div className="flex h-40 flex-grow flex-col py-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#dfb257]">In Cart</span>
            <h3 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">{title}</h3>
            <p className="text-sm text-white/60">SKU: {sku}</p>
          </div>
          <motion.span
            key={price}
            className="text-3xl font-bold text-white sm:text-lg"
            initial={reduceMotion ? false : { opacity: 0.6, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            ${price.toFixed(2)}
          </motion.span>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center gap-6 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white">
            <button
              type="button"
              disabled={activeProductId === productId || quantity <= 1}
              onClick={onDecrement}
              className="material-symbols-outlined text-sm disabled:opacity-40"
            >
              remove
            </button>
            <motion.span
              key={quantity}
              initial={reduceMotion ? false : { scale: 1.35, opacity: 0.5 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
              className="w-4 text-center text-sm font-bold"
            >
              {quantity}
            </motion.span>
            <button
              type="button"
              disabled={activeProductId === productId || quantity >= stockQuantity}
              onClick={onIncrement}
              className="material-symbols-outlined text-sm disabled:opacity-40"
            >
              add
            </button>
          </div>
          <button
            type="button"
            disabled={activeProductId === productId}
            onClick={onRemove}
            className="text-[10px] font-bold uppercase tracking-widest text-white/65 transition hover:text-[#ff9b9b] disabled:opacity-40"
          >
            Remove
          </button>
        </div>
      </div>
    </Wrapper>
  );
}
