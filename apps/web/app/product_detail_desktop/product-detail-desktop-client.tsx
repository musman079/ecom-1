"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { useCartStore } from "../../src/store/cart-store";
import CartBadge from "../../src/components/CartBadge";
import { FadeIn } from "../../src/components/motion/fade-in";
import { kineticEase } from "../../src/components/motion/motion-config";
import { AuthLink } from "../../src/components/auth/auth-link";
import { buildAuthHref } from "../../src/lib/auth-redirect";

const navLinks = [
  { label: 'New Arrivals', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Designers', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
  { label: 'Editorial', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Archive', href: CUSTOMER_ROUTES.PRODUCT_DETAILS },
  { label: 'Sustainability', href: CUSTOMER_ROUTES.BROWSE_PRODUCTS },
];

const lookItems: Array<{ category: string; name: string; price: string; image?: string }> = [];

const desktopTones = [
  "from-[#ececec] via-white to-[#dcdcdc]",
  "from-[#f0ebe4] via-white to-[#d8d1c7]",
  "from-[#e5ecef] via-white to-[#cfd8de]",
] as const;

function getDesktopTone(index: number) {
  return desktopTones[index % desktopTones.length];
}

export function ProductDetailDesktopClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
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
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState<string | null>(null);
  const [wishlistError, setWishlistError] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageDirection, setImageDirection] = useState(0);
  const reduceMotion = useReducedMotion();
  const setCart = useCartStore((state) => state.setCart);

  const productIdOrSlug = useMemo(() => searchParams.get("product")?.trim() ?? "", [searchParams]);
  const hasDesktopImages = Boolean(product?.images && product.images.length > 0);
  const imageCount = product?.images?.length ?? 0;
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const authRedirect = useMemo(() => buildAuthHref(nextPath), [nextPath]);
  const imageVariants = {
    enter: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? 28 : -28,
      scale: 1.02,
    }),
    center: { opacity: 1, x: 0, scale: 1 },
    exit: (direction: number) => ({
      opacity: 0,
      x: direction > 0 ? -28 : 28,
      scale: 0.98,
    }),
  };

  const updateImageIndex = (nextIndex: number) => {
    if (nextIndex === activeImageIndex) {
      return;
    }

    setImageDirection(nextIndex > activeImageIndex ? 1 : -1);
    setActiveImageIndex(nextIndex);
  };

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
        setActiveImageIndex(0);
        setImageDirection(0);
      } catch {
        setProduct(null);
        setError("Failed to load product details.");
      } finally {
        setLoading(false);
      }
    };

    void loadProduct();
  }, [productIdOrSlug]);

  useEffect(() => {
    const syncWishlistState = async () => {
      if (!product?.id) {
        setWishlisted(false);
        return;
      }

      try {
        const response = await fetch("/api/wishlist", { cache: "no-store" });
        if (response.status !== 200) {
          setWishlisted(false);
          return;
        }

        const payload = (await response.json()) as { items?: Array<{ productId: string }> };
        setWishlisted(Array.isArray(payload.items) && payload.items.some((item) => item.productId === product.id));
      } catch {
        setWishlisted(false);
      }
    };

    void syncWishlistState();
  }, [product?.id]);

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
        router.push(authRedirect);
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

  const toggleWishlist = async () => {
    setWishlistError(null);
    setWishlistMessage(null);

    if (!product?.id) {
      setWishlistError("No published product is available to save right now.");
      return;
    }

    setWishlistLoading(true);

    try {
      const requestUrl = wishlisted ? `/api/wishlist?productId=${encodeURIComponent(product.id)}` : "/api/wishlist";
      const response = await fetch(requestUrl, {
        method: wishlisted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: wishlisted ? undefined : JSON.stringify({ productId: product.id }),
      });

      if (response.status === 401) {
        router.push(authRedirect);
        return;
      }

      const payload = (await response.json()) as { error?: string; saved?: boolean; removed?: boolean; isWishlisted?: boolean };

      if (!response.ok) {
        setWishlistError(payload.error ?? "Unable to update wishlist right now.");
        return;
      }

      const nextWishlisted = typeof payload.isWishlisted === "boolean" ? payload.isWishlisted : !wishlisted;
      setWishlisted(nextWishlisted);
      setWishlistMessage(nextWishlisted ? "Added to wishlist." : "Removed from wishlist.");
    } catch {
      setWishlistError("Unable to update wishlist due to a network issue.");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f3f4] text-[#1a1c1c] -mt-20 pt-20">
      <main className="pt-16 sm:pt-20">
        <nav className="px-4 py-6 sm:px-6 sm:py-8 xl:px-12">
          <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
            <li>Archive</li>
            <li>/</li>
            <li>Outerwear</li>
            <li>/</li>
            <li className="text-black">USolstice 01-Tech Coat</li>
          </ul>
        </nav>

        <section className="grid grid-cols-1 gap-0 px-0 pb-16 sm:pb-24 lg:grid-cols-12 lg:px-12">
          <div className="flex flex-col gap-4 lg:col-span-7">
            {hasDesktopImages ? (
              <>
                <div className="group relative aspect-[3/4] w-full overflow-hidden bg-neutral-200">
                  <AnimatePresence mode="wait" custom={imageDirection}>
                    <motion.img
                      key={product?.images?.[activeImageIndex] ?? activeImageIndex}
                      src={product?.images?.[activeImageIndex] || ""}
                      alt={product?.title || "Product image"}
                      custom={imageDirection}
                      variants={imageVariants}
                      initial={reduceMotion ? false : "enter"}
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.5, ease: kineticEase }}
                      className="h-full w-full object-cover transition duration-1000 group-hover:scale-105"
                    />
                  </AnimatePresence>
                  {imageCount > 0 ? (
                    <div className="absolute bottom-4 right-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">
                      {activeImageIndex + 1}/{imageCount}
                    </div>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-2">
                  {product?.images?.slice(0, 4).map((image, idx) => (
                    <motion.button
                      key={`${image}-${idx}`}
                      type="button"
                      onClick={() => updateImageIndex(idx)}
                      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                      className={`aspect-[3/4] overflow-hidden bg-neutral-200 text-left ${
                        idx === activeImageIndex ? "ring-2 ring-black ring-offset-2" : ""
                      }`}
                    >
                      <img src={image} alt={`View ${idx + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-110" />
                    </motion.button>
                  ))}
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

          <FadeIn className="px-4 pt-10 sm:px-6 sm:pt-12 lg:col-span-5 lg:px-0 lg:pl-20 lg:pt-0">
            <div className="lg:sticky lg:top-32 lg:max-w-md">
              <span className="mb-4 block text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">
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
                    {(["Black", "Grey", "White"] as const).map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                        className={`h-8 w-8 rounded-full transition-all ${
                          color === "Black" ? "bg-black" : color === "Grey" ? "bg-neutral-400" : "bg-neutral-200"
                        } ${selectedColor === color ? "ring-2 ring-black ring-offset-2" : ""}`}
                        aria-label={color}
                      />
                    ))}
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
                      <motion.button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        whileHover={reduceMotion ? undefined : { y: -2 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                        className={`h-12 rounded-xl border text-xs font-semibold transition ${
                          selectedSize === size ? "border-black bg-black font-bold text-white" : "border-neutral-300"
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <motion.button
                    type="button"
                    onClick={addToCart}
                    disabled={addToCartLoading}
                    whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="block w-full rounded-full bg-black py-5 text-center text-sm font-bold uppercase tracking-[0.2em] text-white shadow-xl shadow-black/10 disabled:opacity-40"
                  >
                    {addToCartLoading ? "Adding..." : "Add to Cart"}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    whileTap={reduceMotion ? undefined : { scale: 0.98 }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-5 text-sm font-bold uppercase tracking-[0.2em] transition-colors hover:bg-neutral-200 disabled:opacity-40"
                  >
                    <motion.span
                      animate={wishlisted && !reduceMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </motion.span>
                    {wishlistLoading ? "Updating..." : wishlisted ? "Wishlisted" : "Add to Wishlist"}
                  </motion.button>
                  {addToCartError ? <p className="text-xs font-bold text-red-600">{addToCartError}</p> : null}
                  {addToCartMessage ? <p className="text-xs font-bold text-emerald-700">{addToCartMessage}</p> : null}
                  {wishlistError ? <p className="text-xs font-bold text-red-600">{wishlistError}</p> : null}
                  {wishlistMessage ? <p className="text-xs font-bold text-emerald-700">{wishlistMessage}</p> : null}
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
          </FadeIn>
        </section>

        <FadeIn as="section" className="bg-neutral-200/50 px-4 py-16 sm:px-6 sm:py-24 xl:px-12">
          <div className="mb-16 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-3xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-5xl">Complete The Look</h3>
              <p className="mt-2 text-sm uppercase tracking-[0.16em] text-neutral-500">Curated by USolstice Editorial</p>
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
                  <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth className="absolute bottom-4 right-4 translate-y-2 rounded-full bg-white p-3 opacity-0 shadow-lg transition-all group-hover:translate-y-0 group-hover:opacity-100" ariaLabel="Add To Cart">
                    <span className="material-symbols-outlined">add</span>
                  </AuthLink>
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
        </FadeIn>

        <footer className="border-t border-black/5 bg-white">
          <div className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-12 px-6 py-20 md:grid-cols-4 xl:px-12">
            <div className="flex flex-col gap-6">
              <div className="text-2xl font-black tracking-[-0.04em]">USOLSTICE</div>
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
            <span className="text-xs uppercase tracking-[0.14em] text-neutral-400">© 2024 USolstice Editorial. All Rights Reserved.</span>
            <div className="flex gap-8 text-xs tracking-[0.14em] text-neutral-400">
              <a href={CUSTOMER_ROUTES.PRIVACY_POLICY} className="underline underline-offset-4">Privacy Policy</a>
              <a href={CUSTOMER_ROUTES.TERMS_OF_SERVICE} className="underline underline-offset-4">Terms of Use</a>
            </div>
          </div>
        </footer>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 backdrop-blur-xl lg:hidden">
        <div className="mx-auto flex max-w-[560px] gap-2">
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className="flex-1 rounded-full border border-neutral-300 py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] disabled:opacity-40"
          >
            {wishlistLoading ? "Updating" : wishlisted ? "Wishlisted" : "Wishlist"}
          </button>
          <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth className="flex-1 rounded-full bg-black py-3 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-white" ariaLabel="Add to Cart">
            Add to Cart
          </AuthLink>
        </div>
      </div>

    </div>
  );
}
