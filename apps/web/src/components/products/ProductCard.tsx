"use client";

import Link from "next/link";
import { Heart, ShoppingBag, Eye } from "lucide-react";

export interface ProductCardData {
  id: string;
  slug: string;
  label?: string;
  category?: string;
  name: string;
  price: string | number;
  thumbnail?: string | null;
  image?: string | null;
}

interface ProductCardProps {
  product: ProductCardData;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.thumbnail || product.image || "/placeholder.jpg"; // Placeholder image logic

  return (
    <div className="group flex flex-col luxury-card bg-surface rounded-sm relative overflow-hidden">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10">
        {product.category && (
          <span className="bg-primary/80 text-white text-[11px] font-sans px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-sm">
            {product.category}
          </span>
        )}
      </div>
      {product.label && (
        <div className="absolute top-3 right-3 z-10">
          <span className="bg-gold text-primary text-[11px] font-sans px-3 py-1 rounded-full uppercase tracking-wider font-bold">
            {product.label}
          </span>
        </div>
      )}

      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-[#111111]">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.08]"
          loading="lazy"
        />
        
        {/* Action Buttons */}
        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]">
          <button className="bg-surface/90 backdrop-blur-md p-3 rounded-full text-text-primary hover:bg-gold hover:text-primary transition-colors hover:scale-105 active:scale-95 shadow-xl stagger-1">
            <Heart className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button className="bg-surface/90 backdrop-blur-md p-3 rounded-full text-text-primary hover:bg-gold hover:text-primary transition-colors hover:scale-105 active:scale-95 shadow-xl stagger-2">
            <ShoppingBag className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <button className="bg-surface/90 backdrop-blur-md p-3 rounded-full text-text-primary hover:bg-gold hover:text-primary transition-colors hover:scale-105 active:scale-95 shadow-xl stagger-3">
            <Eye className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-2 border-t border-surface">
        <Link href={`/products/${product.slug}`} className="font-sans text-[14px] font-normal text-text-primary hover:text-gold transition-colors line-clamp-1">
          {product.name}
        </Link>
        <span className="font-sans text-[16px] font-medium text-gold group-hover:text-gold-light transition-colors">
          {typeof product.price === 'number' ? `$${product.price.toFixed(2)}` : product.price}
        </span>
      </div>
    </div>
  );
}
