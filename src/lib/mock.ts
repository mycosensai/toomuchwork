import type { Listing, Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 'sports-cards', name: 'Sports Cards', icon: 'card' },
  { id: 'memorabilia', name: 'Memorabilia', icon: 'trophy' },
  { id: 'sealed-wax', name: 'Sealed Wax', icon: 'cube' },
  { id: 'coins', name: 'Coins & Currency', icon: 'logo-bitcoin' },
  { id: 'vintage-toys', name: 'Vintage Toys', icon: 'game-controller' },
  { id: 'comics', name: 'Comics', icon: 'book' },
  { id: 'autographs', name: 'Autographs', icon: 'create' },
  { id: 'other', name: 'Other', icon: 'ellipsis-horizontal' },
];

export const LISTINGS: Listing[] = [
  {
    id: 'l1',
    title: 'Vault Pass — EMPLOYER{OPS}',
    price: 129,
    condition: 'mint',
    category: 'collectibles',
    image_url: 'https://placehold.co/400x400/0a0a0a/f5c518?text=Vault+Pass',
    seller_username: 'vaultops',
    views: 214,
  },
  {
    id: 'l2',
    title: 'Collectible Card — Obsidian Gold',
    price: 58,
    condition: 'near-mint',
    category: 'sports-cards',
    image_url: 'https://placehold.co/400x400/0a0a0a/f5c518?text=Gold+Card',
    seller_username: 'vaultops',
    views: 178,
  },
  {
    id: 'l3',
    title: 'Vault DFW Limited Watchlist Ticket',
    price: 240,
    condition: 'mint',
    category: 'memorabilia',
    image_url: 'https://placehold.co/400x400/0a0a0a/f5c518?text=Watchlist',
    seller_username: 'vaultops',
    views: 99,
  },
];
