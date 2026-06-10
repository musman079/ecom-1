"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { ShoppingBag, DollarSign, Clock, Loader2, Check, X } from "lucide-react";

type AdminOrder = {
  id: string; orderNumber: string; userId: string;
  customerName: string; customerEmail: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "card" | "cod";
  paymentStatus: "pending" | "paid" | "failed";
  trackingNumber: string | null;
  total: number; totalItems: number;
  createdAt: string; updatedAt: string;
};
type DraftState = { status: AdminOrder["status"]; trackingNumber: string; paymentStatus: AdminOrder["paymentStatus"] };

const statusOptions: AdminOrder["status"][] = ["pending","confirmed","processing","shipped","delivered","cancelled"];
const paymentStatusOptions: AdminOrder["paymentStatus"][] = ["pending","paid","failed"];

const STATUS_STYLES: Record<string, string> = {
  delivered:  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  shipped:    "bg-blue-500/10 text-blue-400 border-blue-500/20",
  processing: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  confirmed:  "bg-sky-500/10 text-sky-400 border-sky-500/20",
  pending:    "bg-white/5 text-white/40 border-white/10",
  cancelled:  "bg-red-500/10 text-red-400 border-red-500/20",
};
const PAYMENT_STYLES: Record<string, string> = {
  paid:    "bg-emerald-500/10 text-emerald-400",
  failed:  "bg-red-500/10 text-red-400",
  pending: "bg-white/5 text-white/30",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

export default function AdminOrdersClient() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) { router.replace("/auth"); return; }
        const d = await r.json() as { user?: { roles?: string[] } | null };
        if (!Array.isArray(d.user?.roles) || !d.user.roles.includes("ADMIN")) { router.replace("/"); return; }
        setAllowed(true);
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  useEffect(() => {
    if (!allowed) return;
    fetch("/api/admin/orders?limit=80", { cache: "no-store", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Load failed");
        const d = await r.json() as { orders?: AdminOrder[] };
        const rows = Array.isArray(d.orders) ? d.orders : [];
        setOrders(rows);
        const nextDrafts: Record<string, DraftState> = {};
        rows.forEach((o) => { nextDrafts[o.id] = { status: o.status, trackingNumber: o.trackingNumber ?? "", paymentStatus: o.paymentStatus }; });
        setDrafts(nextDrafts);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [allowed]);

  const totalRevenue = useMemo(() => orders.reduce((s, o) => s + o.total, 0), [orders]);

  const onSave = async (orderId: string) => {
    const draft = drafts[orderId];
    if (!draft) return;
    setSavingId(orderId); setError(null);
    try {
      const r = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft),
      });
      const d = await r.json() as { error?: string; order?: { id: string; status: AdminOrder["status"]; paymentStatus: AdminOrder["paymentStatus"]; trackingNumber: string | null } };
      if (!r.ok || !d.order) { setError(d.error ?? "Update failed"); return; }
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: d.order?.status ?? o.status, paymentStatus: d.order?.paymentStatus ?? o.paymentStatus, trackingNumber: d.order?.trackingNumber ?? o.trackingNumber } : o));
      setSavedId(orderId);
      setTimeout(() => setSavedId(null), 2000);
    } catch { setError("Update failed"); }
    finally { setSavingId(null); }
  };

  const patchDraft = (orderId: string, patch: Partial<DraftState>) => {
    setDrafts((prev) => ({ ...prev, [orderId]: { ...(prev[orderId] ?? { status: "pending", trackingNumber: "", paymentStatus: "pending" }), ...patch } }));
  };

  if (!allowed) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
    </div>
  );

  const selectCls = "bg-[#1A1A1A] border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white outline-none focus:border-[#C8A96E]/40 transition-all";

  return (
    <AdminShell title="Orders" subtitle="Manage and update customer orders">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-[#C8A96E]", bg: "bg-[#C8A96E]/10" },
            { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Processing", value: orders.filter((o) => o.status === "processing").length, icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-[#111111] border border-white/8 rounded-sm p-5">
              <div className={`${bg} w-9 h-9 rounded-sm flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} strokeWidth={1.5} />
              </div>
              <p className="font-display text-2xl text-white">{value}</p>
              <p className="font-sans text-[11px] text-white/30 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Messages */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50"><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* Orders Table */}
        <div className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5">
            <h2 className="font-heading text-xl text-white">All Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-white/5">
                  {["Order", "Customer", "Date", "Status", "Payment", "Tracking", "Total", "Action"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center"><Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin mx-auto" /></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-sm text-white/25">No orders found.</td></tr>
                ) : orders.map((order) => {
                  const draft = drafts[order.id];
                  return (
                    <tr key={order.id} className="hover:bg-white/[0.02] transition-colors align-top">
                      <td className="px-4 py-4">
                        <p className="font-sans text-sm font-bold text-[#C8A96E]">#{order.orderNumber}</p>
                        <p className="font-sans text-[11px] text-white/30 mt-0.5">{order.totalItems} items</p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-sans text-sm text-white/80">{order.customerName}</p>
                        <p className="font-sans text-[11px] text-white/30 mt-0.5 truncate max-w-[140px]">{order.customerEmail}</p>
                      </td>
                      <td className="px-4 py-4 font-sans text-sm text-white/30">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4">
                        <select
                          value={draft?.status ?? order.status}
                          onChange={(e) => patchDraft(order.id, { status: e.target.value as AdminOrder["status"] })}
                          className={selectCls}
                        >
                          {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <span className={`mt-1.5 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[draft?.status ?? order.status] ?? STATUS_STYLES.pending}`}>
                          {draft?.status ?? order.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={draft?.paymentStatus ?? order.paymentStatus}
                          onChange={(e) => patchDraft(order.id, { paymentStatus: e.target.value as AdminOrder["paymentStatus"] })}
                          className={selectCls}
                        >
                          {paymentStatusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <p className="font-sans text-[10px] text-white/25 uppercase mt-1">{order.paymentMethod}</p>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          value={draft?.trackingNumber ?? order.trackingNumber ?? ""}
                          onChange={(e) => patchDraft(order.id, { trackingNumber: e.target.value })}
                          placeholder="Tracking #"
                          className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm px-2 py-1.5 text-xs text-white placeholder:text-white/20 outline-none focus:border-[#C8A96E]/40 transition-all"
                        />
                      </td>
                      <td className="px-4 py-4 font-sans text-sm font-bold text-white/80">${order.total.toFixed(2)}</td>
                      <td className="px-4 py-4">
                        <button
                          onClick={() => void onSave(order.id)}
                          disabled={savingId === order.id}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-sm font-sans text-[11px] font-bold uppercase tracking-wider transition-all ${
                            savedId === order.id
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                              : "bg-[#C8A96E]/10 text-[#C8A96E] border border-[#C8A96E]/20 hover:bg-[#C8A96E]/20 disabled:opacity-40"
                          }`}
                        >
                          {savingId === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : savedId === order.id ? <Check className="w-3 h-3" /> : null}
                          {savingId === order.id ? "Saving" : savedId === order.id ? "Saved" : "Save"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Status Legend */}
        <div className="flex flex-wrap gap-4 text-[11px] font-sans">
          {Object.entries(PAYMENT_STYLES).map(([s, cls]) => (
            <span key={s} className={`flex items-center gap-1.5 px-2 py-1 rounded-full ${cls}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />{s}
            </span>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
