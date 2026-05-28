"use client";

import { motion, useReducedMotion } from "framer-motion";
import { CUSTOMER_ROUTES } from "../constants/routes";
import { useCartStore } from "../store/cart-store";
import { AuthLink } from "./auth/auth-link";

export default function CartBadge() {
  const totalItems = useCartStore((s) => s.totalItems);
  const reduceMotion = useReducedMotion();

  return (
    <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth ariaLabel="Bag" className="relative">
      <span className="material-symbols-outlined">shopping_bag</span>
      <motion.span
        key={totalItems}
        initial={reduceMotion ? false : { scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 22 }}
        className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#65f3de] to-[#3f7dff] text-[8px] font-bold text-[#0c1220]"
      >
        {totalItems}
      </motion.span>
    </AuthLink>
  );
}
