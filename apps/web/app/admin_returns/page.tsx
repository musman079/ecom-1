"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AdminLogoutButton from "../../src/components/admin-logout-button";

type AdminReturn = {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  reason: string;
  notes: string;
  resolution: "refund" | "exchange";
  status: "requested" | "approved" | "in_transit" | "refunded" | "rejected";
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

export default function AdminReturnsPage() {
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
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] text-sm font-medium text-zinc-500">
        Verifying admin access...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-black uppercase tracking-[-0.05em]">Returns</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin_overview_dashboard" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Overview
            </a>
            <a href="/admin_orders" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Orders
            </a>
            <a href="/admin_products" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Products
            </a>
            <AdminLogoutButton
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-600"
              iconClassName="material-symbols-outlined text-sm"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Requests</p>
            <h2 className="mt-2 text-3xl font-black">{totals.total}</h2>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Active Cases</p>
            <h2 className="mt-2 text-3xl font-black">{totals.active}</h2>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Refunded</p>
            <h2 className="mt-2 text-3xl font-black">{totals.refunded}</h2>
          </article>
        </section>

        <section className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black uppercase tracking-tight">Admin Notifications</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">Unread: {unreadNotifications}</p>
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
                className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]"
              >
                <option value="all">All Types</option>
                <option value="admin_return_requested">Return Queue</option>
                <option value="order_created">Order Created</option>
                <option value="order_status_updated">Order Updated</option>
                <option value="return_requested">Return Requested</option>
                <option value="return_status_updated">Return Updated</option>
              </select>
              <label className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.12em]">
                <input
                  type="checkbox"
                  checked={notificationUnreadOnly}
                  onChange={(event) => setNotificationUnreadOnly(event.target.checked)}
                />
                Unread Only
              </label>
              <button
                type="button"
                onClick={() => void markAllAdminNotificationsRead()}
                disabled={markingAllRead || unreadNotifications === 0}
                className="rounded-full border border-zinc-300 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] hover:bg-zinc-100 disabled:opacity-50"
              >
                {markingAllRead ? "Updating..." : "Mark All Read"}
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <article key={item.id} className={`rounded-xl border p-4 ${item.isRead ? "border-zinc-200 bg-zinc-50" : "border-blue-200 bg-blue-50"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-zinc-900">{item.title}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{formatDate(item.createdAt)}</p>
                  </div>
                  <p className="mt-1 text-xs text-zinc-700">{item.message}</p>
                  <a href={getAdminNotificationHref(item)} className="mt-2 inline-block text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700 hover:underline">
                    Open Related
                  </a>
                </article>
              ))}
            </div>
          )}
        </section>

        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left">
              <thead>
                <tr className="bg-zinc-50">
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
                    <th key={title} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-zinc-500" colSpan={9}>
                      Loading return requests...
                    </td>
                  </tr>
                ) : returns.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-zinc-500" colSpan={9}>
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
                      <tr key={row.id} className={`align-top transition hover:bg-zinc-50/70 ${isHighlighted ? "bg-blue-50/70" : ""}`}>
                        <td className="px-4 py-4">
                          <p className="text-xs font-black">{row.returnNumber}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{formatDate(row.createdAt)}</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold">#{row.orderNumber}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{row.orderId.slice(0, 10)}...</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold">{row.customerName}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{row.customerEmail}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-zinc-700">
                          <p className="font-semibold">{row.reason}</p>
                          {row.notes ? <p className="mt-1 text-[10px] text-zinc-500">{row.notes}</p> : null}
                        </td>
                        <td className="px-4 py-4">
                          <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em]">
                            {row.resolution}
                          </span>
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
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold"
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
                          <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusTone(draft?.status ?? row.status)}`}>
                            {(draft?.status ?? row.status).replace("_", " ")}
                          </span>
                          {isFinalStatus ? (
                            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">
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
                            className="w-full min-w-[220px] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500"
                            placeholder="Internal processing note"
                          />
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-zinc-500">{formatDate(row.updatedAt)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => void onSave(row.id)}
                            disabled={savingId === row.id}
                            className="rounded-full bg-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
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
      </main>
    </div>
  );
}
