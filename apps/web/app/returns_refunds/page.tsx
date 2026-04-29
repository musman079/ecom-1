import { Suspense } from "react";
import { ReturnsRefundsClient } from "./returns-refunds-client";

function ReturnsRefundsLoading() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:py-16">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">After Sales</p>
          <h1 className="mt-1 text-4xl font-black uppercase tracking-tight sm:text-5xl">Returns & Refunds</h1>
          <p className="mt-2 text-sm text-zinc-600">Loading...</p>
        </div>
      </header>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500">
        Loading returns data...
      </div>
    </main>
  );
}

export default function ReturnsRefundsPage() {
  return (
    <Suspense fallback={<ReturnsRefundsLoading />}>
      <ReturnsRefundsClient />
    </Suspense>
  );
}
