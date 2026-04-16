"use client";

import { useMemo, useState } from "react";

const navLinks = [
  { label: 'New Arrivals', href: '/' },
  { label: 'Designers', href: '/product_details' },
  { label: 'Editorial', href: '/kinetic_luxury_fashion_e_commerce' },
  { label: 'Archive', href: '/product_detail_desktop' },
  { label: 'Sustainability', href: '/kinetic_luxury_fashion_e_commerce' },
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
  const [selectedPayment, setSelectedPayment] = useState<"card" | "apple">("card");
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
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-6 xl:px-12">
          <h1 className="text-3xl font-black tracking-[-0.06em]">KINETIC</h1>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a href="/cart_checkout_desktop" aria-label="Shopping Bag" className="material-symbols-outlined cursor-pointer text-2xl">shopping_bag</a>
            <a href="/profile" aria-label="Favorite" className="material-symbols-outlined cursor-pointer text-2xl">favorite</a>
            <a href="/profile" aria-label="Profile" className="material-symbols-outlined cursor-pointer text-2xl">person</a>
          </div>
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-[1440px] px-6 pb-24 pt-32 md:px-12">
        <header className="mb-16">
          <h2 className="mb-4 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">Checkout</h2>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-widest">Shopping Bag ({totalItems})</span>
            <div className="h-px flex-1 bg-[#e2e2e2]" />
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
              <section className="rounded-xl bg-[#f3f3f4] p-8 md:p-10">
                <h3 className="mb-8 text-sm font-black uppercase tracking-[0.2em]">Summary</h3>
                <p className="mb-6 text-[10px] font-semibold uppercase tracking-[0.15em] text-blue-700">{checkoutMessage}</p>
                <div className="mb-8 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5c5f60]">Subtotal</span>
                    <span>€{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5c5f60]">Shipping</span>
                    <span>€{shipping.toFixed(2)} (Express)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#5c5f60]">Estimated Taxes</span>
                    <span>€{taxes.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mb-8 h-px bg-black/15" />

                <div className="mb-10 flex justify-between text-3xl font-black uppercase tracking-tight md:text-xl">
                  <span>Total</span>
                  <span>€{total.toFixed(2)}</span>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="DISCOUNT CODE"
                    className="w-full border-0 border-b border-[#c6c6cd] bg-transparent px-0 py-4 text-xs uppercase tracking-widest placeholder:text-neutral-400 focus:border-[#497cff] focus:ring-0"
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
                    <button type="button" onClick={() => { setSelectedPayment("card"); setCheckoutMessage("Payment method: Credit Card."); }} className={`flex flex-col gap-4 rounded-lg bg-white p-6 text-left ${selectedPayment === "card" ? "border-2 border-black" : "border border-black/10"}`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">credit_card</span>
                        <span className={`h-4 w-4 rounded-full ${selectedPayment === "card" ? "border-4 border-black" : "border border-[#76777d]"}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Credit Card</span>
                    </button>

                    <button type="button" onClick={() => { setSelectedPayment("apple"); setCheckoutMessage("Payment method: Apple Pay."); }} className={`flex flex-col gap-4 rounded-lg bg-white p-6 text-left transition-opacity hover:opacity-100 ${selectedPayment === "apple" ? "border-2 border-black opacity-100" : "border border-black/10 opacity-50"}`}>
                      <div className="flex items-center justify-between">
                        <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                        <span className={`h-4 w-4 rounded-full ${selectedPayment === "apple" ? "border-4 border-black" : "border border-[#76777d]"}`} />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Apple Pay</span>
                    </button>
                  </div>
                </div>

                <a href="/profile" className="block w-full rounded-full bg-black py-6 text-center text-sm font-bold uppercase tracking-[0.3em] text-white shadow-xl transition-transform hover:scale-[1.02]">
                  Complete Order
                </a>

                <div className="flex items-center justify-center gap-3 opacity-40">
                  <span className="material-symbols-outlined text-sm">lock</span>
                  <span className="text-[10px] font-medium uppercase tracking-[0.1em]">Secure End-to-End Encryption</span>
                </div>
              </section>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-black/8 bg-white">
        <div className="grid grid-cols-1 gap-12 px-6 py-24 md:grid-cols-4 xl:px-12">
          <div className="flex flex-col gap-6">
            <div className="text-2xl font-black tracking-[-0.04em]">KINETIC EDITORIAL</div>
            <p className="text-xs uppercase tracking-widest text-neutral-400">© 2024 KINETIC EDITORIAL. ALL RIGHTS RESERVED.</p>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Support</h4>
            <a href="/auth" className="text-xs tracking-widest text-neutral-400 underline underline-offset-4">Customer Care</a>
            <a href="/auth" className="text-xs tracking-widest text-neutral-400">Shipping &amp; Returns</a>
            <a href="/" className="text-xs tracking-widest text-neutral-400">Store Locator</a>
          </div>

          <div className="flex flex-col gap-4">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Company</h4>
            <a href="/auth" className="text-xs tracking-widest text-neutral-400">Privacy Policy</a>
            <a href="/kinetic_luxury_fashion_e_commerce" className="text-xs tracking-widest text-neutral-400">Careers</a>
            <a href="/kinetic_luxury_fashion_e_commerce" className="text-xs tracking-widest text-neutral-400">Sustainability</a>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="mb-2 text-xs font-black uppercase tracking-widest">Newsletter</h4>
            <div className="relative">
              <input
                type="text"
                placeholder="ENTER YOUR EMAIL"
                className="w-full border-0 border-b border-neutral-200 bg-transparent py-3 text-[10px] uppercase tracking-widest focus:border-black focus:ring-0"
              />
              <a href="/auth" className="absolute right-0 top-1/2 -translate-y-1/2">
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
