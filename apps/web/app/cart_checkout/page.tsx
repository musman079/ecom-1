"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";

type ApiCartItem = {
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
};

type ApiCart = {
  items: ApiCartItem[];
  subtotal: number;
  totalItems: number;
};

type ShippingForm = {
  fullName: string;
  phone: string;
  line1: string;
  city: string;
  postalCode: string;
  country: string;
};

type AppliedCoupon = {
  code: string;
  discountAmount: number;
  finalSubtotal: number;
};

export default function CartCheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [activeProductId, setActiveProductId] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("cod");
  const [cart, setCart] = useState<ApiCart>({
    items: [],
    subtotal: 0,
    totalItems: 0,
  });
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    postalCode: "",
    country: "",
  });
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const loadCart = async () => {
    try {
      const response = await fetch("/api/cart", { cache: "no-store" });

      if (response.status === 401) {
        setNeedsAuth(true);
        setCart({ items: [], subtotal: 0, totalItems: 0 });
        return;
      }

      const payload = (await response.json()) as {
        cart?: ApiCart;
        error?: string;
      };

      if (!response.ok || !payload.cart) {
        setError(payload.error ?? "Unable to load cart.");
        return;
      }

      setNeedsAuth(false);
      setCart(payload.cart);
    } catch {
      setError("Unable to load cart due to network issue.");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setError(null);
      await loadCart();
      setLoading(false);
    };

    void init();
  }, []);

  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const discountedSubtotal = useMemo(() => Number(Math.max(0, cart.subtotal - discountAmount).toFixed(2)), [cart.subtotal, discountAmount]);
  const shipping = discountedSubtotal > 0 ? 12 : 0;
  const taxes = useMemo(() => Number((discountedSubtotal * 0.08).toFixed(2)), [discountedSubtotal]);
  const total = discountedSubtotal + shipping + taxes;

  useEffect(() => {
    setAppliedCoupon((current) => {
      if (!current) {
        return current;
      }

      const nextSubtotal = Number(Math.max(0, cart.subtotal - current.discountAmount).toFixed(2));
      return {
        ...current,
        finalSubtotal: nextSubtotal,
      };
    });
  }, [cart.subtotal]);

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

      const payload = (await response.json()) as {
        cart?: ApiCart;
        error?: string;
      };

      if (!response.ok || !payload.cart) {
        setError(payload.error ?? "Unable to update cart item.");
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

      const payload = (await response.json()) as {
        cart?: ApiCart;
        error?: string;
      };

      if (!response.ok || !payload.cart) {
        setError(payload.error ?? "Unable to remove product.");
        return;
      }

      setCart(payload.cart);
    } catch {
      setError("Unable to remove product right now.");
    } finally {
      setActiveProductId(null);
    }
  };

  const onShippingChange = (field: keyof ShippingForm, value: string) => {
    setShippingForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const placeOrder = async () => {
    setError(null);
    setMessage(null);

    if (needsAuth) {
      router.push(CUSTOMER_ROUTES.AUTH);
      return;
    }

    if (cart.items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const missing = Object.entries(shippingForm).some(([, value]) => !value.trim());
    if (missing) {
      setError("Please complete shipping details before checkout.");
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

      const payload = (await response.json()) as {
        error?: string;
        order?: {
          orderNumber: string;
        };
      };

      if (!response.ok || !payload.order) {
        setError(payload.error ?? "Checkout failed.");
        return;
      }

      setMessage(`Order placed successfully (${payload.order.orderNumber}).`);
      setAppliedCoupon(null);
      setCouponCode("");
      setCouponError(null);
      await loadCart();
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

    if (needsAuth) {
      setCouponError("Please sign in before applying coupons.");
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
    <div className="relative min-h-screen overflow-x-hidden bg-[#0b1220] text-[#f2f4f8]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 -top-24 h-80 w-80 rounded-full bg-[#3f7dff]/30 blur-3xl" />
        <div className="absolute right-[-120px] top-44 h-[24rem] w-[24rem] rounded-full bg-[#17c4b3]/20 blur-3xl" />
        <div className="absolute bottom-[-170px] left-1/3 h-[26rem] w-[26rem] rounded-full bg-[#d7a8ff]/20 blur-3xl" />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/70 backdrop-blur-2xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a href={CUSTOMER_ROUTES.HOME} className="active:scale-95 transition" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span className="text-xl font-black uppercase tracking-[0.08em] text-white">KINETIC</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden gap-8 md:flex">
              <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Explore</a>
              <a href={CUSTOMER_ROUTES.CART_CHECKOUT} className="text-xs font-bold uppercase tracking-[0.18em] text-white">Cart</a>
            </nav>
            <a href={CUSTOMER_ROUTES.CART_CHECKOUT} className="relative active:scale-95 transition" aria-label="Cart">
              <span className="material-symbols-outlined text-white">shopping_bag</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-[#65f3de] to-[#3f7dff] text-[8px] font-bold text-[#0c1220]">
                {cart.totalItems}
              </span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-32 pt-24 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="mb-12">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.05em] text-white md:text-6xl">Checkout Studio</h1>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/65">{cart.totalItems} Items Curated</p>
          </div>

          {error ? <p className="mb-4 rounded-lg border border-red-300/30 bg-red-400/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</p> : null}
          {message ? <p className="mb-4 rounded-lg border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm font-semibold text-emerald-200">{message}</p> : null}

          <div className="space-y-12">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-white/70 backdrop-blur-xl">Loading cart...</div>
            ) : needsAuth ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-white/70 backdrop-blur-xl">
                <p className="mb-4">Please sign in to access your cart.</p>
                <a href={CUSTOMER_ROUTES.AUTH} className="inline-flex rounded-full bg-gradient-to-br from-[#65f3de] to-[#3f7dff] px-6 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#0c1220]">
                  Go to Login
                </a>
              </div>
            ) : cart.items.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-sm text-white/70 backdrop-blur-xl">No items in cart yet.</div>
            ) : (
              cart.items.map((item) => (
              <article key={item.productId} className="group flex items-start gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.05]">
                <div className="h-40 w-32 shrink-0 overflow-hidden rounded-xl bg-white/5">
                  <img
                    src={`https://picsum.photos/seed/${encodeURIComponent(item.productId)}/320/400`}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex h-40 flex-grow flex-col py-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#65f3de]">In Cart</span>
                      <h3 className="text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-3xl">{item.title}</h3>
                      <p className="text-sm text-white/60">SKU: {item.sku}</p>
                    </div>
                    <span className="text-3xl font-bold text-white sm:text-lg">${item.price.toFixed(2)}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-white">
                      <button
                        type="button"
                        disabled={activeProductId === item.productId || item.quantity <= 1}
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="material-symbols-outlined text-sm disabled:opacity-40"
                      >
                        remove
                      </button>
                      <span className="w-4 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        disabled={activeProductId === item.productId || item.quantity >= item.stockQuantity}
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="material-symbols-outlined text-sm disabled:opacity-40"
                      >
                        add
                      </button>
                    </div>
                    <button
                      type="button"
                      disabled={activeProductId === item.productId}
                      onClick={() => removeItem(item.productId)}
                      className="text-[10px] font-bold uppercase tracking-widest text-white/65 transition hover:text-[#ff9b9b] disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            )))}
          </div>

          <section className="mt-20 rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl">
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight text-white">Shipping Detail</h2>
            <form className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <input
                  value={shippingForm.fullName}
                  onChange={(event) => onShippingChange("fullName", event.target.value)}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Full Name"
                />
                <input
                  value={shippingForm.phone}
                  onChange={(event) => onShippingChange("phone", event.target.value)}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Phone Number"
                />
              </div>
              <input
                value={shippingForm.line1}
                onChange={(event) => onShippingChange("line1", event.target.value)}
                className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                placeholder="Street Address"
              />
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                <input
                  value={shippingForm.city}
                  onChange={(event) => onShippingChange("city", event.target.value)}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="City"
                />
                <input
                  value={shippingForm.postalCode}
                  onChange={(event) => onShippingChange("postalCode", event.target.value)}
                  className="w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
                  placeholder="Postal Code"
                />
                <input
                  value={shippingForm.country}
                  onChange={(event) => onShippingChange("country", event.target.value)}
                  className="col-span-2 w-full border-0 border-b-2 border-white/20 bg-transparent px-0 py-3 font-medium text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0 md:col-span-1"
                  placeholder="Country"
                />
              </div>
            </form>
          </section>
        </section>

        <aside className="lg:col-span-5">
          <div className="space-y-8 lg:sticky lg:top-28">
            <section className="rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-[0px_20px_50px_rgba(5,8,16,0.45)] backdrop-blur-2xl">
              <h2 className="mb-6 text-sm font-black uppercase tracking-widest text-white">Payment Method</h2>
              <div className="space-y-4">
                <label className="block cursor-not-allowed opacity-70">
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    disabled
                    className="peer hidden"
                  />
                  <div className="flex items-center justify-between rounded-xl border border-white/15 bg-[#121b31] p-4 text-white transition-all">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        credit_card
                      </span>
                      <div>
                        <p className="text-sm font-bold">Credit / Debit Card</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-white/35 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white/85">
                      Coming Soon
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
              <p className="mt-4 text-xs font-semibold text-white/60">Online card payments are coming soon. Cash on Delivery is currently available.</p>
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
                    disabled={applyingCoupon || loading || needsAuth}
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
                  <span className="text-sm">${shipping.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/20 pb-4 opacity-70">
                  <span className="text-sm uppercase tracking-wide">Taxes</span>
                  <span className="text-sm">${taxes.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-3xl font-black uppercase tracking-tight sm:text-xl">Total</span>
                  <span className="text-4xl font-black sm:text-2xl">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="button"
                disabled={placingOrder || loading || needsAuth}
                onClick={placeOrder}
                className="mt-10 block w-full rounded-full bg-gradient-to-br from-[#65f3de] via-[#4a8dff] to-[#3f7dff] py-5 text-center text-xs font-black uppercase tracking-[0.2em] text-[#081224] transition hover:scale-[1.02] hover:shadow-[0_10px_35px_rgba(74,141,255,0.35)] active:scale-95 disabled:opacity-40"
              >
                {placingOrder ? "Placing Order..." : "Place Order"}
              </button>
              <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Checkout</span>
              </div>
            </section>
          </div>
        </aside>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-white/10 bg-[#0d1627]/90 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.25)] backdrop-blur-2xl md:hidden">
        <a href={CUSTOMER_ROUTES.HOME} className="flex flex-col items-center text-white/50">
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Home</span>
        </a>
        <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="flex flex-col items-center text-white/50">
          <span className="material-symbols-outlined">search</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Search</span>
        </a>
        <a href={CUSTOMER_ROUTES.REVIEWS} className="flex flex-col items-center text-white/50">
          <span className="material-symbols-outlined">favorite</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Reviews</span>
        </a>
        <a href={CUSTOMER_ROUTES.ORDER_TRACKING} className="flex scale-110 flex-col items-center text-[#65f3de]">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            package_2
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Orders</span>
        </a>
        <a href={CUSTOMER_ROUTES.PROFILE} className="flex flex-col items-center text-white/50">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Profile</span>
        </a>
      </nav>
    </div>
  );
}
