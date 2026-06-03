"use client";

import Link from "next/link";
import { FadeIn } from "./motion/fade-in";
import { CUSTOMER_ROUTES } from "../constants/routes";
import { AuthLink } from "./auth/auth-link";

export function SiteFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <FadeIn as="footer" className="relative overflow-hidden border-t border-white/10 bg-[#12100e]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#dfb257]/10 blur-[120px]" />
        <div className="absolute bottom-[-180px] right-[-80px] h-72 w-72 rounded-full bg-[#e59a3b]/10 blur-[120px]" />
      </div>
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
        <div>
          <h5 className="text-2xl font-black">USOLSTICE</h5>
          <p className="mt-6 max-w-xs text-xs leading-7 tracking-[0.08em] text-white/55">
            Defining the future of digital commerce through editorial excellence and motion design.
          </p>
        </div>

        <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
          <h6 className="mb-2 font-bold uppercase text-white">Shop</h6>
          <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="block transition hover:text-white">
            All Products
          </Link>
          <AuthLink href={CUSTOMER_ROUTES.WISHLIST} requiresAuth className="block transition hover:text-white">
            Wishlist
          </AuthLink>
          <AuthLink href={CUSTOMER_ROUTES.ORDER_TRACKING} requiresAuth className="block transition hover:text-white">
            Order Tracking
          </AuthLink>
          <AuthLink href={CUSTOMER_ROUTES.RETURNS_REFUNDS} requiresAuth className="block transition hover:text-white">
            Returns &amp; Refunds
          </AuthLink>
        </div>

        <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
          <h6 className="mb-2 font-bold uppercase text-white">Company</h6>
          <Link href={CUSTOMER_ROUTES.ABOUT} className="block transition hover:text-white">
            About Us
          </Link>
          <Link href={CUSTOMER_ROUTES.CONTACT} className="block transition hover:text-white">
            Contact Us
          </Link>
          <Link href={CUSTOMER_ROUTES.FAQ} className="block transition hover:text-white">
            FAQ
          </Link>
          <Link href={CUSTOMER_ROUTES.PRIVACY_POLICY} className="block transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href={CUSTOMER_ROUTES.TERMS_OF_SERVICE} className="block transition hover:text-white">
            Terms of Service
          </Link>
        </div>

        <div>
          <h6 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Newsletter</h6>
          <p className="mt-4 text-xs leading-6 text-white/45">Get updates on new arrivals & exclusive deals.</p>
          <div className="mt-6 flex items-center border-b border-white/20 pb-2 transition focus-within:border-[#dfb257]/50">
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full bg-transparent text-[10px] font-medium uppercase tracking-[0.2em] text-white placeholder:text-white/45 focus:outline-none"
            />
            <button
              onClick={() => {
                // Newsletter signup toast
              }}
              className="text-sm transition hover:translate-x-0.5 hover:text-[#dfb257]"
            >
              →
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-t border-white/10 px-6 py-7 xl:px-12">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
          © {currentYear} USolstice Editorial. All Rights Reserved.
        </p>
        <div className="flex gap-4 text-white/45">
          <span className="material-symbols-outlined text-sm transition hover:text-[#dfb257]">lens_blur</span>
          <span className="material-symbols-outlined text-sm transition hover:text-[#dfb257]">north_east</span>
        </div>
      </div>
    </FadeIn>
  );
}
