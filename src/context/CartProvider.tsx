import { useState, useMemo, useEffect, type ReactNode } from 'react';
import { CartContext, type CartItem } from '../context/CartContext';
import type { Listing } from '../types';
import { trpc } from '@/providers/trpc';

function getOrCreateSessionId() {
  try {
    let sid = localStorage.getItem('vault_session_id');
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem('vault_session_id', sid);
    }
    return sid;
  } catch { return null }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Ensure session id exists so cart.get can resolve guest cart
  useEffect(() => { getOrCreateSessionId() }, []);

  // Sync from DB — cart.get is x-session-id OR userId aware, enriched with listing
  const { data: dbCart } = trpc.cart.get.useQuery(undefined, {
    staleTime: 15_000,
    retry: 1,
  });
  const addCart = trpc.cart.add.useMutation({ onSuccess: () => trpc.cart.get.invalidate() });
  const removeCart = trpc.cart.remove.useMutation({ onSuccess: () => trpc.cart.get.invalidate() });
  const clearCart = trpc.cart.clear.useMutation({ onSuccess: () => trpc.cart.get.invalidate() });

  // Hydrate from DB when available (DB is source of truth when it returns rows)
  useEffect(() => {
    if (dbCart && dbCart.length > 0) {
      const mapped: CartItem[] = (dbCart as any[]).map((row: any) => ({
        id: String(row.id),
        listing: row.listing as Listing,
      })).filter((x: CartItem) => x.listing);
      // Only overwrite if DB has data (prevents wiping local optimistic state when DB empty)
      if (mapped.length > 0) setItems(mapped);
    }
  }, [dbCart]);

  const add = (listing: Listing) => {
    setItems(prev => {
      const exists = prev.some(x => x.listing.id === listing.id);
      if (exists) return prev;
      return [...prev, { id: crypto.randomUUID(), listing }];
    });
    // Persist to DB (guest via x-session-id, authed via userId) — fire-and-forget, invalidates cart.get
    addCart.mutate({ listingId: (listing as any).id } as any);
  };

  const remove = (id: string) => {
    setItems(prev => prev.filter(x => x.id !== id));
    const numeric = Number(id);
    if (!Number.isNaN(numeric)) {
      removeCart.mutate({ id: numeric } as any);
    } else {
      // Local-only item (randomUUID) not yet in DB — no-op, will sync on next fetch; clear if needed
    }
  };

  const clear = () => {
    setItems([]);
    clearCart.mutate();
  };

  const total = useMemo(() => items.reduce((sum, x) => sum + Number(x.listing.price), 0), [items]);

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total }}>
      {children}
    </CartContext.Provider>
  );
}
