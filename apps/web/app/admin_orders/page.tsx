"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminLogoutButton from "../../src/components/admin-logout-button";

type AdminOrder = {
  id: string;
  orderNumber: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "card" | "cod";
  paymentStatus: "pending" | "paid" | "failed";
  trackingNumber: string | null;
  total: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
};

type DraftState = {
  status: AdminOrder["status"];
  trackingNumber: string;
  paymentStatus: AdminOrder["paymentStatus"];
};

const statusOptions: AdminOrder["status"][] = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
const paymentStatusOptions: AdminOrder["paymentStatus"][] = ["pending", "paid", "failed"];

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

function statusTone(status: AdminOrder["status"]) {
  if (status === "delivered") {
    return "bg-emerald-50 text-emerald-700";
  }
  if (status === "cancelled") {
    return "bg-red-50 text-red-700";
  }
  if (status === "shipped") {
    return "bg-blue-50 text-blue-700";
  }
  return "bg-zinc-100 text-zinc-700";
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftState>>({});

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

    const loadOrders = async () => {
      setError(null);
      try {
        const response = await fetch("/api/admin/orders?limit=80", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load orders.");
        }

        const payload = (await response.json()) as { orders?: AdminOrder[] };
        const rows = Array.isArray(payload.orders) ? payload.orders : [];
        setOrders(rows);

        const nextDrafts: Record<string, DraftState> = {};
        for (const order of rows) {
          nextDrafts[order.id] = {
            status: order.status,
            trackingNumber: order.trackingNumber ?? "",
            paymentStatus: order.paymentStatus,
          };
        }
        setDrafts(nextDrafts);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load orders.");
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [allowed]);

  const totalRevenue = useMemo(() => orders.reduce((sum, order) => sum + order.total, 0), [orders]);

  const onSave = async (orderId: string) => {
    const draft = drafts[orderId];
    if (!draft) {
      return;
    }

    setSavingId(orderId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(draft),
      });

      const payload = (await response.json()) as {
        error?: string;
        order?: {
          id: string;
          status: AdminOrder["status"];
          paymentStatus: AdminOrder["paymentStatus"];
          trackingNumber: string | null;
        };
      };

      if (!response.ok || !payload.order) {
        setError(payload.error ?? "Failed to update order.");
        return;
      }

      setOrders((current) =>
        current.map((row) =>
          row.id === orderId
            ? {
                ...row,
                status: payload.order?.status ?? row.status,
                paymentStatus: payload.order?.paymentStatus ?? row.paymentStatus,
                trackingNumber: payload.order?.trackingNumber ?? row.trackingNumber,
              }
            : row,
        ),
      );

      setMessage("Order updated successfully.");
    } catch {
      setError("Unable to update order right now.");
    } finally {
      setSavingId(null);
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
            <h1 className="text-3xl font-black uppercase tracking-[-0.05em]">Orders</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin_overview_dashboard" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Overview
            </a>
            <a href="/admin_products" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Products
            </a>
            <a href="/admin_returns" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Returns
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
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Orders</p>
            <h2 className="mt-2 text-3xl font-black">{orders.length}</h2>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Revenue</p>
            <h2 className="mt-2 text-3xl font-black">${totalRevenue.toFixed(2)}</h2>
          </article>
          <article className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Processing</p>
            <h2 className="mt-2 text-3xl font-black">{orders.filter((order) => order.status === "processing").length}</h2>
          </article>
        </section>

        {error ? <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
        {message ? <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p> : null}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left">
              <thead>
                <tr className="bg-zinc-50">
                  {["Order", "Customer", "Date", "Status", "Payment", "Tracking", "Total", "Action"].map((title) => (
                    <th key={title} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {loading ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-zinc-500" colSpan={8}>
                      Loading orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-sm text-zinc-500" colSpan={8}>
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => {
                    const draft = drafts[order.id];
                    return (
                      <tr key={order.id} className="align-top transition hover:bg-zinc-50/70">
                        <td className="px-4 py-4">
                          <p className="text-xs font-black">#{order.orderNumber}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{order.totalItems} items</p>
                        </td>
                        <td className="px-4 py-4">
                          <p className="text-xs font-bold">{order.customerName}</p>
                          <p className="mt-1 text-[10px] text-zinc-500">{order.customerEmail}</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-zinc-500">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-4">
                          <select
                            value={draft?.status ?? order.status}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [order.id]: {
                                  ...(current[order.id] ?? {
                                    status: order.status,
                                    trackingNumber: order.trackingNumber ?? "",
                                    paymentStatus: order.paymentStatus,
                                  }),
                                  status: event.target.value as DraftState["status"],
                                },
                              }))
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold capitalize"
                          >
                            {statusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <span className={`mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusTone(draft?.status ?? order.status)}`}>
                            {draft?.status ?? order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <select
                            value={draft?.paymentStatus ?? order.paymentStatus}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [order.id]: {
                                  ...(current[order.id] ?? {
                                    status: order.status,
                                    trackingNumber: order.trackingNumber ?? "",
                                    paymentStatus: order.paymentStatus,
                                  }),
                                  paymentStatus: event.target.value as DraftState["paymentStatus"],
                                },
                              }))
                            }
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-bold"
                          >
                            {paymentStatusOptions.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                          <p className="mt-1 text-[10px] text-zinc-500 uppercase">{order.paymentMethod}</p>
                        </td>
                        <td className="px-4 py-4">
                          <input
                            value={draft?.trackingNumber ?? order.trackingNumber ?? ""}
                            onChange={(event) =>
                              setDrafts((current) => ({
                                ...current,
                                [order.id]: {
                                  ...(current[order.id] ?? {
                                    status: order.status,
                                    trackingNumber: order.trackingNumber ?? "",
                                    paymentStatus: order.paymentStatus,
                                  }),
                                  trackingNumber: event.target.value,
                                },
                              }))
                            }
                            placeholder="Tracking #"
                            className="w-full rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-blue-500"
                          />
                        </td>
                        <td className="px-4 py-4 text-xs font-black">${order.total.toFixed(2)}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() => void onSave(order.id)}
                            disabled={savingId === order.id}
                            className="rounded-full bg-black px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
                          >
                            {savingId === order.id ? "Saving..." : "Save"}
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
