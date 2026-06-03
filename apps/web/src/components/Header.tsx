"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import type { MotionStyle } from "framer-motion";
import { CUSTOMER_ROUTES } from "../constants/routes";
import CartBadge from "./CartBadge";
import { AuthLink } from "./auth/auth-link";

const navLinks = [
  { label: "Shop", href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: "About", href: CUSTOMER_ROUTES.ABOUT },
  { label: "FAQ", href: CUSTOMER_ROUTES.FAQ },
  { label: "Contact", href: CUSTOMER_ROUTES.CONTACT },
] as const;

// Pages that should render the header with a light-colored design system
const lightPages = [
  CUSTOMER_ROUTES.BROWSE_PRODUCTS,
  CUSTOMER_ROUTES.PRODUCT_DETAILS,
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  const { scrollY } = useScroll();

  const isLight = lightPages.some(
    (path) => pathname === path || pathname.startsWith(path + "?") || pathname.startsWith(path + "/")
  );

  // Dynamic values depending on light or dark page background
  const headerBg = useTransform(
    scrollY,
    [0, 80],
    isLight
      ? ["rgba(255, 255, 255, 0.85)", "rgba(255, 255, 255, 0.98)"]
      : ["rgba(13, 22, 39, 0.85)", "rgba(13, 22, 39, 0.96)"]
  );

  const headerShadow = useTransform(
    scrollY,
    [0, 80],
    isLight
      ? ["0 0 0 rgba(0,0,0,0)", "0 8px 32px rgba(0, 0, 0, 0.08)"]
      : ["0 0 0 rgba(0,0,0,0)", "0 8px 32px rgba(0, 0, 0, 0.35)"]
  );

  const headerLineOpacity = useTransform(scrollY, [0, 80], [0.1, 0.8]);

  // Sync scroll open/close resets
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const headerStyle: MotionStyle = reduceMotion
    ? { backgroundColor: isLight ? "rgba(255, 255, 255, 0.96)" : "rgba(13, 22, 39, 0.85)" }
    : { backgroundColor: headerBg, boxShadow: headerShadow };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchVal.trim()) {
      router.push(`${CUSTOMER_ROUTES.BROWSE_PRODUCTS}?q=${encodeURIComponent(searchVal.trim())}`);
      setSearchOpen(false);
      setSearchVal("");
    }
  };

  const textClass = isLight ? "text-neutral-900" : "text-white";
  const navTextClass = isLight ? "text-neutral-500 hover:text-neutral-900" : "text-white/60 hover:text-white";
  const navActiveTextClass = isLight ? "text-neutral-950 font-bold" : "text-[#65f3de]";
  const borderClass = isLight ? "border-black/5" : "border-white/10";
  const inputBgClass = isLight ? "bg-neutral-100 text-black border-black/15" : "bg-[#121f37] text-white border-white/15";

  const headerContent = (
    <>
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
        <Link href={CUSTOMER_ROUTES.HOME} className="group">
          <motion.h1
            className={`text-3xl font-black tracking-[-0.06em] ${textClass}`}
            whileHover={reduceMotion ? undefined : { letterSpacing: "-0.04em" }}
            transition={{ duration: 0.25 }}
          >
            USOLSTICE
          </motion.h1>
        </Link>

        <div className="flex items-center gap-6">
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`relative text-xs font-bold uppercase tracking-[0.18em] transition-colors ${
                    isActive ? navActiveTextClass : navTextClass
                  }`}
                >
                  {link.label}
                  {isActive ? (
                    <motion.span
                      layoutId="nav-underline"
                      className={`absolute -bottom-1 left-0 right-0 h-px ${isLight ? "bg-black" : "bg-[#65f3de]"}`}
                    />
                  ) : null}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-4 text-lg">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <motion.div
                initial={false}
                animate={{ width: searchOpen ? 200 : 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <input
                  type="text"
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  placeholder="Search products..."
                  className={`h-9 w-full rounded-full border px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-offset-0 ${inputBgClass} ${
                    isLight ? "focus:border-black focus:ring-black" : "focus:border-[#65f3de] focus:ring-[#65f3de]"
                  }`}
                  style={{ pointerEvents: searchOpen ? "auto" : "none" }}
                />
              </motion.div>
              <button
                type="button"
                onClick={() => {
                  if (searchOpen) {
                    if (searchVal.trim()) {
                      handleSearchSubmit();
                    } else {
                      setSearchOpen(false);
                    }
                  } else {
                    setSearchOpen(true);
                  }
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all ${
                  isLight ? "text-neutral-700 hover:bg-neutral-100 hover:text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
                aria-label="Search"
              >
                <span className="material-symbols-outlined text-xl">search</span>
              </button>
            </form>

            <CartBadge />

            <AuthLink
              href={CUSTOMER_ROUTES.WISHLIST}
              requiresAuth
              ariaLabel="Wishlist"
              className={`transition hover:opacity-80 flex h-9 w-9 items-center justify-center rounded-full ${
                isLight ? "text-neutral-700 hover:bg-neutral-100 hover:text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">favorite</span>
            </AuthLink>

            <AuthLink
              href={CUSTOMER_ROUTES.PROFILE}
              requiresAuth
              ariaLabel="Profile"
              className={`transition hover:opacity-80 flex h-9 w-9 items-center justify-center rounded-full ${
                isLight ? "text-neutral-700 hover:bg-neutral-100 hover:text-black" : "text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="material-symbols-outlined">person</span>
            </AuthLink>

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`flex h-9 w-9 items-center justify-center rounded-full md:hidden transition-colors ${
                isLight ? "text-neutral-800 hover:bg-neutral-100" : "text-white/80 hover:bg-white/5"
              }`}
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {reduceMotion ? (
        <div className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px ${borderClass}`} />
      ) : (
        <motion.div
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${
            isLight
              ? "from-transparent via-black/15 to-transparent"
              : "from-transparent via-[#65f3de]/60 to-transparent"
          }`}
          style={{ opacity: headerLineOpacity }}
        />
      )}
    </>
  );

  const mobileMenu = (
    <AnimatePresence>
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`overflow-hidden border-t md:hidden ${
            isLight
              ? "border-black/5 bg-white/98 text-neutral-900 shadow-lg"
              : "border-white/10 bg-[#0d1627]/98 text-white shadow-xl"
          }`}
        >
          <nav className="flex flex-col gap-1 px-6 py-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-[0.14em] transition ${
                    isActive
                      ? isLight
                        ? "bg-neutral-100 text-black font-extrabold"
                        : "bg-[#65f3de]/10 text-[#65f3de]"
                      : isLight
                        ? "text-neutral-500 hover:bg-neutral-50 hover:text-black"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {reduceMotion ? (
        <header
          className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[height] duration-300 ${borderClass}`}
          style={{ backgroundColor: isLight ? "rgba(255,255,255,0.96)" : "rgba(13, 22, 39, 0.85)" }}
        >
          {headerContent}
        </header>
      ) : (
        <motion.header
          className={`fixed inset-x-0 top-0 z-50 border-b backdrop-blur-xl transition-[height] duration-300 ${borderClass}`}
          style={headerStyle}
        >
          {headerContent}
        </motion.header>
      )}
      <div className="fixed inset-x-0 top-20 z-50">
        {mobileMenu}
      </div>
    </>
  );
}
