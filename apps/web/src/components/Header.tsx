"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { MotionStyle } from "framer-motion";
import { CUSTOMER_ROUTES } from "../constants/routes";
import CartBadge from "./CartBadge";
import { AuthLink } from "./auth/auth-link";

const navLinks = [
  { label: "Shop", href: CUSTOMER_ROUTES.BROWSE_PRODUCTS, requiresAuth: false },
  { label: "Cart", href: CUSTOMER_ROUTES.CART_CHECKOUT, requiresAuth: true },
] as const;

const pagesWithOwnHeader = ["/", "/product_details", "/product_detail_desktop", "/cart_checkout", "/cart_checkout_desktop"];

export default function Header() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const headerBg = useTransform(scrollY, [0, 80], ["rgba(13, 22, 39, 0.85)", "rgba(13, 22, 39, 0.96)"]);
  const headerShadow = useTransform(
    scrollY,
    [0, 80],
    ["0 0 0 rgba(0,0,0,0)", "0 8px 32px rgba(0,0,0,0.35)"],
  );
  const headerLineOpacity = useTransform(scrollY, [0, 80], [0.2, 0.8]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  if (pagesWithOwnHeader.some((path) => pathname === path || pathname.startsWith(`${path}?`))) {
    return null;
  }

  const headerStyle: MotionStyle = reduceMotion
    ? { backgroundColor: "rgba(13, 22, 39, 0.85)" }
    : { backgroundColor: headerBg, boxShadow: headerShadow };
  const headerContent = (
    <>
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
        <Link href={CUSTOMER_ROUTES.HOME} className="group">
          <motion.h1
            className="text-3xl font-black tracking-[-0.06em] text-white"
            whileHover={reduceMotion ? undefined : { letterSpacing: "-0.04em" }}
            transition={{ duration: 0.25 }}
          >
            KINETIC
          </motion.h1>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <AuthLink
              key={link.label}
              href={link.href}
              requiresAuth={Boolean(link.requiresAuth)}
              className={`relative text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                pathname === link.href ? "text-[#65f3de]" : "text-white/60 hover:text-white"
              }`}
            >
              {link.label}
              {pathname === link.href ? (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-px bg-[#65f3de]"
                />
              ) : null}
            </AuthLink>
          ))}
        </nav>

        <div className="flex items-center gap-5 text-lg">
          <CartBadge />
          <AuthLink href={CUSTOMER_ROUTES.REVIEWS} requiresAuth ariaLabel="Reviews" className="transition hover:opacity-80">
            <span className="material-symbols-outlined">favorite</span>
          </AuthLink>
          <AuthLink href={CUSTOMER_ROUTES.PROFILE} requiresAuth ariaLabel="Profile" className="transition hover:opacity-80">
            <span className="material-symbols-outlined">person</span>
          </AuthLink>
        </div>
      </div>
      {reduceMotion ? (
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#65f3de]/60 to-transparent opacity-40" />
      ) : (
        <motion.div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#65f3de]/60 to-transparent"
          style={{ opacity: headerLineOpacity }}
        />
      )}
    </>
  );

  if (reduceMotion) {
    return (
      <header
        className="fixed inset-x-0 top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-[height] duration-300 relative"
        style={{ backgroundColor: "rgba(13, 22, 39, 0.85)" }}
      >
        {headerContent}
      </header>
    );
  }

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-[height] duration-300 relative"
      style={headerStyle}
    >
      {headerContent}
    </motion.header>
  );
}
