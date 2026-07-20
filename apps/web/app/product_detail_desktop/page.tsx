import { Suspense } from "react";
import { ProductDetailDesktopClient } from "./product-detail-desktop-client";

function ProductDetailDesktopLoading() {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center pt-16 sm:pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="font-sans text-sm text-text-secondary uppercase tracking-widest">Loading...</p>
        </div>
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
