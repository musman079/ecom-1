"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";

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

const galleryImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAOxZYhTmNSexvgQ6GDh54igLjroBcQ7ioVBk6V4cw1VWP5L_A07-e8MKl8pt4jrETKY9Z-DCde7pecXAb-DFFz0tXmldwELRkd5DgizmRWPGX_xk0RlHaUWtdC56aBQmd8YRW45CgkqWay8pfR_X_aUdIJBpx4qXbSWjl5zC0rt-5LYt6i6v4bPVjzxo6eYEE-7NpQPwlq_TGCKzqydUc6v226wrKpbehfYbvAcO626HVe8aels6ez-mt3Xqa_6cJYLWz2Y1jzSolz',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuAqzBOVRs961H-JV4sKABbjnDcfGTcw-nhKnqT15XS7Ky6t9CushYMSMcrnP-e5iE-3cwDLds-060c2SdjiYDXA0qxk-3HvEPh6HgdIzEiwiKju-BT60ZGEYW8EvNfm8DAlCP8mgjpDuSVlG_Wo8SJACnva0IYh8jH2XG1GYusCAsI9SVeixoEC9vusy555YUVuBei0iF_UTrlaF6R-5XeTcB_K3-EAEiPkuXkNoJswHCVhvhow-ib4mYnm7lnOj5zMeEqsdRD3CD_6',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuANi6A0HugCdIAKHk9SyXx10b-5gYEURdntuDnoZtvo7OQ6OnVQG9529u3C6Bu_hiEIvx06rhrr3SMURHZO0k_oICjmd3lwepp3RXd55UpXG0EDAtRSfymaBio6dE4eS3vOGcSufZzQLgUVm2AqzQmJx0QcFqAX0xrI-Q8XlJOdMFKPJevvHGhdLarWbWPFEVbrkHSjaQroiJLgi-NiheChFgZoNFcGTrEpKVqU4SskuS_FikYIPgSFKrKAKaQDKbZlghRbfi2iAh-p',
];

const thumbImages = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDTXCK3byKC19SgofEhINcytFHMnxlWAW1G-iD7NLK8V6gEq3ufPTk6eumDOUjYvve-yZUy1rqgdeFac06OYSSId8Ahc8zFwq2lOQCD3U6kh1nJUmp4BfDIvHfe6CC1NTSd4pW1uowKvChNBhdzT1sFpPtixiYggUwL1Ohe4U9XxPIrL_x0kkhCwRZgu6MP_BT9teyVlsfw0S6tsJYafFZ1f4HLwEEr2RydF7QYOc-DXZ9y_EDsG37eMQN_uBAz-LXO6KhUMIHfXR91',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDXKur_C7NKAQgbdXvb-T2Zb6J9RzwxESaTxu6nALCgLR6Dd3ZtucwKopQWQ5ddNIhpZRNVSM7okjBoNdCZdbRUHPEy5vLDO1U_UwHth-opLGPMSpdl132FRovmAzyJYLa1AieffHMuial58bg1GsHQ5Ag3b7-jVlB1XKnT-j6lb3iNaRvDnUaBrZuYUfVnYi0_cCqftG0HQ2SCPpdZ0Z9ZoN9nhEwfYW7HXcw2cekb6NS6MLSjZHEcJn-wbEqoeNMbm1VykCUZmBMZ',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDrtAM4T4eOTX4R9uf9ZhfaEDkCW67NbdhbDRnJrm3aPPXUs6lG66FcznHMBbVN8ceVkQt_o6IVmoJEa7WPCMEmVU0smQa9y2JLuMNZpnA99cepVQ5bq1oManB-8CRd-JE3TPoSATbUZIwHDJFvtGSvIBy3oxVnE0kPYg1CDHgRRbu_o7HcAVXfILQ7zr_arR3DP9Ax6msBskJv6_9hRhBSBoacrCfublXZJMuETcLL_GU8Yc2n0t5_RQv7H8ImwzlVoscSVzmMTAd9',
];

export default function ProductDetailsPage() {
  const searchParams = useSearchParams();
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

  const productIdOrSlug = useMemo(() => searchParams.get("product")?.trim() ?? "", [searchParams]);
  const detailGallery = product?.images && product.images.length > 0 ? product.images : galleryImages;

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

        setProduct(payload.product ?? null);
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

      const payload = (await response.json()) as {
        error?: string;
      };

      if (response.status === 401) {
        setAddToCartError("Please login first to add products into cart.");
        return;
      }

      if (!response.ok) {
        setAddToCartError(payload.error ?? "Unable to add product to cart.");
        return;
      }

      setAddToCartMessage("Added to cart successfully.");
    } catch {
      setAddToCartError("Unable to add product due to network issue.");
    } finally {
      setAddToCartLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#1a1c1c]">
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
            <a href={CUSTOMER_ROUTES.CART_CHECKOUT} aria-label="Bag" className="transition hover:opacity-70 active:scale-95">
              <span className="material-symbols-outlined">shopping_bag</span>
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-36 pt-24 md:px-8">
        <div className="flex flex-col items-start gap-12 lg:flex-row lg:gap-20">
          <section className="w-full space-y-6 lg:w-3/5">
            <div className="relative">
              <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-xl bg-[#f3f3f4]">
                {detailGallery.map((image, idx) => (
                  <div key={image} className="relative aspect-[4/5] w-full shrink-0 snap-center md:aspect-square">
                    <img src={image} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
                <span className="h-2 w-2 rounded-full bg-black" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
                <span className="h-2 w-2 rounded-full bg-black/20" />
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 md:gap-4">
              {thumbImages.map((image, idx) => (
                <button
                  key={image}
                  className={`aspect-square overflow-hidden rounded-lg transition hover:opacity-80 ${
                    idx === 0 ? 'ring-1 ring-black ring-offset-2' : ''
                  }`}
                >
                  <img src={image} alt={`Thumbnail ${idx + 1}`} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          </section>

          <section className="w-full lg:sticky lg:top-32 lg:w-2/5">
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
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`rounded-lg py-4 text-sm uppercase ${
                          selectedSize === size ? "bg-black font-bold text-white" : "bg-[#eeeeee]"
                        }`}
                      >
                        {size}
                      </button>
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
                <button
                  type="button"
                  onClick={addToCart}
                  disabled={addToCartLoading}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-black py-6 text-sm font-bold uppercase tracking-widest text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40"
                >
                  Add to Cart
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </button>
                {addToCartError ? <p className="mt-3 text-xs font-bold text-red-600">{addToCartError}</p> : null}
                {addToCartMessage ? <p className="mt-3 text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
              </div>
            </div>
          </section>
        </div>

        <section className="mt-24 space-y-12">
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

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {listItems.map((item, index) => (
              <a
                key={item.id}
                href={`/product_detail_desktop?product=${encodeURIComponent(item.slug || item.id)}`}
                className="group cursor-pointer space-y-4"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-lg bg-[#f3f3f4]">
                  <img
                    src={item.thumbnail || thumbImages[index % thumbImages.length]}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold uppercase tracking-wider">{item.title}</h3>
                  <p className="text-sm text-neutral-600">${item.price.toFixed(2)}</p>
                </div>
              </a>
            ))}
          </div>

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
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-white/90 px-6 pb-8 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Total</span>
            <span className="text-lg font-black">$285.00</span>
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
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Follow</h4>
            <ul className="space-y-2 text-sm text-neutral-600">
              <li>Instagram</li>
              <li>Tiktok</li>
              <li>Journal</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-widest">Newsletter</h4>
            <div className="flex border-b border-neutral-300 py-2">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full border-none bg-transparent text-sm uppercase tracking-widest placeholder:text-neutral-400 focus:outline-none"
              />
              <a href={CUSTOMER_ROUTES.AUTH} className="material-symbols-outlined text-xl">arrow_forward</a>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-20 flex max-w-7xl flex-col gap-4 border-t border-neutral-300/40 pt-8 text-[10px] font-medium uppercase tracking-widest text-neutral-600 md:flex-row md:items-center md:justify-between">
          <span>© 2024 Kinetic Collective</span>
          <div className="flex gap-8">
            <a href={CUSTOMER_ROUTES.PRIVACY_POLICY}>Privacy Policy</a>
            <a href={CUSTOMER_ROUTES.TERMS_OF_SERVICE}>Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
