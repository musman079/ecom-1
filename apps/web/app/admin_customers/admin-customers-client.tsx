"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Users, ShieldAlert, UserCheck, Loader2, Search, X, Trash2, Ban, CheckCircle2 } from "lucide-react";

type Customer = {
  id: string; email: string; fullName: string; phone: string | null;
  roles: string[]; totalOrders: number; totalSpent: number;
  totalSpentFormatted: string; lastOrderDate: string | null;
  lastOrderStatus: string | null; reviewsCount: number;
  isActive: boolean; createdAt: string;
};

const ROLE_STYLES: Record<string, string> = {
  SUPER_ADMIN: "bg-[#C8A96E]/15 text-[#C8A96E] border-[#C8A96E]/20",
  ADMIN:       "bg-purple-500/10 text-purple-400 border-purple-500/20",
  CUSTOMER:    "bg-white/5 text-white/40 border-white/10",
};
const STATUS_STYLES: Record<string, string> = {
  DELIVERED:  "bg-emerald-500/10 text-emerald-400",
  SHIPPED:    "bg-blue-500/10 text-blue-400",
  PROCESSING: "bg-amber-500/10 text-amber-400",
  CONFIRMED:  "bg-sky-500/10 text-sky-400",
  PENDING:    "bg-white/5 text-white/30",
  CANCELLED:  "bg-red-500/10 text-red-400",
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}
function initials(name: string) {
  return name.split(" ").map((w) => w[0]?.toUpperCase() ?? "").join("").slice(0, 2);
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store", credentials: "include" })
      .then(async (r) => {
        if (!r.ok) { router.replace("/auth"); return; }
        const d = await r.json() as { user?: { role?: string; roles?: string[] } | null };
        const roles = Array.isArray(d.user?.roles) ? d.user.roles : [];
        const role = d.user?.role ?? "";
        if (!roles.includes("ADMIN") && role !== "ADMIN" && role !== "SUPER_ADMIN") { router.replace("/"); return; }
        setAllowed(true);
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  const loadCustomers = async (search = searchTerm) => {
    setLoading(true);
    const q = search ? `?search=${encodeURIComponent(search)}&limit=100` : "?limit=100";
    try {
      const r = await fetch(`/api/admin/customers${q}`, { cache: "no-store" });
      if (!r.ok) throw new Error("Load failed");
      const d = await r.json() as { customers?: Customer[] };
      setCustomers(Array.isArray(d.customers) ? d.customers : []);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Load failed"); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadCustomers captures searchTerm; only re-run on allowed change
  useEffect(() => { if (allowed) void loadCustomers(); }, [allowed]);

  const updateStatus = async (customer: Customer, isActive: boolean) => {
    if (!confirm(isActive ? `Reopen ${customer.fullName}'s account?` : `Block ${customer.fullName}?`)) return;
    setActionId(customer.id);
    try {
      const r = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!r.ok) throw new Error("Update failed");
      await loadCustomers();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Update failed"); }
    finally { setActionId(null); }
  };

  const deleteCustomer = async (customer: Customer) => {
    if (!confirm(`Delete ${customer.fullName}? This cannot be undone.`)) return;
    setActionId(customer.id);
    try {
      const r = await fetch(`/api/admin/customers/${customer.id}`, { method: "DELETE" });
      if (!r.ok) throw new Error("Delete failed");
      await loadCustomers();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Delete failed"); }
    finally { setActionId(null); }
  };

  if (!allowed) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
    </div>
  );

  const activeCount = customers.filter((c) => c.isActive).length;
  const adminCount  = customers.filter((c) => c.roles.includes("ADMIN")).length;

  return (
    <AdminShell title="Customers" subtitle={`${customers.length} total accounts`}>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Customers", value: customers.length, icon: Users,       color: "text-[#C8A96E]",  bg: "bg-[#C8A96E]/10" },
            { label: "Active",          value: activeCount,       icon: UserCheck,   color: "text-emerald-400", bg: "bg-emerald-500/10" },
            { label: "Admins",          value: adminCount,        icon: ShieldAlert, color: "text-purple-400",  bg: "bg-purple-500/10" },
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

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto"><X className="w-4 h-4 text-red-400/50" /></button>
          </div>
        )}

        {/* Table */}
        <div className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
          {/* Search */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-white/5">
            <h2 className="font-heading text-xl text-white flex-shrink-0">All Customers</h2>
            <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/8 rounded-sm px-3 py-2 flex-1 max-w-xs ml-auto">
              <Search className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void loadCustomers(searchTerm); }}
                className="bg-transparent text-sm text-white/70 placeholder:text-white/20 outline-none w-full"
              />
              {searchTerm && <button onClick={() => { setSearchTerm(""); void loadCustomers(""); }} className="text-white/25 hover:text-white"><X className="w-3.5 h-3.5" /></button>}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-white/5">
                  {["Customer", "Email", "Role", "Orders", "Spent", "Last Order", "Status", "Joined", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr><td colSpan={9} className="py-16 text-center"><Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin mx-auto" /></td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={9} className="py-16 text-center text-sm text-white/25">No customers found.</td></tr>
                ) : customers.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center font-sans text-[11px] font-bold text-white/50 flex-shrink-0">
                          {initials(c.fullName)}
                        </div>
                        <span className="font-sans text-sm text-white/80 truncate max-w-[100px]">{c.fullName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-sans text-xs text-white/40 truncate max-w-[140px]">{c.email}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(c.roles.length > 0 ? c.roles : ["CUSTOMER"]).map((role) => (
                          <span key={role} className={`font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_STYLES[role] ?? ROLE_STYLES.CUSTOMER}`}>
                            {role.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-sans text-sm font-bold text-white/70">{c.totalOrders}</td>
                    <td className="px-4 py-4 font-sans text-sm font-bold text-[#C8A96E]">{c.totalSpentFormatted}</td>
                    <td className="px-4 py-4">
                      <p className="font-sans text-xs text-white/40">{fmtDate(c.lastOrderDate)}</p>
                      {c.lastOrderStatus && (
                        <span className={`mt-1 inline-block font-sans text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_STYLES[c.lastOrderStatus] ?? STATUS_STYLES.PENDING}`}>
                          {c.lastOrderStatus}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-sans text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${c.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                        {c.isActive ? "Active" : "Blocked"}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-sans text-xs text-white/30">{fmtDate(c.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void updateStatus(c, !c.isActive)}
                          disabled={actionId === c.id}
                          title={c.isActive ? "Block account" : "Reopen account"}
                          className={`p-1.5 rounded-sm transition-all disabled:opacity-40 ${c.isActive ? "text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/10" : "text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/10"}`}
                        >
                          {actionId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : c.isActive ? <Ban className="w-4 h-4" strokeWidth={1.5} /> : <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />}
                        </button>
                        <button
                          onClick={() => void deleteCustomer(c)}
                          disabled={actionId === c.id}
                          title="Delete customer"
                          className="p-1.5 rounded-sm text-red-400/40 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40"
                        >
                          <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
