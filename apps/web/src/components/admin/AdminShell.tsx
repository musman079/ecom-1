"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingBag, RotateCcw,
  Users, BarChart3, Settings, LogOut, Menu, X,
  Bell, Search, ChevronRight
} from "lucide-react";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview",   href: "/admin_overview_dashboard" },
  { icon: Package,          label: "Products",   href: "/admin_products" },
  { icon: ShoppingBag,      label: "Orders",     href: "/admin_orders" },
  { icon: RotateCcw,        label: "Returns",    href: "/admin_returns" },
  { icon: Users,            label: "Customers",  href: "/admin_customers" },
  { icon: BarChart3,        label: "Analytics",  href: "/admin_analytics" },
  { icon: Settings,         label: "Settings",   href: "/admin_settings" },
];

interface AdminShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

/* ─── Sidebar content (shared between desktop & mobile) ──────────────── */
function SidebarContent({
  pathname,
  onLogout,
  onClose,
}: {
  pathname: string;
  onLogout: () => void;
  onClose?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-6 py-8 border-b border-white/5 flex items-center justify-between">
        <Link href="/admin_overview_dashboard" className="block">
          <span className="font-heading text-2xl tracking-[0.05em] text-white">USOLSTICE</span>
          <p className="font-sans text-[10px] font-bold uppercase tracking-[0.25em] text-[#C8A96E] mt-1">
            Admin Portal
          </p>
        </Link>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ icon: Icon, label, href }) => {
          const active = pathname === href || pathname?.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[#C8A96E]/10 text-[#C8A96E] border border-[#C8A96E]/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-[#C8A96E]" : ""}`} strokeWidth={active ? 2 : 1.5} />
              <span className="tracking-wide">{label}</span>
              {active && <ChevronRight className="w-3 h-3 ml-auto text-[#C8A96E]/60" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-6 pt-4 border-t border-white/5 space-y-2">
        <Link
          href="/"
          className="flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          <span>View Store</span>
        </Link>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-sm text-sm font-medium text-white/40 hover:text-red-400 hover:bg-red-400/5 transition-all"
        >
          <LogOut className="w-4 h-4" strokeWidth={1.5} />
          <span>Logout</span>
        </button>
      </div>
    </>
  );
}

export function AdminShell({ children, title, subtitle, actions }: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white flex">

      {/* ══════════════════════════════════════
          DESKTOP SIDEBAR — sticky, in normal flow
          (no fixed positioning = no margin hack needed)
      ══════════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-[240px] flex-shrink-0 sticky top-0 h-screen bg-[#0D0D0D] border-r border-white/5 overflow-y-auto">
        <SidebarContent pathname={pathname} onLogout={handleLogout} />
      </aside>

      {/* ══════════════════════════════════════
          MOBILE SIDEBAR OVERLAY
      ══════════════════════════════════════ */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-screen w-[280px] bg-[#0D0D0D] border-r border-white/5 z-[60] flex flex-col transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent
          pathname={pathname}
          onLogout={handleLogout}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* ══════════════════════════════════════
          MAIN CONTENT AREA — naturally takes remaining width
      ══════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP HEADER */}
        <header className={`sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 h-16 border-b transition-all duration-300 ${
          scrolled ? "bg-[#0D0D0D]/95 backdrop-blur-xl border-white/10" : "bg-[#080808] border-white/5"
        }`}>
          {/* Left: mobile menu + title */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-white/50 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-heading text-lg md:text-xl tracking-[0.04em] text-white leading-none">{title}</h1>
              {subtitle && <p className="font-sans text-[11px] text-white/40 mt-0.5">{subtitle}</p>}
            </div>
          </div>

          {/* Right: search + bell + actions */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-sm px-3 py-2 w-48">
              <Search className="w-3.5 h-3.5 text-white/30" />
              <input
                type="text"
                placeholder="Search..."
                className="bg-transparent text-sm text-white/70 placeholder:text-white/25 outline-none w-full"
              />
            </div>
            <button className="relative text-white/40 hover:text-white transition-colors p-2">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#C8A96E] rounded-full" />
            </button>
            {actions}
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* ══════════════════════════════════════
          MOBILE BOTTOM NAV
      ══════════════════════════════════════ */}
      <nav className="fixed bottom-0 inset-x-0 z-50 lg:hidden bg-[#0D0D0D] border-t border-white/10">
        <ul className="grid grid-cols-5 gap-0">
          {NAV_ITEMS.slice(0, 5).map(({ icon: Icon, label, href }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex flex-col items-center justify-center py-3 gap-1 transition-colors ${
                    active ? "text-[#C8A96E]" : "text-white/30 hover:text-white/70"
                  }`}
                >
                  <Icon className="w-5 h-5" strokeWidth={active ? 2 : 1.5} />
                  <span className="font-sans text-[10px] uppercase tracking-wider">{label}</span>
                  {active && <span className="absolute bottom-0 w-8 h-0.5 bg-[#C8A96E] rounded-full" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
