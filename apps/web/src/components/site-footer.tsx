"use client";

import Link from "next/link";
import { FadeIn } from "./motion/fade-in";
import { CUSTOMER_ROUTES } from "../constants/routes";

export function SiteFooter() {
  return (
    <FadeIn as="footer" className="border-t border-white/10 bg-[#0d1627]">
      <div className="mx-auto grid w-full max-w-[1400px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
        <div>
          <h5 className="text-2xl font-black">KINETIC</h5>
          <p className="mt-6 max-w-xs text-xs leading-7 tracking-[0.08em] text-white/55">
            Defining the future of digital commerce through editorial excellence and motion design.
          </p>
        </div>

        <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
          <h6 className="mb-2 font-bold uppercase text-white">Service</h6>
          <p className="transition hover:text-white">Customer Care</p>
          <p className="transition hover:text-white">Shipping &amp; Returns</p>
          <Link href={CUSTOMER_ROUTES.PRIVACY_POLICY} className="block transition hover:text-white">
            Privacy Policy
          </Link>
        </div>

        <div className="space-y-4 text-xs tracking-[0.14em] text-white/55">
          <h6 className="mb-2 font-bold uppercase text-white">Company</h6>
          <p className="transition hover:text-white">Store Locator</p>
          <p className="transition hover:text-white">Careers</p>
          <p className="transition hover:text-white">Sustainability</p>
        </div>

        <div>
          <h6 className="text-xs font-bold uppercase tracking-[0.2em] text-white">Newsletter</h6>
          <div className="mt-6 flex items-center border-b border-white/20 pb-2 transition focus-within:border-[#65f3de]/50">
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full bg-transparent text-[10px] font-medium uppercase tracking-[0.2em] text-white placeholder:text-white/45 focus:outline-none"
            />
            <Link href={CUSTOMER_ROUTES.AUTH} className="text-sm transition hover:translate-x-0.5">
              →
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between border-t border-white/10 px-6 py-7 xl:px-12">
        <p className="text-[9px] uppercase tracking-[0.2em] text-white/45">
          © 2024 Kinetic Editorial. All Rights Reserved.
        </p>
        <div className="flex gap-4 text-white/45">
          <span className="material-symbols-outlined text-sm transition hover:text-[#65f3de]">lens_blur</span>
          <span className="material-symbols-outlined text-sm transition hover:text-[#65f3de]">north_east</span>
        </div>
      </div>
    </FadeIn>
  );
}
