"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useCartStore } from "@/store/cart-store";

const NAV_LINKS = [
  { label: "Shop", href: "/products" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  // Wire cart count from global zustand store
  const cartCount = useCartStore((state) => state.totalItems);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu or search is open
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen, searchOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  return (
    <>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 transition-all duration-300",
          scrolled ? "h-[60px] bg-primary/90 backdrop-blur-[20px] border-b border-white/5" : "h-[72px] md:h-[80px] bg-transparent"
        )}
      >
        {/* Mobile: Left — Hamburger */}
        <button
          className="lg:hidden text-text-primary hover:text-gold transition-colors p-1"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo — centered on mobile, absolute-centered on desktop */}
        <Link
          href="/"
          className="font-heading text-lg md:text-xl tracking-[0.05em] text-text-primary lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        >
          USOLSTICE
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className="group relative font-sans text-[13px] font-normal uppercase tracking-[0.12em] text-text-primary hover:text-gold transition-colors"
              >
                {link.label}
                <span
                  className={clsx(
                    "absolute -bottom-1 left-0 h-[1px] bg-gold transition-transform duration-300 origin-left",
                    isActive ? "w-full scale-x-100" : "w-full scale-x-0 group-hover:scale-x-100"
                  )}
                />
              </Link>
            );
          })}
        </nav>

        {/* Right Icons */}
        <div className="flex items-center gap-3 md:gap-5">
          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="text-text-primary hover:text-gold transition-colors p-1"
            aria-label="Search"
          >
            <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>

          {/* Wishlist — desktop only */}
          <Link href="/wishlist" className="hidden lg:block text-text-primary hover:text-gold transition-colors p-1">
            <Heart className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </Link>

          {/* Account — desktop only */}
          <Link href="/profile" className="hidden lg:block text-text-primary hover:text-gold transition-colors p-1">
            <User className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </Link>

          {/* Cart — always visible, links to /cart */}
          <Link
            href="/cart"
            className="relative text-text-primary hover:text-gold transition-colors p-1 flex items-center"
            aria-label={`Cart (${cartCount} items)`}
          >
            <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={1.5} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="absolute -top-1 -right-1 bg-gold text-primary text-[10px] font-bold min-w-[16px] h-4 px-[3px] rounded-full flex items-center justify-center"
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>
      </motion.header>

      {/* ── SEARCH OVERLAY ── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[70] bg-primary/95 backdrop-blur-xl flex flex-col items-center justify-center px-6"
          >
            <button
              onClick={() => setSearchOpen(false)}
              className="absolute top-6 right-6 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Close search"
            >
              <X className="w-6 h-6" />
            </button>

            <span className="font-sans text-[11px] uppercase tracking-[0.25em] text-gold mb-8">Search</span>

            <form onSubmit={handleSearch} className="w-full max-w-xl">
              <div className="relative flex items-center border-b-2 border-surface focus-within:border-gold transition-colors">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..."
                  autoFocus
                  className="w-full bg-transparent py-4 pr-12 font-heading text-2xl md:text-3xl text-text-primary placeholder:text-text-tertiary outline-none"
                />
                <button type="submit" className="absolute right-0 text-text-secondary hover:text-gold transition-colors">
                  <Search className="w-6 h-6" strokeWidth={1.5} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU OVERLAY ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
            className="fixed inset-0 z-[60] bg-primary flex flex-col pt-0 overflow-y-auto"
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between px-6 h-[72px] border-b border-surface">
              <Link href="/" className="font-heading text-xl tracking-[0.05em] text-text-primary">
                USOLSTICE
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-text-primary hover:text-gold transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col px-6 py-8 gap-1">
              {NAV_LINKS.map((link, i) => {
                const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
                return (
                  <motion.div
                    key={link.label}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.05 + i * 0.05, duration: 0.3 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={clsx(
                        "block font-display text-3xl py-3 border-b border-surface/50 transition-colors",
                        isActive ? "text-gold" : "text-text-primary hover:text-gold"
                      )}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Mobile Bottom: Account + Cart Links */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-auto px-6 pb-10 flex flex-col gap-4 border-t border-surface pt-8"
            >
              <Link
                href="/cart"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-text-secondary hover:text-gold transition-colors py-2"
              >
                <span className="font-sans text-sm uppercase tracking-widest">Cart</span>
                <div className="flex items-center gap-2">
                  {cartCount > 0 && (
                    <span className="bg-gold text-primary text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {cartCount}
                    </span>
                  )}
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />
                </div>
              </Link>
              <Link
                href="/wishlist"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-text-secondary hover:text-gold transition-colors py-2"
              >
                <span className="font-sans text-sm uppercase tracking-widest">Wishlist</span>
                <Heart className="w-5 h-5" strokeWidth={1.5} />
              </Link>
              <Link
                href="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between text-text-secondary hover:text-gold transition-colors py-2"
              >
                <span className="font-sans text-sm uppercase tracking-widest">Account</span>
                <User className="w-5 h-5" strokeWidth={1.5} />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
