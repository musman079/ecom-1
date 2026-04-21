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
  paymentStatus?: string;
  trackingNumber?: string | null;
};

type TrackedOrderItem = {
  title: string;
  quantity: number;
  unitPrice: number;
};

type TrackedOrder = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountAmount?: number;
  shippingFee: number;
  taxAmount: number;
  total: number;
  notes: string;
  couponCode?: string;
  trackingNumber: string | null;
  items: TrackedOrderItem[];
  createdAt: string;
};

function formatOrderDate(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusSteps(status: string) {
  const steps = ["Processing", "Shipped", "Delivered"];
  const normalized = status.toLowerCase();

  if (normalized === "cancelled") {
    return steps.map((step) => ({
      step,
      active: false,
      complete: false,
    }));
  }

  if (normalized === "pending" || normalized === "processing" || normalized === "confirmed") {
    return steps.map((step, index) => ({
      step,
      active: index === 0,
      complete: false,
    }));
  }

  if (normalized === "shipped") {
    return steps.map((step) => ({
      step,
      active: step === "Shipped",
      complete: step === "Processing",
    }));
  }

  if (normalized === "delivered") {
    return steps.map((step) => ({
      step,
      active: step === "Delivered",
      complete: true,
    }));
  }

  return steps.map((step) => ({
    step,
    active: step === "Processing",
    complete: false,
  }));
}

function getStatusPill(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "delivered") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "shipped") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [orderNumber, setOrderNumber] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [trackedOrder, setTrackedOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);

  const loadOrders = async () => {
    setError(null);
    try {
      const response = await fetch("/api/orders", { cache: "no-store" });
      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        orders?: OrderSummary[];
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to load orders.");
        return;
      }

      setOrders(Array.isArray(payload.orders) ? payload.orders : []);
    } catch {
      setError("Unable to load order tracking right now.");
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadOrders();
      setLoading(false);
    };
    void init();
  }, [router]);

  const totals = useMemo(() => {
    return {
      ordersCount: orders.length,
      unitsCount: orders.reduce((sum, order) => sum + order.totalItems, 0),
      spend: orders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

  const lookupByOrderNumber = async (value?: string) => {
    const normalized = (value ?? orderNumber).trim();
    if (!normalized) {
      setLookupError("Enter your order number.");
      setTrackedOrder(null);
      return;
    }

    if (value !== undefined) {
      setOrderNumber(normalized);
    }

    setLookupLoading(true);
    setLookupError(null);

    try {
      const response = await fetch(`/api/orders/track/${encodeURIComponent(normalized)}`, { cache: "no-store" });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        tracking?: TrackedOrder;
      };

      if (!response.ok || !payload.tracking) {
        setLookupError(payload.error ?? "Unable to find this order.");
        setTrackedOrder(null);
        return;
      }

      setTrackedOrder(payload.tracking);
    } catch {
      setLookupError("Unable to track this order right now.");
      setTrackedOrder(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const cancelOrder = async (orderId: string, orderNumber: string) => {
    setError(null);
    setMessage(null);
    setCancellingOrderId(orderId);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(orderId)}/cancel`, {
        method: "PATCH",
      });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to cancel order.");
        return;
      }

      setMessage(`Order ${orderNumber} cancelled successfully.`);
      await loadOrders();

      if (trackedOrder?.id === orderId) {
        await lookupByOrderNumber(orderNumber);
      }
    } catch {
      setError("Unable to cancel order right now.");
    } finally {
      setCancellingOrderId(null);
    }
  };

  useEffect(() => {
    const fromNotification = searchParams.get("orderNumber");
    if (!fromNotification) {
      return;
    }

    void lookupByOrderNumber(fromNotification);
  }, [searchParams]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12 sm:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Post Purchase</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight sm:text-5xl">Order Tracking</h1>
          <p className="mt-2 text-sm text-zinc-600">Track your order progress from processing to delivery.</p>
        </div>
        <Link href={CUSTOMER_ROUTES.PROFILE} className="rounded-full border border-zinc-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.18em]">
          Back to Profile
        </Link>
      </div>

      <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Orders</p>
          <p className="mt-2 text-3xl font-black">{totals.ordersCount}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Items</p>
          <p className="mt-2 text-3xl font-black">{totals.unitsCount}</p>
        </article>
        <article className="rounded-2xl border border-zinc-200 bg-white p-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Total Spend</p>
          <p className="mt-2 text-3xl font-black">${totals.spend.toFixed(2)}</p>
        </article>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-end gap-3">
          <label className="min-w-[240px] flex-1 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Track by Order Number
            <input
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              placeholder="e.g. ORD-1734567890"
              className="mt-2 h-11 w-full rounded-lg border border-zinc-300 px-3 text-sm font-semibold tracking-normal text-zinc-900 outline-none focus:border-zinc-900"
            />
          </label>
          <button
            type="button"
            onClick={() => void lookupByOrderNumber()}
            disabled={lookupLoading}
            className="h-11 rounded-full bg-black px-6 text-xs font-black uppercase tracking-[0.16em] text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {lookupLoading ? "Checking..." : "Track Order"}
          </button>
        </div>

        {lookupError ? <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{lookupError}</p> : null}

        {trackedOrder ? (
          <article className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Matched Order</p>
                <h2 className="mt-1 text-xl font-black tracking-tight">#{trackedOrder.orderNumber}</h2>
                <p className="mt-1 text-xs text-zinc-600">Placed {formatOrderDate(trackedOrder.createdAt)} • {trackedOrder.items.length} product{trackedOrder.items.length > 1 ? "s" : ""}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black">${trackedOrder.total.toFixed(2)}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusPill(trackedOrder.status)}`}>
                  {trackedOrder.status}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <p className="text-xs text-zinc-700">Payment: <span className="font-bold uppercase">{trackedOrder.paymentStatus}</span></p>
              <p className="text-xs text-zinc-700">Tracking Number: <span className="font-bold">{trackedOrder.trackingNumber || "Not assigned"}</span></p>
              <p className="text-xs text-zinc-700">Coupon: <span className="font-bold">{trackedOrder.couponCode || "None"}</span></p>
              <p className="text-xs text-zinc-700">Discount: <span className="font-bold">${(trackedOrder.discountAmount ?? 0).toFixed(2)}</span></p>
            </div>
          </article>
        ) : null}
      </section>

      {loading ? <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading orders...</p> : null}
      {message ? <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p> : null}
      {error ? <p className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error}</p> : null}

      {!loading && !error && orders.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
          No orders found yet. Place an order from checkout to start tracking.
        </div>
      ) : null}

      {!loading && !error && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => {
            const steps = getStatusSteps(order.status);
            return (
              <article key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Order #{order.orderNumber}</p>
                    <h2 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">{order.leadItemTitle}</h2>
                    <p className="mt-1 text-sm text-zinc-600">{formatOrderDate(order.createdAt)} - {order.totalItems} Item{order.totalItems > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black">${order.total.toFixed(2)}</p>
                    <span className={`mt-2 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getStatusPill(order.status)}`}>
                      {order.status}
                    </span>
                    {order.trackingNumber ? <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">Track #{order.trackingNumber}</p> : null}
                  </div>
                </div>

                {["pending", "confirmed", "processing"].includes(order.status.toLowerCase()) ? (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => void cancelOrder(order.id, order.orderNumber)}
                      disabled={cancellingOrderId === order.id}
                      className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                    >
                      {cancellingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                    </button>
                  </div>
                ) : null}

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {steps.map((step) => (
                    <div key={step.step} className={`rounded-xl border px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] ${step.complete ? "border-emerald-200 bg-emerald-50 text-emerald-700" : step.active ? "border-blue-200 bg-blue-50 text-blue-700" : "border-zinc-200 bg-zinc-50 text-zinc-500"}`}>
                      {step.step}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : null}
    </main>
  );
}
