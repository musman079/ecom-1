import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { isAdminSessionUser } from "../../src/lib/admin-auth";
import { getSessionFromRequest } from "../../src/lib/auth-session";
import { getAdminAnalytics, getAdminDashboardMetrics } from "../../src/lib/ecommerce-db";
import { AdminAnalyticsChart } from "../../src/components/admin/AdminAnalyticsChart";



function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export const dynamic = "force-dynamic";

function readSearchParam(value: string | string[] | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value[0];
  }

  return undefined;
}

export default async function AdminAnalyticsPage({ searchParams }: PageProps<"/admin_analytics">) {
  const params = await searchParams;
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

  const monthsValue = readSearchParam(params.months);
  const topProductsLimitValue = readSearchParam(params.topProductsLimit);

  const months = Number.isFinite(Number(monthsValue)) ? Math.max(1, Math.min(Number(monthsValue), 24)) : 6;
  const topProductsLimit = Number.isFinite(Number(topProductsLimitValue))
    ? Math.max(1, Math.min(Number(topProductsLimitValue), 20))
    : 5;

  const [metrics, analytics] = await Promise.all([
    getAdminDashboardMetrics(),
    getAdminAnalytics({ months, topProductsLimit }),
  ]);

  return (
    <AdminShell title="Analytics" subtitle="Revenue, order velocity, and best sellers">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Revenue", value: formatCurrency(metrics.totalRevenue), note: `${months} month window` },
            { label: "Orders", value: String(metrics.totalOrders), note: `${metrics.processingOrders} processing` },
            { label: "Customers", value: String(metrics.totalCustomers), note: "Active accounts" },
            { label: "Products", value: String(metrics.totalProducts), note: `${metrics.lowStockProducts} low stock` },
          ].map((card) => (
            <article key={card.label} className="bg-[#111111] border border-white/8 rounded-sm p-5">
              <p className="text-[11px] font-sans uppercase tracking-widest text-white/30">{card.label}</p>
              <div className="mt-2 text-4xl font-display text-white tracking-tight">{card.value}</div>
              <p className="mt-2 text-xs font-medium text-white/50">{card.note}</p>
            </article>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="bg-[#111111] border border-white/8 rounded-sm p-6 xl:col-span-2 flex flex-col">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h3 className="text-xl font-heading text-white">Sales by Month</h3>
                <p className="text-xs font-sans text-white/50">Revenue and order count over time</p>
              </div>
              <div className="text-right text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-white/40">
                {months} months
              </div>
            </div>

            <div className="flex-1 mt-4">
              <AdminAnalyticsChart data={analytics.salesByMonth} />
            </div>
          </article>

          <article className="bg-[#111111] border border-white/8 rounded-sm p-6">
            <h3 className="text-xl font-heading text-white">Top Products</h3>
            <p className="text-xs font-sans text-white/50">Best sellers in the selected period</p>

            <div className="mt-6 space-y-4">
              {analytics.topProducts.length === 0 ? (
                <p className="text-sm text-white/50">No product sales yet.</p>
              ) : (
                analytics.topProducts.map((product, index) => (
                  <div key={product.productId} className="rounded-sm border border-white/5 p-4 bg-white/[0.02]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-[#C8A96E]">#{index + 1}</p>
                        <h4 className="mt-1 text-sm font-sans font-bold text-white">{product.productTitle}</h4>
                        <p className="text-xs font-sans text-white/40">SKU {product.sku}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-sans font-bold text-white">{product.quantitySold}</p>
                        <p className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-white/40">Sold</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-sans text-white/50">
                      <span>Revenue</span>
                      <span className="font-bold text-white">{formatCurrency(product.revenue)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
