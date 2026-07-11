"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Gear } from "@/features/catalog/types";

export type CartItem = {
  id: string; // usually gear.id + "-" + startDate + "-" + endDate, but gear.id is fine for now if they only rent once
  gear: Gear;
  startDate: string;
  endDate: string;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  totalItems: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem("mutux_cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart from local storage", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("mutux_cart", JSON.stringify(items));
    }
  }, [items, isLoaded]);

  const addToCart = (newItem: CartItem) => {
    setItems((currentItems) => {
      // If the gear is already in the cart, we can either update its dates or add a new entry.
      // For simplicity in gear rental, let's just replace if same gear, or you can't add twice.
      // Let's replace the existing one with the new dates.
      const existing = currentItems.find((item) => item.gear.id === newItem.gear.id);
      if (existing) {
        return currentItems.map((item) =>
          item.gear.id === newItem.gear.id ? newItem : item
        );
      }
      return [...currentItems, newItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.length;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
