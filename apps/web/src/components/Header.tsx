"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CUSTOMER_ROUTES } from "../constants/routes";
import CartBadge from "./CartBadge";

export default function Header() {
  const pathname = usePathname();
  
  // Hide header on admin routes
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-6 xl:px-12">
        <h1 className="text-3xl font-black tracking-[-0.06em] text-white">KINETIC</h1>

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
  );
}
