"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, ShoppingBag, User, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

const NAV_LINKS = [
  { label: "Shop", href: "/products" },
  { label: "About", href: "/about" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cartCount = 0; // TODO: wire up global state

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <motion.header
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
        className={clsx(
          "fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 transition-all duration-300",
          scrolled ? "h-[60px] bg-primary/85 backdrop-blur-[20px]" : "h-[80px] bg-transparent"
        )}
      >
        {/* Mobile Menu Toggle */}
        <button
          className="lg:hidden text-text-primary hover:text-gold transition-colors"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Logo */}
        <Link href="/" className="font-heading text-xl tracking-[0.05em] text-text-primary lg:absolute lg:left-1/2 lg:-translate-x-1/2">
          USOLSTICE
        </Link>

        {/* Desktop Links */}
        <nav className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.label}
                href={link.href}
                className="group relative font-sans text-[13px] font-normal uppercase tracking-[0.12em] text-text-primary"
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
        <div className="flex items-center gap-5">
          <button className="text-text-primary hover:text-gold transition-colors">
            <Search className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </button>
          <Link href="/wishlist" className="hidden lg:block text-text-primary hover:text-gold transition-colors">
            <Heart className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </Link>
          <Link href="/profile" className="hidden lg:block text-text-primary hover:text-gold transition-colors">
            <User className="w-[20px] h-[20px]" strokeWidth={1.5} />
          </Link>
          <button className="relative text-text-primary hover:text-gold transition-colors flex items-center">
            <ShoppingBag className="w-[20px] h-[20px]" strokeWidth={1.5} />
            {cartCount > 0 && (
              <motion.span
                key={cartCount}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.3 }}
                className="absolute -top-1.5 -right-1.5 bg-gold text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[60] bg-primary flex flex-col pt-6 px-6"
          >
            <div className="flex items-center justify-between mb-16">
              <span className="font-heading text-xl tracking-[0.05em] text-text-primary">USOLSTICE</span>
              <motion.button
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 180, opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="text-text-primary"
              >
                <X className="w-6 h-6" />
              </motion.button>
            </div>
            
            <nav className="flex flex-col gap-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.label}
                  initial={{ x: 40, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.07, duration: 0.4 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="font-display text-4xl text-text-primary hover:text-gold transition-colors"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-auto pb-12 flex gap-6"
            >
              <Link href="/wishlist" className="text-text-secondary hover:text-gold uppercase tracking-widest text-xs font-sans">Wishlist</Link>
              <Link href="/profile" className="text-text-secondary hover:text-gold uppercase tracking-widest text-xs font-sans">Account</Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
