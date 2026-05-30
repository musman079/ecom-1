"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { useCartStore, type CartItem } from "../../src/store/cart-store";
import { CartLineItem } from "../../src/components/cart/cart-line-item";
import { FadeIn } from "../../src/components/motion/fade-in";
import { AuthLink } from "../../src/components/auth/auth-link";
import { buildAuthHref } from "../../src/lib/auth-redirect";

type ShippingForm = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
};

const shippingSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  phone: z.string().min(7, "Valid phone number is required."),
  line1: z.string().min(3, "Street address is required."),
  city: z.string().min(2, "City is required."),
  postalCode: z.string().min(3, "Postal code is required."),
  country: z.string().min(2, "Country is required."),
});

type AppliedCoupon = {
  code: string;
  discountAmount: number;
  finalSubtotal: number;
};

function CartCheckoutContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const checkoutSteps = ["Bag", "Shipping", "Payment"] as const;

  const cartItems = useCartStore((state) => state.items);
  const cartSubtotal = useCartStore((state) => state.subtotal);
  const cartTotalItems = useCartStore((state) => state.totalItems);
  const cart = {
    items: cartItems,
    subtotal: cartSubtotal,
    totalItems: cartTotalItems,
  };
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const authRedirect = useMemo(() => buildAuthHref(nextPath), [nextPath]);
  const activeStep = cart.items.length === 0 ? 1 : 2;
  const progress = (activeStep - 1) / (checkoutSteps.length - 1);
  const setCart = useCartStore((state) => state.setCart);
  const clearCart = useCartStore((state) => state.clearCart);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ShippingForm>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      line1: "",
      city: "",
      postalCode: "",
      country: "",
    },
  });

  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const loadCart = async () => {
      try {
        const response = await fetch("/api/cart", { cache: "no-store" });

        if (response.status === 401) {
          router.push(authRedirect);
          return;
        }

        const payload = (await response.json()) as {
          error?: string;
          cart?: {
            items?: CartItem[];
            subtotal?: number;
            totalItems?: number;
          };
        };

        if (!response.ok || !payload.cart) {
          setError(payload.error ?? "Unable to load cart.");
          return;
        }

        setCart({
          items: Array.isArray(payload.cart.items) ? payload.cart.items : [],
          subtotal: Number(payload.cart.subtotal ?? 0),
          totalItems: Number(payload.cart.totalItems ?? 0),
        });
      } catch {
        setError("Unable to load cart right now.");
      }
    };

    void loadCart();
  }, [authRedirect, router, setCart]);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = useMemo(() => Number(Math.max(0, cart.subtotal - discountAmount).toFixed(2)), [cart.subtotal, discountAmount]);
  const total = discountedSubtotal;
  const currentSubtotal = cart.subtotal;

  useEffect(() => {
    setAppliedCoupon((current) => {
      if (!current) {
        return current;
      }

      const nextSubtotal = Number(Math.max(0, currentSubtotal - current.discountAmount).toFixed(2));
      return {
        ...current,
        finalSubtotal: nextSubtotal,
      };
    });
  }, [appliedCoupon, currentSubtotal]);

  const updateQuantity = async (productId: string, quantity: number) => {
    setActiveProductId(productId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productId, quantity }),
      });

      if (response.status === 401) {
        router.push(authRedirect);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        cart?: {
          items: CartItem[];
          subtotal: number;
          totalItems: number;
        };
      };

      if (!response.ok || !payload.cart) {
        setError(payload.error ?? "Unable to update quantity right now.");
        return;
      }

      setCart(payload.cart);
    } catch {
      setError("Unable to update quantity right now.");
    } finally {
      setActiveProductId(null);
    }
  };

  const removeItem = async (productId: string) => {
    setActiveProductId(productId);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/cart?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        router.push(authRedirect);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        cart?: {
          items: CartItem[];
          subtotal: number;
          totalItems: number;
        };
      };

      if (!response.ok || !payload.cart) {
        setError(payload.error ?? "Unable to remove product right now.");
        return;
      }

      setCart(payload.cart);
    } catch {
      setError("Unable to remove product right now.");
    } finally {
      setActiveProductId(null);
    }
  };

  const placeOrder = async (shippingForm: ShippingForm) => {
    setError(null);
    setMessage(null);

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setPlacingOrder(true);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shippingAddress: shippingForm,
          paymentMethod,
          couponCode: appliedCoupon?.code,
        }),
      });

      if (response.status === 401) {
        router.push(authRedirect);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        order?: {
          orderNumber: string;
        };
        checkoutUrl?: string;
      };

      if (!response.ok || !payload.order) {
        setError(payload.error ?? "Checkout failed.");
        return;
      }

      // If a hosted Stripe Checkout session URL is returned, redirect the browser to it
      if (payload.checkoutUrl) {
        window.location.href = payload.checkoutUrl;
        return;
      }

      setMessage(`Order placed successfully (${payload.order.orderNumber}).`);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
      clearCart();
      router.push(CUSTOMER_ROUTES.ORDER_TRACKING);
    } catch {
      setError("Unable to place order right now.");
    } finally {
      setPlacingOrder(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError(null);
    setError(null);

    if (!couponCode.trim()) {
      setCouponError("Enter a coupon code.");
      return;
    }

    if (cart.items.length === 0) {
      setCouponError("Your cart is empty.");
      return;
    }

    setApplyingCoupon(true);

    try {
      const response = await fetch("/api/coupons/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: couponCode,
          subtotal: cart.subtotal,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        coupon?: AppliedCoupon;
      };

      if (!response.ok || !payload.coupon) {
        setAppliedCoupon(null);
        setCouponError(payload.error ?? "Unable to apply coupon.");
        return;
      }

      setAppliedCoupon(payload.coupon);
      setCouponCode(payload.coupon.code);
      setMessage(`Coupon ${payload.coupon.code} applied successfully.`);
    } catch {
      setCouponError("Unable to apply coupon right now.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b1220] text-[#f2f4f8] -mt-20 pt-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[#3f7dff]/30 blur-3xl" />
        <div className="absolute right-[-120px] top-44 h-[24rem] w-[24rem] rounded-full bg-[#17c4b3]/20 blur-3xl" />
        <div className="absolute bottom-[-170px] left-1/3 h-[26rem] w-[26rem] rounded-full bg-[#d7a8ff]/20 blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/70 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link href={CUSTOMER_ROUTES.HOME} className="active:scale-95 transition" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </Link>
            <span className="text-xl font-black uppercase tracking-[0.08em] text-white">KINETIC</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden gap-8 md:flex">
              <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Explore</Link>
              <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth className="text-xs font-bold uppercase tracking-[0.18em] text-white">Cart</AuthLink>
            </nav>
            <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth className="relative active:scale-95 transition" ariaLabel="Cart">
              <span className="material-symbols-outlined text-white">shopping_bag</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#65f3de] to-[#3f7dff] text-[8px] font-bold text-[#0c1220]">
                {cart.totalItems}
              </span>
            </AuthLink>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-32 pt-24 lg:grid-cols-12">
        <section className="lg:col-span-12">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/45">
              {checkoutSteps.map((step, index) => (
                <span key={step} className={index + 1 <= activeStep ? "text-white" : "text-white/35"}>
                  {step}
                </span>
              ))}
            </div>
            <div className="mt-4 h-1 w-full rounded-full bg-white/10">
              {reduceMotion ? (
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#65f3de] via-[#4a8dff] to-[#3f7dff]"
                  style={{ width: `${progress * 100}%` }}
                />
              ) : (
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#65f3de] via-[#4a8dff] to-[#3f7dff]"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              )}
            </div>
          </div>
        </section>
        <section className="lg:col-span-7">
          <div className="mb-12">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.05em] text-white md:text-6xl">Checkout Studio</h1>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">{cart.totalItems} Items Curated</p>
          </div>

          {error ? <p className="mb-4 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p> : null}
          {message ? <p className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">{message}</p> : null}

          <AnimatePresence mode="popLayout">
            <div className="space-y-12">
              {cart.items.length === 0 ? (
                <motion.div
                  initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-white/70 backdrop-blur-xl"
                >
                  No items in cart yet.
                </motion.div>
              ) : (
                cart.items.map((item) => (
                  <CartLineItem
                    key={item.productId}
                    productId={item.productId}
                    title={item.title}
                    sku={item.sku}
                    price={item.price}
                    quantity={item.quantity}
                    stockQuantity={item.stockQuantity}
                    thumbnail={item.thumbnail}
                    activeProductId={activeProductId}
                    onDecrement={() => updateQuantity(item.productId, item.quantity - 1)}
                    onIncrement={() => updateQuantity(item.productId, item.quantity + 1)}
                    onRemove={() => removeItem(item.productId)}
                  />
                ))
              )}
            </div>
          </AnimatePresence>

            <section className="mt-20 rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <form className="space-y-8" id="shipping-form" onSubmit={handleSubmit(placeOrder)}>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <input
                  {...register("fullName")}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Full Name"
                />
                <input
                  {...register("phone")}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Phone Number"
                />
              </div>
              {errors.fullName ? <p className="text-xs font-semibold text-red-300">{errors.fullName.message}</p> : null}
              {errors.phone ? <p className="text-xs font-semibold text-red-300">{errors.phone.message}</p> : null}
              <input
                {...register("line1")}
                className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                placeholder="Street Address"
              />
              {errors.line1 ? <p className="text-xs font-semibold text-red-300">{errors.line1.message}</p> : null}
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                <input
                  {...register("city")}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="City"
                />
                <input
                  {...register("postalCode")}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Postal Code"
                />
                <input
                  {...register("country")}
                  className="col-span-2 w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0 md:col-span-1"
                  placeholder="Country"
                />
              </div>
              {errors.city ? <p className="text-xs font-semibold text-red-300">{errors.city.message}</p> : null}
              {errors.postalCode ? <p className="text-xs font-semibold text-red-300">{errors.postalCode.message}</p> : null}
              {errors.country ? <p className="text-xs font-semibold text-red-300">{errors.country.message}</p> : null}
            </form>
          </section>
        </section>

        <FadeIn as="aside" className="lg:col-span-5">
          <div className="space-y-8 lg:sticky lg:top-28">
            <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-[0px_20px_50px_rgba(5,8,16,0.45)] backdrop-blur-2xl">
              <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-white">Payment Method</h2>
              <div className="space-y-4">
                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    className="peer hidden"
                  />
                  <div className="flex items-center justify-between rounded-xl border border-white/15 bg-[#121b31] p-4 text-white transition-all peer-checked:border-[#65f3de]/50 peer-checked:bg-[#141f36] peer-checked:text-white">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        credit_card
                      </span>
                      <div>
                        <p className="text-sm font-bold">Credit / Debit Card</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm opacity-0 peer-checked:opacity-100">check_circle</span>
                    <span className="rounded-full border border-white/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/85 peer-checked:border-[#65f3de]/60 peer-checked:text-white">
                      Available
                    </span>
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="peer hidden"
                  />
                  <div className="flex items-center justify-between rounded-xl border border-white/20 bg-[#0f192d] p-4 text-white/80 transition-all peer-checked:border-[#65f3de]/50 peer-checked:bg-[#141f36] peer-checked:text-white">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined">payments</span>
                      <div>
                        <p className="text-sm font-bold">Cash on Delivery</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Pay when you receive</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm opacity-0 peer-checked:opacity-100">check_circle</span>
                  </div>
                </label>
              </div>
              <p className="mt-4 text-xs font-semibold text-white/60">Choose Credit / Debit Card or Cash on Delivery to continue checkout.</p>
            </section>

            <section className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,#111b32_0%,#0a1324_100%)] p-8 text-white shadow-[0px_20px_50px_rgba(8,11,22,0.5)]">
              <h2 className="mb-8 text-sm font-black uppercase tracking-widest">Order Summary</h2>
              <div className="mb-6 rounded-lg border border-white/20 bg-white/5 p-4">
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Coupon</p>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="h-10 flex-1 rounded-md border border-white/20 bg-black/20 px-3 text-xs font-semibold uppercase tracking-[0.16em] text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    disabled={applyingCoupon || cart.items.length === 0}
                    className="rounded-md border border-white/25 px-4 text-[10px] font-black uppercase tracking-[0.16em] transition hover:bg-white/10 disabled:opacity-40"
                  >
                    {applyingCoupon ? "Applying" : "Apply"}
                  </button>
                </div>
                {couponError ? <p className="mt-2 text-xs font-semibold text-red-300">{couponError}</p> : null}
                {appliedCoupon ? <p className="mt-2 text-xs font-semibold text-emerald-300">{appliedCoupon.code} active</p> : null}
              </div>
              <div className="space-y-4 font-medium">
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-sm uppercase tracking-wide">Subtotal</span>
                  <span className="text-sm">${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-sm uppercase tracking-wide">Discount</span>
                  <span className="text-sm">-${discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-sm uppercase tracking-wide">Shipping</span>
                  <span className="text-sm">Calculated at review</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/20 pb-4 opacity-70">
                  <span className="text-sm uppercase tracking-wide">Taxes</span>
                  <span className="text-sm">Calculated at review</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-3xl font-black uppercase tracking-tight sm:text-xl">Subtotal after discounts</span>
                  <motion.span
                    key={total}
                    initial={reduceMotion ? false : { opacity: 0.5, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-black sm:text-2xl"
                  >
                    ${total.toFixed(2)}
                  </motion.span>
                </div>
              </div>

              <motion.button
                type="submit"
                form="shipping-form"
                disabled={placingOrder || cart.items.length === 0}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                className="mt-10 block w-full rounded-full bg-gradient-to-br from-[#65f3de] via-[#4a8dff] to-[#3f7dff] py-5 text-center text-xs font-black uppercase tracking-[0.2em] text-[#081224] transition hover:shadow-[0_10px_35px_rgba(74,141,255,0.35)] disabled:opacity-40"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </motion.button>
              <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Checkout</span>
              </div>
            </section>
          </div>
        </FadeIn>
      </main>

    </div>
  );
}

export default function CartCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CartCheckoutContent />
    </Suspense>
  );
}
