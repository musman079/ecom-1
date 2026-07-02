import { Suspense } from "react";
import { CartView } from "../../src/components/cart/CartView";

export const metadata = {
  title: "Shopping Bag — USOLSTICE",
  description: "Review your selected items and proceed to checkout.",
};

function CartLoading() {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 lg:px-24 py-24 mt-[72px] md:mt-[80px] min-h-[70vh] flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#C8A96E]/30 border-t-[#C8A96E] rounded-full animate-spin" />
        <p className="font-sans text-sm text-[#8A8580] uppercase tracking-widest">Loading your bag...</p>
      </div>
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense fallback={<CartLoading />}>
      <CartView />
    </Suspense>
  );
}
