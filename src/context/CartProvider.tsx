import { useState, useMemo, type ReactNode } from 'react';
import { CartContext, type CartItem } from '../context/CartContext';
import type { Listing } from '../types';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (listing: Listing) => {
    setItems(prev => {
      const exists = prev.some(x => x.listing.id === listing.id);
      if (exists) return prev;
      return [...prev, { id: crypto.randomUUID(), listing }];
    });
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
  };

  const clear = () => setItems([]);

  const total = useMemo(() => items.reduce((sum, x) => sum + x.listing.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}
