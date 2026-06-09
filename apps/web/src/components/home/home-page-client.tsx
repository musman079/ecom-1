"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowDown } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import useEmblaCarousel from "embla-carousel-react";
import { ProductCard, ProductCardData } from "../products/ProductCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function HomePageClient({ newArrivals }: { newArrivals: ProductCardData[], bestSellers?: ProductCardData[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroImgRef = useRef<HTMLImageElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" });

  useEffect(() => {
    if (!containerRef.current) return;
    
    const ctx = gsap.context(() => {
      // 1. PAGE LOAD SEQUENCE
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      
      // Hero eyebrow
      tl.fromTo(".hero-eyebrow", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.4 }, 
        0.5
      );
      
      // Hero Headline word reveal
      tl.fromTo(".hero-word", 
        { clipPath: "inset(0 100% 0 0)" }, 
        { clipPath: "inset(0 0% 0 0)", duration: 0.8, stagger: 0.08 }, 
        0.7
      );
      
      // Hero subtext
      tl.fromTo(".hero-subtext", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.4 }, 
        1.1
      );
      
      // CTAs
      tl.fromTo(".hero-cta", 
        { opacity: 0, scale: 0.95 }, 
        { opacity: 1, scale: 1, duration: 0.4, stagger: 0.1 }, 
        1.3
      );
      
      // Hero image
      tl.fromTo(heroImgRef.current,
        { scale: 1.08, opacity: 0 },
        { scale: 1.0, opacity: 1, duration: 1.8, ease: "power2.out" },
        1.5
      );

      // 8. HERO SECTION PARALLAX
      gsap.to(heroImgRef.current, {
        yPercent: 40,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      gsap.to(heroTextRef.current, {
        yPercent: 10,
        ease: "none",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "bottom top",
          scrub: true
        }
      });

      gsap.to(".hero-cta-container", {
        opacity: 0,
        ease: "power2.in",
        scrollTrigger: {
          trigger: ".hero-section",
          start: "top top",
          end: "center top",
          scrub: true
        }
      });

      // 5. SCROLL REVEAL - SECTIONS
      const sections = gsap.utils.toArray<HTMLElement>('.reveal-section');
      sections.forEach(section => {
        const heading = section.querySelector('.section-heading');
        const cards = section.querySelectorAll('.luxury-card');

        const tlReveal = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: "top 85%",
          }
        });

        if (heading) {
          tlReveal.fromTo(heading,
            { clipPath: "inset(0 100% 0 0)" },
            { clipPath: "inset(0 0% 0 0)", duration: 0.8, ease: "power3.out" }
          );
        }

        if (cards.length > 0) {
          tlReveal.fromTo(cards,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" },
            "-=0.4"
          );
        }
      });

      // Stats Count Up
      const statNumbers = gsap.utils.toArray<HTMLElement>('.stat-number');
      statNumbers.forEach(stat => {
        const target = parseInt(stat.getAttribute('data-target') || '0', 10);
        gsap.to(stat, {
          innerHTML: target,
          duration: 1.5,
          ease: "power3.out",
          snap: { innerHTML: 1 },
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%"
          },
          onUpdate: function() {
            stat.innerHTML = Math.round(this.targets()[0].innerHTML) + (stat.getAttribute('data-suffix') || '');
          }
        });
      });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      
      {/* --- HERO SECTION --- */}
      <section className="hero-section relative h-[100dvh] w-full overflow-hidden flex flex-col md:flex-row pt-20">
        
        {/* Left: Text */}
        <div className="w-full md:w-[55%] h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 z-10 relative bg-primary">
          <div ref={heroTextRef}>
            <span className="hero-eyebrow font-sans text-[11px] text-gold tracking-[0.25em] uppercase font-semibold mb-6 block">
              New Collection 2026
            </span>
            
            <h1 className="font-display text-5xl md:text-6xl lg:text-[80px] font-light leading-[1.1] text-text-primary mb-8 tracking-tight">
              <span className="hero-word block" style={{ clipPath: "inset(0 100% 0 0)" }}>Premium</span>
              <span className="hero-word block" style={{ clipPath: "inset(0 100% 0 0)" }}>Fashion</span>
            </h1>
            
            <p className="hero-subtext font-sans text-base md:text-[16px] font-light text-text-secondary max-w-md mb-12 leading-relaxed">
              Curated pieces for the modern wardrobe. Editorial quality, delivered to your doorstep.
            </p>
            
            <div className="hero-cta-container flex flex-col sm:flex-row gap-5">
              <Link href="/products" className="hero-cta btn-sweep bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-4 rounded-full text-center transition-transform hover:scale-[0.97]">
                <span className="relative z-10">Shop Now</span>
              </Link>
              <Link href="/collections" className="hero-cta border border-gold text-gold hover:bg-gold hover:text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-4 rounded-full text-center transition-all duration-300 hover:scale-[0.97]">
                Browse Collection
              </Link>
            </div>
          </div>

          <div className="absolute bottom-8 left-6 md:left-16 lg:left-24 flex items-center gap-3 opacity-60">
            <span className="font-sans text-[11px] uppercase tracking-widest text-text-primary">Scroll</span>
            <ArrowDown className="w-4 h-4 text-gold animate-bounce" />
          </div>
        </div>

        {/* Right: Image */}
        <div className="w-full md:w-[45%] h-full absolute md:relative top-0 right-0 z-0 overflow-hidden">
          {/* Overlay for mobile readability */}
          <div className="absolute inset-0 bg-primary/60 md:hidden z-10" />
          <img
            ref={heroImgRef}
            src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop"
            alt="Premium Fashion Collection"
            className="w-full h-full object-cover object-center scale-105"
            style={{ opacity: 0 }}
          />
        </div>
      </section>

      {/* --- TICKER BAR --- */}
      <div className="w-full h-12 bg-gold overflow-hidden flex flex-col justify-center border-y border-gold-light">
        <div className="whitespace-nowrap flex animate-marquee">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="font-sans text-[11px] font-bold tracking-[0.2em] uppercase text-primary mx-4">
              FREE SHIPPING OVER $100 • NEW ARRIVALS EVERY WEEK • PREMIUM QUALITY • CURATED COLLECTIONS •
            </span>
          ))}
        </div>
      </div>

      {/* --- NEW ARRIVALS --- */}
      <section className="reveal-section py-24 md:py-32 px-6 md:px-16 lg:px-24 max-w-[1440px] mx-auto bg-primary">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div>
            <span className="font-sans text-[11px] text-gold tracking-[0.2em] uppercase font-semibold mb-4 block">New Arrivals</span>
            <h2 className="section-heading font-heading text-4xl md:text-5xl text-text-primary" style={{ clipPath: "inset(0 100% 0 0)" }}>
              Just Dropped
            </h2>
          </div>
          <Link href="/products/new" className="mt-6 md:mt-0 font-sans text-sm font-medium text-gold hover:text-gold-light transition-colors group flex items-center gap-2">
            Explore All <ArrowDown className="w-4 h-4 -rotate-90 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* --- FEATURED PICKS --- */}
      <section className="reveal-section py-24 bg-secondary">
        <div className="max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-[60%] aspect-[4/3] overflow-hidden rounded-sm relative">
            <img 
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=2000&auto=format&fit=crop" 
              alt="Featured Collection"
              className="w-full h-full object-cover transition-transform duration-[1.5s] hover:scale-105"
            />
          </div>
          <div className="w-full lg:w-[40%] flex flex-col items-start">
            <div className="w-12 h-[1px] bg-gold mb-8" />
            <span className="font-sans text-[11px] text-gold tracking-[0.2em] uppercase font-semibold mb-4 block">Featured Picks</span>
            <h2 className="section-heading font-heading text-4xl md:text-5xl text-text-primary mb-8" style={{ clipPath: "inset(0 100% 0 0)" }}>
              The Minimalist Edit
            </h2>
            <p className="font-sans text-base font-light text-text-secondary leading-relaxed mb-10">
              Discover our curated selection of elevated basics and timeless silhouettes designed for seamless integration into your existing wardrobe.
            </p>
            <Link href="/collections/minimalist" className="btn-sweep bg-transparent border border-gold text-gold font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-8 py-4 rounded-full transition-colors">
              <span className="relative z-10">View Favorites</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section ref={statsRef} className="py-24 bg-surface border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          <div className="flex flex-col items-center">
            <span className="stat-number font-display text-4xl md:text-[56px] text-gold leading-none mb-3" data-target="10" data-suffix="K+">0</span>
            <span className="font-sans text-[13px] text-text-secondary uppercase tracking-wider">Happy Customers</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="stat-number font-display text-4xl md:text-[56px] text-gold leading-none mb-3" data-target="500" data-suffix="+">0</span>
            <span className="font-sans text-[13px] text-text-secondary uppercase tracking-wider">Premium Products</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="stat-number font-display text-4xl md:text-[56px] text-gold leading-none mb-3" data-target="50" data-suffix="+">0</span>
            <span className="font-sans text-[13px] text-text-secondary uppercase tracking-wider">Countries</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="stat-number font-display text-4xl md:text-[56px] text-gold leading-none mb-3" data-target="99" data-suffix="%">0</span>
            <span className="font-sans text-[13px] text-text-secondary uppercase tracking-wider">Satisfaction</span>
          </div>
        </div>
      </section>

      {/* --- TESTIMONIALS --- */}
      <section className="reveal-section py-24 md:py-32 px-6 md:px-16 lg:px-24 max-w-[1440px] mx-auto bg-primary overflow-hidden">
        <div className="text-center mb-16">
          <span className="font-sans text-[11px] text-gold tracking-[0.2em] uppercase font-semibold mb-4 block">Testimonials</span>
          <h2 className="section-heading font-heading text-4xl md:text-5xl text-text-primary" style={{ clipPath: "inset(0 100% 0 0)" }}>
            Client Stories
          </h2>
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <TestimonialCard key={i} />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-[0_0_100%] min-w-0 pr-4">
                <TestimonialCard />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function TestimonialCard() {
  return (
    <div className="bg-surface p-10 rounded-sm border border-gold/20 luxury-card h-full flex flex-col justify-between">
      <div>
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <svg key={i} className="w-4 h-4 text-gold fill-current" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          ))}
        </div>
        <p className="font-display text-[18px] italic text-text-primary leading-relaxed mb-8">
          &ldquo;The quality is absolutely phenomenal. From the packaging to the stitching, every detail feels considered and incredibly premium. I&apos;m a customer for life.&rdquo;
        </p>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden">
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=100&auto=format&fit=crop" alt="User" className="w-full h-full object-cover" />
        </div>
        <div>
          <h4 className="font-sans text-sm font-medium text-text-primary">Eleanor Vance</h4>
          <span className="font-sans text-[12px] text-text-secondary">New York, USA</span>
        </div>
      </div>
    </div>
  );
}
