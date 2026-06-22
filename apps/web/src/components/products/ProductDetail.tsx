"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Star, Minus, Plus, Truck, RotateCcw, ShieldCheck, Check, Heart, Share2 } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import clsx from "clsx";
import { toast } from "sonner";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const COLORS = [
  { value: "#080808", label: "Midnight Black" },
  { value: "#F0EDE8", label: "Ivory White" },
  { value: "#4A4845", label: "Slate Grey" },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductDetail({ product }: { product: any }) {
  const router = useRouter();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("#080808");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  const placeholderSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%231A1A1A'/%3E%3C/svg%3E";
  const images: string[] = product.images?.length > 0
    ? product.images
    : [product.image || product.thumbnail || placeholderSvg];

  const selectedColorLabel = COLORS.find((c) => c.value === selectedColor)?.label || "Midnight Black";

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size");
      return;
    }
    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsSuccess(true);

      useCartStore.getState().addToCart(
        {
          productId: product.id,
          title: product.title || product.name,
          price: product.price,
          sku: product.slug || product.id,
          stockQuantity: product.stock || 10,
          thumbnail: images[0] ?? null,
        },
        quantity
      );

      toast.success(`${quantity}× ${product.title || product.name} added to cart`, {
        action: { label: "View Cart", onClick: () => router.push("/cart") },
      });

      setTimeout(() => setIsSuccess(false), 2000);
    }, 600);
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-12 lg:px-24 py-8 md:py-16 mt-[72px] md:mt-[80px]">

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 mb-6 md:mb-10 font-sans text-[11px] uppercase tracking-widest text-text-secondary overflow-x-auto whitespace-nowrap pb-1">
        <Link href="/" className="hover:text-gold transition-colors shrink-0">Home</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <Link href="/products" className="hover:text-gold transition-colors shrink-0">Shop</Link>
        <ChevronRight className="w-3 h-3 shrink-0" />
        <span className="text-text-primary truncate">{product.categories?.[0] || "Clothing"}</span>
      </nav>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 xl:gap-24">

        {/* ── LEFT: IMAGE GALLERY ── */}
        <div className="w-full lg:w-3/5">
          {/* Main Image */}
          <div className="relative aspect-[4/5] sm:aspect-[3/4] bg-surface rounded-sm overflow-hidden">
            {images.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} - view ${idx + 1}`}
                className={clsx(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-in-out",
                  idx === activeImage ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
              />
            ))}
            {/* Image counter badge */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 z-20 bg-primary/80 backdrop-blur-sm text-text-secondary font-sans text-[11px] px-2 py-1 rounded-full">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2 md:gap-3 mt-3">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={clsx(
                    "aspect-square bg-surface rounded-sm overflow-hidden border-2 transition-all duration-200",
                    idx === activeImage ? "border-gold" : "border-transparent hover:border-gold/40"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── RIGHT: PRODUCT INFO ── */}
        <div className="w-full lg:w-2/5 lg:sticky lg:top-[88px] lg:self-start">
          <div className="flex flex-col">

            {/* Brand + Share */}
            <div className="flex items-center justify-between mb-3">
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold">
                {product.brand || "USOLSTICE Exclusive"}
              </span>
              <button
                onClick={handleShare}
                className="text-text-secondary hover:text-gold transition-colors p-1"
                aria-label="Share product"
              >
                <Share2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Title */}
            <h1 className="font-heading text-[28px] sm:text-[34px] md:text-[38px] leading-tight text-text-primary mb-3">
              {product.title || product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-5">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="font-sans text-[13px] text-text-secondary">(128 Reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-end gap-3 mb-5">
              <span className="font-display text-[36px] text-gold leading-none">
                Rs. {product.price?.toLocaleString()}
              </span>
              {product.compareAtPrice && (
                <span className="font-sans text-lg text-text-secondary line-through mb-1">
                  Rs. {product.compareAtPrice?.toLocaleString()}
                </span>
              )}
              {product.compareAtPrice && (
                <span className="font-sans text-[12px] bg-status-success/10 text-status-success px-2 py-0.5 rounded-full mb-1">
                  Save Rs. {(product.compareAtPrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            {/* Description */}
            <div 
              className="font-sans text-[14px] font-light text-text-secondary leading-relaxed mb-6 [&>li]:ml-4 [&>li]:list-disc"
              dangerouslySetInnerHTML={{ __html: product.description || "" }}
            />

            <hr className="border-surface mb-6" />

            {/* Color Selector */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">Color</span>
                <span className="font-sans text-[12px] text-text-secondary">{selectedColorLabel}</span>
              </div>
              <div className="flex gap-3">
                {COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    aria-label={color.label}
                    className={clsx(
                      "w-9 h-9 rounded-full transition-all duration-200 focus:outline-none",
                      selectedColor === color.value
                        ? "ring-2 ring-offset-2 ring-offset-primary ring-gold scale-110"
                        : "hover:scale-110 hover:ring-1 hover:ring-offset-2 hover:ring-offset-primary hover:ring-gold/50"
                    )}
                    style={{
                      backgroundColor: color.value,
                      border: color.value === "#F0EDE8" ? "1px solid #2a2a2a" : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Size Selector */}
            <div className="mb-7">
              <div className="flex justify-between items-center mb-3">
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">Size</span>
                <button className="font-sans text-[12px] text-gold underline underline-offset-4 hover:text-gold-light transition-colors">
                  Size Guide
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {SIZES.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={clsx(
                      "h-11 flex items-center justify-center border font-sans text-[13px] rounded-sm transition-all duration-200 focus:outline-none",
                      selectedSize === size
                        ? "border-gold bg-gold text-primary font-bold"
                        : "border-surface text-text-primary hover:border-gold hover:text-gold"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity + Add to Cart */}
            <div className="flex gap-3 mb-3">
              {/* Quantity control */}
              <div className="flex items-center border border-surface rounded-sm px-3 py-2 w-32 shrink-0">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-text-secondary hover:text-gold transition-colors p-1"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="flex-1 text-center font-sans text-[14px] text-text-primary font-medium">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-text-secondary hover:text-gold transition-colors p-1"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAddToCart}
                disabled={isAdding || isSuccess}
                className={clsx(
                  "flex-1 relative overflow-hidden rounded-sm h-[50px] font-sans text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300 focus:outline-none",
                  isSuccess
                    ? "bg-status-success text-white border border-status-success"
                    : "btn-sweep text-gold border border-gold"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 h-full">
                  {isAdding ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : isSuccess ? (
                    <>
                      <Check className="w-5 h-5" /> Added to Cart
                    </>
                  ) : (
                    "Add to Cart"
                  )}
                </span>
              </button>
            </div>

            {/* Wishlist */}
            <button
              onClick={() => {
                setIsWishlisted(!isWishlisted);
                toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
              }}
              className={clsx(
                "w-full flex items-center justify-center gap-2 h-[50px] rounded-sm border font-sans text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-200 mb-7 focus:outline-none",
                isWishlisted
                  ? "border-gold/60 text-gold"
                  : "border-surface text-text-primary hover:border-gold/50 hover:text-gold"
              )}
            >
              <Heart
                className="w-4 h-4"
                strokeWidth={1.5}
                fill={isWishlisted ? "currentColor" : "none"}
              />
              {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            {/* Shipping / Returns */}
            <div className="flex flex-col gap-3 py-5 border-y border-surface">
              <div className="flex items-start gap-3 text-text-secondary">
                <Truck className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="font-sans text-[13px] leading-snug">
                  Complimentary shipping on orders over $100
                </span>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <RotateCcw className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="font-sans text-[13px] leading-snug">Free 30-day returns & exchanges</span>
              </div>
              <div className="flex items-start gap-3 text-text-secondary">
                <ShieldCheck className="w-5 h-5 mt-0.5 shrink-0" strokeWidth={1.5} />
                <span className="font-sans text-[13px] leading-snug">Lifetime authenticity guarantee</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
