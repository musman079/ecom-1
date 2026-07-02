"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ArrowRight, Lock, ShoppingBag, Tag, Truck } from "lucide-react";
import { useCartStore, type CartItem } from "@/store/cart-store";
import { buildAuthHref } from "@/lib/auth-redirect";
import { usePathname, useSearchParams } from "next/navigation";

const placeholderSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='128' viewBox='0 0 96 128'%3E%3Crect width='96' height='128' fill='%231A1A1A'/%3E%3C/svg%3E";

export function CartView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const setCart = useCartStore((s) => s.setCart);
  const { items, subtotal, totalItems } = useCartStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [loadingCart, setLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authRedirectRef = useRef(
    buildAuthHref(searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname)
  );

  // Load cart from server on mount
  useEffect(() => {
    const load = async () => {
      setLoadingCart(true);
      try {
        const res = await fetch("/api/cart", { cache: "no-store", credentials: "include" });
        if (res.status === 401) {
          router.push(authRedirectRef.current);
          return;
        }
        const data = (await res.json()) as {
          cart?: { items?: CartItem[]; subtotal?: number; totalItems?: number };
          error?: string;
        };
        if (res.ok && data.cart) {
          setCart({
            items: Array.isArray(data.cart.items) ? data.cart.items : [],
            subtotal: Number(data.cart.subtotal ?? 0),
            totalItems: Number(data.cart.totalItems ?? 0),
          });
        }
      } catch {
        setError("Unable to load cart.");
      } finally {
        setLoadingCart(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateQty = async (productId: string, quantity: number) => {
    setActiveId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      const data = (await res.json()) as {
        cart?: { items: CartItem[]; subtotal: number; totalItems: number };
      };
      if (res.ok && data.cart) setCart(data.cart);
    } catch {
      setError("Unable to update quantity.");
    } finally {
      setActiveId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setActiveId(productId);
    try {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as {
        cart?: { items: CartItem[]; subtotal: number; totalItems: number };
      };
      if (res.ok && data.cart) setCart(data.cart);
    } catch {
      setError("Unable to remove item.");
    } finally {
      setActiveId(null);
    }
  };

  const shipping = subtotal > 100 ? 0 : subtotal > 0 ? 12 : 0;
  const total = subtotal + shipping;
  const freeShippingProgress = Math.min((subtotal / 100) * 100, 100);

  /* ── LOADING ── */
  if (loadingCart) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 lg:px-24 py-24 mt-[72px] md:mt-[80px] min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="font-sans text-sm text-text-secondary uppercase tracking-widest">Loading your bag...</p>
        </div>
      </div>
    );
  }

  /* ── EMPTY STATE ── */
  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-16 lg:px-24 py-24 mt-[72px] md:mt-[80px] min-h-[70vh] flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-8 border border-white/5">
          <ShoppingBag className="w-10 h-10 text-text-tertiary" strokeWidth={1} />
        </div>
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-gold mb-3">Your Bag</p>
        <h1 className="font-heading text-4xl md:text-5xl text-text-primary mb-4">Empty for Now</h1>
        <p className="font-sans text-text-secondary mb-10 max-w-sm leading-relaxed text-sm">
          Discover our curated collection of premium fashion and lifestyle pieces crafted for the discerning.
        </p>
        <Link
          href="/product_details"
          className="btn-sweep font-sans text-[12px] font-bold uppercase tracking-[0.18em] px-10 py-4 rounded-full"
        >
          <span className="relative z-10">Explore Collection</span>
        </Link>
      </div>
    );
  }

  /* ── CART WITH ITEMS ── */
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-16 mt-[72px] md:mt-[80px]">
      {/* Header */}
      <div className="mb-10 md:mb-14">
        <p className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-gold mb-2">Checkout</p>
        <h1 className="font-heading text-4xl md:text-5xl text-text-primary">
          Shopping Bag
          <span className="font-sans text-base text-text-secondary ml-4 font-normal">({totalItems} {totalItems === 1 ? "item" : "items"})</span>
        </h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 rounded border border-status-error/30 bg-status-error/10 text-sm text-status-error font-sans">
          {error}
        </div>
      )}

      <div className="flex flex-col xl:flex-row gap-10 xl:gap-16">
        {/* ── LEFT: ITEMS ── */}
        <div className="w-full xl:w-[62%] flex flex-col">

          {/* Column headers — desktop */}
          <div className="hidden md:grid grid-cols-12 gap-4 pb-5 border-b border-surface font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-text-tertiary">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Unit Price</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <AnimatePresence initial={false}>
            {items.map((item) => {
              const isBusy = activeId === item.productId;
              return (
                <motion.div
                  key={item.productId}
                  layout
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: isBusy ? 0.5 : 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0, paddingTop: 0, paddingBottom: 0, marginBottom: 0 }}
                  transition={{ duration: 0.28 }}
                  className="relative flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center py-6 border-b border-surface/60 last:border-b-0"
                >
                  {/* Product info — col-span-6 */}
                  <div className="md:col-span-6 flex gap-4">
                    <Link
                      href={`/product_detail_desktop/${item.productId}`}
                      className="shrink-0 w-20 h-28 md:w-[88px] md:h-32 bg-surface rounded-sm overflow-hidden border border-white/5"
                    >
                      <img
                        src={item.thumbnail || placeholderSvg}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                    <div className="flex flex-col justify-between py-1 min-w-0">
                      <div>
                        <Link
                          href={`/product_detail_desktop/${item.productId}`}
                          className="font-heading text-base md:text-lg text-text-primary hover:text-gold transition-colors leading-snug block mb-1 truncate"
                        >
                          {item.title}
                        </Link>
                        <p className="font-sans text-[11px] text-text-tertiary uppercase tracking-wider">SKU: {item.sku}</p>
                      </div>
                      {/* Mobile price */}
                      <span className="md:hidden font-display text-xl text-gold mt-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Qty — col-span-2 */}
                  <div className="md:col-span-2 flex items-center justify-between md:justify-center gap-3">
                    <span className="md:hidden font-sans text-[11px] text-text-tertiary uppercase tracking-wider">Qty:</span>
                    <div className="flex items-center border border-surface rounded-sm overflow-hidden">
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        disabled={isBusy || item.quantity <= 1}
                        className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-gold hover:bg-surface transition-colors disabled:opacity-30"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-sans text-sm text-text-primary font-medium select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        disabled={isBusy || item.quantity >= item.stockQuantity}
                        className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-gold hover:bg-surface transition-colors disabled:opacity-30"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Unit price — col-span-2, desktop */}
                  <div className="hidden md:block md:col-span-2 text-right">
                    <span className="font-sans text-sm text-text-secondary">${item.price.toFixed(2)}</span>
                  </div>

                  {/* Line total — col-span-2, desktop */}
                  <div className="hidden md:block md:col-span-2 text-right">
                    <span className="font-sans text-base text-gold font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>

                  {/* Remove — desktop */}
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={isBusy}
                    className="hidden md:flex absolute top-5 right-0 w-7 h-7 items-center justify-center text-text-tertiary hover:text-status-error transition-colors rounded-full hover:bg-surface disabled:opacity-30"
                    aria-label="Remove item"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>

                  {/* Mobile: remove + total row */}
                  <div className="md:hidden flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={isBusy}
                      className="font-sans text-[11px] text-text-tertiary hover:text-status-error transition-colors uppercase tracking-wider underline underline-offset-2 disabled:opacity-30"
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Continue shopping */}
          <div className="pt-6">
            <Link
              href="/product_details"
              className="font-sans text-[12px] text-text-tertiary hover:text-gold transition-colors uppercase tracking-widest underline underline-offset-4 inline-flex items-center gap-2"
            >
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* ── RIGHT: ORDER SUMMARY ── */}
        <div className="w-full xl:w-[38%]">
          <div className="bg-surface rounded-sm border border-white/5 p-6 md:p-8 xl:sticky xl:top-[92px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">

            <h2 className="font-heading text-2xl text-text-primary mb-6 pb-5 border-b border-white/5">
              Order Summary
            </h2>

            {/* Free shipping progress */}
            {subtotal > 0 && subtotal < 100 && (
              <div className="mb-6 p-4 bg-primary rounded-sm border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="w-3.5 h-3.5 text-gold" />
                  <p className="font-sans text-[12px] text-text-secondary">
                    Add <span className="text-gold font-semibold">${(100 - subtotal).toFixed(2)}</span> for free shipping
                  </p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gold rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${freeShippingProgress}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {subtotal >= 100 && (
              <div className="mb-6 p-3 bg-status-success/10 border border-status-success/20 rounded-sm flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-status-success shrink-0" />
                <p className="font-sans text-[12px] text-status-success font-medium">You've unlocked free shipping!</p>
              </div>
            )}

            <div className="flex flex-col gap-3 mb-6 font-sans text-sm">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Shipping</span>
                <span className={shipping === 0 && subtotal > 0 ? "text-status-success font-medium" : ""}>
                  {subtotal === 0 ? "—" : shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Taxes</span>
                <span className="text-text-tertiary text-[12px]">Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-5 border-t border-white/5 mb-7">
              <span className="font-sans text-sm font-medium text-text-primary uppercase tracking-widest">Estimated Total</span>
              <motion.span
                key={total}
                initial={{ opacity: 0.5, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-[36px] text-gold leading-none"
              >
                ${total.toFixed(2)}
              </motion.span>
            </div>

            {/* Checkout button */}
            <button
              onClick={() => router.push("/cart_checkout")}
              className="w-full btn-sweep font-sans text-[12px] font-bold uppercase tracking-[0.18em] h-[54px] rounded-full flex items-center justify-center gap-3 group"
            >
              <span className="relative z-10 flex items-center gap-2">
                Proceed to Checkout
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>

            {/* Trust signals */}
            <div className="mt-5 flex items-center justify-center gap-2 text-text-tertiary">
              <Lock className="w-3 h-3" />
              <span className="font-sans text-[10px] uppercase tracking-wider">256-bit SSL Secure Checkout</span>
            </div>

            <div className="mt-5 flex items-center justify-center gap-2 opacity-40">
              {["VISA", "MC", "AMEX", "PayPal"].map((p) => (
                <span
                  key={p}
                  className="font-sans text-[9px] font-bold border border-text-tertiary/30 px-2 py-0.5 rounded text-text-tertiary"
                >
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
