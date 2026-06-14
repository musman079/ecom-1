"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { Loader2 } from "lucide-react";


export default function AdminPostEditProductPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [actionMessage, setActionMessage] = useState("Ready to post new product.");
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    taxCategory: "Standard Goods (20%)",
    collection: "FW24 Editorial",
    sku: "",
    stockQuantity: "0",
    lowStockAlert: true,
    images: [] as string[]
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploadingImages(true);
    setActionMessage(`Uploading ${files.length} image${files.length > 1 ? "s" : ""}...`);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const payload = (await res.json()) as { error?: string };
          throw new Error(payload.error ?? "Upload failed");
        }

        const data = (await res.json()) as { url?: string; urls?: string[] };
        if (Array.isArray(data.urls) && data.urls.length > 0) {
          uploadedUrls.push(...data.urls);
        } else if (typeof data.url === "string" && data.url.trim()) {
          uploadedUrls.push(data.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setForm((prev) => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      }

      setActionMessage(`${uploadedUrls.length} image${uploadedUrls.length > 1 ? "s" : ""} uploaded successfully.`);
    } catch (err) {
      setActionMessage(err instanceof Error ? err.message : "Error uploading images.");
    } finally {
      e.target.value = "";
      setUploadingImages(false);
    }
  };

  const submitProduct = async (status: "draft" | "published") => {
    setSaving(true);
    setActionMessage(`Saving product as ${status}...`);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stockQuantity: Number(form.stockQuantity),
          status,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error ?? "Failed to save product.");
      }

      setActionMessage(status === "published" ? "Product published!" : "Draft saved!");
      if (status === "published") {
        setTimeout(() => router.push("/admin_products"), 1500);
      }
    } catch (error) {
      setActionMessage(error instanceof Error ? error.message : "Error saving product.");
    } finally {
      setSaving(false);
    }
  };

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

  if (!allowed) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-[#C8A96E] animate-spin" />
      </div>
    );
  }

  return (
    <AdminShell 
      title="Product Editor" 
      subtitle="Create or edit a product listing"
      actions={
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => submitProduct("draft")} disabled={saving} className="bg-white/5 border border-white/10 rounded-sm px-4 py-2 text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/60 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40">
            {saving ? "Saving..." : "Save Draft"}
          </button>
          <button type="button" onClick={() => submitProduct("published")} disabled={saving} className="bg-[#C8A96E]/10 border border-[#C8A96E]/20 text-[#C8A96E] rounded-sm px-4 py-2 text-xs font-sans font-bold uppercase tracking-widest transition-all hover:bg-[#C8A96E]/20 disabled:opacity-40">
            Publish
          </button>
        </div>
      }
    >
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-[#C8A96E]">{actionMessage}</p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-12">
          <div className="space-y-8 lg:col-span-2">
            <section className="bg-[#111111] border border-white/8 rounded-sm p-6 sm:p-8 space-y-6">
              <div>
                <label className="mb-3 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/30">Product Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Sculptural Wool Overcoat"
                  className="w-full bg-transparent border-0 border-b border-white/10 px-0 pb-2 text-2xl font-heading text-white outline-none placeholder:text-white/20 focus:border-[#C8A96E]/40 transition-all sm:text-3xl"
                />
              </div>

              <div>
                <label className="mb-3 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/30">Product Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detail the materials, cut, and conceptual inspiration..."
                  className="min-h-48 w-full bg-[#1A1A1A] border border-white/10 rounded-sm p-4 text-sm font-sans text-white outline-none placeholder:text-white/20 focus:border-[#C8A96E]/40 transition-all"
                />
              </div>
            </section>

            <section className="bg-[#111111] border border-white/8 rounded-sm p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-heading text-white">Media Assets</h3>
                  <p className="text-[11px] font-sans text-white/40 mt-1">First image is the main display.</p>
                </div>
                <label className="bg-white/5 border border-white/10 rounded-sm px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-[0.18em] text-white cursor-pointer hover:bg-white/10 transition-all">
                  Upload files
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    ref={fileInputRef}
                  />
                </label>
              </div>

              {uploadingImages && (
                <div className="mb-4 rounded-sm bg-[#C8A96E]/10 border border-[#C8A96E]/20 p-4 flex items-center justify-center gap-3">
                  <span className="inline-block animate-spin w-4 h-4 border-2 border-[#C8A96E] border-t-transparent rounded-full" />
                  <span className="text-xs font-sans font-bold uppercase tracking-[0.18em] text-[#C8A96E]">Processing Images...</span>
                </div>
              )}

              {form.images.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-sm border border-dashed border-white/20 bg-white/[0.02] py-16 text-center">
                  <p className="text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/30">No Media Assets</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-white/5 border border-white/10">
                      <img src={img} alt="Product upload preview" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
                      <div className="absolute inset-x-0 bottom-0 flex justify-between p-3 opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-[10px] font-sans font-bold text-white bg-black/50 px-2 py-1 rounded-sm">
                          {idx === 0 ? "Main Cover" : `Asset 0${idx + 1}`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))}
                          className="flex h-6 w-6 items-center justify-center rounded-sm bg-red-500/80 text-white transition hover:bg-red-500"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="space-y-6">
            <div className="bg-[#111111] border border-white/8 rounded-sm p-6 sm:p-8">
              <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/30">Pricing & Organization</h4>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/50">Retail Price (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-sans font-bold text-white/40">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm pl-10 pr-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/50">Tax Category</label>
                  <select 
                    value={form.taxCategory}
                    onChange={(e) => setForm({ ...form, taxCategory: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
                  >
                    <option>Standard Goods (20%)</option>
                    <option>Luxury Surcharge (25%)</option>
                    <option>Exempt</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/50">Collection</label>
                  <select 
                    value={form.collection}
                    onChange={(e) => setForm({ ...form, collection: e.target.value })}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all"
                  >
                    <option>FW24 Editorial</option>
                    <option>Permanent Collection</option>
                    <option>Limited Capsules</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/8 rounded-sm p-6 sm:p-8">
              <h4 className="text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/30">Inventory Logistics</h4>
              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/50">Base SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    placeholder="EDITORIAL-W24-001"
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-sm px-4 py-3 text-sm font-sans text-white outline-none focus:border-[#C8A96E]/40 transition-all placeholder:text-white/20"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-sans font-bold uppercase tracking-[0.2em] text-white/50">Total Stock Quantity</label>
                  <div className="flex items-center bg-[#1A1A1A] border border-white/10 rounded-sm px-3 py-2">
                    <button type="button" onClick={() => setForm({...form, stockQuantity: String(Math.max(0, Number(form.stockQuantity) - 1))})} className="text-white/40 hover:text-white transition-colors px-2">-</button>
                    <input type="number" value={form.stockQuantity} onChange={(e) => setForm({ ...form, stockQuantity: e.target.value })} className="w-full bg-transparent text-center font-sans text-white font-bold outline-none" />
                    <button type="button" onClick={() => setForm({...form, stockQuantity: String(Number(form.stockQuantity) + 1)})} className="text-white/40 hover:text-white transition-colors px-2">+</button>
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`flex h-5 w-10 items-center rounded-full px-1 transition-colors ${form.lowStockAlert ? 'bg-[#C8A96E]' : 'bg-white/10'}`}>
                    <div className={`h-3 w-3 rounded-full bg-white transition-transform ${form.lowStockAlert ? 'translate-x-5' : 'translate-x-0'}`} />
                  </div>
                  <span className="text-xs font-sans font-bold uppercase tracking-[0.18em] text-white/70">Low stock alert</span>
                  <input type="checkbox" className="hidden" checked={form.lowStockAlert} onChange={(e) => setForm({...form, lowStockAlert: e.target.checked})} />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
