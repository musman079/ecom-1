"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CUSTOMER_ROUTES } from "../../constants/routes";
import { FadeIn } from "../motion/fade-in";
import { HeroBackground, HeroItem, HeroMotion } from "../motion/hero-motion";
import { Stagger, StaggerItem } from "../motion/stagger";
import { Counter } from "../motion";
import CartBadge from "../CartBadge";
import { AuthLink } from "../auth/auth-link";
import { ProductCard, type ProductCardData } from "../product-card";
import { SiteFooter } from "../site-footer";

const navLinks = [
  { label: "Shop", href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: "About", href: CUSTOMER_ROUTES.ABOUT },
  { label: "FAQ", href: CUSTOMER_ROUTES.FAQ },
  { label: "Contact", href: CUSTOMER_ROUTES.CONTACT },
] as const;

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
    <div className="min-h-screen bg-[#0c0a09] text-[#eaf2ff] -mt-20">
      <main className="pt-20">
        <section className="relative flex h-[88vh] min-h-[700px] items-end overflow-hidden px-6 pb-14 lg:px-16 xl:px-24">
          <HeroBackground />

          <HeroMotion className="relative max-w-4xl text-white">
            <HeroItem>
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">
                Welcome to USolstice
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
                    className="inline-block rounded-full bg-[#dfb257] px-10 py-4 text-sm font-bold text-black transition hover:bg-white"
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

          {reduceMotion ? (
            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/70">
              <span>Scroll</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </div>
          ) : (
            <motion.div
              className="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-[9px] font-bold uppercase tracking-[0.28em] text-white/70"
              animate={{ y: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            >
              <span>Scroll</span>
              <span className="material-symbols-outlined text-base">expand_more</span>
            </motion.div>
          )}
        </section>

        <section className="relative overflow-hidden border-y border-white/10 bg-white/[0.02] py-5">
          <div className="flex w-max animate-marquee whitespace-nowrap text-[10px] font-black uppercase tracking-[0.25em] text-[#dfb257]">
            <span className="mx-8">FREE SHIPPING OVER $100</span>
            <span className="mx-8">•</span>
            <span className="mx-8">NEW ARRIVALS EVERY WEEK</span>
            <span className="mx-8">•</span>
            <span className="mx-8">TECHNICAL CRAFTSMANSHIP</span>
            <span className="mx-8">•</span>
            <span className="mx-8">CURATED DESIGNER PIECES</span>
            <span className="mx-8">•</span>
            <span className="mx-8">24/7 PREMIUM SUPPORT</span>
            <span className="mx-8">•</span>
            <span className="mx-8">FREE SHIPPING OVER $100</span>
            <span className="mx-8">•</span>
            <span className="mx-8">NEW ARRIVALS EVERY WEEK</span>
            <span className="mx-8">•</span>
            <span className="mx-8">TECHNICAL CRAFTSMANSHIP</span>
            <span className="mx-8">•</span>
            <span className="mx-8">CURATED DESIGNER PIECES</span>
            <span className="mx-8">•</span>
            <span className="mx-8">24/7 PREMIUM SUPPORT</span>
          </div>
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
                    className="mt-2 h-1 bg-[#dfb257]"
                    initial={reduceMotion ? { width: 48 } : { width: 0 }}
                    whileInView={{ width: 48 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
                <Link
                  href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                  className="text-xs font-bold uppercase tracking-[0.2em] text-[#dfb257] underline underline-offset-8 transition hover:text-white"
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
                      className="inline-block rounded-full bg-gradient-to-br from-[#dfb257] to-[#003ea8] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-blue-700/20"
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

            {/* Animated Stats Section */}
            <FadeIn as="section" className="rounded-xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm lg:p-16">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Why Choose Us</p>
                <h3 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">
                  Premium Quality. Fast Delivery.
                </h3>
              </div>
              <div className="mt-12 grid grid-cols-2 gap-8 md:grid-cols-4">
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl font-black tracking-tight text-[#dfb257] sm:text-5xl">
                    <Counter value={50} suffix="K+" />
                  </span>
                  <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50">Happy Customers</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl font-black tracking-tight text-[#dfb257] sm:text-5xl">
                    <Counter value={2000} suffix="+" />
                  </span>
                  <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50">Premium Products</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl font-black tracking-tight text-[#dfb257] sm:text-5xl">
                    <Counter value={35} suffix="+" />
                  </span>
                  <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50">Countries Served</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <span className="text-4xl font-black tracking-tight text-[#dfb257] sm:text-5xl">
                    <Counter value={99} suffix="%" />
                  </span>
                  <span className="mt-2 text-[9px] font-bold uppercase tracking-widest text-white/50">Satisfaction Rate</span>
                </div>
              </div>
            </FadeIn>

            {/* Testimonials Section */}
            <FadeIn as="section" className="rounded-xl border border-white/10 bg-white/[0.02] p-10 backdrop-blur-sm lg:p-16">
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Testimonials</p>
                <h3 className="mt-4 text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] text-white">
                  Voices of the community
                </h3>
              </div>
              <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.03]">
                  <div className="flex gap-1 text-[#dfb257] mb-4">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <p className="text-xs leading-6 text-white/70 italic">
                    "The tech coat is incredible. Material quality is top-tier, waterproof, and extremely comfortable. Shipping was super fast."
                  </p>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#dfb257]">— Marcus K., Tokyo</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.03]">
                  <div className="flex gap-1 text-[#dfb257] mb-4">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  </div>
                  <p className="text-xs leading-6 text-white/70 italic">
                    "USOLSTICE has completely redefined my digital wardrobe shopping. The editorial visuals are beautiful and the check-out was seamless."
                  </p>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#dfb257]">— Elena R., Milan</p>
                </div>
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.03]">
                  <div className="flex gap-1 text-[#dfb257] mb-4">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm">star_half</span>
                  </div>
                  <p className="text-xs leading-6 text-white/70 italic">
                    "Outstanding customer service. I had a question about fit, and their team resolved it in minutes. Highly recommend this brand."
                  </p>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-widest text-[#dfb257]">— David L., New York</p>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
