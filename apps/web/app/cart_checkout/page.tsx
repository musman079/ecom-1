"use client";

import { useMemo, useState } from "react";

type CartItem = {
  tag: string;
  name: string;
  details: string;
  price: string;
  image: string;
};

const cartItems: CartItem[] = [
  {
    tag: 'Limited Edition',
    name: 'KINETIC FLUX 01',
    details: 'Size: 42 • Obsidian Black',
    price: '$185.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD0tz5COjD8NSKOARrOnPjVAyc5ucG3fW7pzLeCNlX9HbqLb8zHBUL7BdfAMZqrMNPz_XCcgsAF_EyABl8l8tS4Yk_U9Q8eDKcGybrdru3W_hjU9A7gt9V05yS7YMemZ3WMMVT8Z1PoCSQt-XYMbwmo0kUnNHGGahES5i8RYMoCmXcgpxM2pPNF__Y5iPY3A7gqfsQ0oB4kTaHG95MPHadL2tnXtOAef6oAfDmSEQaj8pGNYq0DP6VkDOfj8UmL_WD9YiC7GlkGTczG',
  },
  {
    tag: 'Essential',
    name: 'CORE SERIES CHRONO',
    details: 'Color: Pure Frost',
    price: '$240.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA1bVm_aH1W9hcY_D-cOeJ8cEt825W7_0mBkP1sHNNcOD7RhDvMNNGRRaCMeYP6ZYJEgMQsk2lRfWtrJ1_5N6NsAL_Sy_1b1fjrXXLqDoSX2jWfka0ZWXXOLuhpVIOTV_HE35fXdhfFk59TK9QrF1KKqcmgDezQHN5TO5ThospJ3rQu6koAVQMpQaMZRVhompT18LiKwI0rr9KchxL2CHIv9uaqB4vNHVg1xP6Jo7puzKGl9kX2SvW5W5uZbFXVvB4gRbvfaFjEdHmL',
  },
];

export default function CartCheckoutPage() {
  const [quantities, setQuantities] = useState<number[]>(() => cartItems.map(() => 1));

  const parsePrice = (value: string) => Number(value.replace(/[^0-9.]/g, "")) || 0;

  const totalItems = useMemo(
    () => quantities.reduce((sum, qty) => sum + qty, 0),
    [quantities],
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item, index) => sum + parsePrice(item.price) * (quantities[index] ?? 0), 0),
    [quantities],
  );

  const shipping = totalItems > 0 ? 12 : 0;
  const taxes = Number((subtotal * 0.08).toFixed(2));
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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <a href="/" className="active:scale-95 transition" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span className="text-xl font-black uppercase tracking-tight">KINETIC</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden gap-8 md:flex">
              <a href="/product_details" className="text-xs font-bold uppercase tracking-tight text-neutral-500">Explore</a>
              <a href="/cart_checkout" className="text-xs font-bold uppercase tracking-tight">Cart</a>
            </nav>
            <a href="/cart_checkout" className="relative active:scale-95 transition" aria-label="Cart">
              <span className="material-symbols-outlined">shopping_bag</span>
              <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#497cff] text-[8px] font-bold text-white">
                {totalItems}
              </span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-32 pt-24 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="mb-12">
            <h1 className="mb-2 text-5xl font-black uppercase tracking-[-0.05em] md:text-6xl">My Cart</h1>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-600">{totalItems} Items Selected</p>
          </div>

          <div className="space-y-12">
            {cartItems.map((item, index) => {
              const quantity = quantities[index];
              if (quantity === 0) {
                return null;
              }

              return (
              <article key={item.name} className="group flex items-start gap-6">
                <div className="h-40 w-32 shrink-0 overflow-hidden rounded-xl bg-[#f3f3f4]">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                </div>

                <div className="flex h-40 flex-grow flex-col py-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.15em] text-[#497cff]">{item.tag}</span>
                      <h3 className="text-4xl font-bold tracking-tight leading-[1.05] sm:text-3xl">{item.name}</h3>
                      <p className="text-sm text-neutral-600">{item.details}</p>
                    </div>
                    <span className="text-3xl font-bold sm:text-lg">{item.price}</span>
                  </div>

                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center gap-6 rounded-full bg-[#f3f3f4] px-4 py-2">
                      <button type="button" onClick={() => decrement(index)} className="material-symbols-outlined text-sm">remove</button>
                      <span className="w-4 text-center text-sm font-bold">{quantity}</span>
                      <button type="button" onClick={() => increment(index)} className="material-symbols-outlined text-sm">add</button>
                    </div>
                    <button type="button" onClick={() => removeItem(index)} className="text-[10px] font-bold uppercase tracking-widest text-neutral-600">Remove</button>
                  </div>
                </div>
              </article>
            );
            })}
          </div>

          <section className="mt-20 rounded-xl bg-[#f3f3f4] p-8">
            <h2 className="mb-8 text-2xl font-black uppercase tracking-tight">Shipping Detail</h2>
            <form className="space-y-8">
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <input className="w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0" placeholder="Full Name" />
                <input className="w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0" placeholder="Phone Number" />
              </div>
              <input className="w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0" placeholder="Street Address" />
              <div className="grid grid-cols-2 gap-8 md:grid-cols-3">
                <input className="w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0" placeholder="City" />
                <input className="w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0" placeholder="Postal Code" />
                <input className="col-span-2 w-full border-0 border-b-2 border-[#c6c6cd] bg-transparent px-0 py-3 font-medium focus:border-[#497cff] focus:ring-0 md:col-span-1" placeholder="Country" />
              </div>
            </form>
          </section>
        </section>

        <aside className="lg:col-span-5">
          <div className="space-y-8 lg:sticky lg:top-28">
            <section className="rounded-xl bg-white p-8 shadow-[0px_20px_40px_rgba(20,27,43,0.06)]">
              <h2 className="mb-6 text-sm font-black uppercase tracking-widest">Payment Method</h2>
              <div className="space-y-4">
                <label className="block cursor-pointer">
                  <input type="radio" name="payment" defaultChecked className="peer hidden" />
                  <div className="flex items-center justify-between rounded-lg border border-[#c6c6cd] bg-[#141b2b] p-4 text-white transition-all">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        credit_card
                      </span>
                      <div>
                        <p className="text-sm font-bold">Credit / Debit Card</p>
                        <p className="text-[10px] uppercase tracking-wider opacity-70">Visa, Mastercard, Amex</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-sm">check_circle</span>
                  </div>
                </label>

                <label className="block cursor-pointer">
                  <input type="radio" name="payment" className="peer hidden" />
                  <div className="flex items-center justify-between rounded-lg border border-[#c6c6cd] p-4 transition-all peer-checked:border-[#141b2b] peer-checked:bg-[#141b2b] peer-checked:text-white">
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
            </section>

            <section className="rounded-xl bg-black p-8 text-white shadow-[0px_20px_40px_rgba(20,27,43,0.06)]">
              <h2 className="mb-8 text-sm font-black uppercase tracking-widest">Order Summary</h2>
              <div className="space-y-4 font-medium">
                <div className="flex items-center justify-between opacity-70">
                  <span className="text-sm uppercase tracking-wide">Subtotal</span>
                  <span className="text-sm">${subtotal.toFixed(2)}</span>
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

              <a href="/profile" className="mt-10 block w-full rounded-full bg-gradient-to-br from-[#497cff] to-[#003ea8] py-5 text-center text-xs font-black uppercase tracking-[0.2em] text-white transition hover:scale-[1.02] active:scale-95">
                Place Order
              </a>
              <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                <span className="material-symbols-outlined text-sm">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">Encrypted Checkout</span>
              </div>
            </section>
          </div>
        </aside>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-white/90 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl md:hidden">
        <a href="/" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">home</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Home</span>
        </a>
        <a href="/product_details" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">search</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Search</span>
        </a>
        <a href="/product_detail_desktop" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">favorite</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Saved</span>
        </a>
        <a href="/cart_checkout" className="flex scale-110 flex-col items-center text-black">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            package_2
          </span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Orders</span>
        </a>
        <a href="/profile" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">person</span>
          <span className="mt-1 text-[10px] font-medium uppercase tracking-widest">Profile</span>
        </a>
      </nav>
    </div>
  );
}
