"use client";

import { useMemo, useState } from "react";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";

const navLinks = [
  { label: 'New Arrivals', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Designers', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Editorial', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Archive', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Sustainability', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
];

const cartItems = [
  {
    name: 'SCULPTURAL WOOL BLAZER',
    details: 'Midnight Black / Size 48',
    price: '€890.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBy0dYSkeoG47a13AW2eyJsktTZUKc7wdHzcbHbmAf2ABZN13cFww5w73nNRoe6RnJC_msUNH0NE8U-sazSxeBPTPh6pmNiztxQVmFnM3d72AVuMIU_h84aiRGTAhgWng9TScpq0Oj0TzCpy6Hm9e97JFv3a9YhccTbp2IiTJQEZIwVr7Or7kPqf7261MHhdZA197JVqS-XJ5VkmtnYUCuLtL9ni7W1Zf6E3vXH5Stb0havcGgl_x9ZeQTrPLWI5u26YgIeC1AYbHbv',
  },
  {
    name: 'KINETIC ORBIT SNEAKERS',
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

export default function CartCheckoutDesktopPage() {
  const [quantities, setQuantities] = useState<number[]>(() => cartItems.map(() => 1));
  const [selectedPayment, setSelectedPayment] = useState<"card" | "cod">("cod");
  const [checkoutMessage, setCheckoutMessage] = useState("Checkout ready.");

  const parsePrice = (value: string) => Number(value.replace(/[^0-9.]/g, "")) || 0;

  const totalItems = useMemo(
    () => quantities.reduce((sum, qty) => sum + qty, 0),
    [quantities],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item, index) => sum + parsePrice(item.price) * (quantities[index] ?? 0), 0),
    [quantities],
  );

  const shipping = 0;
  const taxes = Number((subtotal * 0.09).toFixed(2));
  const total = subtotal + shipping + taxes;

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
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_10%,#304d8f_0%,#0b1220_45%,#070c16_100%)] text-[#f2f4f8]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0d1627]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6 xl:px-12">
          <h1 className="text-3xl font-black tracking-[-0.02em] text-white">KINETIC</h1>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.15em] text-white/60 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a href={CUSTOMER_ROUTES.CART_CHECKOUT} aria-label="Shopping Bag" className="material-symbols-outlined cursor-pointer text-2xl text-white">shopping_bag</a>
            <a href={CUSTOMER_ROUTES.REVIEWS} aria-label="Favorite" className="material-symbols-outlined cursor-pointer text-2xl text-white/75">favorite</a>
            <a href={CUSTOMER_ROUTES.PROFILE} aria-label="Profile" className="material-symbols-outlined cursor-pointer text-2xl text-white/75">person</a>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1440px] px-6 pb-24 pt-32 md:px-12">
        <header className="mb-16">
          <h2 className="mb-4 text-5xl font-black uppercase tracking-[-0.06em] text-white md:text-7xl">Checkout</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-white/75">Shopping Bag ({totalItems})</span>
            <div className="h-px flex-1 bg-white/20" />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
          <section className="flex flex-col gap-12 lg:col-span-7">
            {cartItems.map((item, index) => {
              const quantity = quantities[index];
              if (quantity === 0) {
                return null;
              }

              return (
              <article key={item.name} className="group flex flex-col gap-6 md:flex-row md:gap-8">
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
            );
            })}
          </section>

          <aside className="lg:col-span-5">
            <div className="flex flex-col gap-10 lg:sticky lg:top-32">
              <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur-xl md:p-10">
                <h3 className="mb-8 text-sm font-black uppercase tracking-[0.2em]">Summary</h3>
                <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#65f3de]">{checkoutMessage}</p>
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
                    className="w-full border-0 border-b border-white/25 bg-transparent px-0 py-4 text-xs uppercase tracking-widest placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
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
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#497cff] focus:ring-0"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="FIRST NAME"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#497cff] focus:ring-0"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="LAST NAME"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#497cff] focus:ring-0"
                      />
                    </div>
                    <div className="col-span-2">
                      <input
                        type="text"
                        placeholder="SHIPPING ADDRESS"
                        className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest focus:border-[#497cff] focus:ring-0"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-6 text-sm font-black uppercase tracking-[0.2em]">Payment Method</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <button type="button" disabled className="flex cursor-not-allowed flex-col gap-4 rounded-lg border border-white/20 bg-[#121b31] p-6 text-left text-white/70 opacity-70">
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">credit_card</span>
                        <span className="rounded-full border border-white/30 px-3 py-1 text-[10px] font-bold uppercase tracking-wider">Coming Soon</span>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Credit Card</span>
                    </button>

                    <button type="button" onClick={() => { setSelectedPayment("cod"); setCheckoutMessage("Payment method: Cash on Delivery."); }} className={`flex flex-col gap-4 rounded-lg p-6 text-left transition ${selectedPayment === "cod" ? "border border-[#65f3de]/50 bg-[#121b31] text-white" : "border border-white/20 bg-[#0f192d] text-white/70 hover:text-white"}`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">payments</span>
                        <span className={`h-4 w-4 rounded-full ${selectedPayment === "cod" ? "border-4 border-[#65f3de]" : "border border-white/40"}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Cash on Delivery</span>
                    </button>
                  </div>
                  <p className="mt-3 text-xs font-semibold text-white/60">Online card payments are coming soon.</p>
                </div>

                <a href={CUSTOMER_ROUTES.ORDER_TRACKING} className="block w-full rounded-full bg-gradient-to-br from-[#65f3de] via-[#4a8dff] to-[#3f7dff] py-6 text-center text-sm font-bold uppercase tracking-[0.3em] text-[#0b1220] shadow-xl transition-transform hover:scale-[1.02]">
                  Complete Order
                </a>

                <div className="flex items-center justify-center gap-3 text-white/60">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em]">Secure End-to-End Encryption</span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-white/10 bg-[#0d1627] text-white/75">
        <div className="grid grid-cols-1 gap-12 px-6 py-24 md:grid-cols-4 xl:px-12">
          <div className="flex flex-col gap-6">
            <div className="text-2xl font-black tracking-[-0.04em] text-white">KINETIC EDITORIAL</div>
            <p className="text-xs uppercase tracking-widest text-white/50">© 2024 KINETIC EDITORIAL. ALL RIGHTS RESERVED.</p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Support</h4>
            <a href={CUSTOMER_ROUTES.AUTH} className="text-xs tracking-widest text-white/60 underline underline-offset-4">Customer Care</a>
            <a href={CUSTOMER_ROUTES.RETURNS_REFUNDS} className="text-xs tracking-widest text-white/60">Shipping &amp; Returns</a>
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
                className="w-full border-0 border-b border-white/20 bg-transparent py-3 text-[10px] uppercase tracking-widest text-white placeholder:text-white/45 focus:border-[#65f3de] focus:ring-0"
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
