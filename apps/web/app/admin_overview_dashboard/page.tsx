import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { listAdminProducts } from "../../src/lib/admin-products";
import { getSessionFromRequest } from "../../src/lib/auth-session";
import { isAdminSessionUser } from "../../src/lib/admin-auth";
import AdminLogoutButton from "../../src/components/admin-logout-button";
import { listRecentOrdersForAdmin } from "../../src/lib/ecommerce-db";

const getStatusTone = (status: string): string => {
  const statusMap: Record<string, string> = {
    "delivered": "bg-emerald-50 text-emerald-700",
    "shipped": "bg-blue-50 text-blue-700",
    "processing": "bg-amber-50 text-amber-700",
    "pending": "bg-zinc-100 text-zinc-600",
    "confirmed": "bg-sky-50 text-sky-700",
    "cancelled": "bg-red-50 text-red-700",
  };
  return statusMap[status.toLowerCase()] || "bg-zinc-100 text-zinc-600";
};

const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
};

const navItems = [
  { icon: "dashboard", label: "Overview", active: true },
  { icon: "inventory_2", label: "Products" },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "assignment_return", label: "Returns" },
  { icon: "group", label: "Customers" },
  { icon: "leaderboard", label: "Analytics" },
  { icon: "settings", label: "Settings" },
];

const getAdminNavHref = (label: string) => {
  if (label === "Overview") return "/admin_overview_dashboard";
  if (label === "Products") return "/admin_products";
  if (label === "Orders") return "/admin_orders";
  if (label === "Returns") return "/admin_returns";
  if (label === "Customers") return "/admin_customers";
  if (label === "Analytics") return "/admin_analytics";
  if (label === "Settings") return "/admin_settings";
  return "/admin_overview_dashboard";
};

const barHeights = [40, 60, 75, 55, 85, 45, 30, 65, 95, 50, 40, 70];

const managementModules = [
  { title: "Products Management", items: ["Add/Edit/Delete products", "Multi-image support", "Category and SKU controls"] },
  { title: "Inventory Management", items: ["Track stock levels", "Low stock alerts", "Bulk stock updates (next)"] },
  { title: "Orders Management", items: ["View all orders", "Update order statuses", "Returns/refunds (next)"] },
  { title: "Customers Management", items: ["Customer listing", "Customer profile details", "Purchase history"] },
  { title: "Sales Analytics", items: ["Revenue snapshot", "Best sellers", "Monthly trend cards"] },
  { title: "Payments & Refunds", items: ["Payment status", "Failed transactions", "Refund queue (next)"] },
  { title: "Marketing", items: ["Coupons/discounts", "Campaign placeholders", "Newsletter tools (next)"] },
  { title: "Settings", items: ["Store info", "Tax/shipping settings", "Admin user controls"] },
];

export default async function AdminOverviewDashboardPage() {
  const cookieStore = await cookies();
  const session = await getSessionFromRequest(
    new Request("http://localhost", {
      headers: {
        cookie: cookieStore.toString(),
      },
    }),
  );

  if (!session) {
    redirect("/auth");
  }

  if (!isAdminSessionUser(session)) {
    redirect("/");
  }

  const products = await listAdminProducts();
  const recentOrdersData = await listRecentOrdersForAdmin({ limit: 8 });

  const publishedCount = products.filter((product) => product.status === "published").length;
  const draftCount = products.filter((product) => product.status === "draft").length;
  const totalUnits = products.reduce((sum, product) => sum + product.stockQuantity, 0);
  const inventoryValue = products.reduce((sum, product) => sum + product.price * product.stockQuantity, 0);

  const kpiCards = [
    { label: "Total Products", value: String(products.length), delta: `${publishedCount} Published`, deltaTone: "text-emerald-600" },
    { label: "Draft Products", value: String(draftCount), delta: "In Editorial Queue", deltaTone: "text-zinc-600" },
    { label: "Total Units", value: String(totalUnits), delta: "Across Inventory", deltaTone: "text-blue-600" },
    { label: "Inventory Value", value: `$${inventoryValue.toFixed(2)}`, delta: "Real-time from catalog", deltaTone: "text-emerald-600" },
  ];

  const topProducts = products.slice(0, 4);

  // Transform database orders to UI format
  const orders = recentOrdersData.map((order) => {
    const statusDisplay = order.status.charAt(0).toUpperCase() + order.status.slice(1).toLowerCase();
    return {
      id: `#${order.orderNumber}`,
      customer: order.customerName,
      initials: getInitials(order.customerName),
      date: new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      status: statusDisplay,
      amount: `$${(order.total / 100).toFixed(2)}`,
      tone: getStatusTone(order.status),
    };
  });

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <aside className="fixed top-0 left-0 flex-col hidden w-64 h-screen p-4 border-r border-zinc-200 bg-zinc-100/90 lg:flex">
        <div className="px-3 py-2 mb-8">
          <h1 className="text-2xl font-black uppercase tracking-[-0.05em]">Editorial</h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Super Admin</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
              <a
              key={item.label}
              href={getAdminNavHref(item.label)}
              className={`mx-2 flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition ${
                item.active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-200/70"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="pt-4 mt-auto border-t border-zinc-200">
          <AdminLogoutButton
            className="flex items-center w-full gap-3 px-4 py-3 mx-2 text-sm font-medium transition rounded-full text-zinc-500 hover:bg-zinc-200/70"
            iconClassName="material-symbols-outlined text-[20px]"
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#ffffff]/85 backdrop-blur-xl lg:ml-64">
        <div className="flex items-center justify-between h-16 gap-4 px-4 sm:px-6 lg:px-8">
          <div className="relative w-full max-w-md">
            <span className="absolute text-sm -translate-y-1/2 pointer-events-none material-symbols-outlined left-3 top-1/2 text-zinc-400">search</span>
            <input
              type="text"
              placeholder="Search report..."
              className="w-full py-2 pl-10 pr-4 text-xs font-medium transition border border-transparent rounded-full outline-none bg-zinc-100 ring-zinc-300 focus:ring-1"
            />
          </div>

          <div className="items-center hidden gap-5 sm:flex">
            <a href="/admin_overview_dashboard" className="relative transition text-zinc-500 hover:text-zinc-900" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full" />
            </a>
            <a href="/admin_overview_dashboard" className="transition text-zinc-500 hover:text-zinc-900" aria-label="Help">
              <span className="material-symbols-outlined">help</span>
            </a>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold">Alex Rivera</p>
                <p className="text-[10px] font-medium text-zinc-500">Head of Editorial</p>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArxsCLUaQKsAUMj7ZXMhjbPMCLqMxk4k7ImkVQHyM5fkhkdAjsjplWEEiyqd6ENX934Id6cfdE8i7EBeAj6FOGT6zKSly3fcQoej1FMBjzdgvescj8v8pgwxf4uj3LHwv3Xz2A-5NhhYLyXv9xvrQmZ4BttjNhEui_Sr2K1ASiefLUpeVXYwoVfX0Zges1TPcPc_3Z6CXYr46ojrUkQuucc2t0akrdTN8ncWMkzNTqSKHEp_M-DaI-nx4ePnFsDcxBzPXnVCVRG4qa"
                alt="Admin"
                className="object-cover rounded-full h-9 w-9"
              />
            </div>
          </div>

          <AdminLogoutButton
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-[#ffffff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"
            iconClassName="material-symbols-outlined text-sm"
          />
        </div>
      </header>

      <main className="px-4 pt-6 pb-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-[-0.04em]">Overview</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Real-time product summary for <span className="font-bold text-zinc-900">The Kinetic Editorial</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/admin_overview_dashboard" className="flex items-center gap-2 rounded-full border border-zinc-200 bg-[#ffffff] px-4 py-2.5 text-xs font-bold tracking-tight">
                <span className="text-sm material-symbols-outlined">calendar_today</span>
                <span>Last 30 Days</span>
              </a>
              <a href="/api/admin/products" className="flex items-center gap-2 rounded-full bg-[#000000] px-4 py-2.5 text-xs font-bold tracking-tight text-white">
                <span className="text-sm material-symbols-outlined">download</span>
                <span>Export Report</span>
              </a>
            </div>
          </div>

          <section className="grid grid-cols-1 gap-4 mb-8 sm:grid-cols-2 xl:grid-cols-4">
            {kpiCards.map((card, index) => (
              <article key={card.label} className="rounded-2xl bg-[#ffffff] p-5 shadow-sm transition hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{card.label}</p>
                  <div className="flex items-end w-10 h-6 gap-1">
                    <div className={`w-1 rounded-sm ${index % 2 ? "bg-zinc-900" : "bg-blue-500"}`} style={{ height: "50%", opacity: 0.4 }} />
                    <div className={`w-1 rounded-sm ${index % 2 ? "bg-zinc-900" : "bg-blue-500"}`} style={{ height: "75%", opacity: 0.65 }} />
                    <div className={`w-1 rounded-sm ${index % 2 ? "bg-zinc-900" : "bg-blue-500"}`} style={{ height: "100%" }} />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-bold tracking-tight">{card.value}</h3>
                  <span className={`text-xs font-bold ${card.deltaTone}`}>{card.delta}</span>
                </div>
                <p className="mt-1 text-[10px] font-medium text-zinc-400">vs. previous period</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 mb-8 xl:grid-cols-3">
            <article className="rounded-2xl bg-[#ffffff] p-6 shadow-sm xl:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
                <div>
                  <h4 className="text-xl font-bold">Sales Velocity</h4>
                  <p className="text-xs font-medium text-zinc-500">Revenue across the current fiscal month</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                  <span className="flex items-center gap-2">
                    <i className="w-2 h-2 bg-blue-600 rounded-full" />This Month
                  </span>
                  <span className="flex items-center gap-2">
                    <i className="w-2 h-2 rounded-full bg-zinc-300" />Target
                  </span>
                </div>
              </div>

              <div className="relative h-[270px] rounded-xl bg-zinc-50 px-3 pb-3 pt-6 sm:h-[320px]">
                <div className="absolute inset-x-0 px-3 space-y-12 top-8">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <div key={idx} className="w-full h-px bg-zinc-200" />
                  ))}
                </div>
                <div className="relative z-10 flex items-end h-full gap-2 sm:gap-3">
                  {barHeights.map((h, idx) => (
                    <div
                      key={`bar-${idx}`}
                      className={`w-full rounded-t-sm ${idx % 3 === 2 ? "bg-blue-600" : "bg-zinc-200"}`}
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 px-2 text-center text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                <span>W1</span>
                <span>W2</span>
                <span>W3</span>
                <span>W4</span>
              </div>
            </article>

            <article className="rounded-2xl bg-[#ffffff] p-6 shadow-sm">
              <h4 className="mb-5 text-xl font-bold">Top Products</h4>
              <div className="space-y-4">
                {topProducts.length > 0 ? (
                  topProducts.map((product) => (
                    <div key={product.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 text-xs font-black text-white uppercase rounded-lg bg-zinc-900">
                        {product.images && product.images.length > 0 ? (
                          <img src={product.images[0]} alt="Product" className="object-cover w-full h-full rounded-lg" />
                        ) : (
                          product.title.slice(0, 2)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{product.title}</p>
                        <p className="text-[10px] font-medium text-zinc-500">SKU {product.sku}</p>
                      </div>
                      <span className="text-xs font-bold">${product.price.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500">No products created yet.</p>
                )}
              </div>
              <a href="/admin_products" className="mt-6 block w-full rounded-full border border-zinc-200 py-3 text-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500 transition hover:bg-zinc-50">
                View All Products
              </a>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl bg-[#ffffff] shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 sm:p-6">
              <h4 className="text-xl font-bold">Recent Orders</h4>
              <a href="/admin_orders" className="text-[10px] font-black uppercase tracking-[0.16em] text-blue-600">View All Orders</a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left">
                <thead>
                  <tr className="bg-zinc-50">
                    {[
                      "Order ID",
                      "Customer",
                      "Date",
                      "Status",
                      "Amount",
                    ].map((title) => (
                      <th key={title} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        {title}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="transition hover:bg-zinc-50/60">
                      <td className="px-6 py-4 text-xs font-bold">{order.id}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">{order.initials}</div>
                          <span className="text-xs font-medium">{order.customer}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-zinc-500">{order.date}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${order.tone}`}>{order.status}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-right">{order.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
{/* 
          <section className="mt-8 rounded-2xl bg-[#ffffff] p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold">Admin Modules (Basic Setup)</h4>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">Phase 1</span>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {managementModules.map((module) => (
                <article key={module.title} className="p-4 border rounded-2xl border-zinc-200 bg-zinc-50">
                  <h5 className="text-sm font-black uppercase tracking-[0.04em]">{module.title}</h5>
                  <ul className="mt-3 space-y-2 text-xs text-zinc-600">
                    {module.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-zinc-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section> */}
        </div>
      </main>

      <a href="/admin_post_edit_product" className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-[#000000] text-white shadow-xl transition hover:rotate-90" aria-label="Add Product">
        <span className="material-symbols-outlined">add</span>
      </a>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-zinc-200 bg-[#ffffff] p-2 shadow-xl lg:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <li key={`mobile-${item.label}`}>
              <a
                href={getAdminNavHref(item.label)}
                className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold ${
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
