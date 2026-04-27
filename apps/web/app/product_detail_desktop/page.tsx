"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import LoginRequiredPopup from "../../src/components/login-required-popup";

const navLinks = [
  { label: 'New Arrivals', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Designers', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Editorial', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Archive', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Sustainability', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
];

const lookItems = [
  {
    category: 'Pants',
    name: 'KINETIC STRAIGHT TROUSERS',
    price: '$480.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB8JH5dsxI0_qeqPeR3coZPfuN4vJY-q9voRoFDD25eyjolXEi0neoV2l5UOZC1-1ItxyRn94M-9QGT9FBXLBX8aW7PuKvLYsRR2AKhecsiy4gYy4K7LrNOLc_SC6SR_v2Fgf2JVI_xPlmiLumkQ8WRaMttCLiqKDF9j_p0abxQnZpdC5CF8hkySyO_Z2bvKmCA-UhSN0GYll7SS-VjU8Ed_3CcnDhEIfxzJBUZymXiLaAyjtglKsXwVXiZaHmY8dnlNTcOZTWleQap',
  },
  {
    category: 'Footwear',
    name: 'KINETIC 0.2 SNEAKER',
    price: '$620.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB_dTvGKU_cyi3jj3qtcUp90hSyZ8Qfjre3dWkXsVmVcPdqC0wB9MzLL0N3byYuFSxxS5z4nrju2NncudNW0T8Uwhxd_GC_qMJK8GU6PsCil1J9Jj5AZmeCySVSM3iw40qO01ApJU2Cbs2Xp1lHqGZvaAM3eDmKARct7j-3jxrWS8CoaH4lCWMLNJj5HeVIFuqMBRlLuiXEpwDimb9aCx7KSPHKN9z1Neilkm0hqrk5rMukD2pVjbLg5lOEeoIXbc2ub3QkDPnXqplw',
  },
  {
    category: 'Accessories',
    name: 'MODULAR LEATHER TOTE',
    price: '$890.00',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCUMq7WEFpTbAAaz6R6BfNEy-an0lMnNDsoMMWRQIr4gFjB19gl3O7XTDDUQOaG1ReFJSuY0NCAB5xpUOUFVrXAuA1k21_IILUkFCbpo9Ra6Zfd4I594s5e-6UcEkAZGPW8QYYbewFI1NQfCJ3Bw48_g1Jobf1VlCyj73Q6FlLxhP4nnc5nA9SOkAH7jzJ0G6TkKlHhxW_MU3sqdUGYPs56w05pOxFU0VCrYMC-3QzRcDttVgqqGqvys5W7QxY_pOIAfo3KgT1SyTId',
  },
];

const desktopTones = [
  "from-[#ececec] via-white to-[#dcdcdc]",
  "from-[#f0ebe4] via-white to-[#d8d1c7]",
  "from-[#e5ecef] via-white to-[#cfd8de]",
] as const;

function getDesktopTone(index: number) {
  return desktopTones[index % desktopTones.length];
}

export default function ProductDetailDesktopPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("S");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<{
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
  } | null>(null);
  const [addToCartLoading, setAddToCartLoading] = useState(false);
  const [addToCartMessage, setAddToCartMessage] = useState<string | null>(null);
  const [addToCartError, setAddToCartError] = useState<string | null>(null);
  const [showLoginPopup, setShowLoginPopup] = useState(false);

  const productIdOrSlug = useMemo(() => searchParams.get("product")?.trim() ?? "", [searchParams]);
  const hasDesktopImages = Boolean(product?.images && product.images.length > 0);

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true);
      setError(null);

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
          setError("No published products available.");
          return;
        }

        const response = await fetch(`/api/products/${encodeURIComponent(value)}`, { cache: "no-store" });
        if (response.status === 404) {
          setProduct(null);
          setError("Product not found.");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load product details.");
        }

        const payload = (await response.json()) as {
          product?: {
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
        };

        const product = payload.product;
        if (product) {
          // Ensure images is always an array
          product.images = Array.isArray(product.images) ? product.images : [];
        }
        setProduct(product ?? null);
      } catch {
        setProduct(null);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productIdOrSlug]);

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
        setShowLoginPopup(true);
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
    <div className="min-h-screen bg-[#f3f3f4] text-[#1a1c1c]">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-black/5 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center justify-between px-4 sm:h-20 sm:px-6 xl:px-12">
          <h1 className="text-2xl font-black tracking-[-0.06em] sm:text-3xl">KINETIC</h1>

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="border-b border-transparent pb-1 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 transition-colors hover:text-black"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <a href={CUSTOMER_ROUTES.PROFILE} aria-label="Favorite">
              <span className="material-symbols-outlined">favorite</span>
            </a>
            <a href={CUSTOMER_ROUTES.CART_CHECKOUT} className="relative" aria-label="Shopping Bag">
              <span className="material-symbols-outlined">shopping_bag</span>
            </a>
            <a href={CUSTOMER_ROUTES.PROFILE} aria-label="Profile">
              <span className="material-symbols-outlined">person</span>
            </a>
          </div>
        </div>
      </header>

      <main className="pt-16 sm:pt-20">
        <nav className="px-4 py-6 sm:px-6 sm:py-8 xl:px-12">
          <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            <li>Archive</li>
            <li>/</li>
            <li>Outerwear</li>
            <li>/</li>
            <li className="text-black">Kinetic 01-Tech Coat</li>
          </ul>
        </nav>

        <section className="grid grid-cols-1 gap-0 px-0 pb-16 sm:pb-24 lg:grid-cols-12 lg:px-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            {hasDesktopImages ? (
              <>
                <div className="group aspect-[3/4] w-full overflow-hidden bg-neutral-200">
                  <img
                    src={product?.images?.[0] || ""}
                    alt={product?.title || "Product image"}
                    className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-200">
                    <img
                      src={product?.images?.[1] || product?.images?.[0] || ""}
                      alt="Detail View"
                      className="h-full w-full object-cover transition duration-700 hover:scale-110"
                    />
                  </div>
                  <div className="aspect-[3/4] overflow-hidden bg-neutral-200">
                    <img
                      src={product?.images?.[2] || product?.images?.[0] || ""}
                      alt="Styling Shot"
                      className="h-full w-full object-cover transition duration-700 hover:scale-110"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className={`flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-xl bg-gradient-to-br ${getDesktopTone(0)} p-8 lg:aspect-[3/4]`}>
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">
                  <span>{product?.categories?.[0] || "Published product"}</span>
                  <span>{product?.sku || "SKU pending"}</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">Catalog preview</p>
                  <h2 className="mt-3 max-w-xl text-4xl font-black uppercase leading-[0.9] tracking-[-0.06em] sm:text-5xl">
                    {product?.title || "Product preview"}
                  </h2>
                  <p className="mt-4 max-w-lg text-sm leading-7 text-neutral-600">
                    {product?.description || "Published product images will appear here once media assets are available."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="px-4 pt-10 sm:px-6 sm:pt-12 lg:col-span-5 lg:px-0 lg:pl-20 lg:pt-0">
            <div className="lg:sticky lg:top-32 lg:max-w-md">
              <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.3em] text-[#497cff]">
                {loading ? "Loading..." : "New Season Collection"}
              </span>
              <h2 className="mb-4 text-4xl font-black uppercase leading-[0.86] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                {product?.title || "Product"}
              </h2>
              <p className="mb-8 text-3xl font-light text-neutral-600 sm:text-4xl">
                {typeof product?.price === "number" ? `$${product.price.toFixed(2)}` : "$0.00"}
                {typeof product?.compareAtPrice === "number" ? (
                  <span className="ml-3 text-xl text-neutral-400 line-through">${product.compareAtPrice.toFixed(2)}</span>
                ) : null}
              </p>

              <div className="mb-12 space-y-8">
                <div>
                  <span className="mb-4 block text-[10px] font-semibold uppercase tracking-[0.2em]">Color - {selectedColor === "Black" ? "Obsidian Black" : selectedColor}</span>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setSelectedColor("Black")} className={`h-8 w-8 rounded-full bg-black ${selectedColor === "Black" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Black" />
                    <button type="button" onClick={() => setSelectedColor("Grey")} className={`h-8 w-8 rounded-full bg-neutral-400 transition-all hover:ring-2 hover:ring-neutral-300 hover:ring-offset-2 ${selectedColor === "Grey" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="Grey" />
                    <button type="button" onClick={() => setSelectedColor("White")} className={`h-8 w-8 rounded-full bg-neutral-200 transition-all hover:ring-2 hover:ring-neutral-200 hover:ring-offset-2 ${selectedColor === "White" ? "ring-2 ring-black ring-offset-2" : ""}`} aria-label="White" />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Size - International</span>
                    <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500 underline underline-offset-4">
                      Size Guide
                    </a>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {(["XS", "S", "M", "L"] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`h-12 rounded-xl border text-xs font-semibold ${
                          selectedSize === size ? "border-black bg-black font-bold text-white" : "border-neutral-300"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={addToCartLoading}
                    className="block w-full rounded-full bg-black py-5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-black/10 transition-transform hover:scale-[1.01] disabled:opacity-40"
                  >
                    {addToCartLoading ? "Adding..." : "Add to Cart"}
                  </button>
                  <a href={CUSTOMER_ROUTES.PROFILE} className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:bg-neutral-200">
                    <span className="material-symbols-outlined text-sm">favorite</span>
                    Add to Wishlist
                  </a>
                  {addToCartError ? <p className="text-xs font-bold text-red-600">{addToCartError}</p> : null}
                  {addToCartMessage ? <p className="text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
                </div>
              </div>

              <div className="space-y-6 border-t border-neutral-300/60 pt-8">
                <details className="group cursor-pointer">
                  <summary className="flex list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                    Fabric &amp; Composition
                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p className="pt-4 text-sm leading-relaxed text-neutral-600">
                    {error || product?.description || "This product description is currently unavailable."}
                  </p>
                </details>

                <details className="group cursor-pointer">
                  <summary className="flex list-none items-center justify-between text-[10px] font-bold uppercase tracking-[0.2em]">
                    Shipping &amp; Returns
                    <span className="material-symbols-outlined transition-transform group-open:rotate-180">expand_more</span>
                  </summary>
                  <p className="pt-4 text-sm leading-relaxed text-neutral-600">
                    SKU {product?.sku || "N/A"}. Stock {typeof product?.stockQuantity === "number" ? product.stockQuantity : 0}. {product?.inStock ? "In stock" : "Out of stock"}.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-neutral-200/50 px-4 py-16 sm:px-6 sm:py-24 xl:px-12">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">Complete The Look</h3>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-neutral-500">Curated by Kinetic Editorial</p>
            </div>
            <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="self-start border-b-2 border-black pb-1 text-xs font-bold uppercase tracking-[0.2em] md:self-auto">
              Shop All Recommendations
            </a>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
            {lookItems.map((item) => (
              <article key={item.name} className="group cursor-pointer">
                <div className={`relative mb-6 flex aspect-[4/5] items-end overflow-hidden rounded-xl bg-gradient-to-br ${getDesktopTone(1)} p-5`}>
                  <div className="rounded-[1.1rem] border border-black/5 bg-white/35 p-4 text-[#1a1c1c] backdrop-blur-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-neutral-500">{item.category}</p>
                    <h4 className="mt-2 text-lg font-black uppercase leading-[0.95] tracking-[-0.05em]">{item.name}</h4>
                    <p className="mt-3 text-sm font-medium text-neutral-600">{item.price}</p>
                  </div>
                  <a href={CUSTOMER_ROUTES.CART_CHECKOUT} className="absolute bottom-4 right-4 translate-y-2 rounded-full bg-white p-3 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100" aria-label="Add To Cart">
                    <span className="material-symbols-outlined">add</span>
                  </a>
                </div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500">{item.category}</p>
                <h4 className="mb-2 text-sm font-bold tracking-tight">{item.name}</h4>
                <p className="text-xs font-medium text-neutral-600">{item.price}</p>
              </article>
            ))}

            <article className="relative overflow-hidden rounded-xl bg-black p-8 text-white">
              <div className="relative z-10">
                <span className="mb-6 block text-[10px] font-bold uppercase tracking-[0.3em] text-neutral-400">The Edit</span>
                <h4 className="mb-8 text-4xl font-black uppercase italic leading-[0.9] tracking-[-0.05em] sm:text-5xl">
                  The Art of
                  <br />
                  Layering:
                  <br />
                  Techwear
                  <br />
                  for the
                  <br />
                  Modern
                  <br />
                  Nomad.
                </h4>
                <a href={CUSTOMER_ROUTES.BROWSE_PRODUCTS} className="inline-flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
                  Read Story
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>
              </div>
            </article>
          </div>
        </section>

        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
            <div className="flex flex-col gap-6">
              <div className="text-2xl font-black tracking-[-0.04em]">KINETIC</div>
              <p className="max-w-xs text-xs leading-7 tracking-[0.08em] text-neutral-400">
                Redefining the digital editorial experience through a fusion of high-fashion aesthetics and technical performance.
              </p>
            </div>

            <div className="space-y-3 text-xs tracking-[0.14em] text-neutral-400">
              <h5 className="mb-2 font-bold uppercase text-black">Customer Care</h5>
              <p>Shipping &amp; Returns</p>
              <p>Size Guide</p>
              <p>Order Tracking</p>
            </div>

            <div className="space-y-3 text-xs tracking-[0.14em] text-neutral-400">
              <h5 className="mb-2 font-bold uppercase text-black">Connect</h5>
              <p>Instagram</p>
              <p>Twitter</p>
              <p>Store Locator</p>
            </div>

            <div className="space-y-6">
              <h5 className="font-bold uppercase tracking-[0.2em] text-black text-[10px]">Newsletter</h5>
              <div className="relative">
                <input
                  type="email"
                  placeholder="EMAIL ADDRESS"
                  className="w-full border-b border-neutral-300 bg-transparent pb-2 text-[10px] tracking-[0.2em] uppercase focus:border-black focus:outline-none"
                />
                <a href={CUSTOMER_ROUTES.AUTH} className="absolute bottom-2 right-0 text-[10px] font-bold uppercase tracking-[0.2em]">Join</a>
              </div>
            </div>
          </div>

          <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 border-t border-black/5 px-6 py-8 md:flex-row md:items-center md:justify-between xl:px-12">
            <span className="text-xs uppercase tracking-[0.14em] text-neutral-400">© 2024 Kinetic Editorial. All Rights Reserved.</span>
            <div className="flex gap-8 text-xs tracking-[0.14em] text-neutral-400">
              <a href={CUSTOMER_ROUTES.PRIVACY_POLICY} className="underline underline-offset-4">Privacy Policy</a>
              <a href={CUSTOMER_ROUTES.TERMS_OF_SERVICE} className="underline underline-offset-4">Terms of Use</a>
            </div>
          </div>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[560px] gap-2">
          <a href={CUSTOMER_ROUTES.PROFILE} className="flex-1 rounded-full border border-neutral-300 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em]">
            Wishlist
          </a>
          <a href={CUSTOMER_ROUTES.CART_CHECKOUT} className="flex-1 rounded-full bg-black py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white">
            Add to Cart
          </a>
        </div>
      </div>

      <LoginRequiredPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLogin={() => {
          setShowLoginPopup(false);
          router.push(CUSTOMER_ROUTES.AUTH);
        }}
      />
    </div>
  );
}
