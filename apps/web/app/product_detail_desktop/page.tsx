import { Suspense } from "react";
import { ProductDetailDesktopClient } from "./product-detail-desktop-client";

function ProductDetailDesktopLoading() {
  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:h-20 sm:px-6 xl:px-12">
          <h1 className="text-2xl font-black tracking-[-0.06em] sm:text-3xl">KINETIC</h1>
        </div>
      </header>
      <main className="pt-16 sm:pt-20">
        <div className="rounded-lg bg-gray-200 p-8 text-center">Loading product...</div>
      </main>
    </div>
  );
}

export default function ProductDetailDesktopPage() {
  return (
    <Suspense fallback={<ProductDetailDesktopLoading />}>
      <ProductDetailDesktopClient />
    </Suspense>
  );
}
