"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CUSTOMER_ROUTES } from "../../src/constants/routes";
import { buildAuthHref } from "../../src/lib/auth-redirect";
import { SiteFooter } from "../../src/components/site-footer";
import { FadeIn } from "../../src/components/motion/fade-in";
import { Stagger, StaggerItem } from "../../src/components/motion/stagger";

type WishlistItem = {
  id: string;
  productId: string;
  productTitle: string;
  productSlug: string;
  productImage: string | null;
  productPrice: number;
  addedAt: string;
};

function WishlistContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);
  const authRedirect = useMemo(() => buildAuthHref(nextPath), [nextPath]);

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchWishlist = useCallback(async () => {
    try {
      const res = await fetch("/api/wishlist", { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) {
          router.replace(authRedirect);
          return;
        }
        return;
      }
      const data = await res.json();
      setItems(data.items || data || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [authRedirect, router]);

  useEffect(() => {
    void fetchWishlist();
  }, [fetchWishlist]);

  const handleRemove = async (productId: string) => {
    setRemovingId(productId);
    try {
      await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch {
      /* ignore */
    } finally {
      setRemovingId(null);
    }
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  return (
    <div className="min-h-screen bg-[#0c0a09] text-[#eaf2ff]">
      <main className="mx-auto w-full max-w-[1400px] px-6 py-16 xl:px-12">
        <FadeIn>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#dfb257]">Your Collection</p>
          <h1 className="mt-3 text-4xl font-black uppercase tracking-[-0.04em] sm:text-5xl">Wishlist</h1>
          <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
            Items you&apos;ve saved for later. When you&apos;re ready, they&apos;re waiting.
          </p>
        </FadeIn>

        {loading ? (
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-[3/4] rounded-2xl bg-white/[0.06]" />
                <div className="mt-4 h-4 w-2/3 rounded bg-white/[0.06]" />
                <div className="mt-2 h-3 w-1/3 rounded bg-white/[0.06]" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <FadeIn className="mt-16 flex flex-col items-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] px-8 py-20 text-center backdrop-blur-sm">
            <span className="material-symbols-outlined text-6xl text-white/20">favorite</span>
            <h3 className="mt-6 text-xl font-bold">Your wishlist is empty</h3>
            <p className="mt-3 max-w-sm text-sm text-white/55">
              Browse our collection and save items you love by tapping the heart icon.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} className="mt-8">
              <Link
                href={CUSTOMER_ROUTES.BROWSE_PRODUCTS}
                className="inline-block rounded-full bg-[#dfb257] px-8 py-3.5 text-xs font-bold uppercase tracking-[0.18em] text-[#081224] transition hover:bg-white"
              >
                Browse Products
              </Link>
            </motion.div>
          </FadeIn>
        ) : (
          <Stagger className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AnimatePresence>
              {items.map((item) => (
                <StaggerItem key={item.id || item.productId}>
                  <motion.div
                    layout
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm transition hover:border-white/20"
                  >
                    <Link href={`/product_detail_desktop?product=${encodeURIComponent(item.productSlug || item.productId)}`}>
                      <div className="relative aspect-[3/4] overflow-hidden">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productTitle}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/[0.04]">
                            <span className="material-symbols-outlined text-4xl text-white/20">image</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 transition group-hover:opacity-80" />
                      </div>
                    </Link>

                    <div className="p-5">
                      <h3 className="text-sm font-bold tracking-tight text-white">{item.productTitle}</h3>
                      <p className="mt-1 text-sm font-medium text-[#dfb257]">
                        {item.productPrice ? formatPrice(item.productPrice) : "—"}
                      </p>
                    </div>

                    <button
                      onClick={() => handleRemove(item.productId)}
                      disabled={removingId === item.productId}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/70 backdrop-blur-md transition hover:bg-red-500/30 hover:text-red-400 disabled:opacity-40"
                      aria-label="Remove from wishlist"
                    >
                      <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {removingId === item.productId ? "hourglass_empty" : "close"}
                      </span>
                    </button>
                  </motion.div>
                </StaggerItem>
              ))}
            </AnimatePresence>
          </Stagger>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

export default function WishlistPage() {
  return (
    <Suspense fallback={null}>
      <WishlistContent />
    </Suspense>
  );
}
