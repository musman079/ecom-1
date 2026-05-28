"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CUSTOMER_ROUTES } from "../constants/routes";
import { AuthLink } from "./auth/auth-link";
import { useCartStore } from "../store/cart-store";

const navItems = [
  {
    label: "Home",
    href: CUSTOMER_ROUTES.HOME,
    icon: "home",
    match: ["/"] as const,
  },
  {
    label: "Shop",
    href: CUSTOMER_ROUTES.BROWSE_PRODUCTS,
    icon: "search",
    match: [CUSTOMER_ROUTES.BROWSE_PRODUCTS, CUSTOMER_ROUTES.PRODUCT_DETAILS] as const,
  },
  {
    label: "Cart",
    href: CUSTOMER_ROUTES.CART_CHECKOUT,
    icon: "shopping_bag",
    match: [CUSTOMER_ROUTES.CART_CHECKOUT, "/cart_checkout_desktop"] as const,
    requiresAuth: true,
  },
  {
    label: "Orders",
    href: CUSTOMER_ROUTES.ORDER_TRACKING,
    icon: "package_2",
    match: [CUSTOMER_ROUTES.ORDER_TRACKING] as const,
    requiresAuth: true,
  },
  {
    label: "Profile",
    href: CUSTOMER_ROUTES.PROFILE,
    icon: "person",
    match: [CUSTOMER_ROUTES.PROFILE] as const,
    requiresAuth: true,
  },
] as const;

const hiddenPrefixes = ["/admin", "/auth", "/kinetic_luxury_fashion_e_commerce"] as const;

export default function MobileNav() {
  const pathname = usePathname();
  const totalItems = useCartStore((state) => state.totalItems);

  if (hiddenPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0d1627]/92 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur-2xl md:hidden">
      <div className="mx-auto flex w-full max-w-[480px] items-center justify-between px-4">
        {navItems.map((item) => {
          const isActive = item.match.some((match) => pathname === match || pathname.startsWith(`${match}/`));
          const className = `relative flex flex-col items-center gap-1 text-[9px] font-bold uppercase tracking-[0.2em] transition ${
            isActive ? "text-[#65f3de]" : "text-white/55"
          }`;

          const content = (
            <>
              <span
                className="material-symbols-outlined text-xl"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
              {item.label === "Cart" && totalItems > 0 ? (
                <span className="absolute -right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#65f3de] to-[#3f7dff] text-[8px] font-bold text-[#0c1220]">
                  {totalItems}
                </span>
              ) : null}
            </>
          );

          if (item.requiresAuth) {
            return (
              <AuthLink
                key={item.label}
                href={item.href}
                requiresAuth
                className={className}
                ariaLabel={item.label}
              >
                {content}
              </AuthLink>
            );
          }

          return (
            <Link key={item.label} href={item.href} className={className} aria-label={item.label}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
