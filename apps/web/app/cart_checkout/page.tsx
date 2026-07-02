"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";

import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  CreditCard,
  Lock,
  Package,
  ShoppingBag,
  Tag,
  Truck,
  Wallet,
  CheckCircle2,
  Minus,
  Plus,
  X,
} from "lucide-react";

import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { useCartStore, type CartItem } from "../../src/store/cart-store";
import { buildAuthHref } from "../../src/lib/auth-redirect";

// ─────────────────────────────────────────
// Schema
// ─────────────────────────────────────────
const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  phone: z.string().min(7, "Valid phone number is required."),
  line1: z.string().min(3, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
});
type ShippingForm = z.infer<typeof shippingSchema>;

type AppliedCoupon = {
  code: string;
  discountAmount: number;
  finalSubtotal: number;
};

// ─────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────
function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1.5 font-sans text-[11px] text-status-error"
    >
      {msg}
    </motion.p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-sans text-[10px] font-black uppercase tracking-[0.22em] text-gold mb-6 flex items-center gap-3">
      <span className="flex-1 h-px bg-white/5" />
      <span>{children}</span>
      <span className="flex-1 h-px bg-white/5" />
    </h2>
  );
}

const placeholderSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='80' viewBox='0 0 60 80'%3E%3Crect width='60' height='80' fill='%231A1A1A'/%3E%3C/svg%3E";

// ─────────────────────────────────────────
// Main content
// ─────────────────────────────────────────
function CartCheckoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [loadingCart, setLoadingCart] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");

  const { items, subtotal, totalItems, setCart, clearCart } = useCartStore();

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const authRedirectRef = useRef(
    buildAuthHref(searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname)
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
  });

  // Load cart from server
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

  // Recalc coupon if subtotal changes
  useEffect(() => {
    setAppliedCoupon((c) => {
      if (!c) return c;
      return { ...c, finalSubtotal: Math.max(0, subtotal - c.discountAmount) };
    });
  }, [subtotal]);

  // ── qty update ──
  const handleUpdateQty = async (productId: string, quantity: number) => {
    setActiveId(productId);
    try {
      const res = await fetch("/api/cart", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId, quantity }),
      });
      const data = (await res.json()) as { cart?: { items: CartItem[]; subtotal: number; totalItems: number } };
      if (res.ok && data.cart) setCart(data.cart);
    } catch {
      setError("Unable to update quantity.");
    } finally {
      setActiveId(null);
    }
  };

  // ── remove item ──
  const handleRemove = async (productId: string) => {
    setActiveId(productId);
    try {
      const res = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { cart?: { items: CartItem[]; subtotal: number; totalItems: number } };
      if (res.ok && data.cart) setCart(data.cart);
    } catch {
      setError("Unable to remove item.");
    } finally {
      setActiveId(null);
    }
  };

  // ── apply coupon ──
  const applyCoupon = async () => {
    setCouponError(null);
    if (!couponCode.trim()) { setCouponError("Enter a coupon code."); return; }
    if (items.length === 0) { setCouponError("Your cart is empty."); return; }
    setApplyingCoupon(true);
    try {
      const res = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal }),
      });
      const data = (await res.json()) as { error?: string; coupon?: AppliedCoupon };
      if (!res.ok || !data.coupon) {
        setAppliedCoupon(null);
        setCouponError(data.error ?? "Invalid coupon code.");
        return;
      }
      setAppliedCoupon(data.coupon);
      setCouponCode(data.coupon.code);
      setSuccess(`Coupon ${data.coupon.code} applied!`);
    } catch {
      setCouponError("Unable to apply coupon.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // ── place order ──
  const placeOrder = async (form: ShippingForm) => {
    setError(null);
    setSuccess(null);
    if (items.length === 0) { setError("Your cart is empty."); return; }
    setPlacingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shippingAddress: form,
          paymentMethod,
          couponCode: appliedCoupon?.code,
        }),
      });
      if (res.status === 401) { router.push(authRedirectRef.current); return; }
      const data = (await res.json()) as {
        error?: string;
        order?: { orderNumber: string };
        checkoutUrl?: string;
      };
      if (!res.ok || !data.order) { setError(data.error ?? "Checkout failed."); return; }
      if (data.checkoutUrl) { window.location.href = data.checkoutUrl; return; }
      clearCart();
      router.push(CUSTOMER_ROUTES.ORDER_TRACKING);
    } catch {
      setError("Unable to place order right now.");
    } finally {
      setPlacingOrder(false);
    }
  };

  // Totals
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = useMemo(
    () => Number(Math.max(0, subtotal - discountAmount).toFixed(2)),
    [subtotal, discountAmount]
  );
  const shipping = discountedSubtotal > 100 ? 0 : discountedSubtotal > 0 ? 12 : 0;
  const orderTotal = discountedSubtotal + shipping;

  // ──────────────────────────────
  // LOADING
  // ──────────────────────────────
  if (loadingCart) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="font-sans text-sm text-text-secondary uppercase tracking-widest">Loading your bag...</p>
        </div>
      </div>
    );
  }

  // ──────────────────────────────
  // EMPTY CART
  // ──────────────────────────────
  if (!loadingCart && items.length === 0) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center mb-8 border border-white/5">
          <ShoppingBag className="w-10 h-10 text-text-tertiary" strokeWidth={1} />
        </div>
        <p className="font-sans text-[11px] font-bold uppercase tracking-[0.22em] text-gold mb-3">Your Bag</p>
        <h1 className="font-heading text-4xl text-text-primary mb-4">Nothing Here Yet</h1>
        <p className="font-sans text-text-secondary text-sm max-w-xs leading-relaxed mb-10">
          Browse our collection and add something you love.
        </p>
        <a
          href="/product_details"
          className="btn-sweep font-sans text-[12px] font-bold uppercase tracking-[0.18em] px-10 py-4 rounded-full"
        >
          <span className="relative z-10">Explore Collection</span>
        </a>
      </div>
    );
  }

  // ──────────────────────────────
  // MAIN LAYOUT
  // ──────────────────────────────
  return (
    <div className="min-h-screen bg-primary">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-16 xl:px-24 pt-28 pb-24">

        {/* ─── PAGE HEADER ─── */}
        <div className="mb-12">
          <div className="flex items-center gap-2 font-sans text-[10px] text-text-tertiary uppercase tracking-[0.2em] mb-3">
            <a href="/" className="hover:text-gold transition-colors">Home</a>
            <ChevronRight className="w-3 h-3" />
            <a href="/cart" className="hover:text-gold transition-colors">Bag</a>
            <ChevronRight className="w-3 h-3" />
            <span className="text-text-secondary">Checkout</span>
          </div>
          <h1 className="font-heading text-4xl md:text-5xl text-text-primary">
            Checkout
            <span className="font-sans text-base text-text-secondary ml-4 font-normal">
              ({totalItems} {totalItems === 1 ? "item" : "items"})
            </span>
          </h1>
        </div>

        {/* Global alerts */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded border border-status-error/30 bg-status-error/10 font-sans text-sm text-status-error"
            >
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 px-4 py-3 rounded border border-status-success/30 bg-status-success/10 font-sans text-sm text-status-success flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {success}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col xl:flex-row gap-10 xl:gap-14">

          {/* ═══════════════════════════════
              LEFT COLUMN
          ═══════════════════════════════ */}
          <div className="w-full xl:w-[62%] flex flex-col gap-8">

            {/* ── CART ITEMS ── */}
            <section className="bg-surface rounded-sm border border-white/5 p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading text-xl text-text-primary flex items-center gap-3">
                  <Package className="w-4 h-4 text-gold" />
                  Your Items
                </h2>
                <a
                  href="/cart"
                  className="font-sans text-[11px] text-text-tertiary hover:text-gold transition-colors uppercase tracking-wider underline underline-offset-2"
                >
                  Edit Bag
                </a>
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const isBusy = activeId === item.productId;
                  return (
                    <motion.div
                      key={item.productId}
                      layout
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: isBusy ? 0.5 : 1, y: 0 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0, paddingTop: 0, paddingBottom: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-4 py-4 border-b border-white/5 last:border-b-0"
                    >
                      {/* Thumbnail */}
                      <div className="shrink-0 w-16 h-20 bg-primary rounded-sm overflow-hidden border border-white/5">
                        <img
                          src={item.thumbnail || placeholderSvg}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-heading text-base text-text-primary leading-snug truncate">{item.title}</p>
                            <p className="font-sans text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">SKU: {item.sku}</p>
                          </div>
                          <button
                            onClick={() => handleRemove(item.productId)}
                            disabled={isBusy}
                            className="shrink-0 text-text-tertiary hover:text-status-error transition-colors disabled:opacity-30 mt-0.5"
                            aria-label="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          {/* Qty stepper */}
                          <div className="flex items-center border border-white/10 rounded-sm overflow-hidden">
                            <button
                              onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                              disabled={isBusy || item.quantity <= 1}
                              className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-30"
                            >
                              <Minus className="w-2.5 h-2.5" />
                            </button>
                            <span className="w-7 text-center font-sans text-xs text-text-primary font-medium select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                              disabled={isBusy || item.quantity >= item.stockQuantity}
                              className="w-7 h-7 flex items-center justify-center text-text-secondary hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-30"
                            >
                              <Plus className="w-2.5 h-2.5" />
                            </button>
                          </div>
                          {/* Price */}
                          <span className="font-sans text-sm text-gold font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </section>

            {/* ── SHIPPING ADDRESS ── */}
            <section className="bg-surface rounded-sm border border-white/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <Truck className="w-4 h-4 text-gold" />
                <h2 className="font-heading text-xl text-text-primary">Shipping Address</h2>
              </div>

              <form id="checkout-form" className="space-y-6" onSubmit={handleSubmit(placeOrder)}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                      Full Name *
                    </label>
                    <input
                      {...register("fullName")}
                      placeholder="e.g. Ahmad Khan"
                      className="checkout-input"
                    />
                    <FieldError msg={errors.fullName?.message} />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                      Phone Number *
                    </label>
                    <input
                      {...register("phone")}
                      placeholder="+92 300 0000000"
                      className="checkout-input"
                    />
                    <FieldError msg={errors.phone?.message} />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                    Street Address *
                  </label>
                  <input
                    {...register("line1")}
                    placeholder="House no., Street, Area"
                    className="checkout-input"
                  />
                  <FieldError msg={errors.line1?.message} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {/* City */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                      City *
                    </label>
                    <input
                      {...register("city")}
                      placeholder="Lahore"
                      className="checkout-input"
                    />
                    <FieldError msg={errors.city?.message} />
                  </div>

                  {/* Postal Code */}
                  <div>
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                      Postal Code *
                    </label>
                    <input
                      {...register("postalCode")}
                      placeholder="54000"
                      className="checkout-input"
                    />
                    <FieldError msg={errors.postalCode?.message} />
                  </div>

                  {/* Country */}
                  <div className="col-span-2 md:col-span-1">
                    <label className="block font-sans text-[10px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-2">
                      Country *
                    </label>
                    <input
                      {...register("country")}
                      placeholder="Pakistan"
                      className="checkout-input"
                    />
                    <FieldError msg={errors.country?.message} />
                  </div>
                </div>
              </form>
            </section>

            {/* ── PAYMENT METHOD ── */}
            <section className="bg-surface rounded-sm border border-white/5 p-6 md:p-8">
              <div className="flex items-center gap-3 mb-8">
                <CreditCard className="w-4 h-4 text-gold" />
                <h2 className="font-heading text-xl text-text-primary">Payment Method</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Card */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="sr-only peer"
                  />
                  <div className="flex items-center gap-4 p-4 border border-white/10 rounded-sm transition-all cursor-pointer peer-checked:border-gold/50 peer-checked:bg-gold/5 hover:border-white/20">
                    <div className="w-9 h-9 bg-primary rounded-sm flex items-center justify-center border border-white/10 shrink-0">
                      <CreditCard className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-text-primary">Credit / Debit Card</p>
                      <p className="font-sans text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">Visa · Mastercard · Amex</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-white/20 peer-checked:border-gold flex items-center justify-center shrink-0 transition-colors">
                      {paymentMethod === "card" && <div className="w-2 h-2 rounded-full bg-gold" />}
                    </div>
                  </div>
                </label>

                {/* COD */}
                <label className="cursor-pointer">
                  <input
                    type="radio"
                    name="payment-method"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="sr-only peer"
                  />
                  <div className="flex items-center gap-4 p-4 border border-white/10 rounded-sm transition-all cursor-pointer peer-checked:border-gold/50 peer-checked:bg-gold/5 hover:border-white/20">
                    <div className="w-9 h-9 bg-primary rounded-sm flex items-center justify-center border border-white/10 shrink-0">
                      <Wallet className="w-4 h-4 text-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="font-sans text-sm font-semibold text-text-primary">Cash on Delivery</p>
                      <p className="font-sans text-[10px] text-text-tertiary uppercase tracking-wider mt-0.5">Pay when received</p>
                    </div>
                    <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center shrink-0 transition-colors peer-checked:border-gold">
                      {paymentMethod === "cod" && <div className="w-2 h-2 rounded-full bg-gold" />}
                    </div>
                  </div>
                </label>
              </div>
            </section>
          </div>

          {/* ═══════════════════════════════
              RIGHT COLUMN — Order Summary
          ═══════════════════════════════ */}
          <div className="w-full xl:w-[38%]">
            <div className="xl:sticky xl:top-28 flex flex-col gap-6">

              {/* ── ORDER SUMMARY CARD ── */}
              <div className="bg-surface rounded-sm border border-white/5 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                <h2 className="font-heading text-2xl text-text-primary mb-6 pb-5 border-b border-white/5">
                  Order Summary
                </h2>

                {/* Item thumbnails preview */}
                <div className="flex gap-2 mb-6 flex-wrap">
                  {items.slice(0, 5).map((item) => (
                    <div key={item.productId} className="w-12 h-14 rounded-sm overflow-hidden border border-white/10 bg-primary shrink-0">
                      <img src={item.thumbnail || placeholderSvg} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ))}
                  {items.length > 5 && (
                    <div className="w-12 h-14 rounded-sm border border-white/10 bg-surface flex items-center justify-center">
                      <span className="font-sans text-[10px] text-text-tertiary font-bold">+{items.length - 5}</span>
                    </div>
                  )}
                </div>

                {/* Coupon */}
                <div className="mb-6 p-4 bg-primary rounded-sm border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-3 h-3 text-gold" />
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-text-secondary">Coupon Code</p>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="ENTER CODE"
                      disabled={!!appliedCoupon}
                      className="h-9 flex-1 rounded-sm border border-white/10 bg-surface px-3 font-sans text-xs font-semibold uppercase tracking-[0.12em] text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none transition-colors disabled:opacity-50"
                    />
                    {appliedCoupon ? (
                      <button
                        type="button"
                        onClick={() => { setAppliedCoupon(null); setCouponCode(""); setSuccess(null); }}
                        className="px-3 rounded-sm border border-white/10 font-sans text-[10px] font-bold uppercase tracking-wider text-text-secondary hover:text-status-error hover:border-status-error/30 transition-colors"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={applyingCoupon || items.length === 0}
                        className="px-4 rounded-sm border border-gold/30 font-sans text-[10px] font-bold uppercase tracking-wider text-gold hover:bg-gold/10 transition-colors disabled:opacity-40"
                      >
                        {applyingCoupon ? "…" : "Apply"}
                      </button>
                    )}
                  </div>
                  {couponError && (
                    <p className="mt-2 font-sans text-[11px] text-status-error">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="mt-2 font-sans text-[11px] text-status-success flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {appliedCoupon.code} — saving ${discountAmount.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Totals */}
                <div className="flex flex-col gap-3 font-sans text-sm mb-6">
                  <div className="flex justify-between text-text-secondary">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? "item" : "items"})</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-status-success">
                      <span>Discount ({appliedCoupon?.code})</span>
                      <span>−${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-text-secondary">
                    <span>Shipping</span>
                    <span className={shipping === 0 && discountedSubtotal > 0 ? "text-status-success font-medium" : ""}>
                      {discountedSubtotal === 0
                        ? "—"
                        : shipping === 0
                          ? "Free"
                          : `$${shipping.toFixed(2)}`}
                    </span>
                  </div>

                  <div className="flex justify-between text-text-secondary">
                    <span>Taxes</span>
                    <span className="text-text-tertiary text-[12px]">Calculated at review</span>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center py-5 border-t border-b border-white/5 mb-8">
                  <span className="font-sans text-sm font-medium text-text-primary uppercase tracking-widest">Total</span>
                  <motion.span
                    key={orderTotal}
                    initial={{ opacity: 0.5, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-display text-[38px] text-gold leading-none"
                  >
                    ${orderTotal.toFixed(2)}
                  </motion.span>
                </div>

                {/* Place Order */}
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={placingOrder || items.length === 0}
                  className="w-full btn-sweep font-sans text-[12px] font-bold uppercase tracking-[0.18em] h-[54px] rounded-full flex items-center justify-center gap-3 group disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {placingOrder ? (
                      <>
                        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Placing Order...
                      </>
                    ) : (
                      <>
                        Place Order
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </span>
                </button>

                {/* Trust signals */}
                <div className="mt-5 flex items-center justify-center gap-2 text-text-tertiary">
                  <Lock className="w-3 h-3" />
                  <span className="font-sans text-[10px] uppercase tracking-wider">256-bit SSL Encrypted</span>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 opacity-40">
                  {["VISA", "MC", "AMEX"].map((p) => (
                    <span key={p} className="font-sans text-[9px] font-bold border border-text-tertiary/30 px-2 py-0.5 rounded text-text-tertiary">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              {/* ── Policies ── */}
              <div className="bg-surface rounded-sm border border-white/5 p-5">
                <div className="grid grid-cols-1 gap-3">
                  {[
                    { icon: Truck, label: "Free returns within 30 days" },
                    { icon: Lock, label: "Secure encrypted payment" },
                    { icon: Package, label: "Premium packaging included" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-3 text-text-secondary">
                      <Icon className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span className="font-sans text-[12px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// Page export (Suspense boundary)
// ─────────────────────────────────────────
export default function CartCheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-primary flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-[#C8A96E]/30 border-t-[#C8A96E] rounded-full animate-spin" />
            <p className="font-sans text-sm text-[#8A8580] uppercase tracking-widest">Loading...</p>
          </div>
        </div>
      }
    >
      <CartCheckoutContent />
    </Suspense>
  );
}
