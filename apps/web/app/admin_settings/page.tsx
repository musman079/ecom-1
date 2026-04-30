"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import AdminLogoutButton from "../../src/components/admin-logout-button";

type Profile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
};

type Preferences = {
  orderUpdates: boolean;
  returnUpdates: boolean;
  emailEnabled: boolean;
};

const navItems = [
  { icon: "dashboard", label: "Overview" },
  { icon: "inventory_2", label: "Products" },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "assignment_return", label: "Returns" },
  { icon: "group", label: "Customers" },
  { icon: "leaderboard", label: "Analytics" },
  { icon: "settings", label: "Settings", active: true },
];

const getAdminNavHref = (label: string) => {
  if (label === "Overview") return "/admin_overview_dashboard";
  if (label === "Products") return "/admin_products";
  if (label === "Orders") return "/admin_orders";
  if (label === "Returns") return "/admin_returns";
  if (label === "Customers") return "/admin_customers";
  if (label === "Analytics") return "/admin_analytics";
  if (label === "Settings") return "/admin_settings";
  return "/admin_overview_dashboard";
};

export default function AdminSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roleLabel, setRoleLabel] = useState("ADMIN");
  const [preferences, setPreferences] = useState<Preferences>({
    orderUpdates: true,
    returnUpdates: true,
    emailEnabled: true,
  });
  const [form, setForm] = useState({ fullName: "", phone: "" });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [meResponse, profileResponse, preferencesResponse] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/profile", { cache: "no-store" }),
          fetch("/api/notifications/preferences", { cache: "no-store" }),
        ]);

        if (meResponse.status === 401 || profileResponse.status === 401 || preferencesResponse.status === 401) {
          router.replace("/auth");
          return;
        }

        const mePayload = (await meResponse.json()) as {
          user?: {
            role?: string;
            roles?: string[];
          } | null;
        };

        const roles = Array.isArray(mePayload.user?.roles) ? mePayload.user.roles : [];
        const role = mePayload.user?.role;
        const isAdmin = roles.includes("ADMIN") || role === "ADMIN" || role === "SUPER_ADMIN";

        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setRoleLabel(role ?? (roles.includes("SUPER_ADMIN") ? "SUPER_ADMIN" : "ADMIN"));

        const profilePayload = (await profileResponse.json()) as { profile?: Profile; error?: string };
        const preferencesPayload = (await preferencesResponse.json()) as { preferences?: Preferences; error?: string };

        if (!profileResponse.ok || !profilePayload.profile) {
          throw new Error(profilePayload.error ?? "Unable to load profile.");
        }

        if (!preferencesResponse.ok || !preferencesPayload.preferences) {
          throw new Error(preferencesPayload.error ?? "Unable to load preferences.");
        }

        setProfile(profilePayload.profile);
        setForm({
          fullName: profilePayload.profile.fullName,
          phone: profilePayload.profile.phone,
        });
        setPreferences(preferencesPayload.preferences);
        setAllowed(true);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [router]);

  async function saveAll() {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const profileResponse = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fullName: form.fullName, phone: form.phone }),
      });

      if (!profileResponse.ok) {
        const payload = (await profileResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to update profile.");
      }

      const preferencesResponse = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferences),
      });

      if (!preferencesResponse.ok) {
        const payload = (await preferencesResponse.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to update preferences.");
      }

      const profilePayload = (await profileResponse.json()) as { profile?: Profile };
      const preferencesPayload = (await preferencesResponse.json()) as { preferences?: Preferences };

      if (profilePayload.profile) {
        setProfile(profilePayload.profile);
        setForm({
          fullName: profilePayload.profile.fullName,
          phone: profilePayload.profile.phone,
        });
      }

      if (preferencesPayload.preferences) {
        setPreferences(preferencesPayload.preferences);
      }

      setMessage("Settings saved successfully.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] text-sm font-medium text-zinc-500">
        {loading ? "Loading settings..." : "Verifying admin access..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <aside className="fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-zinc-200 bg-zinc-100/90 p-4 lg:flex">
        <div className="mb-8 px-3 py-2">
          <h1 className="text-2xl font-black uppercase tracking-[-0.05em]">Editorial</h1>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Super Admin</p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={getAdminNavHref(item.label)}
              className={`mx-2 flex items-center gap-3 rounded-full px-4 py-3 text-sm font-medium transition ${
                item.active ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-200/70"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto border-t border-zinc-200 pt-4">
          <AdminLogoutButton
            className="mx-2 flex w-full items-center gap-3 rounded-full px-4 py-3 text-sm font-medium text-zinc-500 transition hover:bg-zinc-200/70"
            iconClassName="material-symbols-outlined text-[20px]"
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#ffffff]/85 backdrop-blur-xl lg:ml-64">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[-0.04em]">Settings</h2>
            <p className="text-xs font-medium text-zinc-500">Update your admin profile and preferences</p>
          </div>

          <AdminLogoutButton
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-[#ffffff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"
            iconClassName="material-symbols-outlined text-sm"
          />
        </div>
      </header>

      <main className="px-4 pb-24 pt-6 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Account Settings</h3>
            <p className="mt-1 text-sm text-zinc-500">Edit the current admin account linked to this session.</p>

            {error && <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {message && <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div>}

            <div className="mt-6 grid gap-4">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Full Name
                <input
                  value={form.fullName}
                  onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-zinc-300 transition focus:ring-1"
                />
              </label>

              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Phone
                <input
                  value={form.phone}
                  onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none ring-zinc-300 transition focus:ring-1"
                />
              </label>

              <div className="grid gap-2 text-sm font-medium text-zinc-700">
                Email
                <div className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                  {profile?.email ?? "-"}
                </div>
              </div>

              <div className="grid gap-2 text-sm font-medium text-zinc-700">
                Role
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-zinc-900 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                    {roleLabel.replaceAll("_", " ")}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void saveAll()}
                disabled={saving}
                className="mt-2 rounded-full bg-black px-5 py-3 text-xs font-black uppercase tracking-[0.18em] text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Notifications</h3>
              <p className="mt-1 text-sm text-zinc-500">Control which events should reach this admin account.</p>

              <div className="mt-6 space-y-4">
                {[
                  {
                    label: "Order Updates",
                    key: "orderUpdates" as const,
                    description: "Order status changes and fulfilment updates.",
                  },
                  {
                    label: "Return Updates",
                    key: "returnUpdates" as const,
                    description: "New return requests and status changes.",
                  },
                  {
                    label: "Email Enabled",
                    key: "emailEnabled" as const,
                    description: "Send the selected events by email too.",
                  },
                ].map((item) => (
                  <label key={item.key} className="flex items-start justify-between gap-4 rounded-2xl border border-zinc-100 p-4">
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="mt-1 text-xs text-zinc-500">{item.description}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={preferences[item.key]}
                      onChange={(e) => setPreferences((current) => ({ ...current, [item.key]: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-zinc-300"
                    />
                  </label>
                ))}
              </div>
            </article>

            <article className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-xl font-bold">Session Summary</h3>
              <div className="mt-4 space-y-3 text-sm text-zinc-600">
                <div className="flex items-center justify-between">
                  <span>Status</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Notifications</span>
                  <span className="font-bold">{preferences.emailEnabled ? "Email On" : "Email Off"}</span>
                </div>
              </div>
            </article>
          </section>
        </div>
      </main>
    </div>
  );
}
