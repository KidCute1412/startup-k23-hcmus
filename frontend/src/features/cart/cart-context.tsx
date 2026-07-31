"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useCartState } from "@/hooks/useCart";
export type { CartItem } from "@/types/cart";

type CartContextValue = ReturnType<typeof useCartState>;
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  return <CartContext.Provider value={useCartState()}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
