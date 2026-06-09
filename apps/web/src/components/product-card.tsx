"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { kineticEase } from "./motion/motion-config";
import { buildAuthHref } from "../lib/auth-redirect";
import { useCartStore } from "../store/cart-store";

const cardTones = [
  "from-[#15233b] via-[#101b31] to-[#0e1728]",
  "from-[#1a2340] via-[#111a31] to-[#0c1527]",
  "from-[#143039] via-[#10242d] to-[#0b1b23]",
  "from-[#261a3f] via-[#191230] to-[#100c21]",
] as const;

const lightTones = [
  "from-[#ececec] via-white to-[#dcdcdc]",
  "from-[#f0ebe4] via-white to-[#d8d1c7]",
  "from-[#e5ecef] via-white to-[#cfd8de]",
] as const;

export type ProductCardData = {
  id?: string;
  slug?: string;
  label?: string;
  category?: string;
  name: string;
  title?: string;
  price: string;
  thumbnail?: string | null;
};

type ProductCardProps = {
  item: ProductCardData;
  index: number;
  href: string;
  variant?: "dark" | "light" | "compact";
  className?: string;
};

function getTone(index: number, variant: "dark" | "light" | "compact") {
  const tones = variant === "light" ? lightTones : cardTones;
  return tones[index % tones.length];
}

export function ProductCard({ item, index, href, variant = "dark", className = "" }: ProductCardProps) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();

  const [loading, setLoading] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const displayName = item.name || item.title || "Product";
  const tone = getTone(index, variant);
  const isDark = variant === "dark" || variant === "compact";
  const revealPillClass = isDark ? "bg-white/85 text-[#0b1220]" : "bg-black/80 text-white";
  const revealOutlineClass = isDark
    ? "border border-white/30 bg-black/40 text-white"
    : "border border-black/15 bg-white/85 text-neutral-700";

  // Check wishlist state on mount
  useEffect(() => {
    if (!item.id) return;
    const checkSaved = async () => {
      try {
        const res = await fetch("/api/wishlist", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data || [];
          setIsSaved(items.some((w: { productId: string }) => w.productId === item.id));
        }
      } catch {
        /* ignore */
      }
    };
    void checkSaved();
  }, [item.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.id) return;
    setWishlistLoading(true);

    try {
      const response = await fetch(
        isSaved ? `/api/wishlist?productId=${encodeURIComponent(item.id)}` : "/api/wishlist",
        {
          method: isSaved ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: isSaved ? undefined : JSON.stringify({ productId: item.id }),
        }
      );

      if (response.status === 401) {
        toast.error("Please login to save items.", {
          action: {
            label: "Login",
            onClick: () => router.push(buildAuthHref(pathname)),
          },
        });
        return;
      }

      if (!response.ok) {
        throw new Error();
      }

      setIsSaved(!isSaved);
      toast.success(isSaved ? "Removed from Wishlist" : "Saved to Wishlist");
    } catch {
      toast.error("Failed to update wishlist.");
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!item.id) return;
    setLoading(true);

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: item.id, quantity: 1 }),
      });

      if (response.status === 401) {
        toast.error("Please login to checkout.", {
          action: {
            label: "Login",
            onClick: () => router.push(buildAuthHref(pathname)),
          },
        });
        return;
      }

      const payload = await response.json();
      if (!response.ok || !payload.cart) {
        throw new Error(payload.error || "Failed to add.");
      }

      useCartStore.getState().setCart(payload.cart);
      toast.success(`${displayName} added to cart!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add to cart.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <>
      <div
        className={`relative mb-6 flex overflow-hidden rounded-xl bg-gradient-to-br ${tone} p-6 ${
          variant === "compact" ? "aspect-[4/5] items-end p-5" : "aspect-[3/4]"
        }`}
      >
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={displayName}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-white/5">
            <div
              className={`rounded-full border px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] ${
                isDark ? "border-white/10 bg-white/5 text-white/55" : "border-black/10 bg-white/80 text-neutral-500"
              }`}
            >
              No Image
            </div>
          </div>
        )}
        <div
          className={`absolute inset-0 transition duration-500 ${
            item.thumbnail
              ? "bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-70 group-hover:opacity-100"
              : "bg-black/10"
          }`}
        />

        {/* Quick Wishlist button */}
        {item.id && (
          <button
            onClick={handleWishlistToggle}
            disabled={wishlistLoading}
            className={`absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full border backdrop-blur-md transition-all duration-300 hover:scale-110 disabled:opacity-40 ${
              isSaved
                ? "bg-[#ff496c] border-[#ff496c] text-white"
                : isDark
                  ? "bg-black/40 border-white/15 text-white/70 hover:text-white"
                  : "bg-white/60 border-black/10 text-neutral-700 hover:text-black"
            }`}
            aria-label="Save to Wishlist"
          >
            <span
              className="material-symbols-outlined text-base transition-colors"
              style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
            >
              favorite
            </span>
          </button>
        )}

        {/* Quick Add to Cart button */}
        {item.id && (
          <button
            onClick={handleAddToCart}
            disabled={loading}
            className="absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-[#dfb257] text-[#081224] opacity-0 shadow-lg transition-all duration-300 translate-y-2 group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105 hover:bg-white disabled:opacity-40"
            aria-label="Quick Add to Cart"
          >
            <span className="material-symbols-outlined text-base font-bold">
              {loading ? "hourglass_empty" : "shopping_bag"}
            </span>
          </button>
        )}

        <div className="pointer-events-none absolute inset-0 flex items-end justify-between p-5 opacity-0 transition duration-500 group-hover:opacity-100">
          <span className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${revealPillClass}`}>
            View
          </span>
          <span className={`rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-[0.18em] ${revealOutlineClass}`}>
            Details
          </span>
        </div>
        {variant !== "light" ? (
          <div className="relative flex h-full w-full flex-col justify-between rounded-[1.25rem] border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition duration-500 group-hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/65">
              <span>{item.label || "Collection"}</span>
              <span>{item.price}</span>
            </div>
            <div>
              {item.category ? (
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/65">{item.category}</p>
              ) : null}
              <h4 className="mt-3 text-2xl font-black uppercase leading-[0.95] tracking-[-0.05em] text-white">
                {displayName}
              </h4>
            </div>
          </div>
        ) : null}
      </div>
      {variant === "light" ? (
        <div className="space-y-1 px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">{item.label}</p>
          <h4 className="text-sm font-bold uppercase tracking-tight text-black">{displayName}</h4>
          <p className="text-sm font-medium text-neutral-600">{item.price}</p>
        </div>
      ) : variant === "compact" ? (
        <>
          <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-white">{displayName}</h4>
          <p className="text-xs text-white/60">{item.price}</p>
        </>
      ) : (
        <>
          <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-white/55">{item.label}</p>
          <h4 className="mb-2 text-base font-bold tracking-tight text-white">{displayName}</h4>
          <p className="text-sm font-medium text-white/85">{item.price}</p>
        </>
      )}
    </>
  );

  const linkClass = `group cursor-pointer block ${className}`;

  if (reduceMotion) {
    return (
      <Link href={href} className={linkClass}>
        {content}
      </Link>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.35, ease: kineticEase }}
    >
      <Link href={href} className={linkClass}>
        {content}
      </Link>
    </motion.div>
  );
}
