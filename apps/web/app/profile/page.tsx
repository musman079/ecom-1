import Link from "next/link";

import AdminLogoutButton from "../../src/components/admin-logout-button";
import { requireAuth } from "../../src/lib/require-auth";

export default async function ProfilePage() {
  const user = await requireAuth();

  return (
    <main className="min-h-screen bg-neutral-100 px-6 py-12 text-neutral-900">
      <section className="mx-auto w-full max-w-3xl rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Account</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">My Profile</h1>
          </div>
          <AdminLogoutButton className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-semibold transition hover:bg-neutral-100" />
        </div>

        <dl className="grid gap-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5 text-sm md:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Full Name</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{user.fullName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Email</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Phone</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{user.phone || "-"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.14em] text-neutral-500">Role</dt>
            <dd className="mt-1 font-semibold text-neutral-900">{user.role}</dd>
          </div>
        </dl>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
            Back to home
          </Link>
        </div>
      </section>
    </main>
  );
}
