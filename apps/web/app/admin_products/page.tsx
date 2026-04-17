"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLogoutButton from "../../src/components/admin-logout-button";

type ProductStatus = "draft" | "published";

type AdminProduct = {
  id: string;
  title: string;
  description: string;
  price: number;
  taxCategory: string;
  collection: string;
  sku: string;
  stockQuantity: number;
  lowStockAlert: boolean;
  status: ProductStatus;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  products: AdminProduct[];
};

const initialFormState = {
  title: "",
  description: "",
  price: "",
  taxCategory: "Standard Goods (20%)",
  collection: "FW24 Editorial",
  sku: "",
  stockQuantity: "0",
  lowStockAlert: true,
  status: "published" as ProductStatus,
};

export default function AdminProductsPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialFormState);

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
            roles?: string[];
          } | null;
        };

        if (!payload.user) {
          router.replace("/auth");
          return;
        }

        const roles = Array.isArray(payload.user.roles) ? payload.user.roles : [];
        if (!roles.includes("ADMIN")) {
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

    const loadProducts = async () => {
      try {
        const response = await fetch("/api/admin/products", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        const data = (await response.json()) as ApiResponse;
        setProducts(data.products);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    void loadProducts();
  }, [allowed]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f4f5] text-sm font-medium text-zinc-500">
        Verifying admin access...
      </div>
    );
  }

  const submitProduct = async (status: ProductStatus) => {
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const isEditing = Boolean(editingId);
      const endpoint = isEditing ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          lowStockAlert: form.lowStockAlert,
          status,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to save product.");
      }

      const payload = (await response.json()) as { product: AdminProduct };

      if (isEditing) {
        setProducts((current) => current.map((product) => (product.id === payload.product.id ? payload.product : product)));
        setMessage(status === "published" ? "Product updated and published." : "Draft updated.");
      } else {
        setProducts((current) => [payload.product, ...current]);
        setMessage(status === "published" ? "Product published." : "Draft saved.");
      }

      setEditingId(null);
      setForm(initialFormState);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setError(null);
    setMessage(null);
    setForm({
      title: product.title,
      description: product.description,
      price: String(product.price),
      taxCategory: product.taxCategory,
      collection: product.collection,
      sku: product.sku,
      stockQuantity: String(product.stockQuantity),
      lowStockAlert: product.lowStockAlert,
      status: product.status,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState);
    setError(null);
    setMessage(null);
  };

  const removeProduct = async (id: string) => {
    setDeletingId(id);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to delete product.");
      }

      setProducts((current) => current.filter((product) => product.id !== id));

      if (editingId === id) {
        cancelEdit();
      }

      setMessage("Product deleted.");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete product.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f5] text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Admin</p>
            <h1 className="text-3xl font-black uppercase tracking-[-0.05em]">Products</h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin_overview_dashboard" className="rounded-full border border-zinc-200 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50">
              Overview
            </a>
            <a href="/admin_post_edit_product" className="rounded-full bg-black px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-white">
              Editor
            </a>
            <AdminLogoutButton
              className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-zinc-600"
              iconClassName="material-symbols-outlined text-sm"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:px-8">
        <section className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Create</p>
                <h2 className="text-2xl font-black uppercase tracking-[-0.04em]">{editingId ? "Edit Product" : "New Product"}</h2>
              </div>
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                {saving ? "Saving" : "Ready"}
              </span>
            </div>

            <div className="space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Product title"
                className="w-full border-0 border-b border-zinc-300 bg-transparent px-0 py-3 text-lg font-bold outline-none placeholder:text-zinc-300 focus:border-blue-600"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm outline-none placeholder:text-zinc-400 focus:border-blue-500"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <input
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  placeholder="SKU"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  value={form.stockQuantity}
                  onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                  placeholder="Stock"
                  type="number"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                />
                <label className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm">
                  <span className="font-medium text-zinc-600">Low stock alert</span>
                  <input
                    type="checkbox"
                    checked={form.lowStockAlert}
                    onChange={(event) => setForm((current) => ({ ...current, lowStockAlert: event.target.checked }))}
                    className="h-4 w-4 accent-black"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select
                  value={form.taxCategory}
                  onChange={(event) => setForm((current) => ({ ...current, taxCategory: event.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option>Standard Goods (20%)</option>
                  <option>Luxury Surcharge (25%)</option>
                  <option>Exempt</option>
                </select>
                <select
                  value={form.collection}
                  onChange={(event) => setForm((current) => ({ ...current, collection: event.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500"
                >
                  <option>FW24 Editorial</option>
                  <option>Permanent Collection</option>
                  <option>Limited Capsules</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void submitProduct("draft")}
                  disabled={saving}
                  className="rounded-full border border-zinc-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => void submitProduct("published")}
                  disabled={saving}
                  className="rounded-full bg-black px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {editingId ? "Update Product" : "Publish Product"}
                </button>
              </div>

              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full rounded-full border border-zinc-200 px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] transition hover:bg-zinc-50"
                >
                  Cancel Edit
                </button>
              ) : null}

              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">Inventory</p>
              <h2 className="text-2xl font-black uppercase tracking-[-0.04em]">Saved Products</h2>
            </div>
            <a href="/api/admin/products" className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700 underline underline-offset-4">
              API
            </a>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="rounded-3xl bg-white p-8 text-sm text-zinc-500 shadow-sm">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="rounded-3xl bg-white p-8 text-sm text-zinc-500 shadow-sm">No products saved yet. Publish one to begin.</div>
            ) : (
              products.map((product) => (
                <article key={product.id} className="rounded-3xl bg-white p-6 shadow-sm transition hover:-translate-y-0.5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                        <span className={`rounded-full px-3 py-1 ${product.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"}`}>
                          {product.status}
                        </span>
                        <span className="rounded-full bg-zinc-100 px-3 py-1">{product.collection}</span>
                        <span className="rounded-full bg-zinc-100 px-3 py-1">{product.taxCategory}</span>
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-[-0.04em]">{product.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-zinc-600">{product.description}</p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-3xl font-black">${product.price.toFixed(2)}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">SKU {product.sku}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">Stock {product.stockQuantity}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">{product.lowStockAlert ? "Low stock alert on" : "Low stock alert off"}</p>
                      <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => beginEdit(product)}
                          className="rounded-full border border-zinc-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeProduct(product.id)}
                          disabled={deletingId === product.id}
                          className="rounded-full border border-red-200 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === product.id ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
