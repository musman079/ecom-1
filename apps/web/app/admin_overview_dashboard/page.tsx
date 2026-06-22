import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { listAdminProducts, type AdminProduct } from "@/lib/admin-products";
import { getSessionFromRequest } from "@/lib/auth-session";
import { isAdminSessionUser } from "@/lib/admin-auth";
import { listRecentOrdersForAdmin, getAdminAnalytics } from "@/lib/ecommerce-db";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  Package, TrendingUp, Layers, DollarSign,
  ArrowUpRight, ExternalLink
} from "lucide-react";

const STATUS_STYLES: Record<string, string> = {
  delivered:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  shipped:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  pending:    "bg-white/5 text-white/40 border-white/10",
  confirmed:  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  cancelled:  "bg-red-500/10 text-red-400 border-red-500/20",
};

const getInitials = (name: string) =>
  name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default async function AdminOverviewDashboardPage() {
  const cookieStore = await cookies();
  const session = await getSessionFromRequest(
    new Request("http://localhost", { headers: { cookie: cookieStore.toString() } })
  );
  if (!session) redirect("/auth");
  if (!isAdminSessionUser(session)) redirect("/");

  const products: AdminProduct[] = await listAdminProducts();
  const recentOrdersData = await listRecentOrdersForAdmin({ limit: 6 });
  const analyticsData = await getAdminAnalytics({ months: 12 });

  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount     = products.filter((p) => p.status === "draft").length;
  const totalUnits     = products.reduce((s, p) => s + p.stockQuantity, 0);
  const inventoryValue = products.reduce((s, p) => s + p.price * p.stockQuantity, 0);

  const kpis = [
    { label: "Total Products", value: String(products.length),             sub: `${publishedCount} published`,    icon: Package,    color: "text-[#C8A96E]", bg: "bg-[#C8A96E]/10" },
    { label: "Drafts",         value: String(draftCount),                  sub: "In editorial queue",             icon: Layers,     color: "text-blue-400",   bg: "bg-blue-500/10" },
    { label: "Total Units",    value: totalUnits.toLocaleString(),          sub: "Across all SKUs",                icon: TrendingUp, color: "text-emerald-400",bg: "bg-emerald-500/10" },
    { label: "Catalog Value",  value: `$${inventoryValue.toLocaleString(undefined,{maximumFractionDigits:0})}`, sub: "Real-time estimate", icon: DollarSign, color: "text-purple-400", bg: "bg-purple-500/10" },
  ];

  const orders = recentOrdersData.map((o) => ({
    id: `#${o.orderNumber}`,
    customer: o.customerName,
    initials: getInitials(o.customerName),
    date: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    status: o.status.charAt(0).toUpperCase() + o.status.slice(1).toLowerCase(),
    statusKey: o.status.toLowerCase(),
    amount: `$${(o.total / 100).toFixed(2)}`,
  }));

  const topProducts = products.slice(0, 5);

  // Build real chart data from analytics — last 12 months filled with 0 for missing months
  const now = new Date();
  const chartMonths = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_NAMES[d.getMonth()] ?? "" };
  });

  const revenueByKey = new Map(
    analyticsData.salesByMonth.map((row) => [`${row.year}-${row.month}`, row.revenue])
  );
  const chartValues = chartMonths.map((m) => revenueByKey.get(`${m.year}-${m.month}`) ?? 0);
  const maxRevenue = Math.max(...chartValues, 1);
  const chartBars = chartValues.map((v) => Math.round((v / maxRevenue) * 100));
  const maxBarIndex = chartBars.indexOf(Math.max(...chartBars));

  return (
    <AdminShell
      title="Overview"
      subtitle="Real-time editorial summary"
      actions={
        <a
          href="/api/admin/products"
          className="hidden sm:flex items-center gap-2 border border-white/10 text-white/50 hover:text-white hover:border-white/20 font-sans text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-2 rounded-sm transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Export
        </a>
      }
    >
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── KPI CARDS ── */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111111] border border-white/8 rounded-sm p-5 hover:border-white/15 transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className={`${bg} p-2.5 rounded-sm`}>
                  <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
              </div>
              <p className="font-display text-3xl text-white mb-1">{value}</p>
              <p className="font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-white/30">{label}</p>
              <p className="font-sans text-[11px] text-white/20 mt-1">{sub}</p>
            </div>
          ))}
        </section>

        {/* ── CHART + TOP PRODUCTS ── */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Sales Chart */}
          <div className="xl:col-span-2 bg-[#111111] border border-white/8 rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-1">Revenue</p>
                <h3 className="font-heading text-xl text-white">Sales Velocity</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-sans font-bold uppercase tracking-wider">
                <span className="flex items-center gap-1.5 text-white/30">
                  <span className="w-2 h-2 rounded-full bg-white/20" />Target
                </span>
                <span className="flex items-center gap-1.5 text-[#C8A96E]">
                  <span className="w-2 h-2 rounded-full bg-[#C8A96E]" />This Month
                </span>
              </div>
            </div>

            {/* Bar Chart — Real Revenue Data */}
            <div className="relative h-48 flex items-end gap-1.5 px-1">
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[100, 75, 50, 25].map((v) => (
                  <div key={v} className="flex items-center gap-2">
                    <span className="text-[9px] text-white/15 w-6 text-right flex-shrink-0">{v}%</span>
                    <div className="flex-1 h-px bg-white/5" />
                  </div>
                ))}
              </div>

              <div className="relative z-10 flex items-end gap-1.5 w-full h-full pb-6 pl-8">
                {chartBars.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`$${(chartValues[i] ?? 0).toFixed(0)}`}>
                    <div
                      className={`w-full rounded-t-sm transition-all duration-500 ${i === maxBarIndex ? "bg-[#C8A96E]" : "bg-white/10 hover:bg-white/20"}`}
                      style={{ height: h > 0 ? `${h}%` : "2px" }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Month labels */}
            <div className="grid grid-cols-12 pl-8 mt-2 text-center">
              {chartMonths.map((m) => (
                <span key={`${m.year}-${m.month}`} className="text-[9px] font-sans font-bold text-white/20 uppercase">{m.label}</span>
              ))}
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-[#111111] border border-white/8 rounded-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-heading text-xl text-white">Top Products</h3>
              <a href="/admin_products" className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#C8A96E] hover:text-[#E2C98A] transition-colors">
                All →
              </a>
            </div>

            <div className="space-y-4">
              {topProducts.length > 0 ? topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 group">
                  <span className="font-sans text-[11px] text-white/20 w-4 flex-shrink-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="w-10 h-10 flex-shrink-0 rounded-sm overflow-hidden bg-[#1A1A1A] border border-white/5">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-sans text-[11px] font-bold text-white/20">
                        {p.title.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-white/80 truncate group-hover:text-white transition-colors">{p.title}</p>
                    <p className="font-sans text-[11px] text-white/25">Stock: {p.stockQuantity}</p>
                  </div>
                  <span className="font-sans text-sm font-bold text-[#C8A96E] flex-shrink-0">${p.price.toFixed(2)}</span>
                </div>
              )) : (
                <p className="text-sm text-white/25 text-center py-8">No products yet</p>
              )}
            </div>

            <a href="/admin_products" className="mt-6 block w-full text-center border border-white/8 hover:border-[#C8A96E]/30 rounded-sm py-3 font-sans text-[11px] font-bold uppercase tracking-widest text-white/30 hover:text-[#C8A96E] transition-all">
              View All Products
            </a>
          </div>
        </section>

        {/* ── RECENT ORDERS TABLE ── */}
        <section className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
            <h3 className="font-heading text-xl text-white">Recent Orders</h3>
            <a href="/admin_orders" className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#C8A96E] hover:text-[#E2C98A] transition-colors">
              View All →
            </a>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/5">
                  {["Order", "Customer", "Date", "Status", "Amount"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.length > 0 ? orders.map((o) => (
                  <tr key={o.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-sans text-sm font-bold text-[#C8A96E]">{o.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center font-sans text-[11px] font-bold text-white/50">
                          {o.initials}
                        </div>
                        <span className="font-sans text-sm text-white/70">{o.customer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm text-white/30">{o.date}</td>
                    <td className="px-6 py-4">
                      <span className={`font-sans text-[10px] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full border ${STATUS_STYLES[o.statusKey] ?? STATUS_STYLES.pending}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-sans text-sm font-bold text-white/80 text-right">{o.amount}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center font-sans text-sm text-white/25">No orders yet</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </AdminShell>
  );
}
