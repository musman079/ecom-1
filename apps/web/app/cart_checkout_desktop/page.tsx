"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { AuthLink } from "../../src/components/auth/auth-link";
import { buildAuthHref } from "../../src/lib/auth-redirect";
import { FadeIn } from "../../src/components/motion/fade-in";
import { Stagger, StaggerItem } from "../../src/components/motion/stagger";

const navLinks = [
  { label: 'New Arrivals', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Designers', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Editorial', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Archive', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Sustainability', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
];

const checkoutSteps = ["Bag", "Shipping", "Payment"] as const;

const cartItems = [
  {
    name: 'SCULPTURAL WOOL BLAZER',
    details: 'Midnight Black / Size 48',
    price: '€890.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBy0dYSkeoG47a13AW2eyJsktTZUKc7wdHzcbHbmAf2ABZN13cFww5w73nNRoe6RnJC_msUNH0NE8U-sazSxeBPTPh6pmNiztxQVmFnM3d72AVuMIU_h84aiRGTAhgWng9TScpq0Oj0TzCpy6Hm9e97JFv3a9YhccTbp2IiTJQEZIwVr7Or7kPqf7261MHhdZA197JVqS-XJ5VkmtnYUCuLtL9ni7W1Zf6E3vXH5Stb0havcGgl_x9ZeQTrPLWI5u26YgIeC1AYbHbv',
  },
  {
    name: 'USOLSTICE ORBIT SNEAKERS',
    details: 'Deep Indigo / Size 42',
    price: '€345.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCGvKIMlpGXPCc1fbTBKUeuals_oiNSB_Nx3DaTokOi9upbTSYsqBCVVkrkIqhPd3mM2BmS--rXy7RYMorDC2gCh1CBLgqOIfDc5KYqqR5qhTODDWmpPNLL0e2rXMXZSvAhq7BJig72JP8lGtf0D_0B5wVmkk9fFJt7NokEmFkx8bNkGaFq101JV1SaqObg3XUh55gwE9lUurpnTFLX0yi66Zf5NwHMCW0TtzIKPvOZqDKFbUysEgrzj70GDIKaicyZ1cx6Ngk9JcAB',
  },
  {
    name: 'ARCHIVE SILK FOULARD',
    details: 'Bone / One Size',
    price: '€180.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAaERByElmqaRmQau3jmGKNgbNg7GIuJUUEEmCRfSl_IwQfY26B3qEuAadka8HfAr7c8Ld_GeuLgUYDeMSOCcHmTcRY7-V4Z06cjUTpc8TEPNJYArpJT4-pQCIsKE-1_nbH-uGoECzIc_PSNd0S1aPVVIe19hmgmgUVFJtOBVrVqTF2LcwlpeF3o4ul6r84jtwC0-l0vo7wJcVHt0SBfMkAWIOeDIn35jg3fkZwTcEGItMtrfEpayTapwY5EIMATQNrUGD9c7OGA2uy',
  },
];

function CartCheckoutDesktopContent() {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [quantities, setQuantities] = useState<number[]>(() => cartItems.map(() => 1));
  const [selectedPayment, setSelectedPayment] = useState<"card" | "cod">("cod");
  const [checkoutMessage, setCheckoutMessage] = useState("Checkout ready.");
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const authRedirect = useMemo(() => buildAuthHref(nextPath), [nextPath]);

  const parsePrice = (value: string) => Number(value.replace(/[^0-9.]/g, "")) || 0;

  const totalItems = useMemo(
    () => quantities.reduce((sum, qty) => sum + qty, 0),
    [quantities],
  );
  const activeStep = totalItems === 0 ? 1 : 2;
  const progress = (activeStep - 1) / (checkoutSteps.length - 1);

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item, index) => sum + parsePrice(item.price) * (quantities[index] ?? 0), 0),
    [quantities],
  );

  const shipping = 0;
  const taxes = Number((subtotal * 0.09).toFixed(2));
  const total = subtotal + shipping + taxes;

  useEffect(() => {
    const ensureAuth = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        if (!response.ok) {
          router.replace(authRedirect);
        }
      } catch {
        router.replace(authRedirect);
      }
    };

    void ensureAuth();
  }, [authRedirect, router]);

  const increment = (index: number) => {
    setQuantities((previous) => previous.map((qty, idx) => (idx === index ? qty + 1 : qty)));
  };

  const decrement = (index: number) => {
    setQuantities((previous) => previous.map((qty, idx) => {
      if (idx !== index) {
        return qty;
      }
      return Math.max(0, qty - 1);
    }));
  };

  const removeItem = (index: number) => {
    setQuantities((previous) => previous.map((qty, idx) => (idx === index ? 0 : qty)));
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#304d8f_0%,#0b1220_45%,#070c16_100%)] text-[#f2f4f8] -mt-20 pt-20">
      <main className="mx-auto min-h-screen max-w-[1440px] px-6 pb-24 pt-32 md:px-12">
        <FadeIn as="header" className="mb-16">
          <h2 className="mb-4 text-5xl font-black uppercase tracking-[-0.06em] text-white md:text-7xl">Checkout</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white/75">Shopping Bag ({totalItems})</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>
        </FadeIn>

        <FadeIn as="section" className="mb-16 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-5 backdrop-blur-xl">
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
                className="h-full rounded-full bg-gradient-to-r from-[#dfb257] via-[#4a8dff] to-[#d97706]"
                style={{ width: `${progress * 100}%` }}
              />
            ) : (
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#dfb257] via-[#4a8dff] to-[#d97706]"
                initial={{ width: "0%" }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              />
            )}
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <section className="lg:col-span-7">
            <Stagger className="flex flex-col gap-12">
              {cartItems.map((item, index) => {
                const quantity = quantities[index];
                if (quantity === 0) {
                  return null;
                }

                return (
                  <StaggerItem key={item.name}>
                    <article className="group flex flex-col gap-6 md:flex-row md:gap-8">
                      <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-[#eeeeee] md:w-48">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      </div>

                      <div className="flex flex-1 flex-col justify-between py-2">
                        <div>
                          <div className="mb-2 flex items-start justify-between gap-4">
                            <h3 className="text-2xl font-bold uppercase tracking-tight md:text-xl">{item.name}</h3>
                            <span className="text-xl font-bold md:text-lg">{item.price}</span>
                          </div>
                          <p className="mb-4 text-sm text-[#5c5f60]">{item.details}</p>

                          <div className="flex items-center gap-4">
                            <button type="button" onClick={() => decrement(index)} className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition-all hover:bg-black hover:text-white">
                              <span className="material-symbols-outlined text-sm">remove</span>
                            </button>
                            <span className="font-mono text-sm">{String(quantity).padStart(2, "0")}</span>
                            <button type="button" onClick={() => increment(index)} className="flex h-8 w-8 items-center justify-center rounded-full border border-black/10 transition-all hover:bg-black hover:text-white">
                              <span className="material-symbols-outlined text-sm">add</span>
                            </button>
                          </div>
                        </div>

                        <button type="button" onClick={() => removeItem(index)} className="mt-6 inline-flex items-center gap-2 text-left text-xs uppercase tracking-widest text-[#5c5f60] transition-colors hover:text-[#ba1a1a]">
                          <span className="material-symbols-outlined text-sm">delete</span>
                          Remove from bag
                        </button>
                      </div>
                    </article>
                  </StaggerItem>
                );
              })}
            </Stagger>
          </section>

          <aside className="lg:col-span-5">
            <div className="flex flex-col gap-10 lg:sticky lg:top-32">
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
                <h3 className="mb-8 text-sm font-black uppercase tracking-[0.2em]">Summary</h3>
                <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#dfb257]">{checkoutMessage}</p>
                <div className="mb-8 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/65">Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/65">Shipping</span>
                    <span>€{shipping.toFixed(2)} (Express)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/65">Estimated Taxes</span>
                    <span>€{taxes.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-8 h-px bg-white/20" />

                <div className="mb-10 flex justify-between text-3xl font-black uppercase tracking-tight md:text-xl">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="DISCOUNT CODE"
                    className="w-full border-0 border-b border-white/25 bg-transparent px-0 py-4 text-xs uppercase tracking-widest placeholder:text-white/45 focus:border-[#dfb257] focus:ring-0"
                  />
                  <button type="button" onClick={() => setCheckoutMessage("Discount code applied.")} className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-widest underline underline-offset-4">
                    Apply
                  </button>
                </div>
              </section>

              <section className="space-y-10">
                <div>
                  <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em]">Shipping Information</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="col-span-2">
                      <input
                        type="email"
                        placeholder="EMAIL ADDRESS"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#dfb257] focus:ring-0"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="FIRST NAME"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#dfb257] focus:ring-0"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="LAST NAME"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#dfb257] focus:ring-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="SHIPPING ADDRESS"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#dfb257] focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em]">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button type="button" onClick={() => { setSelectedPayment("card"); setCheckoutMessage("Payment method: Credit / Debit Card."); }} className={`flex flex-col gap-4 rounded-lg p-6 text-left transition ${selectedPayment === "card" ? "border border-[#dfb257]/50 bg-[#121b31] text-white" : "border border-white/20 bg-[#121b31] text-white/70 hover:text-white"}`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">credit_card</span>
                        <span className={`h-4 w-4 rounded-full ${selectedPayment === "card" ? "border-4 border-[#dfb257]" : "border border-white/40"}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Credit Card</span>
                    </button>

                    <button type="button" onClick={() => { setSelectedPayment("cod"); setCheckoutMessage("Payment method: Cash on Delivery."); }} className={`flex flex-col gap-4 rounded-lg p-6 text-left transition ${selectedPayment === "cod" ? "border border-[#dfb257]/50 bg-[#121b31] text-white" : "border border-white/20 bg-[#0f192d] text-white/70 hover:text-white"}`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                        <span className={`h-4 w-4 rounded-full ${selectedPayment === "cod" ? "border-4 border-[#dfb257]" : "border border-white/40"}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cash on Delivery</span>
                    </button>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-white/60">Choose either payment option to continue checkout.</p>
                </div>

                <AuthLink href={CUSTOMER_ROUTES.ORDER_TRACKING} requiresAuth className="block w-full rounded-full bg-gradient-to-br from-[#dfb257] via-[#4a8dff] to-[#d97706] py-6 text-center text-sm font-bold uppercase tracking-[0.3em] text-[#0b1220] shadow-xl transition-transform hover:scale-[1.02]">
                  Complete Order
                </AuthLink>

                <div className="flex items-center justify-center gap-3 text-white/60">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em]">Secure End-to-End Encryption</span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#12100e] text-white/75">
        <div className="grid grid-cols-1 gap-12 px-6 py-24 md:grid-cols-4 xl:px-12">
          <div className="flex flex-col gap-6">
            <div className="text-2xl font-black tracking-[-0.04em] text-white">USOLSTICE EDITORIAL</div>
            <p className="text-xs uppercase tracking-widest text-white/50">© 2024 USOLSTICE EDITORIAL. ALL RIGHTS RESERVED.</p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Support</h4>
            <AuthLink href={CUSTOMER_ROUTES.ORDER_TRACKING} requiresAuth className="text-xs tracking-widest text-white/60 underline underline-offset-4">
              Customer Care
            </AuthLink>
            <AuthLink href={CUSTOMER_ROUTES.RETURNS_REFUNDS} requiresAuth className="text-xs tracking-widest text-white/60">
              Shipping &amp; Returns
            </AuthLink>
            <a href={CUSTOMER_ROUTES.HOME} className="text-xs tracking-widest text-white/60">Store Locator</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Company</h4>
            <a href={CUSTOMER_ROUTES.PRIVACY_POLICY} className="text-xs tracking-widest text-white/60">Privacy Policy</a>
            <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs tracking-widest text-white/60">Careers</a>
            <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-xs tracking-widest text-white/60">Sustainability</a>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Newsletter</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="ENTER YOUR EMAIL"
                className="w-full border-0 border-b border-white/20 bg-transparent py-3 text-[10px] uppercase tracking-widest text-white placeholder:text-white/45 focus:border-[#dfb257] focus:ring-0"
              />
              <a href={CUSTOMER_ROUTES.AUTH} className="absolute right-0 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CartCheckoutDesktopPage() {
  return (
    <Suspense fallback={null}>
      <CartCheckoutDesktopContent />
    </Suspense>
  );
}
