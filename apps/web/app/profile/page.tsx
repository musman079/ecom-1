'use client';

import { useEffect, useState } from "react";

type Order = {
  id: string;
  name: string;
  date: string;
  items: number;
  price: string;
  status: string;
  statusClass: string;
  image: string;
};

const orders: Order[] = [
  {
    id: 'KN-92834',
    name: 'Premium Core Runner',
    date: 'Oct 24, 2023',
    items: 1,
    price: '$245.00',
    status: 'Delivered',
    statusClass: 'bg-green-50 text-green-700',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAJCTzHtDX1wjj2btinlXaIoI8IgwNo_zDiJiSPdlXnwdw6qU5MJkNaQPaOVSCKeimgmlHlBiAqahGo_r5VOkW3euCJNsg7I-xXCcThAmYG2NGr4Wy056hkmUZBAY8ZdBqCP71ISqQrqCVPAa2aKQG3xvzjAauOdS2KhJa-bqADIoxSDcSfs-FbcGYBaRLNnYgU8eHh7XXBhFo3WCLhJzfTD17GOmiGT1ek0zl4o_hSXyr3k2JWlfQvzwi0c-DkWushEQacSXIcrZY2',
  },
  {
    id: 'KN-92711',
    name: 'Element Shield Parka',
    date: 'Oct 21, 2023',
    items: 2,
    price: '$590.00',
    status: 'Shipped',
    statusClass: 'bg-blue-50 text-blue-700',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCkyMXPKAvPe-EfTNAM_JibdxBA3strZyWKalGZDpU3VEi-x0ppkOr-KZ0QpDp95JZNNbl72JhavxkFETC927Zot7TjYQwb-BntfyMQS_bv4b7HZlF6Akq64GLZH7SEJ_zmUxDePKnYiAFweR5466VB-VvCW56MPiJDzKbmrzWzqP96WWTNnDLE23TgvDJ54yMtN2pYM01INUujeTem4UblicuR9HWPMkDnnzgUqCI8m5TrIDgFMc5FVSTbMtq79Op1mPAYpjWu3scG',
  },
  {
    id: 'KN-92650',
    name: 'Utility Tote Bag',
    date: 'Oct 19, 2023',
    items: 1,
    price: '$85.00',
    status: 'Pending',
    statusClass: 'bg-orange-50 text-orange-700',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAT7C1tYrsPxWG9HpJ-GAMStf-Um287Ru1LGWdEsmATlM27rJ2Me7mr8gyNDhlIozPlxJA_ty-lXGQkQafHpHpBhvcEYg41UEA79EgjUdKBoKXD03o-7ZNNmu9LbxXqQlabaNU3CuP6Ul4HEUu8z7mX71ujhoVw0vWpZJJOx0e3LX8muNvz4OVKpX1UF9J9AJzlM8gWRqDbkZNDeHihniZ76TAOFDrAi74acVgeKPK0sU56GrL5R5sUd9kLKgLysY2ax27kOwqUSTfJ',
  },
];

export default function ProfilePage() {
  const [profileName, setProfileName] = useState("Marcus Sterling");
  const [profileEmail, setProfileEmail] = useState("m.sterling@editorial.co");

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as {
          user?: { fullName?: string; email?: string };
        };

        if (payload.user?.fullName) {
          setProfileName(payload.user.fullName);
        }
        if (payload.user?.email) {
          setProfileEmail(payload.user.email);
        }
      } catch {
        // Keep fallback profile values if session lookup fails.
      }
    };

    void loadCurrentUser();
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth";
  };

  return (
    <div className="min-h-[100dvh] bg-neutral-100 text-neutral-900">
      <header className="fixed top-0 z-50 w-full bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <a href="/" className="transition-opacity hover:opacity-70" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">KINETIC</h1>
          </div>
          <a href="/cart_checkout" className="transition-opacity hover:opacity-70" aria-label="Bag">
            <span className="material-symbols-outlined">shopping_bag</span>
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
        <section className="mb-16 flex flex-col items-center gap-8 md:flex-row md:items-end">
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-full bg-neutral-300 ring-4 ring-white shadow-lg">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlyC3e714RjUHh5F9YESAtlWAX2S9TaCuHI7Zb64Au6h3S3EWDhvwUN-AGlcQMr0E_MKTi-iny4OXQMflx3ZrQ_-WbRSweXTF-SgFnHDm08xt44zPNOeZLwosLZYn1iTREillGEFLqyLGDHNxHAvdV_lQHpRgGeA6bm1pdTTujEwcVVFQOksZVMNJxV_yXtfxZ0zhlunqsbi8lxDgBmdynioNmThl4GHD5f2qHllSP0Q5pIy8SpX1dJ-nbbJ9dEdy-w6WA8Q8oyL_R"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <a
              href="/auth"
              className="absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-md transition-transform active:scale-90"
              aria-label="Edit Profile"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </a>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="mb-1 text-6xl font-bold leading-none tracking-tight">{profileName}</h2>
            <p className="text-3xl text-neutral-700">{profileEmail}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3 md:justify-start">
              <span className="rounded-full border border-neutral-200 bg-white px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em]">
                Member Since 2023
              </span>
              <span className="rounded-full bg-blue-100 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                Gold Status
              </span>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <aside className="space-y-2 lg:col-span-4">
            <h3 className="mb-6 px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">Account Overview</h3>
            <nav className="space-y-1">
              <a href="/cart_checkout_desktop" className="group flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm transition-all hover:translate-x-1">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">package_2</span>
                  <span className="text-base font-bold tracking-tight">My Orders</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </a>
              <a href="/profile" className="group flex items-center justify-between rounded-xl px-4 py-4 transition-all hover:bg-neutral-200">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">location_on</span>
                  <span className="text-base font-medium tracking-tight">Saved Addresses</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </a>
              <a href="/profile" className="group flex items-center justify-between rounded-xl px-4 py-4 transition-all hover:bg-neutral-200">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">settings</span>
                  <span className="text-base font-medium tracking-tight">Settings</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </a>
              <div className="mt-4 border-t border-neutral-300 pt-4">
                <button type="button" onClick={() => void logout()} className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-red-600 transition-all hover:bg-red-50">
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-base font-bold tracking-tight">Log Out</span>
                </button>
              </div>
            </nav>
          </aside>

          <section className="lg:col-span-8">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-4xl font-bold tracking-tight">Recent Orders</h3>
              <a href="/cart_checkout_desktop" className="border-b-2 border-blue-300 pb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                View All
              </a>
            </div>

            <div className="space-y-4">
              {orders.map((order) => (
                <article
                  key={order.id}
                  className="rounded-xl border border-neutral-200 bg-white p-6 shadow-[0px_20px_40px_rgba(20,27,43,0.02)] transition-transform hover:scale-[1.01]"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-6">
                      <div className="h-20 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-200">
                        <img src={order.image} alt={order.name} className="h-full w-full object-cover" />
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Order #{order.id}</p>
                        <h4 className="mb-1 text-3xl font-bold leading-tight">{order.name}</h4>
                        <p className="text-lg text-neutral-600">
                          {order.date} - {order.items} Item{order.items > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                      <p className="text-4xl font-bold">{order.price}</p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${order.statusClass}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-white/90 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl md:hidden">
        <a href="/" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Home</span>
        </a>
        <a href="/product_details" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">search</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Search</span>
        </a>
        <a href="/product_detail_desktop" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Saved</span>
        </a>
        <a href="/cart_checkout" className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">package_2</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Orders</span>
        </a>
        <a href="/profile" className="flex flex-col items-center text-black">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Profile</span>
        </a>
      </nav>
    </div>
  );
}
