"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLogoutButton from "../../src/components/admin-logout-button";

type Customer = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  roles: string[];
  totalOrders: number;
  totalSpent: number;
  totalSpentFormatted: string;
  lastOrderDate: string | null;
  lastOrderStatus: string | null;
  reviewsCount: number;
  isActive: boolean;
  createdAt: string;
};

const navItems = [
  { icon: "dashboard", label: "Overview" },
  { icon: "inventory_2", label: "Products" },
  { icon: "shopping_cart", label: "Orders" },
  { icon: "assignment_return", label: "Returns" },
  { icon: "group", label: "Customers", active: true },
  { icon: "leaderboard", label: "Analytics" },
  { icon: "settings", label: "Settings" },
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

export default function AdminCustomersPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionCustomerId, setActionCustomerId] = useState<string | null>(null);

  useEffect(() => {
    const verifyAdmin = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        if (!response.ok) {
          router.replace("/auth");
          return;
        }

        const payload = (await response.json()) as {
          user?: {
            role?: "CUSTOMER" | "ADMIN" | "SUPER_ADMIN";
            roles?: string[];
          } | null;
        };

        const roles = Array.isArray(payload.user?.roles) ? payload.user.roles : [];
        const role = payload.user?.role;
        const isAdmin = roles.includes("ADMIN") || role === "ADMIN" || role === "SUPER_ADMIN";
        if (!isAdmin) {
          router.replace("/");
          return;
        }

        setAllowed(true);
      } catch {
        router.replace("/auth");
      }
    };

    void verifyAdmin();
  }, [router]);

  useEffect(() => {
    if (!allowed) {
      return;
    }

    const loadCustomers = async () => {
      setError(null);
      try {
        const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}&limit=100` : "?limit=100";
        const response = await fetch(`/api/admin/customers${query}`, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load customers.");
        }

        const payload = (await response.json()) as { customers?: Customer[] };
        const rows = Array.isArray(payload.customers) ? payload.customers : [];
        setCustomers(rows);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load customers.");
      } finally {
        setLoading(false);
      }
    };

    void loadCustomers();
  }, [allowed, searchTerm]);

  async function refreshCustomers() {
    const query = searchTerm ? `?search=${encodeURIComponent(searchTerm)}&limit=100` : "?limit=100";
    const response = await fetch(`/api/admin/customers${query}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Unable to load customers.");
    }

    const payload = (await response.json()) as { customers?: Customer[] };
    setCustomers(Array.isArray(payload.customers) ? payload.customers : []);
  }

  async function updateCustomerStatus(customer: Customer, isActive: boolean) {
    const confirmed = window.confirm(isActive ? `Reopen ${customer.fullName}'s account?` : `Block ${customer.fullName}'s account?`);

    if (!confirmed) {
      return;
    }

    setActionCustomerId(customer.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to update customer status.");
      }

      await refreshCustomers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to update customer status.");
    } finally {
      setActionCustomerId(null);
    }
  }

  async function deleteCustomer(customer: Customer) {
    const confirmed = window.confirm(`Delete ${customer.fullName}'s account? This cannot be undone.`);

    if (!confirmed) {
      return;
    }

    setActionCustomerId(customer.id);
    setError(null);

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Unable to delete customer.");
      }

      await refreshCustomers();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to delete customer.");
    } finally {
      setActionCustomerId(null);
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "-";
    const value = new Date(iso);
    if (Number.isNaN(value.getTime())) {
      return "-";
    }
    return value.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  }

  function getStatusColor(status: string | null) {
    if (!status) return "bg-zinc-100 text-zinc-600";
    const statusMap: Record<string, string> = {
      DELIVERED: "bg-emerald-50 text-emerald-700",
      SHIPPED: "bg-blue-50 text-blue-700",
      PROCESSING: "bg-amber-50 text-amber-700",
      CONFIRMED: "bg-sky-50 text-sky-700",
      PENDING: "bg-zinc-100 text-zinc-600",
      CANCELLED: "bg-red-50 text-red-700",
    };
    return statusMap[status] || "bg-zinc-100 text-zinc-600";
  }

  function getRoleColor(role: string) {
    const roleMap: Record<string, string> = {
      SUPER_ADMIN: "bg-fuchsia-50 text-fuchsia-700",
      ADMIN: "bg-indigo-50 text-indigo-700",
      CUSTOMER: "bg-zinc-100 text-zinc-700",
    };

    return roleMap[role] || "bg-zinc-100 text-zinc-700";
  }

  if (!allowed) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <aside className="fixed top-0 left-0 flex-col hidden w-64 h-screen p-4 border-r border-zinc-200 bg-zinc-100/90 lg:flex">
        <div className="px-3 py-2 mb-8">
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

        <div className="pt-4 mt-auto border-t border-zinc-200">
          <AdminLogoutButton
            className="flex items-center w-full gap-3 px-4 py-3 mx-2 text-sm font-medium transition rounded-full text-zinc-500 hover:bg-zinc-200/70"
            iconClassName="material-symbols-outlined text-[20px]"
          />
        </div>
      </aside>

      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-[#ffffff]/85 backdrop-blur-xl lg:ml-64">
        <div className="flex items-center justify-between h-16 gap-4 px-4 sm:px-6 lg:px-8">
          <div className="relative w-full max-w-md">
            <span className="absolute text-sm -translate-y-1/2 pointer-events-none material-symbols-outlined left-3 top-1/2 text-zinc-400">
              search
            </span>
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 text-xs font-medium transition border border-transparent rounded-full outline-none bg-zinc-100 ring-zinc-300 focus:ring-1"
            />
          </div>

          <div className="items-center hidden gap-5 sm:flex">
            <a href="/admin_overview_dashboard" className="relative transition text-zinc-500 hover:text-zinc-900" aria-label="Notifications">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-blue-600 rounded-full" />
            </a>
            <a href="/admin_overview_dashboard" className="transition text-zinc-500 hover:text-zinc-900" aria-label="Help">
              <span className="material-symbols-outlined">help</span>
            </a>
            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="text-xs font-bold">Alex Rivera</p>
                <p className="text-[10px] font-medium text-zinc-500">Head of Editorial</p>
              </div>
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuArxsCLUaQKsAUMj7ZXMhjbPMCLqMxk4k7ImkVQHyM5fkhkdAjsjplWEEiyqd6ENX934Id6cfdE8i7EBeAj6FOGT6zKSly3fcQoej1FMBjzdgvescj8v8pgwxf4uj3LHwv3Xz2A-5NhhYLyXv9xvrQmZ4BttjNhEui_Sr2K1ASiefLUpeVXYwoVfX0Zges1TPcPc_3Z6CXYr46ojrUkQuucc2t0akrdTN8ncWMkzNTqSKHEp_M-DaI-nx4ePnFsDcxBzPXnVCVRG4qa"
                alt="Admin"
                className="object-cover rounded-full h-9 w-9"
              />
            </div>
          </div>

          <AdminLogoutButton
            className="flex items-center gap-2 rounded-full border border-zinc-200 bg-[#ffffff] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600"
            iconClassName="material-symbols-outlined text-sm"
          />
        </div>
      </header>

      <main className="px-4 pt-6 pb-24 sm:px-6 lg:ml-64 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-[-0.04em]">Customers</h2>
              <p className="mt-1 text-sm text-zinc-600">
                Manage and view all <span className="font-bold text-zinc-900">{customers.length}</span> customers
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 mb-4 text-sm text-red-700 rounded-lg bg-red-50">
              {error}
            </div>
          )}

          <section className="overflow-hidden rounded-2xl bg-[#ffffff] shadow-sm">
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 sm:p-6">
              <h4 className="text-xl font-bold">All Customers</h4>
              <span className="text-sm font-medium text-zinc-500">{customers.length} total</span>
            </div>

            {loading ? (
              <div className="px-6 py-8 text-center">
                <span className="text-sm text-zinc-500">Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <span className="text-sm text-zinc-500">No customers found.</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead>
                    <tr className="bg-zinc-50">
                      {[
                        "Customer",
                        "Email",
                        "Roles",
                        "Phone",
                        "Total Orders",
                        "Total Spent",
                        "Last Order",
                        "Reviews",
                        "Status",
                        "Joined",
                        "Actions",
                      ].map((title) => (
                        <th key={title} className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                          {title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {customers.map((customer) => (
                      <tr key={customer.id} className="transition hover:bg-zinc-50/60">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-600">
                              {customer.fullName
                                .split(" ")
                                .map((word) => word.charAt(0).toUpperCase())
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <span className="text-xs font-bold">{customer.fullName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600">{customer.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {(Array.isArray(customer.roles) && customer.roles.length > 0 ? customer.roles : ["CUSTOMER"]).map((role) => (
                              <span
                                key={`${customer.id}-${role}`}
                                className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${getRoleColor(role)}`}
                              >
                                {role.replaceAll("_", " ")}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600">{customer.phone || "-"}</td>
                        <td className="px-6 py-4 text-xs font-bold">{customer.totalOrders}</td>
                        <td className="px-6 py-4 text-xs font-bold">{customer.totalSpentFormatted}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-medium text-zinc-500">{formatDate(customer.lastOrderDate)}</span>
                            {customer.lastOrderStatus && (
                              <span
                                className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${getStatusColor(
                                  customer.lastOrderStatus,
                                )}`}
                              >
                                {customer.lastOrderStatus}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-zinc-600">{customer.reviewsCount}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-wide ${
                              customer.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                            }`}
                          >
                            {customer.isActive ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-zinc-500">{formatDate(customer.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => void updateCustomerStatus(customer, !customer.isActive)}
                              disabled={actionCustomerId === customer.id}
                              className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] transition disabled:opacity-40 ${
                                customer.isActive
                                  ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              }`}
                            >
                              {customer.isActive ? "Block" : "Reopen"}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteCustomer(customer)}
                              disabled={actionCustomerId === customer.id}
                              className="rounded-full bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-red-700 transition hover:bg-red-100 disabled:opacity-40"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>

      <nav className="fixed inset-x-3 bottom-3 z-50 rounded-2xl border border-zinc-200 bg-[#ffffff] p-2 shadow-xl lg:hidden">
        <ul className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <li key={`mobile-${item.label}`}>
              <a
                href={getAdminNavHref(item.label)}
                className={`flex flex-col items-center justify-center rounded-xl px-1 py-2 text-[10px] font-semibold ${
                  item.active ? "bg-zinc-900 text-white" : "text-zinc-500"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span className="mt-1 truncate">{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
