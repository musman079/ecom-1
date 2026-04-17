"use client";

import { useState } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLogoutButton from "../../src/components/admin-logout-button";

const navItems = [
  { icon: "dashboard", label: "Overview" },
  { icon: "inventory_2", label: "Products", active: true },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "group", label: "Customers" },
  { icon: "leaderboard", label: "Analytics" },
  { icon: "settings", label: "Settings" },
];

const getAdminNavHref = (label: string) => {
  if (label === "Overview") {
    return "/admin_overview_dashboard";
  }
  if (label === "Products") {
    return "/admin_products";
  }
  return "/admin_overview_dashboard";
};

const variantRows = [
  { name: "Midnight Black", shades: "Small, Medium, Large", count: "3 Variants", tone: "bg-zinc-900" },
  { name: "Slate Grey", shades: "Medium, Extra Large", count: "2 Variants", tone: "bg-zinc-200" },
];

export default function AdminPostEditProductPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [actionMessage, setActionMessage] = useState("Ready to edit product draft.");

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          router.replace("/auth");
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            roles?: string[];
          } | null;
        };

        if (!payload.user) {
          router.replace("/auth");
          return;
        }

        const roles = Array.isArray(payload.user.roles) ? payload.user.roles : [];
        if (!roles.includes("ADMIN")) {
          router.replace("/");
          return;
        }

        setAllowed(true);
      } catch {
        router.replace("/auth");
      }
    };

    void verifyAdmin();
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] text-sm font-medium text-zinc-500">
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-100/90 p-4 lg:flex">
        <div className="mb-8 px-4">
          <h1 className="text-2xl font-black uppercase tracking-[-0.05em]">Editorial</h1>
          <p className="text-xs font-medium text-zinc-500">Super Admin</p>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={getAdminNavHref(item.label)}
              className={`mx-2 flex items-center rounded-full px-4 py-3 text-sm font-medium transition ${
                item.active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-200/70"
              }`}
            >
              <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="border-t border-zinc-200 pt-4">
          <AdminLogoutButton
            className="mx-2 flex w-full items-center rounded-full px-4 py-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-200/70"
            iconClassName="material-symbols-outlined mr-3 text-[20px]"
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-xl lg:ml-64">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-zinc-400">arrow_back</span>
            <span className="font-bold tracking-tight text-zinc-900">New Product Entry</span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button type="button" onClick={() => setActionMessage("Notifications opened.")} className="text-zinc-400 transition hover:text-zinc-900">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button type="button" onClick={() => setActionMessage("Help center opened.")} className="text-zinc-400 transition hover:text-zinc-900">
              <span className="material-symbols-outlined">help</span>
            </button>
            <img
              alt="Admin profile"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuB4GT8C29KZ2z93aHRA6mrYbA9kg0A8SYUndH_8d_nCIJvv310gJAMdHLDdcxN8vv1FfaqKqyfuFU5tpk88e9z2AH9ePYJGWtELAHGoiK3GtASQspyGVYFi36nYZtX2xLdxcxbE_iVy6xxZtsn2MtfJTAk-WMaS9Xh9hbpXjGlsLpC2lzb67oDYP971BG-8ZiQcSQTmfO25Wf96xbmT0DkzieopzjVb77EjUehsjs6BLZ2akLJPFUmnw3KDOnhnpAsVf5PSxo4udjOk"
              className="h-8 w-8 rounded-full object-cover"
            />
            <AdminLogoutButton
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"
              iconClassName="material-symbols-outlined text-sm"
            />
          </div>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Editor Suite</p>
            <h2 className="text-4xl font-black tracking-[-0.05em] sm:text-5xl">Post Product</h2>
            <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-blue-600">{actionMessage}</p>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
            <div className="space-y-8 lg:col-span-2">
              <section className="space-y-8">
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Product Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Sculptural Wool Overcoat"
                    className="w-full border-0 border-b-2 border-zinc-300 bg-transparent px-0 pb-2 text-2xl font-bold outline-none placeholder:text-zinc-300 focus:border-blue-600 sm:text-3xl"
                  />
                </div>

                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Description</label>
                  <div className="min-h-[280px] rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:min-h-[320px]">
                    <div className="mb-4 flex items-center gap-4 border-b border-zinc-100 pb-4 text-zinc-400">
                      <button type="button" onClick={() => setActionMessage("Bold formatting selected.")} className="material-symbols-outlined transition hover:text-zinc-900">format_bold</button>
                      <button type="button" onClick={() => setActionMessage("Italic formatting selected.")} className="material-symbols-outlined transition hover:text-zinc-900">format_italic</button>
                      <button type="button" onClick={() => setActionMessage("List formatting selected.")} className="material-symbols-outlined transition hover:text-zinc-900">format_list_bulleted</button>
                      <button type="button" onClick={() => setActionMessage("Link tool selected.")} className="material-symbols-outlined transition hover:text-zinc-900">link</button>
                      <div className="h-4 w-px bg-zinc-200" />
                      <button type="button" onClick={() => setActionMessage("Image tool selected.")} className="material-symbols-outlined transition hover:text-zinc-900">image</button>
                    </div>
                    <textarea
                      className="h-44 w-full resize-none border-0 bg-transparent p-0 text-sm leading-7 outline-none placeholder:text-zinc-300"
                      placeholder="Describe the craftsmanship, materials, and silhouette..."
                    />
                  </div>
                </div>
              </section>

              <section>
                <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Media Portfolio</label>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:grid-rows-2 sm:h-[400px]">
                  <div className="flex min-h-48 items-center justify-center rounded-2xl border-2 border-dashed border-zinc-300 bg-zinc-200/50 p-6 text-center transition hover:border-blue-500/50 hover:bg-zinc-100 sm:col-span-2 sm:row-span-2">
                    <div>
                      <span className="material-symbols-outlined mb-3 text-4xl text-zinc-300">cloud_upload</span>
                      <p className="text-sm font-semibold text-zinc-500">Drop High-Res Hero Image</p>
                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-zinc-400">Min 2400x3000px</p>
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-2xl bg-zinc-200 sm:col-span-1">
                    <img
                      alt="Product detail"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAV-DBkwWY_o59Rl7IZHX_GU3X8JGmZrPGA3NYyK-zox9zvAORvBfqKopvH40jKVnzoBpUMQtMupaD98S5ycunHZmIAYXmqZ4ddCznX4FHHtbxX_T1RdYHtezxd4G-rdygtxoDiU9xg9Og6xDyTIkCRqLdwAcoBfwJA_-OZy6IuUj4HqECGnzJORYhfXs4iZCg2h_7zw4bDV3VSXXgnZ2PqjsmOPgsPWTlvmGYInfZq7Lz9jfvhdDczSCFc2RgQcHDVztUUFJ5rXZO"
                      className="h-full w-full object-cover grayscale transition duration-500 hover:grayscale-0"
                    />
                  </div>

                  <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 sm:col-span-1">
                    <span className="material-symbols-outlined text-zinc-300">add</span>
                  </div>

                  <div className="flex min-h-28 items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-100 transition hover:bg-zinc-200 sm:col-span-2">
                    <span className="material-symbols-outlined text-zinc-300">add</span>
                  </div>
                </div>
              </section>

              <section className="rounded-3xl bg-zinc-100 p-6 sm:p-8">
                <div className="mb-8 flex items-end justify-between gap-4">
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Variant Manager</p>
                    <h3 className="text-xl font-bold">Size &amp; Colorways</h3>
                  </div>
                  <button type="button" onClick={() => setActionMessage("New attribute row added.")} className="rounded-full bg-black px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition hover:bg-zinc-800">
                    Add Attribute
                  </button>
                </div>

                <div className="space-y-4">
                  {variantRows.map((variant) => (
                    <div key={variant.name} className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
                      <div className="flex items-center gap-4 sm:gap-6">
                        <div className={`h-10 w-10 rounded-full border border-zinc-200 ${variant.tone}`} />
                        <div>
                          <p className="text-sm font-bold">{variant.name}</p>
                          <p className="text-[10px] uppercase tracking-[0.18em] text-zinc-400">{variant.shades}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-sm font-medium text-zinc-500">{variant.count}</span>
                        <button type="button" onClick={() => setActionMessage(`Editing ${variant.name}.`)} className="material-symbols-outlined text-zinc-400 transition hover:text-zinc-900">edit</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:space-y-8">
              <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
                <div>
                  <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Pricing (USD)</label>
                  <div className="relative">
                    <span className="absolute left-0 top-0 text-3xl font-black text-zinc-300">$</span>
                    <input
                      type="number"
                      placeholder="0.00"
                      className="w-full border-0 border-b-2 border-zinc-300 bg-transparent py-0 pb-1 pl-6 text-3xl font-black outline-none focus:border-blue-600"
                    />
                  </div>
                </div>

                <div className="mt-8 space-y-6">
                  <div>
                    <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Tax Category</label>
                    <select className="w-full rounded-xl border-0 bg-zinc-100 px-4 py-3 text-sm font-semibold outline-none ring-blue-500/20 focus:ring-2">
                      <option>Standard Goods (20%)</option>
                      <option>Luxury Surcharge (25%)</option>
                      <option>Exempt</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Collection</label>
                    <select className="w-full rounded-xl border-0 bg-zinc-100 px-4 py-3 text-sm font-semibold outline-none ring-blue-500/20 focus:ring-2">
                      <option>FW24 Editorial</option>
                      <option>Permanent Collection</option>
                      <option>Limited Capsules</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl bg-zinc-100 p-6 sm:p-8">
                <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Inventory Logistics</h4>
                <div className="mt-6 space-y-6">
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Base SKU</label>
                    <input
                      type="text"
                      defaultValue="EDITORIAL-W24-001"
                      className="w-full rounded-xl border-0 bg-white px-4 py-3 text-sm font-mono outline-none ring-blue-500/20 focus:ring-2"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Stock Quantity</label>
                    <div className="flex items-center rounded-xl bg-white px-3 py-2">
                      <button type="button" onClick={() => setActionMessage("Stock decreased by 1.")} className="material-symbols-outlined text-zinc-400">remove</button>
                      <input type="number" defaultValue={120} className="w-full bg-transparent text-center font-bold outline-none" />
                      <button type="button" onClick={() => setActionMessage("Stock increased by 1.")} className="material-symbols-outlined text-zinc-400">add</button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-5 w-10 items-center rounded-full bg-zinc-900 px-1">
                      <div className="h-3 w-3 translate-x-5 rounded-full bg-white" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-900">Low stock alert</span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-start gap-4">
                  <span className="material-symbols-outlined text-blue-700">visibility</span>
                  <div>
                    <p className="text-sm font-bold text-blue-700">Online Visibility</p>
                    <p className="mt-1 text-xs text-blue-700/70">Currently hidden from storefront. Product will go live upon publishing.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/90 px-4 py-4 backdrop-blur-xl lg:left-64 lg:px-12">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" onClick={() => setActionMessage("Draft discarded.")} className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400 transition hover:text-red-600">
            Discard Draft
          </button>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button type="button" onClick={() => setActionMessage("Draft saved successfully.")} className="rounded-full border border-zinc-200 px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:bg-zinc-50">
              Save as Draft
            </button>
            <a href="/admin_products" className="rounded-full bg-gradient-to-r from-blue-600 to-blue-700 px-7 py-3 text-center text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg shadow-blue-600/20 transition active:scale-[0.98]">
              Publish Product
            </a>
          </div>
        </div>
      </footer>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl lg:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <li key={`mobile-${item.label}`}>
              <a
                href={getAdminNavHref(item.label)}
                className={`flex flex-col items-center rounded-xl px-1 py-2 text-[10px] font-semibold ${
                  item.active ? "bg-zinc-900 text-white" : "text-zinc-500"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="mt-1 truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
