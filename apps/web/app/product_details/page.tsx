import { Suspense } from "react";
import { ProductDetailsClient } from "./product-details-client";

function ProductDetailsLoading() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <span className="text-xl font-black uppercase tracking-tight">KINETIC</span>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 pb-36 pt-24 md:px-8">
        <div className="rounded-lg bg-gray-200 p-8 text-center">Loading product...</div>
      </main>
    </div>
  );
}

export default function ProductDetailsPage() {
  return (
    <Suspense fallback={<ProductDetailsLoading />}>
      <ProductDetailsClient />
    </Suspense>
  );
}
