"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CUSTOMER_ROUTES } from "../../constants/routes";
import { FadeIn } from "../motion/fade-in";
import { HeroBackground, HeroItem, HeroMotion } from "../motion/hero-motion";
import { Stagger, StaggerItem } from "../motion/stagger";
import CartBadge from "../CartBadge";
import { ProductCard, type ProductCardData } from "../product-card";
import { SiteFooter } from "../site-footer";

const navLinks = ["New Arrivals", "Designers", "Editorial", "Archive", "Sustainability"] as const;

const navRoutes: Record<(typeof navLinks)[number], string> = {
  "New Arrivals": CUSTOMER_ROUTES.BROWSE_PRODUCTS,
  Designers: CUSTOMER_ROUTES.BROWSE_PRODUCTS,
  Editorial: CUSTOMER_ROUTES.PRODUCT_DETAILS,
  Archive: CUSTOMER_ROUTES.PRODUCT_DETAILS,
  Sustainability: CUSTOMER_ROUTES.BROWSE_PRODUCTS,
};

const filters = ["Category", "Size", "Color", "Price Range", "Material"];

type HomePageClientProps = {
  newArrivals: ProductCardData[];
  bestSellers: ProductCardData[];
};

function productHref(item: ProductCardData) {
  return `/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id || item.name)}`;
}

export function HomePageClient({ newArrivals, bestSellers }: HomePageClientProps) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#070d17] text-[#eaf2ff] -mt-20">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/85 backdrop-blur-xl transition-[background,box-shadow] duration-300">
        <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
          <Link href={CUSTOMER_ROUTES.HOME}>
            <h1 className="text-3xl font-black tracking-[-0.06em] text-white">KINETIC</h1>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link, idx) => (
              <Link
                key={link}
                href={navRoutes[link]}
                className={`border-b pb-1 text-xs font-semibold uppercase tracking-[0.14em] transition-colors ${
                  idx === 0
                    ? "border-[#65f3de] text-white"
                    : "border-transparent text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                {link}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-5 text-lg">
            <CartBadge />
            <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} aria-label="Favorites">
              <span className="material-symbols-outlined">favorite</span>
            </Link>
            <Link href={CUSTOMER_ROUTES.PROFILE} aria-label="Profile">
              <span className="material-symbols-outlined">person</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-20">
        <section className="relative flex h-[88vh] min-h-[700px] items-end overflow-hidden px-6 pb-14 lg:px-16 xl:px-24">
          <HeroBackground />

          <HeroMotion className="relative max-w-4xl text-white">
            <HeroItem>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#65f3de]">
                Welcome to Kinetic
              </p>
            </HeroItem>
            <HeroItem>
              <h2 className="mb-8 text-6xl font-black uppercase italic leading-[0.9] tracking-[-0.06em] sm:text-7xl md:text-8xl xl:text-9xl">
                Premium
                <br />
                Fashion
              </h2>
            </HeroItem>
            <HeroItem>
              <div className="flex flex-wrap gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                    className="inline-block rounded-full bg-[#65f3de] px-10 py-4 text-sm font-bold text-black transition hover:bg-white"
                  >
                    Shop Now
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                    className="inline-block rounded-full border border-white/20 bg-white/5 px-10 py-4 text-sm font-bold text-white backdrop-blur-md transition hover:bg-white/15"
                  >
                    Browse Collection
                  </Link>
                </motion.div>
              </div>
            </HeroItem>
          </HeroMotion>
        </section>

        <div className="mx-auto flex w-full max-w-[1400px] gap-12 px-6 py-12 xl:px-12">
          <FadeIn as="aside" className="sticky top-24 hidden h-[calc(100vh-7rem)] w-72 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl lg:flex lg:flex-col">
            <div className="mb-6">
              <h3 className="text-xs font-bold uppercase tracking-[0.24em]">Filters</h3>
              <p className="mt-1 text-[9px] uppercase tracking-[0.22em] text-white/50">Refine Selection</p>
            </div>

            <div className="space-y-2">
              {filters.map((item, idx) => (
                <a
                  key={item}
                  href={`${CUSTOMER_ROUTES.BROWSE_PRODUCTS}?filter=${encodeURIComponent(item.toLowerCase())}`}
                  className={`flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.2em] transition-colors ${
                    idx === 0 ? "text-white" : "text-white/55 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{idx === 0 ? "◈" : "◻"}</span>
                  <span>{item}</span>
                </a>
              ))}
            </div>

            <div className="mt-auto rounded-lg border border-white/10 bg-[#081222] p-4 text-white">
              <p className="text-[9px] uppercase tracking-[0.2em] text-white/60">Join the movement</p>
              <p className="mt-2 text-xs font-bold">Member access to private sales.</p>
            </div>
          </FadeIn>

          <div className="min-w-0 flex-1 space-y-24">
            <FadeIn as="section">
              <div className="mb-12 flex items-end justify-between">
                <div>
                  <h3 className="text-4xl font-black uppercase tracking-[-0.05em] text-white">New Arrivals</h3>
                  <motion.div
                    className="mt-2 h-1 bg-[#65f3de]"
                    initial={reduceMotion ? { width: 48 } : { width: 0 }}
                    whileInView={{ width: 48 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
                <Link
                  href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#65f3de] underline underline-offset-8 transition hover:text-white"
                >
                  Explore All
                </Link>
              </div>

              <Stagger className="grid grid-cols-1 gap-x-8 gap-y-14 sm:grid-cols-2 xl:grid-cols-4">
                {newArrivals.map((item, idx) => (
                  <StaggerItem key={item.id || item.name}>
                    <ProductCard item={item} index={idx} href={productHref(item)} variant="dark" />
                  </StaggerItem>
                ))}
              </Stagger>
              {newArrivals.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/20 bg-white/[0.03] p-8 text-sm text-white/60">
                  No published products available right now. Publish items in admin to populate this section.
                </div>
              ) : null}
            </FadeIn>

            <FadeIn as="section" className="-mx-6 rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-20 backdrop-blur-xl xl:-mx-12 xl:px-12">
              <div className="flex flex-col gap-12 lg:flex-row lg:items-center">
                <div className="w-full lg:w-[34%]">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">Curated Selection</p>
                  <h3 className="mt-4 text-6xl font-black uppercase leading-[0.9] tracking-[-0.06em] text-white">
                    Featured Picks
                  </h3>
                  <p className="mt-6 max-w-md text-sm leading-7 text-white/70">
                    The foundation of the modern wardrobe. These pieces are pulled directly from published catalog data,
                    so the storefront feels aligned with the inventory behind it.
                  </p>
                  <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.98 }} className="mt-8 inline-block">
                    <Link
                      href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                      className="inline-block rounded-full bg-gradient-to-br from-[#497cff] to-[#003ea8] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-700/20"
                    >
                      View Favorites
                    </Link>
                  </motion.div>
                </div>

                <Stagger className="no-scrollbar flex w-full gap-8 overflow-x-auto pb-2 lg:w-[66%]">
                  {bestSellers.map((item, idx) => (
                    <StaggerItem
                      key={item.id || item.name}
                      className={`min-w-[280px] ${idx === 2 ? "opacity-40" : ""}`}
                    >
                      <ProductCard item={item} index={idx + 1} href={productHref(item)} variant="compact" />
                    </StaggerItem>
                  ))}
                </Stagger>
                {bestSellers.length === 0 ? (
                  <div className="min-w-[280px] rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-6 text-sm text-white/60">
                    No featured products are live yet.
                  </div>
                ) : null}
              </div>
            </FadeIn>

            <FadeIn as="section" className="rounded-xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm lg:p-16">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#65f3de]">Why Choose Us</p>
                <h3 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">
                  Premium Quality. Fast Delivery.
                </h3>
                <p className="mx-auto mt-6 max-w-2xl text-white/70">
                  Curated collections from world-class designers. Free shipping on orders over $100. Premium customer
                  support available 24/7.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
