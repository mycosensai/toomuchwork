export type Listing = {
  id: string;
  title: string;
  price: number;
  category: string;
  image: string;
  seller: string;
  views: number;
  condition: string;
  badge: string;
};

export type Lead = {
  id: string;
  listingId: string;
  buyer: string;
  status: string;
  createdAt: string;
};

export const defaultListings: Listing[] = [
  { id: 'l1', title: 'Vault Pass — EMPLOYER{OPS}', price: 129, category: 'collectibles', image: '', seller: 'vaultops', views: 214, condition: 'mint', badge: 'new' },
  { id: 'l2', title: 'Collectible Card — Obsidian Gold', price: 58, category: 'sports-memorabilia', image: '', seller: 'vaultops', views: 178, condition: 'near-mint', badge: 'hot' },
  { id: 'l3', title: 'Vault DFW Limited Watchlist Ticket', price: 240, category: 'collectibles', image: '', seller: 'vaultops', views: 99, condition: 'mint', badge: 'offer' },
  { id: 'l4', title: 'Rare 1965 Silver Coin Set', price: 425, category: 'rare-coins', image: '', seller: 'vaultops', views: 312, condition: 'mint', badge: 'verified' },
  { id: 'l5', title: 'Graded 1990 Comic Collection', price: 320, category: 'books', image: '', seller: 'vaultops', views: 145, condition: 'near-mint', badge: 'verified' },
  { id: 'l6', title: 'Vintage Toy Robot — 1984', price: 190, category: 'collectibles', image: '', seller: 'vaultops', views: 89, condition: 'good', badge: 'hot' },
  { id: 'l7', title: 'Signed Baseball — Authenticated', price: 650, category: 'sports-memorabilia', image: '', seller: 'vaultops', views: 410, condition: 'mint', badge: 'verified' },
  { id: 'l8', title: 'Sealed 1992 Topps Wax Box', price: 890, category: 'collectibles', image: '', seller: 'vaultops', views: 220, condition: 'mint', badge: 'new' },
];
