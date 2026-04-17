"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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

  if (normalized === "pending") {
    return steps.map((step, index) => ({
      step,
      active: index === 0,
      complete: false,
    }));
  }

  if (normalized === "confirmed") {
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
  if (normalized === "confirmed") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default function OrderTrackingPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
      } finally {
        setLoading(false);
      }
    };

    void loadOrders();
  }, [router]);

  const totals = useMemo(() => {
    return {
      ordersCount: orders.length,
      unitsCount: orders.reduce((sum, order) => sum + order.totalItems, 0),
      spend: orders.reduce((sum, order) => sum + order.total, 0),
    };
  }, [orders]);

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

      {loading ? <p className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">Loading orders...</p> : null}
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
                  </div>
                </div>

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
