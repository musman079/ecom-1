"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import AdminLogoutButton from "../../src/components/admin-logout-button";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";

type ApiProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
};

type ProfileOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  trackingNumber: string | null;
  total: number;
  totalItems: number;
  leadItemTitle: string;
  createdAt: string;
};

type UserNotification = {
  id: string;
  audience: "customer" | "admin";
  kind: string;
  title: string;
  message: string;
  metadata?: Record<string, string>;
  isRead: boolean;
  createdAt: string;
};

type NotificationPreferences = {
  orderUpdates: boolean;
  returnUpdates: boolean;
  emailEnabled: boolean;
};

function formatProfileDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}

function getStatusBadge(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "delivered") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (normalized === "cancelled") {
    return "bg-red-50 text-red-700";
  }

  if (normalized === "shipped") {
    return "bg-blue-50 text-blue-700";
  }

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-zinc-100 text-zinc-700";
}

function canCreateReturn(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "shipped" || normalized === "delivered";
}

function getNotificationHref(item: UserNotification) {
  if (item.kind === "order_created" || item.kind === "order_status_updated") {
    const orderNumber = item.metadata?.orderNumber;
    return orderNumber
      ? `${CUSTOMER_ROUTES.ORDER_TRACKING}?orderNumber=${encodeURIComponent(orderNumber)}`
      : CUSTOMER_ROUTES.ORDER_TRACKING;
  }

  if (item.kind === "return_requested" || item.kind === "return_status_updated") {
    const returnNumber = item.metadata?.returnNumber;
    const orderNumber = item.metadata?.orderNumber;
    const params = new URLSearchParams();

    if (returnNumber) {
      params.set("returnNumber", returnNumber);
    }

    if (orderNumber) {
      params.set("orderNumber", orderNumber);
    }

    const serialized = params.toString();
    return serialized ? `${CUSTOMER_ROUTES.RETURNS_REFUNDS}?${serialized}` : CUSTOMER_ROUTES.RETURNS_REFUNDS;
  }

  return CUSTOMER_ROUTES.PROFILE;
}

export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [recentOrders, setRecentOrders] = useState<ProfileOrderSummary[]>([]);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    orderUpdates: true,
    returnUpdates: true,
    emailEnabled: true,
  });
  const [form, setForm] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    const loadAccount = async () => {
      setLoading(true);
      setError(null);

      try {
        const [profileResponse, orderResponse, notificationsResponse, preferencesResponse] = await Promise.all([
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/orders/history?limit=6", { cache: "no-store" }),
          fetch("/api/notifications?limit=8&audience=customer", { cache: "no-store" }),
          fetch("/api/notifications/preferences", { cache: "no-store" }),
        ]);

        if (
          profileResponse.status === 401 ||
          orderResponse.status === 401 ||
          notificationsResponse.status === 401 ||
          preferencesResponse.status === 401
        ) {
          router.replace(CUSTOMER_ROUTES.AUTH);
          return;
        }

        const profilePayload = (await profileResponse.json()) as {
          error?: string;
          profile?: ApiProfile;
        };

        const orderPayload = (await orderResponse.json()) as {
          error?: string;
          orders?: ProfileOrderSummary[];
        };

        const notificationsPayload = (await notificationsResponse.json()) as {
          error?: string;
          unreadCount?: number;
          notifications?: UserNotification[];
        };

        const preferencesPayload = (await preferencesResponse.json()) as {
          error?: string;
          preferences?: NotificationPreferences;
        };

        if (!profileResponse.ok || !profilePayload.profile) {
          setError(profilePayload.error ?? "Unable to load profile.");
          return;
        }

        if (!orderResponse.ok) {
          setError(orderPayload.error ?? "Unable to load orders.");
          return;
        }

        if (!notificationsResponse.ok) {
          setError(notificationsPayload.error ?? "Unable to load notifications.");
          return;
        }

        if (!preferencesResponse.ok || !preferencesPayload.preferences) {
          setError(preferencesPayload.error ?? "Unable to load notification preferences.");
          return;
        }

        setProfile(profilePayload.profile);
        setForm({
          fullName: profilePayload.profile.fullName,
          phone: profilePayload.profile.phone,
        });
        setRecentOrders(Array.isArray(orderPayload.orders) ? orderPayload.orders : []);
        setNotifications(Array.isArray(notificationsPayload.notifications) ? notificationsPayload.notifications : []);
        setUnreadCount(Number(notificationsPayload.unreadCount ?? 0));
        setPreferences(preferencesPayload.preferences);
      } catch {
        setError("Unable to load account details right now.");
      } finally {
        setLoading(false);
      }
    };

    void loadAccount();
  }, [router]);

  const summary = useMemo(() => {
    return {
      totalOrders: recentOrders.length,
      totalSpend: recentOrders.reduce((sum, order) => sum + order.total, 0),
      inTransit: recentOrders.filter((order) => ["processing", "shipped"].includes(order.status.toLowerCase())).length,
    };
  }, [recentOrders]);

  const saveProfile = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);

    if (!form.fullName.trim()) {
      setError("Full name is required.");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
        }),
      });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        profile?: ApiProfile;
      };

      if (!response.ok || !payload.profile) {
        setError(payload.error ?? "Unable to update profile.");
        return;
      }

      setProfile(payload.profile);
      setForm({
        fullName: payload.profile.fullName,
        phone: payload.profile.phone,
      });
      setMessage("Profile updated successfully.");
    } catch {
      setError("Unable to save profile right now.");
    } finally {
      setSaving(false);
    }
  };

  const markAllNotificationsRead = async () => {
    setMarkingAllRead(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      if (!response.ok) {
        setError("Unable to update notifications.");
        return;
      }

      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      setError("Unable to update notifications right now.");
    } finally {
      setMarkingAllRead(false);
    }
  };

  const saveNotificationPreferences = async () => {
    setSavingPreferences(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (response.status === 401) {
        router.replace(CUSTOMER_ROUTES.AUTH);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        preferences?: NotificationPreferences;
      };

      if (!response.ok || !payload.preferences) {
        setError(payload.error ?? "Unable to save notification preferences.");
        return;
      }

      setPreferences(payload.preferences);
      setMessage("Notification preferences saved.");
    } catch {
      setError("Unable to save preferences right now.");
    } finally {
      setSavingPreferences(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070d17] px-6 py-10 text-[#eaf2ff] sm:py-12">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Customer Account</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">My Profile</h1>
              <p className="mt-2 text-sm text-white/65">Manage your personal details and review recent order activity.</p>
            </div>
            <AdminLogoutButton
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.03] px-4 py-2 text-sm font-semibold transition hover:bg-white/[0.08]"
              label="Logout"
            />
          </div>

          {loading ? <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">Loading account...</p> : null}
          {error ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</p> : null}
          {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">{message}</p> : null}

          {!loading && profile ? (
            <div className="grid gap-6 lg:grid-cols-12">
              <section className="space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 lg:col-span-7">
                <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Personal Info</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                    Full Name
                    <input
                      value={form.fullName}
                      onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-lg border border-white/20 bg-[#0d1627] px-3 text-sm font-semibold text-white outline-none focus:border-[#65f3de]"
                    />
                  </label>
                  <label className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">
                    Phone
                    <input
                      value={form.phone}
                      onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                      className="mt-2 h-11 w-full rounded-lg border border-white/20 bg-[#0d1627] px-3 text-sm font-semibold text-white outline-none focus:border-[#65f3de]"
                      placeholder="+92 300 0000000"
                    />
                  </label>
                </div>

                <div className="rounded-lg border border-white/10 bg-[#0d1627] p-4 text-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-white/60">Email</p>
                  <p className="mt-1 font-semibold text-white">{profile.email}</p>
                </div>

                <button
                  type="button"
                  onClick={() => void saveProfile()}
                  disabled={saving}
                  className="rounded-full bg-gradient-to-br from-[#65f3de] via-[#4f8cff] to-[#3f7dff] px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-[#081224] transition hover:brightness-110 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </section>

              <section className="grid gap-4 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-1">
                <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Recent Orders</p>
                  <p className="mt-2 text-3xl font-black text-white">{summary.totalOrders}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">In Transit</p>
                  <p className="mt-2 text-3xl font-black text-white">{summary.inTransit}</p>
                </article>
                <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60">Recent Spend</p>
                  <p className="mt-2 text-3xl font-black text-white">${summary.totalSpend.toFixed(2)}</p>
                </article>
              </section>
            </div>
          ) : null}
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight">Notification Preferences</h2>
            <button
              type="button"
              onClick={() => void saveNotificationPreferences()}
              disabled={savingPreferences}
              className="rounded-full border border-white/20 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/[0.08] disabled:opacity-50"
            >
              {savingPreferences ? "Saving..." : "Save Preferences"}
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/85">
              <input
                type="checkbox"
                checked={preferences.orderUpdates}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    orderUpdates: event.target.checked,
                  }))
                }
              />
              Order Updates
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/85">
              <input
                type="checkbox"
                checked={preferences.returnUpdates}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    returnUpdates: event.target.checked,
                  }))
                }
              />
              Return Updates
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-semibold text-white/85">
              <input
                type="checkbox"
                checked={preferences.emailEnabled}
                onChange={(event) =>
                  setPreferences((current) => ({
                    ...current,
                    emailEnabled: event.target.checked,
                  }))
                }
              />
              Email Alerts
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black tracking-tight">Notifications</h2>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">Unread: {unreadCount}</p>
            </div>
            <button
              type="button"
              onClick={() => void markAllNotificationsRead()}
              disabled={markingAllRead || unreadCount === 0}
              className="rounded-full border border-white/20 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/[0.08] disabled:opacity-50"
            >
              {markingAllRead ? "Updating..." : "Mark All Read"}
            </button>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">No notifications yet.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((item) => (
                <article key={item.id} className={`rounded-xl border p-4 ${item.isRead ? "border-white/10 bg-white/[0.03]" : "border-[#4f8cff]/40 bg-[#4f8cff]/10"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/60">{formatProfileDate(item.createdAt)}</span>
                  </div>
                  <p className="mt-1 text-sm text-white/75">{item.message}</p>
                  <Link href={getNotificationHref(item)} className="mt-2 inline-block text-xs font-bold uppercase tracking-[0.14em] text-[#65f3de] hover:underline">
                    View Details
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-sm backdrop-blur-xl sm:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-black tracking-tight">Recent Orders</h2>
            <div className="flex gap-2">
              <Link href={CUSTOMER_ROUTES.ORDER_TRACKING} className="rounded-full border border-white/20 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/[0.08]">
                Track Orders
              </Link>
              <Link href={CUSTOMER_ROUTES.RETURNS_REFUNDS} className="rounded-full border border-white/20 bg-white/[0.03] px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/[0.08]">
                Returns
              </Link>
            </div>
          </div>

          {recentOrders.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/60">No orders yet. Your latest purchases will appear here.</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/60">Order #{order.orderNumber}</p>
                    <h3 className="mt-1 text-sm font-bold text-white">{order.leadItemTitle}</h3>
                    <p className="mt-1 text-xs text-white/60">{formatProfileDate(order.createdAt)} • {order.totalItems} Item{order.totalItems > 1 ? "s" : ""}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-white">${order.total.toFixed(2)}</p>
                    <span className={`mt-1 inline-block rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                    {canCreateReturn(order.status) ? (
                      <Link
                        href={`${CUSTOMER_ROUTES.RETURNS_REFUNDS}?orderNumber=${encodeURIComponent(order.orderNumber)}`}
                        className="mt-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-[#65f3de] hover:underline"
                      >
                        Start Return
                      </Link>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between">
            <Link href={CUSTOMER_ROUTES.HOME} className="text-sm font-semibold text-[#65f3de] hover:underline">
              Back to home
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
