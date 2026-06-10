"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, ImagePlus, Trash2, Pencil, X, Check, Loader2, Package } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";

type ProductStatus = "draft" | "published";
type AdminProduct = {
  id: string; title: string; description: string; price: number;
  taxCategory: string; collection: string; sku: string;
  stockQuantity: number; lowStockAlert: boolean; status: ProductStatus;
  images: string[]; createdAt: string; updatedAt: string;
};

const initialForm = {
  title: "", description: "", price: "", taxCategory: "Standard Goods (20%)",
  collection: "FW24 Editorial", sku: "", stockQuantity: "0",
  lowStockAlert: true, status: "published" as ProductStatus, images: [] as string[],
};

const getAdminNavHref = (label: string) => {
  const map: Record<string, string> = {
    Overview: "/admin_overview_dashboard", Products: "/admin_products",
    Orders: "/admin_orders", Returns: "/admin_returns",
    Customers: "/admin_customers", Analytics: "/admin_analytics",
    Settings: "/admin_settings",
  };
  return map[label] ?? "/admin_overview_dashboard";
};
void getAdminNavHref;

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
  const [form, setForm] = useState(initialForm);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) { router.replace("/auth"); return; }
        const data = await r.json() as { user?: { role?: string; roles?: string[] } | null };
        if (!data.user) { router.replace("/auth"); return; }
        const roles = Array.isArray(data.user.roles) ? data.user.roles : [];
        const role = data.user.role ?? "";
        if (!roles.includes("ADMIN") && role !== "ADMIN" && role !== "SUPER_ADMIN") { router.replace("/"); return; }
        setAllowed(true);
      })
      .catch(() => router.replace("/auth"));
  }, [router]);

  useEffect(() => {
    if (!allowed) return;
    fetch("/api/admin/products", { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) throw new Error("Unable to load products.");
        const data = await r.json() as { products: AdminProduct[] };
        setProducts(data.products);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [allowed]);

  if (!allowed) return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center">
      <div className="flex items-center gap-3 text-white/50">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="font-sans text-sm tracking-widest uppercase">Verifying access...</span>
      </div>
    </div>
  );

  const submitProduct = async (status: ProductStatus) => {
    setSaving(true); setError(null); setMessage(null);
    try {
      const endpoint = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
      const method = editingId ? "PUT" : "POST";
      const r = await fetch(endpoint, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity), status }),
      });
      if (!r.ok) { const d = await r.json() as { error?: string }; throw new Error(d.error ?? "Save failed"); }
      const { product } = await r.json() as { product: AdminProduct };
      setProducts((p) => editingId ? p.map((x) => x.id === product.id ? product : x) : [product, ...p]);
      setMessage(editingId ? "Product updated." : "Product published.");
      setEditingId(null); setForm(initialForm); setImageUrlInput("");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Save failed"); }
    finally { setSaving(false); }
  };

  const beginEdit = (p: AdminProduct) => {
    setEditingId(p.id); setImageUrlInput(""); setError(null); setMessage(null);
    setForm({ title: p.title, description: p.description, price: String(p.price), taxCategory: p.taxCategory, collection: p.collection, sku: p.sku, stockQuantity: String(p.stockQuantity), lowStockAlert: p.lowStockAlert, status: p.status, images: p.images || [] });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => { setEditingId(null); setForm(initialForm); setImageUrlInput(""); setError(null); setMessage(null); };

  const addImageUrl = () => {
    const url = imageUrlInput.trim();
    if (!url) return;
    setForm((f) => f.images.includes(url) ? f : { ...f, images: [...f.images, url] });
    setImageUrlInput("");
  };

  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id); setError(null);
    try {
      const r = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!r.ok) { const d = await r.json() as { error?: string }; throw new Error(d.error ?? "Delete failed"); }
      setProducts((p) => p.filter((x) => x.id !== id));
      if (editingId === id) cancelEdit();
      setMessage("Product deleted.");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Delete failed"); }
    finally { setDeletingId(null); }
  };

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const inputCls = "w-full bg-[#111111] border border-white/8 rounded-sm px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none focus:border-[#C8A96E]/50 focus:ring-1 focus:ring-[#C8A96E]/20 transition-all";
  const labelCls = "block font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-white/40 mb-2";

  return (
    <AdminShell
      title="Products"
      subtitle="Manage your product catalog"
      actions={
        <button
          onClick={() => { setShowForm(!showForm); if (!showForm) { cancelEdit(); } }}
          className="flex items-center gap-2 bg-[#C8A96E] text-[#080808] font-sans text-[12px] font-bold uppercase tracking-[0.15em] px-4 py-2 rounded-sm hover:bg-[#E2C98A] transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Product</span>
        </button>
      }
    >
      <div className="max-w-7xl mx-auto">
        {/* Status messages */}
        {message && (
          <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-sm px-4 py-3 mb-6">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span className="text-sm text-emerald-300">{message}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-emerald-400/50 hover:text-emerald-400"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 rounded-sm px-4 py-3 mb-6">
            <X className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-red-400/50 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* ── CREATE / EDIT FORM ── */}
          {showForm && (
            <section className="xl:col-span-5">
              <div className="bg-[#111111] border border-white/8 rounded-sm overflow-hidden">
                {/* Form header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
                  <div>
                    <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#C8A96E]">
                      {editingId ? "Editing" : "Create"}
                    </p>
                    <h2 className="font-heading text-xl text-white mt-0.5">
                      {editingId ? "Edit Product" : "New Product"}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {saving && <Loader2 className="w-4 h-4 text-[#C8A96E] animate-spin" />}
                    <span className={`font-sans text-[10px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full ${saving ? "bg-[#C8A96E]/10 text-[#C8A96E]" : "bg-white/5 text-white/30"}`}>
                      {saving ? "Saving..." : "Ready"}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Title */}
                  <div>
                    <label className={labelCls}>Product Title</label>
                    <input value={form.title} onChange={f("title")} placeholder="e.g. Cashmere Turtleneck Sweater" className={inputCls} />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={labelCls}>Description</label>
                    <textarea value={form.description} onChange={f("description")} placeholder="Product description..." rows={4} className={`${inputCls} resize-none`} />
                  </div>

                  {/* Price + SKU */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Price ($)</label>
                      <input value={form.price} onChange={f("price")} placeholder="0.00" type="number" step="0.01" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>SKU</label>
                      <input value={form.sku} onChange={f("sku")} placeholder="USL-001" className={inputCls} />
                    </div>
                  </div>

                  {/* Stock + Alert */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Stock Qty</label>
                      <input value={form.stockQuantity} onChange={f("stockQuantity")} type="number" placeholder="0" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Low Stock Alert</label>
                      <label className="flex items-center gap-3 bg-[#111111] border border-white/8 rounded-sm px-4 py-3 cursor-pointer hover:border-[#C8A96E]/30 transition-all h-[46px]">
                        <div className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${form.lowStockAlert ? "bg-[#C8A96E]" : "bg-white/10"}`}>
                          <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 shadow ${form.lowStockAlert ? "translate-x-4" : "translate-x-0.5"}`} />
                        </div>
                        <input type="checkbox" checked={form.lowStockAlert} onChange={(e) => setForm((p) => ({ ...p, lowStockAlert: e.target.checked }))} className="sr-only" />
                        <span className="text-sm text-white/60">{form.lowStockAlert ? "On" : "Off"}</span>
                      </label>
                    </div>
                  </div>

                  {/* Tax + Collection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Tax Category</label>
                      <select value={form.taxCategory} onChange={f("taxCategory")} className={inputCls}>
                        <option>Standard Goods (20%)</option>
                        <option>Luxury Surcharge (25%)</option>
                        <option>Exempt</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Collection</label>
                      <select value={form.collection} onChange={f("collection")} className={inputCls}>
                        <option>FW24 Editorial</option>
                        <option>Permanent Collection</option>
                        <option>Limited Capsules</option>
                      </select>
                    </div>
                  </div>

                  {/* Images */}
                  <div>
                    <label className={labelCls}>Product Images</label>
                    <div className="bg-[#0D0D0D] border border-white/5 rounded-sm p-4 space-y-3">
                      <div className="flex gap-2">
                        <input
                          value={imageUrlInput}
                          onChange={(e) => setImageUrlInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImageUrl(); } }}
                          placeholder="Paste image URL and press Enter..."
                          className="flex-1 bg-[#111111] border border-white/8 rounded-sm px-3 py-2 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#C8A96E]/40 transition-all"
                        />
                        <button onClick={addImageUrl} className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-sm text-white/70 transition-all">
                          <ImagePlus className="w-4 h-4" />
                        </button>
                      </div>

                      {form.images.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                          {form.images.map((img, i) => (
                            <div key={i} className="relative group aspect-square rounded-sm overflow-hidden bg-[#111111] border border-white/10">
                              <img src={img} alt="" className="w-full h-full object-cover" />
                              <button
                                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((_, j) => j !== i) }))}
                                className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-4 h-4 text-white" />
                              </button>
                              <span className="absolute bottom-1 left-1 bg-black/60 text-[9px] text-white px-1 rounded">{i + 1}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[12px] text-white/25 text-center py-2">No images added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={() => void submitProduct("draft")} disabled={saving}
                      className="flex-1 border border-white/15 text-white/60 hover:text-white hover:border-white/30 font-sans text-[12px] font-bold uppercase tracking-[0.15em] py-3 rounded-sm transition-all disabled:opacity-40">
                      Save Draft
                    </button>
                    <button onClick={() => void submitProduct("published")} disabled={saving}
                      className="flex-1 bg-[#C8A96E] text-[#080808] hover:bg-[#E2C98A] font-sans text-[12px] font-bold uppercase tracking-[0.15em] py-3 rounded-sm transition-all disabled:opacity-40 flex items-center justify-center gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {editingId ? "Update" : "Publish"}
                    </button>
                  </div>

                  {editingId && (
                    <button onClick={cancelEdit} className="w-full text-center font-sans text-[12px] text-white/30 hover:text-white/60 transition-colors py-2">
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── PRODUCT LIST ── */}
          <section className={showForm ? "xl:col-span-7" : "xl:col-span-12"}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Inventory</p>
                <h2 className="font-heading text-xl text-white">Saved Products</h2>
              </div>
              <span className="font-sans text-[12px] text-white/30">{products.length} total</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="w-6 h-6 text-[#C8A96E] animate-spin" />
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center border border-white/5 rounded-sm bg-[#111111]">
                <Package className="w-12 h-12 text-white/10 mb-4" strokeWidth={1} />
                <p className="font-heading text-lg text-white/30 mb-2">No products yet</p>
                <p className="font-sans text-sm text-white/20">Create your first product using the form</p>
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <article
                    key={product.id}
                    className={`group bg-[#111111] border rounded-sm p-5 transition-all duration-200 hover:border-white/15 ${editingId === product.id ? "border-[#C8A96E]/30 bg-[#C8A96E]/5" : "border-white/8"}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                      {/* Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-[#1A1A1A] rounded-sm overflow-hidden border border-white/5">
                        {product.images?.[0] ? (
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/10">
                            <Package className="w-6 h-6" strokeWidth={1} />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`font-sans text-[10px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full ${product.status === "published" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20" : "bg-white/5 text-white/40 border border-white/10"}`}>
                            {product.status}
                          </span>
                          <span className="font-sans text-[10px] text-white/30 bg-white/5 border border-white/5 px-2 py-0.5 rounded-full">
                            {product.collection}
                          </span>
                        </div>
                        <h3 className="font-heading text-lg text-white leading-tight mb-1 truncate">{product.title}</h3>
                        <p className="font-sans text-sm text-white/40 line-clamp-2 leading-relaxed mb-3">{product.description}</p>
                        <div className="flex flex-wrap gap-4 text-[11px] font-sans text-white/30">
                          <span>SKU: <span className="text-white/50">{product.sku || "—"}</span></span>
                          <span>Stock: <span className={product.stockQuantity < 5 ? "text-amber-400" : "text-white/50"}>{product.stockQuantity}</span></span>
                          <span>Tax: <span className="text-white/50">{product.taxCategory}</span></span>
                        </div>
                      </div>

                      {/* Price + Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-3 flex-shrink-0">
                        <span className="font-display text-2xl text-[#C8A96E]">${product.price.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => beginEdit(product)}
                            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white px-3 py-1.5 rounded-sm text-[11px] font-sans font-bold uppercase tracking-wider transition-all"
                          >
                            <Pencil className="w-3 h-3" /> Edit
                          </button>
                          <button
                            onClick={() => void removeProduct(product.id)}
                            disabled={deletingId === product.id}
                            className="flex items-center gap-1.5 bg-red-500/5 hover:bg-red-500/15 border border-red-500/15 hover:border-red-500/30 text-red-400/70 hover:text-red-400 px-3 py-1.5 rounded-sm text-[11px] font-sans font-bold uppercase tracking-wider transition-all disabled:opacity-40"
                          >
                            {deletingId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                            {deletingId === product.id ? "..." : "Del"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
