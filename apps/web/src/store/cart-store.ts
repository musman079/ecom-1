"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  title: string;
  sku: string;
  price: number;
  quantity: number;
  stockQuantity: number;
  lineTotal: number;
  thumbnail: string | null;
};

type CartState = {
  items: CartItem[];
  subtotal: number;
  totalItems: number;
  addToCart: (item: Omit<CartItem, "quantity" | "lineTotal">, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

function recalculate(items: CartItem[]) {
  const normalized = items
    .map((item) => {
      const safeQuantity = Math.max(0, Math.min(Math.floor(item.quantity), item.stockQuantity));
      return {
        ...item,
        quantity: safeQuantity,
        lineTotal: Number((item.price * safeQuantity).toFixed(2)),
      };
    })
    .filter((item) => item.quantity > 0);

  const subtotal = Number(normalized.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  const totalItems = normalized.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items: normalized,
    subtotal,
    totalItems,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      subtotal: 0,
      totalItems: 0,
      addToCart: (item, quantity = 1) => {
        set((state) => {
          const requested = Math.max(1, Math.floor(quantity));
          const existing = state.items.find((entry) => entry.productId === item.productId);

          if (!existing) {
            return recalculate([
              ...state.items,
              {
                ...item,
                quantity: requested,
                lineTotal: Number((item.price * requested).toFixed(2)),
              },
            ]);
          }

          return recalculate(
            state.items.map((entry) =>
              entry.productId === item.productId
                ? {
                    ...entry,
                    quantity: entry.quantity + requested,
                  }
                : entry,
            ),
          );
        });
      },
      removeFromCart: (productId) => {
        set((state) => recalculate(state.items.filter((item) => item.productId !== productId)));
      },
      updateQuantity: (productId, quantity) => {
        set((state) =>
          recalculate(
            state.items.map((item) =>
              item.productId === productId
                ? {
                    ...item,
                    quantity,
                  }
                : item,
            ),
          ),
        );
      },
      clearCart: () => {
        set({
          items: [],
          subtotal: 0,
          totalItems: 0,
        });
      },
    }),
    {
      name: "ecommerce-cart-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        totalItems: state.totalItems,
      }),
    },
  ),
);
