"use client";

import { useEffect, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { useCartStore } from "../../src/store/cart-store";

import { FadeIn } from "../../src/components/motion/fade-in";
import { kineticEase } from "../../src/components/motion/motion-config";
import { AuthLink } from "../../src/components/auth/auth-link";
import { buildAuthHref } from "../../src/lib/auth-redirect";
import { ChevronDown, Plus, Minus, CheckCircle2, Lock, Truck, Package, ArrowRight } from "lucide-react";


const lookItems: Array<{ category: string; name: string; price: string; image?: string }> = [
  { category: "Accessories", name: "Obsidian Tech Pack", price: "$120.00" },
  { category: "Footwear", name: "Velocity Sneakers", price: "$180.00" },
  { category: "Layering", name: "Core Compression Tee", price: "$65.00" },
];

export function ProductDetailDesktopClient() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState("Black");
  const [selectedSize, setSelectedSize] = useState("S");
  const [quantity, setQuantity] = useState(1);

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
          quantity: quantity,
        }),
      });

      if (response.status === 401) {
        router.push(authRedirect);
        return;
      }

      const payload = (await response.json()) as {
        error?: string;
        cart?: {
          items: any[];
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
      
      // Auto clear message after 3s
      setTimeout(() => setAddToCartMessage(null), 3000);
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
      
      setTimeout(() => setWishlistMessage(null), 3000);
    } catch {
      setWishlistError("Unable to update wishlist due to a network issue.");
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-text-primary -mt-[80px] pt-[80px]">
      <main className="max-w-[1440px] mx-auto pt-8 sm:pt-12">
        {/* Breadcrumb */}
        <nav className="px-4 pb-6 sm:px-6 xl:px-12">
          <ul className="flex items-center gap-2 overflow-x-auto whitespace-nowrap font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">
            <li><a href="/" className="hover:text-gold transition-colors">Home</a></li>
            <li>/</li>
            <li><a href="/product_details" className="hover:text-gold transition-colors">{product?.categories?.[0] || "Catalog"}</a></li>
            <li>/</li>
            <li className="text-text-primary truncate max-w-[200px]">{product?.title || "Product"}</li>
          </ul>
        </nav>

        <section className="grid grid-cols-1 gap-12 px-4 pb-16 sm:px-6 lg:grid-cols-12 xl:px-12 xl:gap-20 sm:pb-24">
          
          {/* ─── LEFT: IMAGES ─── */}
          <div className="flex flex-col gap-4 lg:col-span-7">
            {hasDesktopImages ? (
              <>
                <div className="group relative aspect-[3/4] w-full overflow-hidden bg-surface border border-white/5 rounded-sm">
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
                  {imageCount > 0 && (
                    <div className="absolute bottom-4 right-4 rounded bg-primary/80 backdrop-blur-md px-3 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-white border border-white/10">
                      {activeImageIndex + 1}/{imageCount}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {product?.images?.slice(0, 4).map((image, idx) => (
                    <motion.button
                      key={`${image}-${idx}`}
                      type="button"
                      onClick={() => updateImageIndex(idx)}
                      whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                      className={`aspect-[3/4] overflow-hidden bg-surface border rounded-sm transition-all ${
                        idx === activeImageIndex ? "border-gold" : "border-white/5 hover:border-white/20"
                      }`}
                    >
                      <img src={image} alt={`View ${idx + 1}`} className="h-full w-full object-cover transition duration-700 hover:scale-110" />
                    </motion.button>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex aspect-[3/4] w-full flex-col justify-between overflow-hidden rounded-sm bg-surface border border-white/5 p-8">
                <div className="flex items-center justify-between font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-text-tertiary">
                  <span>{product?.categories?.[0] || "Catalog"}</span>
                  <span>{product?.sku || "SKU PENDING"}</span>
                </div>
                <div className="flex items-center justify-center flex-1">
                  <span className="font-heading text-2xl text-text-tertiary/30 uppercase tracking-widest">No Image Available</span>
                </div>
              </div>
            )}
          </div>

          {/* ─── RIGHT: PRODUCT INFO ─── */}
          <FadeIn className="lg:col-span-5 flex flex-col">
            <div className="lg:sticky lg:top-28 flex flex-col">
              <span className="mb-3 block font-sans text-[10px] font-bold uppercase tracking-[0.3em] text-gold">
                {loading ? "Loading..." : product?.categories?.[0] || "New Arrival"}
              </span>
              
              <h1 className="mb-4 font-heading text-4xl md:text-5xl lg:text-[56px] text-text-primary leading-tight">
                {product?.title || "Product Name"}
              </h1>
              
              <p className="mb-8 font-display text-3xl md:text-4xl text-text-primary">
                {typeof product?.price === "number" ? `$${product.price.toFixed(2)}` : "$0.00"}
                {typeof product?.compareAtPrice === "number" && product.compareAtPrice > product.price && (
                  <span className="ml-4 font-display text-2xl text-text-tertiary line-through decoration-status-error/50">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </p>

              <div className="space-y-8 mb-10">
                {/* Color Selection */}
                <div>
                  <span className="mb-3 block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                    Color: <span className="text-gold">{selectedColor === "Black" ? "Obsidian Black" : selectedColor}</span>
                  </span>
                  <div className="flex gap-4">
                    {(["Black", "Grey", "White"] as const).map((color) => (
                      <motion.button
                        key={color}
                        type="button"
                        onClick={() => setSelectedColor(color)}
                        whileTap={reduceMotion ? undefined : { scale: 0.9 }}
                        className={`h-10 w-10 rounded-full transition-all border-2 ${
                          color === "Black" ? "bg-black" : color === "Grey" ? "bg-[#8A8580]" : "bg-[#F0EDE8]"
                        } ${selectedColor === color ? "border-gold ring-2 ring-gold/20" : "border-white/10"}`}
                        aria-label={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Size: {selectedSize}</span>
                    <button className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary underline underline-offset-4 hover:text-gold transition-colors">
                      Size Guide
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {(["XS", "S", "M", "L"] as const).map((size) => (
                      <motion.button
                        key={size}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        whileHover={reduceMotion ? undefined : { y: -2 }}
                        whileTap={reduceMotion ? undefined : { scale: 0.95 }}
                        className={`h-12 rounded-sm border font-sans text-xs font-bold transition-all ${
                          selectedSize === size 
                            ? "border-gold bg-gold/10 text-gold" 
                            : "border-white/10 text-text-secondary hover:border-white/30"
                        }`}
                      >
                        {size}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <span className="mb-3 block font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">Quantity</span>
                  <div className="flex items-center border border-white/10 rounded-sm overflow-hidden w-32 h-12">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                      className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-30"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-sans text-sm text-text-primary font-medium select-none">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(Math.min(product?.stockQuantity || 1, quantity + 1))}
                      disabled={quantity >= (product?.stockQuantity || 1)}
                      className="w-10 h-full flex items-center justify-center text-text-secondary hover:text-gold hover:bg-white/5 transition-colors disabled:opacity-30"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* CTAs */}
                <div className="flex flex-col gap-4 pt-2">
                  <button
                    type="button"
                    onClick={addToCart}
                    disabled={addToCartLoading || !product?.inStock}
                    className="btn-sweep font-sans text-[12px] font-bold uppercase tracking-[0.18em] h-[56px] rounded-full flex items-center justify-center w-full disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      {addToCartLoading ? "Adding..." : !product?.inStock ? "Out of Stock" : "Add to Bag"}
                    </span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={toggleWishlist}
                    disabled={wishlistLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 h-[56px] font-sans text-[12px] font-bold uppercase tracking-[0.18em] text-text-primary hover:border-gold hover:text-gold transition-colors disabled:opacity-40"
                  >
                    <motion.span
                      animate={wishlisted && !reduceMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      favorite
                    </motion.span>
                    {wishlistLoading ? "Updating..." : wishlisted ? "Saved to Wishlist" : "Save to Wishlist"}
                  </button>
                  
                  {/* Status Messages */}
                  <AnimatePresence>
                    {(addToCartError || addToCartMessage || wishlistError || wishlistMessage) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 mt-2"
                      >
                        {addToCartError && <p className="font-sans text-xs text-status-error flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {addToCartError}</p>}
                        {addToCartMessage && <p className="font-sans text-xs text-status-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {addToCartMessage}</p>}
                        {wishlistError && <p className="font-sans text-xs text-status-error flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {wishlistError}</p>}
                        {wishlistMessage && <p className="font-sans text-xs text-status-success flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> {wishlistMessage}</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Accordions */}
              <div className="space-y-0 border-t border-white/10 mt-auto">
                <details className="group cursor-pointer border-b border-white/10">
                  <summary className="flex list-none items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.2em] py-6 text-text-primary group-hover:text-gold transition-colors">
                    Details & Composition
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="pb-6 font-sans text-sm leading-relaxed text-text-secondary">
                    {error || product?.description || "This product description is currently unavailable."}
                  </p>
                </details>

                <details className="group cursor-pointer border-b border-white/10">
                  <summary className="flex list-none items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.2em] py-6 text-text-primary group-hover:text-gold transition-colors">
                    Shipping & Returns
                    <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="pb-6 space-y-4 font-sans text-sm text-text-secondary">
                    <p className="flex items-center gap-3"><Truck className="w-4 h-4 text-gold"/> Free worldwide shipping on orders over $100.</p>
                    <p className="flex items-center gap-3"><Package className="w-4 h-4 text-gold"/> Premium packaging included.</p>
                    <p className="flex items-center gap-3"><Lock className="w-4 h-4 text-gold"/> 30-day complimentary returns.</p>
                    <p className="text-text-tertiary text-xs uppercase tracking-wider mt-4">SKU: {product?.sku || "N/A"}</p>
                  </div>
                </details>
              </div>
            </div>
          </FadeIn>
        </section>

        {/* ─── COMPLETE THE LOOK ─── */}
        <FadeIn as="section" className="border-t border-white/10 px-4 py-16 sm:px-6 sm:py-24 xl:px-12">
          <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="font-heading text-3xl md:text-5xl text-text-primary">Complete The Look</h3>
              <p className="mt-3 font-sans text-[10px] uppercase tracking-[0.2em] text-text-tertiary">Curated by USolstice Editorial</p>
            </div>
            <a href="/product_details" className="group flex items-center gap-2 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-gold hover:text-white transition-colors">
              Shop Collection <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {lookItems.map((item, idx) => (
              <article key={item.name} className="group cursor-pointer">
                <div className="relative mb-5 flex aspect-[4/5] items-end overflow-hidden rounded-sm bg-surface border border-white/5 p-5">
                  <div className="absolute inset-0 bg-primary/20 transition-colors group-hover:bg-transparent" />
                  
                  {/* Decorative placeholder image effect */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <span className="font-heading text-6xl rotate-[-45deg]">{idx + 1}</span>
                  </div>

                  <AuthLink href={CUSTOMER_ROUTES.CART_CHECKOUT} requiresAuth className="absolute bottom-5 right-5 translate-y-4 rounded-full bg-gold text-primary p-3 opacity-0 shadow-lg transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" ariaLabel="Add To Cart">
                    <Plus className="w-5 h-5" />
                  </AuthLink>
                </div>
                <p className="mb-1 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-text-tertiary">{item.category}</p>
                <h4 className="mb-1 font-heading text-lg text-text-primary group-hover:text-gold transition-colors">{item.name}</h4>
                <p className="font-sans text-sm font-medium text-text-secondary">{item.price}</p>
              </article>
            ))}
          </div>
        </FadeIn>
      </main>

      {/* Mobile Sticky Add to Cart */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-primary/95 p-4 backdrop-blur-xl lg:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="mx-auto flex max-w-[560px] gap-3">
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={wishlistLoading}
            className="w-14 rounded-full border border-white/20 flex items-center justify-center text-text-primary disabled:opacity-40"
          >
            <motion.span
              animate={wishlisted && !reduceMotion ? { scale: [1, 1.25, 1] } : { scale: 1 }}
              transition={{ duration: 0.35 }}
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: wishlisted ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </motion.span>
          </button>
          <button 
            type="button"
            onClick={addToCart}
            disabled={addToCartLoading || !product?.inStock}
            className="flex-1 btn-sweep font-sans text-[11px] font-bold uppercase tracking-[0.18em] py-4 rounded-full text-center disabled:opacity-40"
          >
            <span className="relative z-10">{addToCartLoading ? "Adding..." : "Add to Bag"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
