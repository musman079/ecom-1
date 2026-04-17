'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CUSTOMER_ROUTES } from "../../src/constants/routes";

type Order = {
  id: string;
  orderNumber: string;
  leadItemTitle: string;
  createdAt: string;
  totalItems: number;
  total: number;
  status: string;
};

type SessionUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  roles: string[];
};

type ProfileFormState = {
  fullName: string;
  phone: string;
};

function formatOrderDate(isoDate: string) {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusClass(status: string) {
  if (status === "confirmed") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "pending") {
    return "bg-orange-50 text-orange-700";
  }

  return "bg-neutral-100 text-neutral-700";
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loggingOut, setLoggingOut] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    fullName: "",
    phone: "",
  });

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          router.replace(CUSTOMER_ROUTES.AUTH);
          return;
        }

        const payload = (await response.json()) as {
          user?: SessionUser | null;
        };

        if (!payload.user) {
          router.replace(CUSTOMER_ROUTES.AUTH);
          return;
        }

        setUser(payload.user);
        setForm({
          fullName: payload.user.fullName,
          phone: payload.user.phone ?? "",
        });

        const ordersResponse = await fetch("/api/orders", { cache: "no-store" });
        if (ordersResponse.ok) {
          const ordersPayload = (await ordersResponse.json()) as {
            orders?: Order[];
          };

          if (Array.isArray(ordersPayload.orders)) {
            setOrders(ordersPayload.orders);
          }
        }
      } catch {
        router.replace(CUSTOMER_ROUTES.AUTH);
      } finally {
        setLoadingUser(false);
        setLoadingOrders(false);
      }
    };

    void loadCurrentUser();
  }, [router]);

  const onLogout = async () => {
    setLoggingOut(true);
    setStatusMessage(null);

    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace(CUSTOMER_ROUTES.AUTH);
    } catch {
      setStatusMessage("Unable to logout right now. Please retry.");
    } finally {
      setLoggingOut(false);
    }
  };

  const onSaveProfile = async () => {
    setStatusMessage(null);

    if (!form.fullName.trim()) {
      setStatusMessage("Full name is required.");
      return;
    }

    setSavingProfile(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        profile?: {
          id: string;
          email: string;
          fullName: string;
          phone?: string;
        };
      };

      if (!response.ok || !payload.profile) {
        setStatusMessage(payload.error ?? "Unable to update profile.");
        return;
      }

      setUser((current) =>
        current
          ? {
              ...current,
              fullName: payload.profile?.fullName ?? current.fullName,
              phone: payload.profile?.phone ?? "",
            }
          : current,
      );
      setEditingProfile(false);
      setStatusMessage("Profile updated successfully.");
    } catch {
      setStatusMessage("Unable to update profile right now.");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-100 text-sm font-medium text-neutral-600">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-neutral-100 text-neutral-900">
      <header className="fixed top-0 z-50 w-full bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Link href={CUSTOMER_ROUTES.HOME} className="transition-opacity hover:opacity-70" aria-label="Menu">
              <span className="material-symbols-outlined">menu</span>
            </Link>
            <h1 className="text-4xl font-black tracking-tighter leading-none uppercase">KINETIC</h1>
          </div>
          <Link href={CUSTOMER_ROUTES.CART_CHECKOUT} className="transition-opacity hover:opacity-70" aria-label="Bag">
            <span className="material-symbols-outlined">shopping_bag</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-32 pt-28">
        {statusMessage ? <p className="mb-6 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700">{statusMessage}</p> : null}

        <section className="mb-16 flex flex-col items-center gap-8 md:flex-row md:items-end">
          <div className="relative">
            <div className="h-32 w-32 overflow-hidden rounded-full bg-neutral-300 ring-4 ring-white shadow-lg">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlyC3e714RjUHh5F9YESAtlWAX2S9TaCuHI7Zb64Au6h3S3EWDhvwUN-AGlcQMr0E_MKTi-iny4OXQMflx3ZrQ_-WbRSweXTF-SgFnHDm08xt44zPNOeZLwosLZYn1iTREillGEFLqyLGDHNxHAvdV_lQHpRgGeA6bm1pdTTujEwcVVFQOksZVMNJxV_yXtfxZ0zhlunqsbi8lxDgBmdynioNmThl4GHD5f2qHllSP0Q5pIy8SpX1dJ-nbbJ9dEdy-w6WA8Q8oyL_R"
                alt="Profile"
                className="h-full w-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingProfile((current) => !current);
                setStatusMessage(null);
              }}
              className="absolute bottom-0 right-0 rounded-full bg-black p-2 text-white shadow-md transition-transform active:scale-90"
              aria-label="Edit Profile"
            >
              <span className="material-symbols-outlined text-sm">edit</span>
            </button>
          </div>

          <div className="flex-1 text-center md:text-left">
            <h2 className="mb-1 text-6xl font-bold leading-none tracking-tight">{user?.fullName ?? "Profile"}</h2>
            <p className="text-3xl text-neutral-700">{user?.email ?? "-"}</p>
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

        {editingProfile ? (
          <section className="mb-10 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-neutral-700">Edit Profile</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="text-xs font-semibold text-neutral-600">
                Full Name
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring"
                  placeholder="Enter full name"
                />
              </label>
              <label className="text-xs font-semibold text-neutral-600">
                Phone
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none ring-blue-500/30 focus:ring"
                  placeholder="Enter phone number"
                />
              </label>
            </div>
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => void onSaveProfile()}
                disabled={savingProfile}
                className="rounded-full bg-black px-5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white disabled:opacity-50"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingProfile(false);
                  setForm({
                    fullName: user?.fullName ?? "",
                    phone: user?.phone ?? "",
                  });
                }}
                className="rounded-full border border-neutral-300 px-5 py-2 text-xs font-bold uppercase tracking-[0.16em]"
              >
                Cancel
              </button>
            </div>
          </section>
        ) : null}

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
          <aside className="space-y-2 lg:col-span-4">
            <h3 className="mb-6 px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-600">Account Overview</h3>
            <nav className="space-y-1">
              <Link href={CUSTOMER_ROUTES.ORDER_TRACKING} className="group flex items-center justify-between rounded-xl bg-white px-4 py-4 shadow-sm transition-all hover:translate-x-1">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">package_2</span>
                  <span className="text-base font-bold tracking-tight">My Orders</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </Link>
              <Link href={CUSTOMER_ROUTES.RETURNS_REFUNDS} className="group flex items-center justify-between rounded-xl px-4 py-4 transition-all hover:bg-neutral-200">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">location_on</span>
                  <span className="text-base font-medium tracking-tight">Returns &amp; Refunds</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </Link>
              <Link href={CUSTOMER_ROUTES.REVIEWS} className="group flex items-center justify-between rounded-xl px-4 py-4 transition-all hover:bg-neutral-200">
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-neutral-600">settings</span>
                  <span className="text-base font-medium tracking-tight">Reviews &amp; Ratings</span>
                </div>
                <span className="material-symbols-outlined text-sm text-neutral-400 group-hover:text-black">chevron_right</span>
              </Link>
              <div className="mt-4 border-t border-neutral-300 pt-4">
                <button
                  type="button"
                  onClick={() => void onLogout()}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-red-600 transition-all hover:bg-red-50 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">logout</span>
                  <span className="text-base font-bold tracking-tight">{loggingOut ? "Logging out..." : "Log Out"}</span>
                </button>
              </div>
            </nav>
          </aside>

          <section className="lg:col-span-8">
            <div className="mb-8 flex items-center justify-between">
              <h3 className="text-4xl font-bold tracking-tight">Recent Orders</h3>
              <Link href={CUSTOMER_ROUTES.ORDER_TRACKING} className="border-b-2 border-blue-300 pb-0.5 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-700">
                View All
              </Link>
            </div>

            <div className="space-y-4">
              {loadingOrders ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">Loading orders...</div>
              ) : null}

              {!loadingOrders && orders.length === 0 ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-6 text-sm text-neutral-500">
                  No orders found yet. Start shopping to see order history.
                </div>
              ) : null}

              {orders.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => router.push(CUSTOMER_ROUTES.ORDER_TRACKING)}
                  className="w-full rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-[0px_20px_40px_rgba(20,27,43,0.02)] transition-transform hover:scale-[1.01]"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex h-20 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-xs font-bold uppercase text-neutral-500">
                        {order.leadItemTitle.slice(0, 2)}
                      </div>
                      <div>
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">Order #{order.orderNumber}</p>
                        <h4 className="mb-1 text-3xl font-bold leading-tight">{order.leadItemTitle}</h4>
                        <p className="text-lg text-neutral-600">
                          {formatOrderDate(order.createdAt)} - {order.totalItems} Item{order.totalItems > 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 md:flex-col md:items-end md:justify-center">
                      <p className="text-4xl font-bold">${order.total.toFixed(2)}</p>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getStatusClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-white/90 px-4 pb-6 pt-3 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl md:hidden">
        <Link href={CUSTOMER_ROUTES.HOME} className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Home</span>
        </Link>
        <Link href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">search</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Search</span>
        </Link>
        <Link href={CUSTOMER_ROUTES.REVIEWS} className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">favorite</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Reviews</span>
        </Link>
        <Link href={CUSTOMER_ROUTES.ORDER_TRACKING} className="flex flex-col items-center text-neutral-400">
          <span className="material-symbols-outlined">package_2</span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Orders</span>
        </Link>
        <Link href={CUSTOMER_ROUTES.PROFILE} className="flex flex-col items-center text-black">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            person
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
