"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Star, Minus, Plus, Truck, RotateCcw, ShieldCheck, Check } from "lucide-react";
import { useCartStore } from "../../store/cart-store";
import clsx from "clsx";
import { toast } from "sonner";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ProductDetail({ product }: { product: any }) {
  const [activeImage, setActiveImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("M");
  const [selectedColor, setSelectedColor] = useState("#080808");
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Fallback to array if single image
  const images = product.images?.length > 0 ? product.images : [product.image || product.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='800' viewBox='0 0 600 800'%3E%3Crect width='600' height='800' fill='%231A1A1A'/%3E%3C/svg%3E"];

  const handleAddToCart = () => {
    setIsAdding(true);
    // Simulate network delay for the animation
    setTimeout(() => {
      setIsAdding(false);
      setIsSuccess(true);
      
      // Add to global cart store
      useCartStore.getState().addToCart({
        productId: product.id,
        title: product.title || product.name,
        price: product.price,
        sku: product.slug || product.id,
        stockQuantity: product.stock || 10,
        thumbnail: images[0]
      }, quantity);

      toast.success(`${quantity}x ${product.title || product.name} added to cart`);

      setTimeout(() => {
        setIsSuccess(false);
      }, 1500);
    }, 800);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 py-12 md:py-20 mt-10">
      
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 mb-8 font-sans text-[11px] uppercase tracking-widest text-text-secondary">
        <Link href="/" className="hover:text-gold transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/products" className="hover:text-gold transition-colors">Shop</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-text-primary">{product.categories?.[0] || "Clothing"}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left: Image Gallery */}
        <div className="w-full lg:w-3/5 flex flex-col gap-4">
          <div className="aspect-[4/5] bg-surface rounded-sm overflow-hidden relative">
            {images.map((img: string, idx: number) => (
              <img
                key={idx}
                src={img}
                alt={product.title}
                className={clsx(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ease-in-out",
                  idx === activeImage ? "opacity-100 z-10" : "opacity-0 z-0"
                )}
              />
            ))}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={clsx(
                    "aspect-square bg-surface rounded-sm overflow-hidden relative border-2 transition-all duration-300",
                    idx === activeImage ? "border-gold" : "border-transparent hover:border-gold/50"
                  )}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Info (Sticky) */}
        <div className="w-full lg:w-2/5">
          <div className="sticky top-32 flex flex-col">
            <span className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-gold mb-3">
              {product.brand || "USOLSTICE Exclusive"}
            </span>
            <h1 className="font-heading text-4xl md:text-[40px] leading-tight text-text-primary mb-4">
              {product.title || product.name}
            </h1>
            
            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-gold">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <span className="font-sans text-[13px] text-text-secondary">(128 Reviews)</span>
            </div>

            <div className="flex items-end gap-4 mb-8">
              <span className="font-display text-[32px] text-gold leading-none">
                ${product.price.toFixed(2)}
              </span>
              {product.compareAtPrice && (
                <span className="font-sans text-lg text-text-secondary line-through mb-1">
                  ${product.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            <p className="font-sans text-[14px] font-light text-text-secondary leading-relaxed mb-10">
              {product.description}
            </p>

            <hr className="border-surface mb-10" />

            {/* Colors */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">Color</span>
                <span className="font-sans text-[12px] text-text-secondary">Midnight Black</span>
              </div>
              <div className="flex gap-4">
                {['#080808', '#F0EDE8', '#4A4845'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={clsx(
                      "w-8 h-8 rounded-full relative",
                      selectedColor === color ? "ring-2 ring-offset-2 ring-offset-primary ring-gold" : "hover:scale-110 transition-transform"
                    )}
                    style={{ backgroundColor: color, border: color === '#080808' ? '1px solid #1A1A1A' : 'none' }}
                  />
                ))}
              </div>
            </div>

            {/* Sizes */}
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <span className="font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-primary">Size</span>
                <button className="font-sans text-[12px] text-gold underline underline-offset-4 hover:text-gold-light transition-colors">Size Guide</button>
              </div>
              <div className="flex gap-3 flex-wrap">
                {['XS', 'S', 'M', 'L', 'XL'].map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={clsx(
                      "w-12 h-12 flex items-center justify-center border font-sans text-[13px] rounded-sm transition-all duration-300",
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

            {/* Actions */}
            <div className="flex gap-4 mb-6">
              {/* Quantity */}
              <div className="flex items-center justify-between border border-surface rounded-sm px-4 py-3 w-32 shrink-0">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="text-text-secondary hover:text-gold transition-colors">
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-sans text-[14px] text-text-primary font-medium w-8 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="text-text-secondary hover:text-gold transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <button 
                onClick={handleAddToCart}
                disabled={isAdding || isSuccess}
                className={clsx(
                  "flex-1 relative overflow-hidden rounded-sm h-[50px] font-sans text-[13px] font-bold uppercase tracking-[0.15em] transition-all duration-300",
                  isSuccess ? "bg-status-success text-white border-status-success" : "btn-sweep text-gold"
                )}
              >
                <span className="relative z-10 flex items-center justify-center gap-2 h-full">
                  {isAdding ? (
                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : isSuccess ? (
                    <><Check className="w-5 h-5" /> Added</>
                  ) : (
                    "Add to Cart"
                  )}
                </span>
              </button>
            </div>

            <button className="w-full border border-surface text-text-primary hover:text-gold hover:border-gold/50 h-[50px] rounded-sm font-sans text-[13px] font-bold uppercase tracking-[0.15em] transition-colors mb-10">
              Add to Wishlist
            </button>

            {/* Shipping Info */}
            <div className="flex flex-col gap-4 py-6 border-y border-surface">
              <div className="flex items-center gap-4 text-text-secondary">
                <Truck className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-sans text-[13px]">Complimentary shipping on orders over $100</span>
              </div>
              <div className="flex items-center gap-4 text-text-secondary">
                <RotateCcw className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-sans text-[13px]">Free 30-day returns</span>
              </div>
              <div className="flex items-center gap-4 text-text-secondary">
                <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
                <span className="font-sans text-[13px]">Lifetime authenticity guarantee</span>
              </div>
            </div>

          </div>
        </div>
      </div>
      
    </div>
  );
}
