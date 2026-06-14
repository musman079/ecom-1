"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AdminShell } from "@/components/admin/AdminShell";
import { Loader2 } from "lucide-react";

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



export default function AdminSettingsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
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
          fetch("/api/auth/me", { cache: "no-store", credentials: "include" }),
          fetch("/api/profile", { cache: "no-store", credentials: "include" }),
          fetch("/api/notifications/preferences", { cache: "no-store", credentials: "include" }),
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
        // loading complete
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
        credentials: "include",
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
        credentials: "include",
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
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
      </div>
    );
  }

  return (
    <AdminShell title="Settings" subtitle="Update your admin profile and preferences">
      <div className="max-w-5xl mx-auto grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="bg-[#111111] border border-white/8 rounded-sm p-6">
          <h3 className="text-xl font-heading text-white">Account Settings</h3>
          <p className="mt-1 text-sm font-sans text-white/50">Edit the current admin account linked to this session.</p>

          {error && <div className="mt-4 rounded-sm bg-red-500/10 border border-red-500/20 p-4 text-sm font-sans text-red-400">{error}</div>}
          {message && <div className="mt-4 rounded-sm bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm font-sans text-emerald-400">{message}</div>}

          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-sans font-medium text-white/70">
              Full Name
              <input
                value={form.fullName}
                onChange={(e) => setForm((current) => ({ ...current, fullName: e.target.value }))}
                className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
              />
            </label>

            <label className="grid gap-2 text-sm font-sans font-medium text-white/70">
              Phone
              <input
                value={form.phone}
                onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))}
                className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
              />
            </label>

            <div className="grid gap-2 text-sm font-sans font-medium text-white/70">
              Email
              <div className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white/50">
                {profile?.email ?? "-"}
              </div>
            </div>

            <div className="grid gap-2 text-sm font-sans font-medium text-white/70">
              Role
              <div className="flex flex-wrap gap-2">
                <span className="bg-[#C8A96E]/15 text-[#C8A96E] border border-[#C8A96E]/20 rounded-full px-3 py-1 text-[10px] font-sans font-black uppercase tracking-[0.14em]">
                  {roleLabel.replaceAll("_", " ")}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void saveAll()}
              disabled={saving}
              className="mt-2 rounded-sm bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] px-5 py-3 text-xs font-sans font-black uppercase tracking-[0.18em] transition-all hover:bg-[#C8A96E]/20 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <article className="bg-[#111111] border border-white/8 rounded-sm p-6">
            <h3 className="text-xl font-heading text-white">Notifications</h3>
            <p className="mt-1 text-sm font-sans text-white/50">Control which events should reach this admin account.</p>

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
                <label key={item.key} className="flex items-start justify-between gap-4 rounded-sm border border-white/5 p-4 bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-sans font-bold text-white">{item.label}</p>
                    <p className="mt-1 text-xs font-sans text-white/40">{item.description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences[item.key]}
                    onChange={(e) => setPreferences((current) => ({ ...current, [item.key]: e.target.checked }))}
                    className="mt-1 h-4 w-4 rounded-sm border-white/10 bg-[#1A1A1A] accent-[#C8A96E]"
                  />
                </label>
              ))}
            </div>
          </article>

          <article className="bg-[#111111] border border-white/8 rounded-sm p-6">
            <h3 className="text-xl font-heading text-white">Session Summary</h3>
            <div className="mt-4 space-y-3 text-sm font-sans text-white/60">
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="font-bold text-emerald-400">Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="font-bold text-white">{preferences.emailEnabled ? "Email On" : "Email Off"}</span>
              </div>
            </div>
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
