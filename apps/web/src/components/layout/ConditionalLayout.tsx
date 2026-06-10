"use client";

import { usePathname } from "next/navigation";

interface ConditionalLayoutProps {
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}

// Admin routes jahan Navbar aur Footer nahi chahiye
const ADMIN_PREFIXES = [
  "/admin_overview_dashboard",
  "/admin_products",
  "/admin_orders",
  "/admin_returns",
  "/admin_customers",
  "/admin_analytics",
  "/admin_settings",
  "/admin_post_edit_product",
];

export function ConditionalLayout({ children, navbar, footer }: ConditionalLayoutProps) {
  const pathname = usePathname();

  const isAdminPage = ADMIN_PREFIXES.some((prefix) =>
    pathname === prefix || pathname?.startsWith(prefix + "/")
  );

  if (isAdminPage) {
    // Admin pages: sirf children, koi navbar/footer nahi
    return <>{children}</>;
  }

  // Public pages: navbar + main + footer
  return (
    <>
      {navbar}
      <main className="min-h-screen">{children}</main>
      {footer}
    </>
  );
}
