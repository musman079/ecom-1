"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary pt-24 pb-12 px-6 lg:px-12 mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
          
          {/* Brand Column */}
          <div className="flex flex-col">
            <Link href="/" className="font-heading text-2xl tracking-[0.05em] text-text-primary mb-6">
              USOLSTICE
            </Link>
            <p className="text-text-secondary font-sans text-sm font-light mb-8 max-w-xs">
              Curated pieces for the modern wardrobe. Editorial quality, delivered to your doorstep.
            </p>
            <div className="flex items-center gap-5">
              <a href="#" className="text-text-secondary hover:text-gold transition-all duration-300 hover:scale-110 font-sans text-xs tracking-widest uppercase">
                IG
              </a>
              <a href="#" className="text-text-secondary hover:text-gold transition-all duration-300 hover:scale-110 font-sans text-xs tracking-widest uppercase">
                X
              </a>
              <a href="#" className="text-text-secondary hover:text-gold transition-all duration-300 hover:scale-110 font-sans text-xs tracking-widest uppercase">
                FB
              </a>
              <a href="#" className="text-text-secondary hover:text-gold transition-all duration-300 hover:scale-110 font-sans text-xs tracking-widest uppercase">
                YT
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div className="flex flex-col">
            <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary mb-6">
              Shop
            </h4>
            <div className="flex flex-col gap-4">
              <Link href="/products/new-arrivals" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">New Arrivals</Link>
              <Link href="/products/clothing" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">Clothing</Link>
              <Link href="/products/accessories" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">Accessories</Link>
              <Link href="/products/sale" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">Sale</Link>
            </div>
          </div>

          {/* Company Links */}
          <div className="flex flex-col">
            <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary mb-6">
              Company
            </h4>
            <div className="flex flex-col gap-4">
              <Link href="/about" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">About Us</Link>
              <Link href="/contact" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">Contact</Link>
              <Link href="/faq" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">FAQ</Link>
              <Link href="/shipping" className="text-text-secondary hover:text-gold transition-colors font-sans text-sm">Shipping & Returns</Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="flex flex-col">
            <h4 className="font-sans text-[11px] font-medium uppercase tracking-[0.2em] text-text-primary mb-6">
              Stay in the loop
            </h4>
            <p className="text-text-secondary font-sans text-sm font-light mb-4">
              Subscribe to receive updates, access to exclusive deals, and more.
            </p>
            <form className="relative mt-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full bg-transparent border-b border-text-tertiary pb-3 text-sm font-sans text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-gold transition-colors duration-300 pr-10"
                required
              />
              <button 
                type="submit" 
                className="absolute right-0 bottom-3 text-text-secondary hover:text-gold transition-colors group"
                aria-label="Subscribe"
              >
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" strokeWidth={1.5} />
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-surface pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-text-tertiary text-xs font-sans">
            &copy; {new Date().getFullYear()} USOLSTICE. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-text-tertiary hover:text-text-secondary transition-colors text-xs font-sans">Privacy Policy</Link>
            <Link href="/terms" className="text-text-tertiary hover:text-text-secondary transition-colors text-xs font-sans">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
