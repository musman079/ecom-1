"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart-store";
import { Minus, Plus, X, ArrowRight, Lock, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const placeholderSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='128' viewBox='0 0 96 128'%3E%3Crect width='96' height='128' fill='%231A1A1A'/%3E%3C/svg%3E";

export function CartView() {
  const router = useRouter();
  const { items, subtotal, updateQuantity, removeFromCart } = useCartStore();

  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  /* ── EMPTY STATE ── */
  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 lg:px-24 py-24 mt-[72px] md:mt-[80px] min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-8">
          <ShoppingBag className="w-8 h-8 text-text-tertiary" strokeWidth={1.5} />
        </div>
        <h1 className="font-heading text-3xl md:text-4xl text-text-primary mb-4">Your Cart is Empty</h1>
        <p className="font-sans text-text-secondary mb-10 max-w-sm leading-relaxed">
          Discover our latest collection of premium fashion and lifestyle pieces.
        </p>
        <Link
          href="/products"
          className="btn-sweep bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-10 py-4 rounded-full"
        >
          <span className="relative z-10">Continue Shopping</span>
        </Link>
      </div>
    );
  }

  /* ── CART WITH ITEMS ── */
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-16 mt-[72px] md:mt-[80px]">
      <h1 className="font-heading text-3xl md:text-5xl text-text-primary mb-8 md:mb-12">
        Shopping Cart
        <span className="font-sans text-[16px] text-text-secondary ml-4 font-normal">({items.length} items)</span>
      </h1>

      <div className="flex flex-col xl:flex-row gap-8 xl:gap-16">

        {/* ── LEFT: CART ITEMS ── */}
        <div className="w-full xl:w-[62%] flex flex-col gap-6">

          {/* Desktop column headers */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-surface font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-secondary">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <AnimatePresence initial={false}>
            {items.map((item) => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.25 }}
                className="relative flex flex-col md:grid md:grid-cols-12 gap-4 md:gap-4 md:items-center border-b border-surface/60 pb-6 last:border-0"
              >
                {/* Product Info col-span-6 */}
                <div className="md:col-span-6 flex gap-4">
                  {/* Thumbnail */}
                  <Link
                    href={`/products/${item.productId}`}
                    className="shrink-0 w-20 h-28 md:w-24 md:h-32 bg-surface rounded-sm overflow-hidden"
                  >
                    <img
                      src={item.thumbnail || placeholderSvg}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </Link>

                  {/* Details */}
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <Link
                        href={`/products/${item.productId}`}
                        className="font-heading text-base md:text-xl text-text-primary hover:text-gold transition-colors leading-tight block mb-1"
                      >
                        {item.title}
                      </Link>
                      <p className="font-sans text-[12px] text-text-tertiary">Color: Midnight Black</p>
                      <p className="font-sans text-[12px] text-text-tertiary">Size: M</p>
                    </div>
                    {/* Mobile price */}
                    <span className="md:hidden font-display text-[20px] text-gold mt-2">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Quantity — col-span-2 */}
                <div className="md:col-span-2 flex items-center justify-between md:justify-center gap-3">
                  <span className="md:hidden font-sans text-[12px] text-text-secondary uppercase tracking-wider">Qty:</span>
                  <div className="flex items-center border border-surface rounded-sm">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-gold transition-colors"
                      aria-label="Decrease"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center font-sans text-[14px] text-text-primary font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-gold transition-colors"
                      aria-label="Increase"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Unit Price — col-span-2 */}
                <div className="hidden md:block md:col-span-2 text-right">
                  <span className="font-sans text-[14px] text-text-secondary">${item.price.toFixed(2)}</span>
                </div>

                {/* Line Total — col-span-2 */}
                <div className="hidden md:block md:col-span-2 text-right">
                  <span className="font-sans text-[16px] text-gold font-medium">${item.lineTotal.toFixed(2)}</span>
                </div>

                {/* Remove — desktop: absolute top-right button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  className="hidden md:flex absolute -top-1 right-0 w-7 h-7 items-center justify-center text-text-tertiary hover:text-red-400 transition-colors rounded-full hover:bg-surface"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Mobile: Remove + Line total row */}
                <div className="md:hidden flex items-center justify-between pt-1">
                  <button
                    onClick={() => removeFromCart(item.productId)}
                    className="font-sans text-[12px] text-text-tertiary hover:text-red-400 transition-colors uppercase tracking-wider underline"
                  >
                    Remove
                  </button>
                  <span className="font-display text-[22px] text-gold">${item.lineTotal.toFixed(2)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Continue shopping */}
          <div className="pt-2">
            <Link
              href="/products"
              className="font-sans text-[13px] text-text-secondary hover:text-gold transition-colors uppercase tracking-widest underline underline-offset-4"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── RIGHT: ORDER SUMMARY ── */}
        <div className="w-full xl:w-[38%]">
          <div className="bg-surface rounded-sm p-6 md:p-8 xl:sticky xl:top-[92px]">
            <h2 className="font-heading text-2xl text-text-primary mb-6 pb-4 border-b border-white/5">
              Order Summary
            </h2>

            <div className="flex flex-col gap-3 mb-6 font-sans text-[14px]">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({items.length} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Shipping</span>
                <span className={shipping === 0 ? "text-status-success" : ""}>
                  {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Taxes</span>
                <span className="text-[12px]">Calculated at checkout</span>
              </div>
            </div>

            {/* Free shipping progress */}
            {subtotal < 100 && (
              <div className="mb-6 p-3 bg-primary rounded-sm border border-surface">
                <p className="font-sans text-[12px] text-text-secondary mb-2">
                  Add <span className="text-gold font-medium">${(100 - subtotal).toFixed(2)}</span> more for free shipping
                </p>
                <div className="w-full h-1 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gold rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((subtotal / 100) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-end mb-7 pt-5 border-t border-white/5">
              <span className="font-sans text-[14px] font-medium text-text-primary uppercase tracking-widest">Total</span>
              <span className="font-display text-[34px] text-gold leading-none">${total.toFixed(2)}</span>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => router.push("/cart_checkout")}
              className="w-full btn-sweep bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] h-[54px] rounded-full flex items-center justify-center gap-3 transition-all hover:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gold/50"
            >
              <span className="relative z-10 flex items-center gap-2">
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </span>
            </button>

            <div className="mt-5 flex items-center justify-center gap-2 text-text-tertiary">
              <Lock className="w-3 h-3" />
              <span className="font-sans text-[11px] uppercase tracking-wider">256-bit SSL Secure Checkout</span>
            </div>

            {/* Accepted payment icons */}
            <div className="mt-5 flex items-center justify-center gap-3 opacity-50">
              {["VISA", "MC", "AMEX", "PayPal"].map((p) => (
                <span key={p} className="font-sans text-[10px] font-bold border border-text-tertiary/30 px-2 py-0.5 rounded text-text-tertiary">
                  {p}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
