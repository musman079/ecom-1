"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { FadeIn } from "../../src/components/motion/fade-in";
import { Stagger, StaggerItem } from "../../src/components/motion/stagger";
import { Counter } from "../../src/components/motion";
import { SiteFooter } from "../../src/components/site-footer";

const values = [
  {
    icon: "diamond",
    title: "Premium Quality",
    description: "Every product is curated for exceptional craftsmanship and materials that stand the test of time.",
  },
  {
    icon: "local_shipping",
    title: "Fast Delivery",
    description: "Free express shipping on orders over $100. We get your items to you as fast as possible.",
  },
  {
    icon: "eco",
    title: "Sustainability",
    description: "We're committed to reducing our carbon footprint and partnering with eco-conscious brands.",
  },
  {
    icon: "support_agent",
    title: "24/7 Support",
    description: "Our team is always here to help — whether you need sizing advice or order support.",
  },
];

const stats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "2,000+", label: "Premium Products" },
  { value: "35+", label: "Countries Served" },
  { value: "4.9★", label: "Average Rating" },
];

const milestones = [
  { year: "2020", title: "Founded", desc: "USolstice was born from a passion for curated digital commerce." },
  { year: "2021", title: "First 10K Customers", desc: "Reached our first milestone through word-of-mouth and exceptional quality." },
  { year: "2022", title: "International Launch", desc: "Expanded to 20+ countries with localized shipping and support." },
  { year: "2023", title: "Sustainability Pledge", desc: "Committed to carbon-neutral shipping and eco-friendly packaging." },
  { year: "2024", title: "50K Community", desc: "Celebrating 50,000+ customers who trust USolstice for premium fashion." },
];

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.3]);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#eaf2ff]">
      {/* Hero Section */}
      <section ref={heroRef} className="relative flex min-h-[60vh] items-end overflow-hidden px-6 pb-16 pt-32 lg:px-16">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-[#382315] via-[#1f140e] to-[#0a0705]"
          style={{ y: heroY, opacity: heroOpacity }}
        />
        <motion.div
          className="pointer-events-none absolute -right-20 top-1/3 h-[400px] w-[400px] rounded-full bg-[#dfb257]/10 blur-[120px]"
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -left-16 bottom-0 h-[350px] w-[350px] rounded-full bg-[#dfb257]/12 blur-[100px]"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="relative mx-auto w-full max-w-[1400px]">
          <FadeIn>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Our Story</p>
            <h1 className="mt-3 text-5xl font-black uppercase tracking-[-0.05em] sm:text-6xl md:text-7xl">
              About
              <br />
              <span className="bg-gradient-to-r from-[#dfb257] to-[#e59a3b] bg-clip-text text-transparent">USOLSTICE</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-white/60">
              We believe that shopping should feel like discovery. USolstice is a premium digital storefront
              built for people who value quality, craftsmanship, and modern design.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/10 bg-white/[0.02]">
        <Stagger className="mx-auto grid w-full max-w-[1400px] grid-cols-2 gap-px md:grid-cols-4">
          {stats.map((stat) => (
            <StaggerItem key={stat.label} className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <span className="text-3xl font-black tracking-tight text-[#dfb257] sm:text-4xl">
                {stat.label === "Happy Customers" ? (
                  <Counter value={50} suffix="K+" />
                ) : stat.label === "Premium Products" ? (
                  <Counter value={2000} suffix="+" />
                ) : stat.label === "Countries Served" ? (
                  <Counter value={35} suffix="+" />
                ) : (
                  stat.value
                )}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55">{stat.label}</span>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <main className="mx-auto w-full max-w-[1400px] px-6 xl:px-12">
        {/* Values */}
        <section className="py-24">
          <FadeIn>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">What We Stand For</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">Our Values</h2>
          </FadeIn>

          <Stagger className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((val) => (
              <StaggerItem key={val.title}>
                <div className="group h-full rounded-2xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-sm transition hover:border-[#dfb257]/20 hover:bg-white/[0.05]">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#dfb257]/15 to-[#e59a3b]/15 transition group-hover:from-[#dfb257]/25 group-hover:to-[#e59a3b]/25">
                    <span className="material-symbols-outlined text-2xl text-[#dfb257]">{val.icon}</span>
                  </div>
                  <h3 className="mt-6 text-sm font-bold text-white">{val.title}</h3>
                  <p className="mt-3 text-xs leading-6 text-white/50">{val.description}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Timeline */}
        <section className="pb-24">
          <FadeIn>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Our Journey</p>
            <h2 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em]">Milestones</h2>
          </FadeIn>

          <div className="relative mt-14">
            {/* Vertical line */}
            <div className="absolute left-6 top-0 h-full w-px bg-gradient-to-b from-[#dfb257]/40 via-[#e59a3b]/30 to-transparent md:left-1/2" />

            {milestones.map((item, idx) => (
              <FadeIn key={item.year} delay={idx * 0.08}>
                <div className={`relative mb-12 flex items-start gap-8 pl-16 md:pl-0 ${idx % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"}`}>
                  <div className={`hidden md:block md:w-1/2 ${idx % 2 === 0 ? "text-right pr-12" : "text-left pl-12"}`}>
                    <span className="text-3xl font-black tracking-tight text-white/15">{item.year}</span>
                    <h3 className="mt-2 text-base font-bold text-white">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/50">{item.desc}</p>
                  </div>

                  {/* Dot */}
                  <div className="absolute left-4 top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#dfb257] bg-[#0c0a09] md:left-1/2 md:-translate-x-1/2">
                    <div className="h-2 w-2 rounded-full bg-[#dfb257]" />
                  </div>

                  <div className="md:hidden">
                    <span className="text-2xl font-black tracking-tight text-white/20">{item.year}</span>
                    <h3 className="mt-1 text-sm font-bold text-white">{item.title}</h3>
                    <p className="mt-1 text-xs text-white/50">{item.desc}</p>
                  </div>

                  <div className="hidden md:block md:w-1/2" />
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* CTA */}
        <FadeIn>
          <section className="mb-24 rounded-3xl border border-white/10 bg-gradient-to-br from-[#dfb257]/5 to-[#e59a3b]/5 p-12 text-center backdrop-blur-sm lg:p-20">
            <h3 className="text-3xl font-black uppercase tracking-[-0.04em] sm:text-4xl">
              Join the <span className="text-[#dfb257]">USOLSTICE</span> Movement
            </h3>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/55">
              Discover premium fashion curated for the modern shopper. Exceptional quality, fast delivery, and a shopping experience you&apos;ll love.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                  className="inline-block rounded-full bg-[#dfb257] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-[#081224] transition hover:bg-white"
                >
                  Shop Now
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href={CUSTOMER_ROUTES.CONTACT}
                  className="inline-block rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-white backdrop-blur-md transition hover:bg-white/15"
                >
                  Get in Touch
                </Link>
              </motion.div>
            </div>
          </section>
        </FadeIn>
      </main>
      <SiteFooter />
    </div>
  );
}
