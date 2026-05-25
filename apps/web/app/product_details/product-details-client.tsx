"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { useCartStore } from "../../src/store/cart-store";
import CartBadge from "../../src/components/CartBadge";
import { FadeIn } from "../../src/components/motion/fade-in";
import { Stagger, StaggerItem } from "../../src/components/motion/stagger";
import { ProductCard } from "../../src/components/product-card";
import { kineticEase } from "../../src/components/motion/motion-config";

type ProductCard = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  price: number;
  stockQuantity: number;
  inStock: boolean;
  thumbnail: string | null;
};

type ProductDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  sku: string;
  stockQuantity: number;
  inStock: boolean;
  images: string[];
  categories: string[];
};

const detailTones = [
  "from-[#ececec] via-white to-[#dcdcdc]",
  "from-[#f0ebe4] via-white to-[#d8d1c7]",
  "from-[#e5ecef] via-white to-[#cfd8de]",
] as const;

function getDetailTone(index: number) {
  return detailTones[index % detailTones.length];
}

export function ProductDetailsClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("M");
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(true);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [listItems, setListItems] = useState<ProductCard[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const reduceMotion = useReducedMotion();
  const setCart = useCartStore((state) => state.setCart);
  const addToCartLocal = useCartStore((state) => state.addToCart);

  const productIdOrSlug = useMemo(() => searchParams.get("product")?.trim() ?? "", [searchParams]);
  const hasProductImages = Boolean(product?.images && product.images.length > 0);

  useEffect(() => {
    const loadProduct = async () => {
      setDetailLoading(true);
      setDetailError(null);

      try {
        let value = productIdOrSlug;
        if (!value) {
          const listing = await fetch("/api/products?page=1&limit=1", { cache: "no-store" });
          if (!listing.ok) {
            throw new Error("Unable to load product list.");
          }

          const listingPayload = (await listing.json()) as {
            products?: Array<{ id: string; slug?: string }>;
          };
          value = listingPayload.products?.[0]?.slug || listingPayload.products?.[0]?.id || "";
        }

        if (!value) {
          setProduct(null);
          setDetailError("No published products available.");
          return;
        }

        const response = await fetch(`/api/products/${encodeURIComponent(value)}`, { cache: "no-store" });
        if (response.status === 404) {
          setProduct(null);
          setDetailError("Product not found.");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load product details.");
        }

        const payload = (await response.json()) as {
          product?: ProductDetail;
        };

        const product = payload.product;
        if (product) {
          // Ensure images is always an array
          product.images = Array.isArray(product.images) ? product.images : [];
        }
        setProduct(product ?? null);
        setActiveImageIndex(0);
      } catch {
        setProduct(null);
        setDetailError("Failed to load product details.");
      } finally {
        setDetailLoading(false);
      }
    };

    void loadProduct();
  }, [productIdOrSlug]);

  useEffect(() => {
    const controller = new AbortController();

    const loadList = async () => {
      setListLoading(true);
      setListError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", "8");
        params.set("sort", sort);
        if (searchText.trim()) {
          params.set("q", searchText.trim());
        }

        const response = await fetch(`/api/products?${params.toString()}`, {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Unable to load products.");
        }

        const payload = (await response.json()) as {
          products?: ProductCard[];
          totalPages?: number;
        };

        setListItems(Array.isArray(payload.products) ? payload.products : []);
        setTotalPages(Math.max(1, Number(payload.totalPages ?? 1)));
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }
        setListItems([]);
        setTotalPages(1);
        setListError("Unable to load products right now.");
      } finally {
        setListLoading(false);
      }
    };

    void loadList();
    return () => controller.abort();
  }, [page, searchText, sort]);

  useEffect(() => {
    setPage(1);
  }, [searchText, sort]);

  const addToCart = async () => {
    setAddToCartError(null);
    setAddToCartMessage(null);

    if (!product?.id) {
      setAddToCartError("No published product is available to add right now.");
      return;
    }

    setAddToCartLoading(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      });

      if (response.status === 401) {
        // Guest fallback: update client-only cart so badge updates in real-time
        addToCartLocal(
          {
            productId: product.id,
            title: product.title,
            sku: product.sku ?? product.slug ?? product.id,
            price: product.price,
            stockQuantity: product.stockQuantity ?? 9999,
            thumbnail:
              Array.isArray(product.images) && product.images.length > 0 ? product.images[0] ?? null : null,
          },
          1,
        );

        setAddToCartMessage("Added to cart (guest). Please sign in to persist cart.");
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        cart?: {
          items: Array<{
            productId: string;
            title: string;
            sku: string;
            price: number;
            quantity: number;
            stockQuantity: number;
            lineTotal: number;
            thumbnail: string | null;
          }>;
          subtotal: number;
          totalItems: number;
        };
      };

      if (!response.ok || !payload.cart) {
        setAddToCartError(payload.error ?? "Unable to add product right now.");
        return;
      }

      setCart(payload.cart);
      setAddToCartMessage("Added to cart successfully.");
    } catch {
      setAddToCartError("Unable to add product due to network issue.");
    } finally {
      setAddToCartLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c] -mt-20 pt-20">
      <header className="fixed inset-x-0 top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <div className="flex items-center gap-4">
            <a href={CUSTOMER_ROUTES.HOME} aria-label="Menu" className="transition hover:opacity-70 active:scale-95">
              <span className="material-symbols-outlined">menu</span>
            </a>
            <span className="text-xl font-black uppercase tracking-tight">KINETIC</span>
          </div>

          <div className="flex items-center gap-6">
            <nav className="hidden items-center gap-8 md:flex">
              <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-sm font-bold uppercase tracking-tight">Shop</a>
              <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-sm uppercase tracking-tight text-neutral-500 hover:opacity-70">Editorial</a>
              <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-sm uppercase tracking-tight text-neutral-500 hover:opacity-70">Archive</a>
            </nav>
            <CartBadge />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-36 pt-24 md:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-20">
          <section className="w-full space-y-6 lg:w-3/5">
            <div className="relative">
              {hasProductImages ? (
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#f3f3f4] md:aspect-square">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={product?.images?.[activeImageIndex] ?? activeImageIndex}
                      src={product?.images?.[activeImageIndex] ?? ""}
                      alt={`Gallery ${activeImageIndex + 1}`}
                      initial={reduceMotion ? false : { opacity: 0, scale: 1.03 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.45, ease: kineticEase }}
                      className="h-full w-full object-cover"
                    />
                  </AnimatePresence>
                </div>
              ) : (
                <div className={`flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br ${getDetailTone(0)} p-8 md:aspect-square`}>
                  <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                    <span>{product?.categories?.[0] || "Published product"}</span>
                    <span>{product?.sku || "SKU pending"}</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Catalog preview</p>
                    <h2 className="mt-3 max-w-md text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-5xl">
                      {product?.title || "Product preview"}
                    </h2>
                    <p className="mt-4 max-w-lg text-sm leading-7 text-neutral-600">
                      {product?.description || "Published products will show their actual imagery here once image assets are connected."}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {hasProductImages ? (
              <div className="grid grid-cols-5 gap-3 md:gap-4">
                {product?.images?.slice(0, 5).map((image, idx) => (
                  <motion.button
                    key={image}
                    type="button"
                    onClick={() => setActiveImageIndex(idx)}
                    whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                    className={`aspect-square overflow-hidden rounded-lg transition ${
                      idx === activeImageIndex ? "ring-2 ring-black ring-offset-2" : "opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500 md:grid-cols-3">
                <div className={`rounded-lg border border-black/5 bg-gradient-to-br ${getDetailTone(1)} p-4`}>Ready to publish</div>
                <div className={`rounded-lg border border-black/5 bg-gradient-to-br ${getDetailTone(2)} p-4`}>Data driven</div>
                <div className="rounded-lg border border-black/5 bg-white p-4">No fake imagery</div>
              </div>
            )}
          </section>

          <FadeIn as="section" className="w-full lg:sticky lg:top-32 lg:w-2/5">
            <div className="space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-500">New Arrival - FW24</span>
                <h1 className="text-4xl font-extrabold uppercase leading-none tracking-tighter md:text-5xl">
                  {detailLoading ? "Loading Product..." : product?.title ?? "Product Not Found"}
                </h1>
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center">
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="material-symbols-outlined text-sm">star_half</span>
                  </div>
                  <span className="text-sm text-neutral-600">(42 Reviews)</span>
                </div>
              </div>

              <p className="text-4xl font-light tracking-tight">
                {typeof product?.price === "number" ? `$${product.price.toFixed(2)}` : "$0.00"}
                {typeof product?.compareAtPrice === "number" ? (
                  <span className="ml-3 text-xl text-neutral-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                ) : null}
              </p>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Select Color</span>
                    <span className="text-xs text-neutral-500">{selectedColor === "Black" ? "Obsidian Black" : selectedColor}</span>
                  </div>
                  <div className="flex gap-4">
                    <button type="button" onClick={() => setSelectedColor("Black")} className={`h-10 w-10 rounded-full bg-black ${selectedColor === "Black" ? "ring-2 ring-black ring-offset-2" : "ring-1 ring-neutral-300 ring-offset-2"}`} aria-label="Black" />
                    <button type="button" onClick={() => setSelectedColor("White")} className={`h-10 w-10 rounded-full bg-white ${selectedColor === "White" ? "ring-2 ring-black ring-offset-2" : "ring-1 ring-neutral-300 ring-offset-2"}`} aria-label="White" />
                    <button type="button" onClick={() => setSelectedColor("Blue")} className={`h-10 w-10 rounded-full bg-[#2563EB] ${selectedColor === "Blue" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Blue" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold uppercase tracking-widest">Select Size</span>
                    <a href={CUSTOMER_ROUTES.PRODUCT_DETAILS} className="text-xs text-neutral-500 underline">Size Guide</a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["S", "M", "L", "XL"] as const).map((size) => (
                      <motion.button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                        className={`rounded-lg py-4 text-sm uppercase transition ${
                          selectedSize === size ? "bg-black font-bold text-white" : "bg-[#eeeeee]"
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-neutral-300/40 pt-8">
                <p className="text-sm leading-relaxed text-neutral-600 md:text-base">
                  {detailError || product?.description || "This product description is currently unavailable."}
                </p>
                <ul className="space-y-3 pt-2 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    SKU: {product?.sku || "N/A"}
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Stock: {typeof product?.stockQuantity === "number" ? product.stockQuantity : 0}
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Status: {product?.inStock ? "In Stock" : "Out of Stock"}
                  </li>
                </ul>
              </div>

              <div className="hidden lg:block pt-6">
                <motion.button
                  type="button"
                  onClick={addToCart}
                  disabled={addToCartLoading}
                  whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-6 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:opacity-40"
                >
                  {addToCartLoading ? "Adding..." : "Add to Cart"}
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </motion.button>
                {addToCartError ? <p className="mt-3 text-xs font-bold text-red-600">{addToCartError}</p> : null}
                {addToCartMessage ? <p className="mt-3 text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
              </div>
            </div>
          </FadeIn>
        </div>

        <FadeIn as="section" className="mt-24 space-y-12">
          <h2 className="text-center text-3xl font-black uppercase tracking-tighter">Complete the Look</h2>

          <div className="mx-auto flex max-w-3xl flex-col gap-4 md:flex-row">
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search products"
              className="h-11 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-black"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="h-11 rounded-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-black"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>

          {listLoading ? <p className="text-center text-sm text-neutral-500">Loading products...</p> : null}
          {listError ? <p className="text-center text-sm font-semibold text-red-600">{listError}</p> : null}
          {!listLoading && !listError && listItems.length === 0 ? (
            <p className="text-center text-sm text-neutral-500">No published products matched your filters.</p>
          ) : null}

          <AnimatePresence mode="wait">
            <Stagger key={`${page}-${sort}-${searchText}`} className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {listItems.map((item, index) => (
                <StaggerItem key={item.id}>
                  <ProductCard
                    item={{
                      id: item.id,
                      slug: item.slug,
                      name: item.title,
                      label: "Catalog",
                      price: `$${item.price.toFixed(2)}`,
                      thumbnail: item.thumbnail,
                    }}
                    index={index}
                    href={`/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id)}`}
                    variant="light"
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </AnimatePresence>

          {!listLoading && !listError ? (
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
              >
                Prev
              </button>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Page {page} / {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-full border border-neutral-300 px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-40"
              >
                Next
              </button>
            </div>
          ) : null}
        </FadeIn>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white/90 px-6 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</span>
            <span className="text-lg font-black">{typeof product?.price === "number" ? `$${product.price.toFixed(2)}` : "$0.00"}</span>
          </div>
          <button
            type="button"
            onClick={addToCart}
            disabled={addToCartLoading}
            className="flex-1 rounded-full bg-black py-4 text-center text-xs font-bold uppercase tracking-widest text-white transition active:scale-95 disabled:opacity-40"
          >
            Add to Cart
          </button>
        </div>
        {addToCartError ? <p className="mt-3 text-xs font-bold text-red-600">{addToCartError}</p> : null}
        {addToCartMessage ? <p className="mt-3 text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
      </div>

      <footer className="mt-24 bg-[#f3f3f4] px-8 py-20">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 md:grid-cols-4">
          <div className="space-y-6">
            <span className="text-2xl font-black tracking-tighter">KINETIC</span>
            <p className="max-w-xs text-sm leading-relaxed text-neutral-600">
              Redefining contemporary wardrobe through architectural silhouettes and technical craftsmanship.
            </p>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Support</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>Shipping &amp; Returns</li>
              <li>Sustainability</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
