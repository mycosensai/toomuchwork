import { createContext } from 'react';
import type { Listing } from '../types';

export interface CartItem {
  id: string;
  listing: Listing;
}

interface CartContextValue {
  items: CartItem[];
  add: (listing: Listing) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  total: number;
}

export const CartContext = createContext<CartContextValue | undefined>(undefined);
