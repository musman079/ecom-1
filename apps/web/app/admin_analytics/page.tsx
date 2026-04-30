import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import AdminLogoutButton from "../../src/components/admin-logout-button";
import { isAdminSessionUser } from "../../src/lib/admin-auth";
import { getSessionFromRequest } from "../../src/lib/auth-session";
import { getAdminAnalytics, getAdminDashboardMetrics } from "../../src/lib/ecommerce-db";

const navItems = [
  { icon: "dashboard", label: "Overview" },
  { icon: "inventory_2", label: "Products" },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "assignment_return", label: "Returns" },
  { icon: "group", label: "Customers" },
  { icon: "leaderboard", label: "Analytics", active: true },
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

const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams?: { months?: string; topProductsLimit?: string };
}) {
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

  const months = Number.isFinite(Number(searchParams?.months)) ? Math.max(1, Math.min(Number(searchParams?.months), 24)) : 6;
  const topProductsLimit = Number.isFinite(Number(searchParams?.topProductsLimit))
    ? Math.max(1, Math.min(Number(searchParams?.topProductsLimit), 20))
    : 5;

  const [metrics, analytics] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminAnalytics({ months, topProductsLimit }),
  ]);

  const maxRevenue = Math.max(...analytics.salesByMonth.map((row) => row.revenue), 1);

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-100/90 p-4 lg:flex">
        <div className="mb-8 px-3 py-2">
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

        <div className="mt-auto border-t border-zinc-200 pt-4">
          <AdminLogoutButton
            className="mx-2 flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-200/70"
            iconClassName="material-symbols-outlined text-[20px]"
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#ffffff]/85 backdrop-blur-xl lg:ml-64">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[-0.04em]">Analytics</h2>
            <p className="text-xs font-medium text-zinc-500">Revenue, order velocity, and best sellers</p>
          </div>

          <AdminLogoutButton
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-[#ffffff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"
            iconClassName="material-symbols-outlined text-sm"
          />
        </div>
      </header>

      <main className="px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Revenue", value: formatCurrency(metrics.totalRevenue), note: `${months} month window` },
              { label: "Orders", value: String(metrics.totalOrders), note: `${metrics.processingOrders} processing` },
              { label: "Customers", value: String(metrics.totalCustomers), note: "Active accounts" },
              { label: "Products", value: String(metrics.totalProducts), note: `${metrics.lowStockProducts} low stock` },
            ].map((card) => (
              <article key={card.label} className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{card.label}</p>
                <div className="mt-2 text-4xl font-black tracking-tight">{card.value}</div>
                <p className="mt-2 text-xs font-medium text-zinc-500">{card.note}</p>
              </article>
            ))}
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <article className="rounded-2xl bg-white p-6 shadow-sm xl:col-span-2">
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold">Sales by Month</h3>
                  <p className="text-xs font-medium text-zinc-500">Revenue and order count over time</p>
                </div>
                <div className="text-right text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                  {months} months
                </div>
              </div>

              <div className="space-y-4">
                {analytics.salesByMonth.length === 0 ? (
                  <p className="text-sm text-zinc-500">No analytics data yet.</p>
                ) : (
                  analytics.salesByMonth.map((row) => {
                    const width = Math.max(12, Math.round((row.revenue / maxRevenue) * 100));

                    return (
                      <div key={`${row.year}-${row.month}`} className="grid grid-cols-[72px_1fr_120px] items-center gap-4">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-zinc-500">
                          {monthNames[row.month - 1] ?? row.month} {row.year}
                        </div>
                        <div className="h-3 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#65f3de] via-[#4f8cff] to-[#3f7dff]"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        <div className="text-right text-xs font-bold text-zinc-700">
                          {formatCurrency(row.revenue)} <span className="text-zinc-400">/ {row.orders} orders</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Top Products</h3>
              <p className="text-xs font-medium text-zinc-500">Best sellers in the selected period</p>

              <div className="mt-6 space-y-4">
                {analytics.topProducts.length === 0 ? (
                  <p className="text-sm text-zinc-500">No product sales yet.</p>
                ) : (
                  analytics.topProducts.map((product, index) => (
                    <div key={product.productId} className="rounded-2xl border border-zinc-100 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">#{index + 1}</p>
                          <h4 className="mt-1 text-sm font-bold">{product.productTitle}</h4>
                          <p className="text-xs text-zinc-500">SKU {product.sku}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black">{product.quantitySold}</p>
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Sold</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                        <span>Revenue</span>
                        <span className="font-bold text-zinc-700">{formatCurrency(product.revenue)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
