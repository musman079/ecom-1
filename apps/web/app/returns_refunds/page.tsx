"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { CUSTOMER_ROUTES } from "../../src/constants/routes";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  totalItems: number;
  leadItemTitle: string;
  createdAt: string;
};

type ReturnRequest = {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  reason: string;
  notes: string;
  resolution: "refund" | "exchange";
  status: "requested" | "approved" | "in_transit" | "refunded" | "rejected";
  createdAt: string;
  updatedAt: string;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getReturnStatusStyles(status: ReturnRequest["status"]) {
  if (status === "requested") {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }

  if (status === "approved") {
    return "bg-blue-50 border-blue-200 text-blue-700";
  }

  if (status === "in_transit") {
    return "bg-indigo-50 border-indigo-200 text-indigo-700";
  }

  if (status === "refunded") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  return "bg-red-50 border-red-200 text-red-700";
}

export default function ReturnsRefundsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [highlightReturnNumber, setHighlightReturnNumber] = useState<string | null>(null);
  const [form, setForm] = useState({
    orderId: "",
    resolution: "refund" as "refund" | "exchange",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [ordersResponse, returnsResponse] = await Promise.all([
          fetch("/api/orders/history?limit=30", { cache: "no-store" }),
          fetch("/api/returns?limit=30", { cache: "no-store" }),
        ]);

        if (ordersResponse.status === 401 || returnsResponse.status === 401) {
          router.replace(CUSTOMER_ROUTES.AUTH);
          return;
        }

        const ordersPayload = (await ordersResponse.json()) as {
          error?: string;
          orders?: OrderSummary[];
        };

        const returnsPayload = (await returnsResponse.json()) as {
          error?: string;
          returns?: ReturnRequest[];
        };

        if (!ordersResponse.ok) {
          setError(ordersPayload.error ?? "Unable to load orders.");
          return;
        }

        if (!returnsResponse.ok) {
          setError(returnsPayload.error ?? "Unable to load return requests.");
          return;
        }

        const orderList = Array.isArray(ordersPayload.orders) ? ordersPayload.orders : [];
        const returnList = Array.isArray(returnsPayload.returns) ? returnsPayload.returns : [];
        setOrders(orderList);
        setReturns(returnList);

        const orderNumberFromNotification = searchParams.get("orderNumber");
        const returnNumberFromNotification = searchParams.get("returnNumber");

        if (returnNumberFromNotification) {
          setHighlightReturnNumber(returnNumberFromNotification);
        }

        if (orderList.length > 0) {
          const matchedOrderByNumber =
            orderNumberFromNotification
              ? orderList.find((order) => order.orderNumber === orderNumberFromNotification)
              : null;

          setForm((current) => ({
            ...current,
            orderId: current.orderId || matchedOrderByNumber?.id || orderList[0].id,
          }));
        }

        if (returnNumberFromNotification && returnList.some((item) => item.returnNumber === returnNumberFromNotification)) {
          setMessage(`Showing request ${returnNumberFromNotification}.`);
        }
      } catch {
        setError("Unable to load returns data right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [router, searchParams]);

  const activeRequests = useMemo(
    () => returns.filter((item) => ["requested", "approved", "in_transit"].includes(item.status)).length,
    [returns],
  );

  const submitReturnRequest = async () => {
    setError(null);
    setMessage(null);

    if (!form.orderId) {
      setError("Please select an order.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Please provide a reason for return.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/returns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: form.orderId,
          reason: form.reason,
          notes: form.notes,
          resolution: form.resolution,
        }),
      });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        returnRequest?: ReturnRequest;
      };

      if (!response.ok || !payload.returnRequest) {
        setError(payload.error ?? "Unable to submit return request.");
        return;
      }

      setReturns((current) => [payload.returnRequest as ReturnRequest, ...current]);
      setForm((current) => ({
        ...current,
        reason: "",
        notes: "",
      }));
      setMessage(`Return request ${payload.returnRequest.returnNumber} created.`);
    } catch {
      setError("Unable to submit return request right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">After Sales</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight sm:text-5xl">Returns & Refunds</h1>
          <p className="mt-2 text-sm text-zinc-600">Create return requests, choose refund or exchange, and track request status.</p>
        </div>
        <Link href={CUSTOMER_ROUTES.PROFILE} className="rounded-full border border-zinc-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em] hover:bg-zinc-100">
          Back to Profile
        </Link>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Total Requests</p>
          <p className="mt-2 text-3xl font-black">{returns.length}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Active Cases</p>
          <p className="mt-2 text-3xl font-black">{activeRequests}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Eligible Orders</p>
          <p className="mt-2 text-3xl font-black">{orders.length}</p>
        </article>
      </section>

      {loading ? <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading returns data...</p> : null}
      {error ? <p className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
      {message ? <p className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p> : null}

      {!loading ? (
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-5">
            <h2 className="text-sm font-black uppercase tracking-[0.16em]">Create Return Request</h2>

            {orders.length === 0 ? (
              <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">No orders available yet for returns.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Order
                  <select
                    value={form.orderId}
                    onChange={(event) => setForm((current) => ({ ...current, orderId: event.target.value }))}
                    className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                  >
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        {order.orderNumber} - {order.leadItemTitle}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Resolution
                  <select
                    value={form.resolution}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        resolution: event.target.value as "refund" | "exchange",
                      }))
                    }
                    className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                  >
                    <option value="refund">Refund</option>
                    <option value="exchange">Exchange</option>
                  </select>
                </label>

                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Reason
                  <input
                    value={form.reason}
                    onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                    placeholder="Wrong size, damaged item, quality issue..."
                    className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm font-semibold text-zinc-900 outline-none focus:border-zinc-900"
                  />
                </label>

                <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  Notes (Optional)
                  <textarea
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                    rows={4}
                    className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-900 outline-none focus:border-zinc-900"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => void submitReturnRequest()}
                  disabled={saving}
                  className="h-11 rounded-full bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 lg:col-span-7">
            <h2 className="text-sm font-black uppercase tracking-[0.16em]">Request History</h2>

            {returns.length === 0 ? (
              <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">No return requests yet.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {returns.map((item) => (
                  <article
                    key={item.id}
                    className={`rounded-xl border p-4 ${highlightReturnNumber === item.returnNumber ? "border-blue-300 bg-blue-50" : "border-zinc-200 bg-zinc-50"}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{item.returnNumber}</p>
                        <h3 className="mt-1 text-sm font-black">Order #{item.orderNumber}</h3>
                        <p className="mt-1 text-xs text-zinc-600">{item.reason}</p>
                        <p className="mt-1 text-[11px] text-zinc-500">Requested on {formatDate(item.createdAt)} • {item.resolution}</p>
                      </div>
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getReturnStatusStyles(item.status)}`}>
                        {item.status.replace("_", " ")}
                      </span>
                    </div>
                    {item.notes ? <p className="mt-2 text-xs text-zinc-700">Notes: {item.notes}</p> : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
    </main>
  );
}
