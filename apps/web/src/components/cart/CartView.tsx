"use client";

import Link from "next/link";
import { useCartStore } from "../../store/cart-store";
import { Minus, Plus, X, ArrowRight, Lock } from "lucide-react";

export function CartView() {
  const { items, subtotal, updateQuantity, removeFromCart } = useCartStore();

  const shipping = subtotal > 100 ? 0 : 15;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 py-24 md:py-32 mt-10 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="font-heading text-4xl text-text-primary mb-6">Your Cart is Empty</h1>
        <p className="font-sans text-text-secondary mb-10 max-w-md">
          Discover our latest collection of premium fashion and lifestyle pieces to elevate your wardrobe.
        </p>
        <Link href="/products" className="btn-sweep bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] px-10 py-4 rounded-full transition-transform hover:scale-[0.97]">
          <span className="relative z-10">Continue Shopping</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-16 lg:px-24 py-12 md:py-20 mt-10">
      <h1 className="font-heading text-4xl md:text-5xl text-text-primary mb-12">Shopping Cart</h1>
      
      <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
        
        {/* Left: Cart Items */}
        <div className="w-full lg:w-[60%] flex flex-col gap-8">
          <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-surface font-sans text-[11px] font-bold uppercase tracking-[0.15em] text-text-secondary">
            <div className="col-span-6">Product</div>
            <div className="col-span-3 text-center">Quantity</div>
            <div className="col-span-2 text-right">Total</div>
            <div className="col-span-1"></div>
          </div>

          <div className="flex flex-col gap-8">
            {items.map((item) => (
              <div key={item.productId} className="flex flex-col md:grid md:grid-cols-12 gap-6 items-center border-b border-surface/50 pb-8 last:border-0 last:pb-0">
                {/* Product Info */}
                <div className="w-full md:col-span-6 flex gap-6">
                  <Link href={`/products/${item.productId}`} className="shrink-0 w-24 h-32 bg-surface rounded-sm overflow-hidden">
                    <img src={item.thumbnail || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='128' viewBox='0 0 96 128'%3E%3Crect width='96' height='128' fill='%231A1A1A'/%3E%3C/svg%3E"} alt={item.title} className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex flex-col justify-center">
                    <Link href={`/products/${item.productId}`} className="font-heading text-xl text-text-primary mb-2 hover:text-gold transition-colors">
                      {item.title}
                    </Link>
                    <span className="font-sans text-[13px] text-text-secondary mb-1">Color: Midnight Black</span>
                    <span className="font-sans text-[13px] text-text-secondary">Size: M</span>
                    <span className="font-sans text-[14px] text-gold mt-3 md:hidden">${item.price.toFixed(2)}</span>
                  </div>
                </div>

                {/* Quantity */}
                <div className="w-full md:col-span-3 flex justify-between md:justify-center items-center">
                  <span className="md:hidden font-sans text-[12px] text-text-secondary uppercase tracking-wider">Quantity:</span>
                  <div className="flex items-center justify-between border border-surface rounded-sm px-3 py-2 w-28">
                    <button onClick={() => updateQuantity(item.productId, item.quantity - 1)} className="text-text-secondary hover:text-gold transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-sans text-[14px] text-text-primary font-medium">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} className="text-text-secondary hover:text-gold transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="hidden md:block col-span-2 text-right">
                  <span className="font-sans text-[16px] text-gold">${item.lineTotal.toFixed(2)}</span>
                </div>

                {/* Remove */}
                <div className="hidden md:flex col-span-1 justify-end">
                  <button onClick={() => removeFromCart(item.productId)} className="text-text-tertiary hover:text-status-error transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Mobile Remove */}
                <button onClick={() => removeFromCart(item.productId)} className="md:hidden w-full text-center font-sans text-[12px] text-text-tertiary underline uppercase tracking-wider">
                  Remove Item
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Order Summary */}
        <div className="w-full lg:w-[40%]">
          <div className="bg-surface p-8 rounded-sm sticky top-32">
            <h2 className="font-heading text-2xl text-text-primary mb-8 pb-4 border-b border-white/5">Order Summary</h2>
            
            <div className="flex flex-col gap-4 mb-8 font-sans text-[14px]">
              <div className="flex justify-between text-text-secondary">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Estimated Shipping</span>
                <span>{shipping === 0 ? "Complimentary" : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-text-secondary">
                <span>Taxes</span>
                <span>Calculated at checkout</span>
              </div>
            </div>

            <div className="flex justify-between items-end mb-8 pt-6 border-t border-white/5">
              <span className="font-sans text-[14px] font-medium text-text-primary uppercase tracking-widest">Total</span>
              <span className="font-display text-[32px] text-gold leading-none">${total.toFixed(2)}</span>
            </div>

            <button className="w-full btn-sweep bg-gold text-primary font-sans text-[13px] font-bold uppercase tracking-[0.15em] h-[54px] rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-[0.98]">
              <span className="relative z-10 flex items-center gap-2">
                Checkout <ArrowRight className="w-4 h-4" />
              </span>
            </button>
            
            <div className="mt-6 flex items-center justify-center gap-2 text-text-tertiary">
              <Lock className="w-3 h-3" />
              <span className="font-sans text-[11px] uppercase tracking-wider">Secure Checkout</span>
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}
