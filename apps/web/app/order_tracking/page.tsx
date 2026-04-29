import { Suspense } from "react";
import { OrderTrackingClient } from "./order-tracking-client";

function OrderTrackingLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-12 text-[#eaf2ff] sm:py-16">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Post Purchase</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight text-white sm:text-5xl">Order Tracking</h1>
          <p className="mt-2 text-sm text-white/65">Loading...</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
        Loading order tracking...
      </div>
    </main>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={<OrderTrackingLoading />}>
      <OrderTrackingClient />
    </Suspense>
  );
}
