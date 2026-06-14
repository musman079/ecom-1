"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader2 } from "lucide-react";

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
  images: string[];
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
  images: [] as string[]
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
  const [imageUrlInput, setImageUrlInput] = useState("");

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

        if (!payload.user) {
          router.replace("/auth");
          return;
        }

        const roles = Array.isArray(payload.user.roles) ? payload.user.roles : [];
        const role = payload.user.role;
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
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
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
          images: form.images
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
      setImageUrlInput("");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (product: AdminProduct) => {
    setEditingId(product.id);
    setImageUrlInput("");
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
      images: product.images || []
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(initialFormState);
    setImageUrlInput("");
    setError(null);
    setMessage(null);
  };

  const addImageUrl = () => {
    const normalized = imageUrlInput.trim();
    if (!normalized) {
      return;
    }

    setForm((current) => {
      if (current.images.includes(normalized)) {
        return current;
      }

      return {
        ...current,
        images: [...current.images, normalized],
      };
    });

    setImageUrlInput("");
  };

  const removeImageUrl = (indexToRemove: number) => {
    setForm((current) => ({
      ...current,
      images: current.images.filter((_, index) => index !== indexToRemove),
    }));
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
    <AdminShell 
      title="Products" 
      subtitle="Manage your inventory and product listings"
      actions={
        <a href="/admin_post_edit_product" className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest transition-all hover:bg-[#C8A96E]/20">
          Editor
        </a>
      }
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="space-y-6 lg:col-span-5">
          <div className="bg-[#111111] border border-white/8 rounded-sm p-6 sm:p-8">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-sans font-bold uppercase tracking-[0.24em] text-white/30">Create</p>
                <h2 className="text-2xl font-heading text-white">{editingId ? "Edit Product" : "New Product"}</h2>
              </div>
              <span className="bg-white/5 border border-white/10 rounded-sm px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white/40">
                {saving ? "Saving" : "Ready"}
              </span>
            </div>

            <div className="space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Product title"
                className="w-full bg-transparent border-0 border-b border-white/10 px-0 py-3 text-lg font-heading text-white outline-none placeholder:text-white/20 focus:border-[#C8A96E]/40 transition-all"
              />
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder="Description"
                className="min-h-28 w-full bg-[#1A1A1A] border border-white/10 rounded-sm p-4 text-sm font-sans text-white outline-none placeholder:text-white/20 focus:border-[#C8A96E]/40 transition-all"
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  value={form.price}
                  onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
                  placeholder="Price"
                  type="number"
                  step="0.01"
                  className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                />
                <input
                  value={form.sku}
                  onChange={(event) => setForm((current) => ({ ...current, sku: event.target.value }))}
                  placeholder="SKU"
                  className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  value={form.stockQuantity}
                  onChange={(event) => setForm((current) => ({ ...current, stockQuantity: event.target.value }))}
                  placeholder="Stock"
                  type="number"
                  className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                />
                <label className="flex items-center justify-between bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans">
                  <span className="font-medium text-white/70">Low stock alert</span>
                  <input
                    type="checkbox"
                    checked={form.lowStockAlert}
                    onChange={(event) => setForm((current) => ({ ...current, lowStockAlert: event.target.checked }))}
                    className="h-4 w-4 accent-[#C8A96E] bg-[#0D0D0D] border-white/10 rounded-sm"
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <select
                  value={form.taxCategory}
                  onChange={(event) => setForm((current) => ({ ...current, taxCategory: event.target.value }))}
                  className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
                >
                  <option>Standard Goods (20%)</option>
                  <option>Luxury Surcharge (25%)</option>
                  <option>Exempt</option>
                </select>
                <select
                  value={form.collection}
                  onChange={(event) => setForm((current) => ({ ...current, collection: event.target.value }))}
                  className="bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
                >
                  <option>FW24 Editorial</option>
                  <option>Permanent Collection</option>
                  <option>Limited Capsules</option>
                </select>
              </div>

              <div className="bg-white/[0.02] border border-white/5 rounded-sm p-4">
                <p className="mb-3 text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/30">Product Images</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    value={imageUrlInput}
                    onChange={(event) => setImageUrlInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addImageUrl();
                      }
                    }}
                    placeholder="Paste image URL e.g. /uploads/product.webp"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                  />
                  <button
                    type="button"
                    onClick={addImageUrl}
                    className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-4 py-3 text-[10px] font-sans font-bold uppercase tracking-[0.16em] transition-all hover:bg-[#C8A96E]/20"
                  >
                    Add
                  </button>
                </div>
                {form.images.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {form.images.map((image, index) => (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        onClick={() => removeImageUrl(index)}
                        className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[10px] font-sans font-semibold tracking-[0.14em] text-white/60 transition-all hover:border-red-500/50 hover:text-red-400"
                        title="Remove image"
                      >
                        IMG {index + 1}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-sans text-white/30">No images added yet.</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void submitProduct("draft")}
                  disabled={saving}
                  className="bg-white/5 border border-white/10 rounded-sm px-5 py-3 text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => void submitProduct("published")}
                  disabled={saving}
                  className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-5 py-3 text-xs font-sans font-bold uppercase tracking-[0.18em] transition-all hover:bg-[#C8A96E]/20 disabled:opacity-40"
                >
                  {editingId ? "Update Product" : "Publish Product"}
                </button>
              </div>

              {editingId ? (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="w-full bg-white/5 border border-white/10 rounded-sm px-5 py-3 text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
                >
                  Cancel Edit
                </button>
              ) : null}

              {form.images.length > 0 ? (
                <div className="grid grid-cols-4 gap-2 bg-[#1A1A1A] border border-white/10 rounded-sm p-3">
                  {form.images.map((image, index) => (
                    <div key={`${image}-preview-${index}`} className="group relative aspect-square overflow-hidden rounded-sm border border-white/10">
                      <img src={image} alt={`Preview ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImageUrl(index)}
                        className="absolute right-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white opacity-0 transition group-hover:opacity-100"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {error ? <p className="text-sm font-sans text-red-400">{error}</p> : null}
              {message ? <p className="text-sm font-sans text-emerald-400">{message}</p> : null}
            </div>
          </div>
        </section>

        <section className="space-y-6 lg:col-span-7">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-sans font-bold uppercase tracking-[0.24em] text-white/30">Inventory</p>
              <h2 className="text-2xl font-heading text-white">Saved Products</h2>
            </div>
            <a href="/api/admin/products" className="text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-[#C8A96E] hover:underline underline-offset-4">
              API
            </a>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="bg-[#111111] border border-white/8 rounded-sm p-8 text-sm font-sans text-white/30 text-center">
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div className="bg-[#111111] border border-white/8 rounded-sm p-8 text-sm font-sans text-white/30 text-center">
                No products saved yet. Publish one to begin.
              </div>
            ) : (
              products.map((product) => (
                <article key={product.id} className="bg-[#111111] border border-white/8 rounded-sm p-6 transition-all hover:border-white/10 hover:bg-white/[0.02]">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap gap-2 text-[9px] font-sans font-bold uppercase tracking-[0.18em] text-white/40">
                        <span className={`px-2 py-0.5 rounded-full border ${product.status === "published" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-white/5 border-white/10"}`}>
                          {product.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full border bg-white/5 border-white/10">{product.collection}</span>
                        <span className="px-2 py-0.5 rounded-full border bg-white/5 border-white/10">{product.taxCategory}</span>
                      </div>
                      <h3 className="text-xl font-heading text-white">{product.title}</h3>
                      <p className="mt-2 text-sm font-sans leading-relaxed text-white/60">{product.description}</p>
                      
                      {product.images && product.images.length > 0 && (
                        <div className="mt-4 flex gap-2">
                          {product.images.map((img, idx) => (
                            <img key={idx} src={img} alt="Product img" className="h-16 w-16 object-cover rounded-sm border border-white/10" />
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-2xl font-display text-[#C8A96E]">${product.price.toFixed(2)}</p>
                      <p className="mt-1 text-[10px] font-sans uppercase tracking-[0.18em] text-white/40">SKU {product.sku}</p>
                      <p className="text-[10px] font-sans uppercase tracking-[0.18em] text-white/40">Stock {product.stockQuantity}</p>
                      <p className={`mt-1 text-[9px] font-sans uppercase tracking-[0.18em] ${product.lowStockAlert ? "text-amber-400" : "text-white/20"}`}>
                        {product.lowStockAlert ? "Low stock alert on" : "Low stock alert off"}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
                        <button
                          type="button"
                          onClick={() => beginEdit(product)}
                          className="bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.16em] text-white/60 transition-all hover:bg-white/10 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void removeProduct(product.id)}
                          disabled={deletingId === product.id}
                          className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-sm px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-[0.16em] transition-all hover:bg-red-500/20 disabled:opacity-40"
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
      </div>
    </AdminShell>
  );
}
