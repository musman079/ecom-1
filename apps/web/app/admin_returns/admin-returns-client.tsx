"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { Loader2 } from "lucide-react";

type AdminReturn = {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  paymentStatus: string;
  reason: string;
  notes: string;
  resolution: "refund" | "exchange";
  status: "requested" | "approved" | "in_transit" | "refunded" | "rejected";
  refundStatus: "not_required" | "pending" | "refunded" | "failed";
  adminNote: string;
  createdAt: string;
  updatedAt: string;
};

type ReturnDraft = {
  status: AdminReturn["status"];
  adminNote: string;
};

type AdminNotification = {
  id: string;
  kind: string;
  title: string;
  message: string;
  metadata?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
};

function getAdminNotificationHref(item: AdminNotification) {
  const returnNumber = item.metadata?.returnNumber;
  const orderNumber = item.metadata?.orderNumber;

  if (item.kind.includes("return")) {
    const params = new URLSearchParams();
    if (returnNumber) {
      params.set("returnNumber", returnNumber);
    }
    if (orderNumber) {
      params.set("orderNumber", orderNumber);
    }

    const serialized = params.toString();
    return serialized ? `/admin_returns?${serialized}` : "/admin_returns";
  }

  if (orderNumber) {
    return `/admin_orders?orderNumber=${encodeURIComponent(orderNumber)}`;
  }

  return "/admin_returns";
}

const statusOptions: AdminReturn["status"][] = ["requested", "approved", "in_transit", "refunded", "rejected"];
const transitionMap: Record<AdminReturn["status"], AdminReturn["status"][]> = {
  requested: ["approved", "rejected"],
  approved: ["in_transit", "rejected"],
  in_transit: ["refunded", "rejected"],
  refunded: [],
  rejected: [],
};

function formatDate(iso: string) {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return "-";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function statusTone(status: AdminReturn["status"]) {
  if (status === "requested") {
    return "bg-amber-50 text-amber-700";
  }
  if (status === "approved") {
    return "bg-blue-50 text-blue-700";
  }
  if (status === "in_transit") {
    return "bg-indigo-50 text-indigo-700";
  }
  if (status === "refunded") {
    return "bg-emerald-50 text-emerald-700";
  }
  return "bg-red-50 text-red-700";
}

function nextAllowedStatuses(status: AdminReturn["status"]) {
  return transitionMap[status];
}

const navItems = [
  { icon: "dashboard", label: "Overview" },
  { icon: "inventory_2", label: "Products" },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "assignment_return", label: "Returns", active: true },
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

export function AdminReturnsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [returns, setReturns] = useState<AdminReturn[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReturnDraft>>({});
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [notificationKindFilter, setNotificationKindFilter] = useState<
    "all" | "admin_return_requested" | "order_created" | "order_status_updated" | "return_requested" | "return_status_updated"
  >("all");
  const [notificationUnreadOnly, setNotificationUnreadOnly] = useState(false);

  const highlightedReturnNumber = searchParams.get("returnNumber")?.trim() || null;
  const highlightedOrderNumber = searchParams.get("orderNumber")?.trim() || null;

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

        const roles = Array.isArray(payload.user?.roles) ? payload.user.roles : [];
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

  useEffect(() => {
    if (!allowed) {
      return;
    }

    const loadReturns = async () => {
      setError(null);
      try {
        const response = await fetch("/api/admin/returns?limit=120", { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Unable to load return requests.");
        }

        const payload = (await response.json()) as { returns?: AdminReturn[] };
        const rows = Array.isArray(payload.returns) ? payload.returns : [];
        setReturns(rows);

        const nextDrafts: Record<string, ReturnDraft> = {};
        for (const row of rows) {
          nextDrafts[row.id] = {
            status: row.status,
            adminNote: row.adminNote ?? "",
          };
        }
        setDrafts(nextDrafts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load return requests.");
      } finally {
        setLoading(false);
      }
    };

    void loadReturns();
  }, [allowed]);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    const loadNotifications = async () => {
      try {
        const params = new URLSearchParams({
          limit: "10",
          audience: "admin",
        });

        if (notificationUnreadOnly) {
          params.set("unreadOnly", "true");
        }

        if (notificationKindFilter !== "all") {
          params.set("kind", notificationKindFilter);
        }

        const response = await fetch(`/api/notifications?${params.toString()}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load admin notifications.");
        }

        const payload = (await response.json()) as {
          unreadCount?: number;
          notifications?: AdminNotification[];
        };

        setUnreadNotifications(Number(payload.unreadCount ?? 0));
        setNotifications(Array.isArray(payload.notifications) ? payload.notifications : []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load admin notifications.");
      }
    };

    void loadNotifications();
  }, [allowed, notificationKindFilter, notificationUnreadOnly]);

  const totals = useMemo(
    () => ({
      total: returns.length,
      active: returns.filter((row) => ["requested", "approved", "in_transit"].includes(row.status)).length,
      refunded: returns.filter((row) => row.status === "refunded").length,
    }),
    [returns],
  );

  const onSave = async (returnId: string) => {
    const draft = drafts[returnId];
    const row = returns.find((item) => item.id === returnId);
    if (!draft) {
      return;
    }
    if (!row) {
      setError("Return request not found.");
      return;
    }

    const statusChanged = draft.status !== row.status;
    const allowedStatuses = nextAllowedStatuses(row.status);
    if (statusChanged && !allowedStatuses.includes(draft.status)) {
      setError(`Invalid transition: ${row.status} -> ${draft.status}.`);
      return;
    }

    if (draft.status === "rejected" && !draft.adminNote.trim()) {
      setError("Admin note is required when rejecting a return request.");
      return;
    }

    setSavingId(returnId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/returns/${returnId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as {
        error?: string;
        returnRequest?: {
          id: string;
          status: AdminReturn["status"];
          adminNote: string;
          updatedAt: string;
        };
      };

      if (!response.ok || !payload.returnRequest) {
        setError(payload.error ?? "Failed to update request.");
        return;
      }

      setReturns((current) =>
        current.map((row) =>
          row.id === returnId
            ? {
                ...row,
                status: payload.returnRequest?.status ?? row.status,
                adminNote: payload.returnRequest?.adminNote ?? row.adminNote,
                updatedAt: payload.returnRequest?.updatedAt ?? row.updatedAt,
              }
            : row,
        ),
      );

      setMessage("Return request updated.");
    } catch {
      setError("Unable to update return request right now.");
    } finally {
      setSavingId(null);
    }
  };

  const markAllAdminNotificationsRead = async () => {
    setMarkingAllRead(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (!response.ok) {
        setError("Unable to update notifications.");
        return;
      }

      setUnreadNotifications(0);
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
    } catch {
      setError("Unable to update notifications right now.");
    } finally {
      setMarkingAllRead(false);
    }
  };

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
      </div>
    );
  }

  return (
    <AdminShell title="Returns" subtitle="Process and manage customer return requests">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="bg-[#111111] border border-white/8 rounded-sm p-5">
            <p className="text-[11px] font-sans uppercase tracking-widest text-white/30">Total Requests</p>
            <h2 className="mt-2 text-3xl font-display text-white">{totals.total}</h2>
          </article>
          <article className="bg-[#111111] border border-white/8 rounded-sm p-5">
            <p className="text-[11px] font-sans uppercase tracking-widest text-white/30">Active Cases</p>
            <h2 className="mt-2 text-3xl font-display text-white">{totals.active}</h2>
          </article>
          <article className="bg-[#111111] border border-white/8 rounded-sm p-5">
            <p className="text-[11px] font-sans uppercase tracking-widest text-white/30">Refunded</p>
            <h2 className="mt-2 text-3xl font-display text-white">{totals.refunded}</h2>
          </article>
        </section>

        <section className="bg-[#111111] border border-white/8 rounded-sm p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-heading text-white">Admin Notifications</h2>
              <p className="text-[11px] font-sans uppercase tracking-widest text-[#C8A96E] mt-1">Unread: {unreadNotifications}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={notificationKindFilter}
                onChange={(event) =>
                  setNotificationKindFilter(
                    event.target.value as
                      | "all"
                      | "admin_return_requested"
                      | "order_created"
                      | "order_status_updated"
                      | "return_requested"
                      | "return_status_updated",
                  )
                }
                className="bg-[#1A1A1A] border border-white/10 rounded-sm px-3 py-2 text-xs font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
              >
                <option value="all">All Types</option>
                <option value="admin_return_requested">Return Queue</option>
                <option value="order_created">Order Created</option>
                <option value="order_status_updated">Order Updated</option>
                <option value="return_requested">Return Requested</option>
                <option value="return_status_updated">Return Updated</option>
              </select>
              <label className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-sm px-3 py-2 text-xs font-sans text-white/70">
                <input
                  type="checkbox"
                  checked={notificationUnreadOnly}
                  onChange={(event) => setNotificationUnreadOnly(event.target.checked)}
                  className="accent-[#C8A96E]"
                />
                Unread Only
              </label>
              <button
                type="button"
                onClick={() => void markAllAdminNotificationsRead()}
                disabled={markingAllRead || unreadNotifications === 0}
                className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest transition-all hover:bg-[#C8A96E]/20 disabled:opacity-40"
              >
                {markingAllRead ? "Updating..." : "Mark All Read"}
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="text-sm font-sans text-white/30 py-2">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <article key={item.id} className={`rounded-sm border p-4 ${item.isRead ? "border-white/5 bg-white/[0.02]" : "border-[#C8A96E]/30 bg-[#C8A96E]/5"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-sans font-bold text-white">{item.title}</h3>
                    <p className="text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-white/40">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs font-sans text-white/60">{item.message}</p>
                  <a href={getAdminNotificationHref(item)} className="mt-2 inline-block text-[11px] font-sans font-bold uppercase tracking-[0.14em] text-[#C8A96E] hover:underline">
                    Open Related
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        {error ? <p className="rounded-sm border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-sans text-red-400">{error}</p> : null}
        {message ? <p className="rounded-sm border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-sans text-emerald-400">{message}</p> : null}

        <section className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-white/5">
            <h2 className="font-heading text-xl text-white">All Return Requests</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="border-b border-white/5">
                  {[
                    "Return",
                    "Order",
                    "Customer",
                    "Reason",
                    "Resolution",
                    "Status",
                    "Admin Note",
                    "Updated",
                    "Action",
                  ].map((title) => (
                    <th key={title} className="px-4 py-4 text-left font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white/25">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td className="px-4 py-12 text-center" colSpan={9}>
                      <span className="inline-block animate-spin w-5 h-5 border-2 border-[#C8A96E] border-t-transparent rounded-full" />
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td className="px-4 py-12 text-center text-sm font-sans text-white/25" colSpan={9}>
                      No return requests found.
                    </td>
                  </tr>
                ) : (
                  returns.map((row) => {
                    const draft = drafts[row.id];
                    const allowedNextStatuses = nextAllowedStatuses(row.status);
                    const isFinalStatus = allowedNextStatuses.length === 0;
                    const isHighlighted =
                      (highlightedReturnNumber && row.returnNumber === highlightedReturnNumber) ||
                      (highlightedOrderNumber && row.orderNumber === highlightedOrderNumber);
                    return (
                      <tr key={row.id} className={`align-top hover:bg-white/[0.02] transition-colors ${isHighlighted ? "bg-[#C8A96E]/5" : ""}`}>
                        <td className="px-4 py-4">
                          <p className="text-sm font-sans font-bold text-[#C8A96E]">{row.returnNumber}</p>
                          <p className="mt-1 text-[11px] font-sans text-white/30">{formatDate(row.createdAt)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-sans font-bold text-white/80">#{row.orderNumber}</p>
                          <p className="mt-1 text-[11px] font-sans text-white/30">{row.orderId.slice(0, 10)}...</p>
                          <p className="mt-1 text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-white/40">Payment {row.paymentStatus}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-sm font-sans text-white/80">{row.customerName}</p>
                          <p className="mt-1 text-[11px] font-sans text-white/30">{row.customerEmail}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-sans text-white/70">
                          <p className="font-bold">{row.reason}</p>
                          {row.notes ? <p className="mt-1 text-[11px] text-white/40">{row.notes}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <span className="bg-white/5 border border-white/10 rounded-sm px-2 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-white/60">
                            {row.resolution}
                          </span>
                          <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-[0.14em] text-white/40">Refund {row.refundStatus}</p>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={draft?.status ?? row.status}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [row.id]: {
                                  ...(current[row.id] ?? { status: row.status, adminNote: row.adminNote }),
                                  status: event.target.value as ReturnDraft["status"],
                                },
                              }))
                            }
                            className="bg-[#1A1A1A] border border-white/10 rounded-sm px-2 py-1.5 text-xs font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all disabled:opacity-50"
                            disabled={isFinalStatus}
                          >
                            {statusOptions
                              .filter((status) => status === row.status || allowedNextStatuses.includes(status))
                              .map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                              ))}
                          </select>
                          <div className="mt-2">
                            <span className={`inline-block px-2 py-0.5 border text-[9px] font-sans font-bold uppercase tracking-wider rounded-full ${
                              (draft?.status ?? row.status) === "refunded" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                              (draft?.status ?? row.status) === "rejected" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                              (draft?.status ?? row.status) === "in_transit" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                              (draft?.status ?? row.status) === "approved" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                              "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}>
                              {(draft?.status ?? row.status).replace("_", " ")}
                            </span>
                          </div>
                          {isFinalStatus ? (
                            <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-[0.12em] text-white/30">
                              Final status
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4">
                          <textarea
                            value={draft?.adminNote ?? row.adminNote}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [row.id]: {
                                  ...(current[row.id] ?? { status: row.status, adminNote: row.adminNote }),
                                  adminNote: event.target.value,
                                },
                              }))
                            }
                            rows={2}
                            className="w-full min-w-[220px] bg-[#1A1A1A] border border-white/10 rounded-sm px-2 py-1.5 text-xs font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                            placeholder="Internal processing note"
                          />
                        </td>
                        <td className="px-4 py-4 text-xs font-sans text-white/30">{formatDate(row.updatedAt)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => void onSave(row.id)}
                            disabled={savingId === row.id}
                            className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-3 py-2 text-[11px] font-sans font-bold uppercase tracking-wider transition-all hover:bg-[#C8A96E]/20 disabled:opacity-40"
                          >
                            {savingId === row.id ? "Saving..." : "Save"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
