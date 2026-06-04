// https://github.com/mycosensai/toomuchwork
// The Vault DFW — standalone marketplace UI
// Licensed to The Vault DFW. All rights reserved.

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const svg = {
  diamond: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  menu: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  logout: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17 21 12 16 7"/><path d="M21 12h-9"/></svg>',
  user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a2 2 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  shield: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  cart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  info: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
  help: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>',
  msg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  arrow: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  sparkles: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5Z"/><path d="M5 15 6 18 9 19 6 20 5 23 4 20 1 19 4 18Z"/></svg>',
  'shield-check': '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',
  clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',
  trending: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',
  gem: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',
  coins: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.5 13.5 16 11M14 16l2.5 2.5M16 11.5 18.5 14"/><circle cx="16" cy="16" r="5.5"/></svg>',
  landmark: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',
  palette: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  watch: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 9v4l2 2"/><path d="M9 2h6M9 22h6"/></svg>',
  trophy: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66 17 12l-7-2.66v4.01A2 2 0 0 1 12 18a2 2 0 0 1-2-2.01V14.66z"/><path d="M17 8l2-4"/></svg>',
  book: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  chevron: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',
  xsocial: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  instagram: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',
  mail: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>',
  logo: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
};

const social = { x: 'https://x.com/thevault', instagram: 'https://instagram.com/thevault', email: 'mailto:ratchetkrewelabs@gmail.com' };

const CATEGORIES = [
  { id: 'fine-jewelry', name: 'Fine Jewelry', slug: 'jewelry', iconName: 'gem' },
  { id: 'rare-coins', name: 'Rare Coins', slug: 'coins', iconName: 'coins' },
  { id: 'luxury-watches', name: 'Luxury Watches', slug: 'watches', iconName: 'watch' },
  { id: 'fine-art', name: 'Fine Art', slug: 'art', iconName: 'palette' },
  { id: 'antiques', name: 'Antiques', slug: 'antiques', iconName: 'landmark' },
  { id: 'sports-memorabilia', name: 'Sports Memorabilia', slug: 'memorabilia', iconName: 'trophy' },
  { id: 'collectibles', name: 'Collectibles', slug: 'collectibles', iconName: 'diamond' },
  { id: 'books', name: 'Books & Ephemera', slug: 'books', iconName: 'book' },
];

const LISTINGS = [
  { id: 'l1', title: 'Vault Pass — EMPLOYER{OPS}', price: 129, category: 'collectibles', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 214, condition: 'mint', badge: 'new' },
  { id: 'l2', title: 'Collectible Card — Obsidian Gold', price: 58, category: 'sports-memorabilia', image: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 178, condition: 'near-mint', badge: 'hot' },
  { id: 'l3', title: 'Vault DFW Limited Watchlist Ticket', price: 240, category: 'collectibles', image: 'https://images.unsplash.com/photo-1599582909646-2f0a3a6e5c2e?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 99, condition: 'mint', badge: 'offer' },
  { id: 'l4', title: 'Rare 1965 Silver Coin Set', price: 425, category: 'rare-coins', image: 'https://images.unsplash.com/photo-1610375465536-5b1d2c5d1f3a?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 312, condition: 'mint', badge: 'verified' },
  { id: 'l5', title: 'Graded 1990 Comic Collection', price: 320, category: 'books', image: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 145, condition: 'near-mint', badge: 'verified' },
  { id: 'l6', title: 'Vintage Toy Robot — 1984', price: 190, category: 'collectibles', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 89, condition: 'good', badge: 'hot' },
  { id: 'l7', title: 'Signed Baseball — Authenticated', price: 650, category: 'sports-memorabilia', image: 'https://images.unsplash.com/photo-1610189012906-478603565824?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 410, condition: 'mint', badge: 'verified' },
  { id: 'l8', title: 'Sealed 1992 Topps Wax Box', price: 890, category: 'collectibles', image: 'https://images.unsplash.com/photo-1607330289024-1535d6f30c7e?auto=format&fit=crop&w=400&q=80', seller: 'vaultops', views: 220, condition: 'mint', badge: 'new' },
];

const state = { cart: [], wishlist: [], user: null, _status: '' };

const addToCart = (id) => {
  const item = LISTINGS.find(i => i.id === id);
  if (item && !state.cart.find(i => i.id === id)) state.cart.push(item);
  render();
};
const removeFromCart = (id) => { state.cart = state.cart.filter(i => i.id !== id); render(); };
const toggleWishlist = (id) => { state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(x => x !== id) : [...state.wishlist, id]; render(); };

const navigate = (path) => { history.pushState(null, '', `/${path}`); render(); };

const badgeFor = (key) => {
  const map = { verified: 'border:1px solid rgba(201,168,76,0.45);color:#E8CB7A;background:rgba(201,168,76,0.10)', new: 'border:1px solid rgba(52,211,153,0.45);color:#6ee7b7;background:rgba(16,185,129,0.10)', hot: 'border:1px solid rgba(248,113,113,0.45);color:#fca5a5;background:rgba(220,38,38,0.10)', offer: 'border:1px solid rgba(251,146,60,0.45);color:#fdba74;background:rgba(234,88,12,0.10)' };
  return map[key] || map.verified;
};

const iconFor = (name) => {
  const map = { gem: svg.gem, coins: svg.coins, landmark: svg.landmark, palette: svg.palette, watch: svg.watch, trophy: svg.trophy, diamond: svg.diamond, book: svg.book };
  return map[name] || svg.diamond;
};

const footerPlatform = ['Browse Collection','AI Appraisal','ProVerify','Sell an Item','Token Gallery','Wishlist','My Orders'];
const footerCompany = ['About The Vault','FAQ','Contact Us','Shipping Info','Support Center'];
const footerLegal = ['Directory / Sitemap','Terms of Service','Privacy Policy','Returns & Refunds'];

const shell = () => {
  const path = location.pathname.replace(/^\/+/, '') || 'home';
  const active = (p) => (path === p ? 'color:#E8CB7A;' : 'color:#C8BC98;');
  return `
    <header style="border-bottom:1px solid rgba(201,168,76,0.18);background:rgba(0,0,0,0.7);backdrop-filter:blur(14px);position:sticky;top:0;z-index:50;">
      <div style="max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:12px;">${svg.logo} <span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;">The Vault DFW Exchange</span></a>
        <nav style="display:none;align-items:center;gap:24px;">
          ${['browse','appraisal','proverify','sell','tokengallery','nft','support'].map(p => `<a href="/${p}" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;${active(p)}">${p === 'tokengallery' ? 'Tokens' : p === 'proverify' ? 'ProVerify' : p === 'nft' ? 'NFT' : p.charAt(0).toUpperCase() + p.slice(1)}</a>`).join('')}
        </nav>
        <div style="display:none;align-items:center;gap:14px;">
          <a href="/browse" style="color:#C8BC98;text-decoration:none;">${svg.search}</a>
          <a href="/wishlist" style="color:#C8BC98;text-decoration:none;">${svg.heart}</a>
          <a href="/cart" style="color:#C8BC98;text-decoration:none;">${svg.cart}</a>
          <a href="/admin" style="color:#C8BC98;text-decoration:none;">${svg.shield}</a>
          <a href="/login" style="padding:8px 14px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;font-weight:700;">Sign In</a>
        </div>
      </div>
    </header>
    <main style="min-height:100vh;">
      <div style="max-width:1100px;margin:0 auto;padding:0 24px;">${(routes[path] || routes.home)()}</div>
    </main>
    <footer style="border-top:1px solid rgba(201,168,76,0.18);background:#080808;padding:56px 20px 28px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(2,1fr);gap:32px;">
        <div>
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;font-size:14px;">THE VAULT</span></div>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:#C8BC98;line-height:1.6;max-width:280px;">The elite collector exchange. Peer-to-peer marketplace for rare and exclusive items. AI-powered. Blockchain-certified. Collector-first.</p>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <a href="${social.x}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${svg.xsocial}</a>
            <a href="${social.instagram}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${svg.instagram}</a>
            <a href="${social.email}" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${svg.mail}</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Platform</h4>
          ${footerPlatform.map(label => `<a href="/browse" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${label}</a>`).join('')}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Company</h4>
          ${footerCompany.map(label => `<a href="/about" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${label}</a>`).join('')}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Legal</h4>
          ${footerLegal.map(label => `<a href="/terms" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${label}</a>`).join('')}
          <a href="${social.email}" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#C8BC98;text-decoration:none;">${svg.mail} ratchetkrewelabs@gmail.com</a>
        </div>
      </div>
      <div style="max-width:1100px;margin:28px auto 0;padding-top:18px;border-top:1px solid rgba(201,168,76,0.10);display:flex;flex-direction:column;gap:10px;align-items:center;">
        <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">&copy; 2024 The Vault. All rights reserved.</p>
      </div>
    </footer>
  `;
};

const style = (obj) => Object.entries(obj).map(([k,v]) => `${k}:${v}`).join(';');

const cardImg = (src, alt, ratio = 'aspect-square') => `
  <div class="${ratio}" style="background:#111;border-bottom:1px solid rgba(201,168,76,0.15);overflow:hidden;">
    <img src="${src}" alt="${alt}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />
  </div>
`;

const routes = {
  checkout: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Checkout</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Complete purchase for item <strong style="color:#F5EED8;">${id || 'selected'}</strong>.</p>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Order placed.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping Address</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="3" required></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Card Number</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="4242 4242 4242 4242"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="MM/YY"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="CVC"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Payment Method</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Stripe (Card)</option><option>Coinbase Commerce</option><option>Solana (SOL)</option></select></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${svg.shield} Pay Securely</button></div>
        </form>
      </div>
    </section>
  `,
  cryptocheckout: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Crypto Checkout</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Pay with USDC, SOL, or Coinbase Commerce.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          <button style="padding:14px;background:#e5c07b;color:#000;border-radius:12px;font-weight:700;cursor:pointer;">Connect Wallet</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Coinbase</button>
        </div>
      </div>
    </section>
  `,
  walletpay: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Wallet Pay</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Wallet checkout for <strong style="color:#F5EED8;">${id || 'selected'}</strong>.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          <button style="padding:14px;background:#e5c07b;color:#000;border-radius:12px;font-weight:700;cursor:pointer;">Connect Wallet</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Stripe</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Coinbase</button>
        </div>
      </div>
    </section>
  `,
  certificate: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Digital Certificate</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Authenticity certificate for <strong style="color:#F5EED8;">${id || 'this item'}</strong>.</p>
      </div>
    </section>
  `,
  proverifyresult: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">ProVerify Result</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Verification <strong style="color:#F5EED8;">${id ? '#' + id : 'record'}</strong>.</p>
        <div style="margin-top:22px;display:grid;gap:14px;">
          <div style="background:#111;border:1px solid rgba(201,168,76,0.25);padding:16px;border-radius:16px;color:#C8BC98;font-size:12px;line-height:1.6;">
            Professional verification complete. Use the outreach email below to begin the buyer/seller introduction directly.
          </div>
          <a href="mailto:?subject=ProVerify%20Verification%20%23${encodeURIComponent(id || 'record')}&body=Hello%20The%20Vault%20team%2C%0A%0AI%20have%20reviewed%20ProVerify%20record%20%23${encodeURIComponent(id || 'record')}%20and%20I%20am%20ready%20to%20discuss%20next%20steps.%0A%0ARegards" style="display:inline-flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:12px;text-decoration:none;font-family:'Cinzel',serif;font-weight:700;border:1px solid #C9A84C;">
            ${svg.mail} Send ProVerify Outreach Email
          </a>
        </div>
      </div>
    </section>
  `,
  leads: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Professional Leads</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Qualified professionals interested in your item category.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
          ${[
            {name:'Elena Rossi',title:'Senior Curator, European Art',institution:'Louvre Dept.',interest:'very_interested',offer:'$14,200'},
            {name:'David Chen',title:'Private Collector / Dealer',institution:'Hong Kong',interest:'interested',offer:'$10,800'},
            {name:'Sarah Mitchell',title:'Estate Director',institution:'Mitchell Estates',interest:'contacted',offer:''},
            {name:'Marcus Webb',title:'Certified Appraiser',institution:'Webb & Co.',interest:'interested',offer:'$9,500'},
          ].map(l => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="color:#F5EED8;font-weight:700;font-size:12px;">${l.name}</div><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${l.interest==='very_interested'?'#6ee7b7':l.interest==='interested'?'#C9A84C':'#8A6E2F'};">${l.interest.replace('_',' ')}</span></div>
              <div style="color:#C8BC98;font-size:11px;margin-bottom:4px;">${l.title}</div>
              <div style="color:#8A6E2F;font-size:10px;margin-bottom:8px;">${l.institution}</div>
              ${l.offer?`<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 10px;background:#C9A84C/8;border:1px solid rgba(201,168,76,0.25);border-radius:999px;color:#C9A84C;font-size:11px;font-weight:700;">Offer: ${l.offer}</div>`:''}
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  socialleads: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Social Buyer Intelligence</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Real public mentions from X, Reddit, and Instagram.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          ${[
            {platform:'x',author:'@chronowise',content:'Looking for a vintage diver that holds value.',status:'contacted'},
            {platform:'reddit',author:'u/collectr_nyc',content:'Anyone selling authenticated vintage pieces in DFW?',status:'interested'},
            {platform:'instagram',author:'@horologist_daily',content:'Condition matters more than box + papers for 1980s pieces.',status:'new'},
          ].map(m => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#C9A84C;">${m.platform}</span><span style="font-size:10px;color:${m.status==='contacted'?'#60a5fa':m.status==='interested'?'#6ee7b7':'#C9A84C'};">${m.status.replace('_',' ')}</span></div>
              <div style="color:#F5EED8;font-weight:700;font-size:12px;margin-bottom:6px;">${m.author}</div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:8px;">"${m.content}"</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button onclick="window._toast('Mark contacted')" style="padding:8px 10px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:10px;cursor:pointer;">Contacted</button>
                <button onclick="window._toast('Mark interested')" style="padding:8px 10px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;">Interested</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  notfound: () => `
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;text-align:center;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Page Not Found</h2>
        <p style="color:#a1a1aa;margin-top:10px;">The requested page does not exist.</p>
        <a href="/" style="display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:12px 14px;background:#e5c07b;color:#000;border-radius:12px;text-decoration:none;font-weight:700;">Return Home</a>
      </div>
    </section>
  `,

  home: () => `
    <section style="position:relative;min-height:100vh;background:#000000;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 28%,rgba(201,168,76,0.10),transparent 60%);"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,#0a0a0a,#000000 38%,#050505 72%,#0a0a0a);"></div>
      <canvas id="particle-canvas" style="position:fixed;inset:0;"></canvas>
      <div style="position:relative;z-index:2;text-align:center;padding:140px 20px 60px;max-width:1100px;margin:0 auto;">
        <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(201,168,76,0.35);border-radius:999px;margin-bottom:28px;">
          <span style="width:6px;height:6px;border-radius:50%;background:#C9A84C;box-shadow:0 0 10px #C9A84C;"></span>
          <span style="font-family:'Cinzel',serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;">Est. 2024 &middot; Elite Collector Exchange &middot; AI-Powered &middot; Disclaimer</span>
        </div>
        <h1 style="font-family:'Cinzel',serif;font-size:clamp(44px,7vw,96px);font-weight:900;letter-spacing:clamp(6px,1.2vw,18px);line-height:0.95;background:linear-gradient(to bottom,#FFD97A,#C9A84C,#8A6E2F);-webkit-background-clip:text;background-clip:text;color:transparent;">The Vault DFW</h1>
        <p style="font-family:'Cinzel',serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:clamp(6px,1vw,14px);color:#C8BC98;text-transform:uppercase;margin-top:14px;">Elite Collector Exchange</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:18px 0 26px;">
          <div style="width:80px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
          <span style="color:#C9A84C;display:inline-flex;">${svg.diamond}</span>
          <div style="width:80px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
        </div>
        <p style="max-width:860px;margin:0 auto 36px;color:#F5EED8;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2vw,22px);line-height:1.6;">Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.</p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
          <a href="/sell" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;border:1px solid #C9A84C;">Start Selling ${svg.arrow}</a>
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;">Find Treasures</a>
        </div>
        <div style="margin-top:28px;padding:16px;border:1px solid rgba(201,168,76,0.20);background:rgba(201,168,76,0.05);max-width:720px;margin-left:auto;margin-right:auto;">
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:13px;line-height:1.6;">Marketplace participation does not guarantee sale. Pricing estimates are generated from historical and third-party data. Items are verified at the time of listing. The Vault may revise commission tiers at any time.</p>
        </div>
      </div>
    </section>

    <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.25);border-bottom:1px solid rgba(0,0,0,0.25);">
      <div style="display:flex;white-space:nowrap;animation:marquee 38s linear infinite;width:max-content;">
        ${['5% Commission Under $1,000','7% Commission $1,000-$7,500','10% Commission $7,500-$10,000','5% Commission Over $10,000','AI-Powered Buyer Matching','Verified Collectors Only','Real-Time Market Pricing'].map(t => `<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${t} <span style="display:inline-flex;">${svg.diamond}</span></span>`).join('')}
        ${['5% Commission Under $1,000','7% Commission $1,000-$7,500','10% Commission $7,500-$10,000','5% Commission Over $10,000','AI-Powered Buyer Matching','Verified Collectors Only','Real-Time Market Pricing'].map(t => `<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${t} <span style="display:inline-flex;">${svg.diamond}</span></span>`).join('')}
      </div>
    </div>

    <section style="padding:80px 20px;background:#020202;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Transparent Pricing</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Commission Calculator</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 10px;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${svg.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;">Know exactly what you keep before you list</p>
        </div>
        <div style="background:#141414;border:1px solid rgba(201,168,76,0.35);padding:28px;position:relative;box-shadow:0 0 40px rgba(201,168,76,0.06);">
          <div style="position:absolute;top:0;left:0;width:18px;height:18px;border-top:2px solid #C9A84C;border-left:2px solid #C9A84C;"></div>
          <div style="position:absolute;bottom:0;right:0;width:18px;height:18px;border-bottom:2px solid #C9A84C;border-right:2px solid #C9A84C;"></div>
          <div style="margin-bottom:28px;">
            <label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Item Value</label>
            <input type="number" id="calc-value" placeholder="0" oninput="window._calc()" style="width:100%;background:#141414;border:1px solid rgba(201,168,76,0.35);border-bottom:2px solid #C9A84C;color:#F5EED8;font-family:'Cinzel',serif;font-size:clamp(24px,4vw,40px);font-weight:700;padding:18px 16px 18px 44px;outline:none;" />
          </div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:18px;" id="calc-tiers">
            ${[{r:5,range:'Under $1,000',label:'Entry'},{r:7,range:'$1,000-$7,500',label:'Standard'},{r:10,range:'$7,500-$10,000',label:'Premium'},{r:15,range:'$10,000+',label:'Elite'}].map(t => `
              <div id="tier-${t.r}" style="padding:14px;border:1px solid rgba(201,168,76,0.25);background:#141414;text-align:center;transition:all .2s;">
                <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:800;color:#C9A84C;">${t.r}%</div>
                <div style="font-size:9px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;line-height:1.5;">${t.range}<br/>${t.label}</div>
              </div>
            `).join('')}
          </div>
          <div style="background:#141414;border:1px solid rgba(201,168,76,0.65);padding:18px;">
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">
              <div style="padding:14px;background:#111;text-align:center;">
                <div style="font-size:8px;letter-spacing:3px;color:#8A6E2F;text-transform:uppercase;margin-bottom:6px;">Item Value</div>
                <div id="cv-value" style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#E8CB7A;">$0.00</div>
              </div>
              <div style="padding:14px;background:#111;text-align:center;border:1px solid rgba(201,168,76,0.35);">
                <div style="font-size:8px;letter-spacing:3px;color:#8A6E2F;text-transform:uppercase;margin-bottom:6px;">Commission (<span id="cv-rate">0</span>%)</div>
                <div id="cv-comm" style="font-family:'Cinzel',serif;font-size:20px;font-weight:700;color:#FFD97A;">$0.00</div>
              </div>
              <div style="padding:14px;background:#111;text-align:center;">
                <div style="font-size:8px;letter-spacing:3px;color:#8A6E2F;text-transform:uppercase;margin-bottom:6px;">You Receive</div>
                <div id="cv-net" style="font-family:'Cinzel',serif;font-size:18px;font-weight:700;color:#E8CB7A;">$0.00</div>
              </div>
            </div>
          </div>
          <div id="calc-compare" style="margin-top:18px;padding:18px;border:1px solid rgba(201,168,76,0.25);background:#141414;display:none;">
            <p style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;text-align:center;margin-bottom:14px;">Commission Comparison</p>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;text-align:center;">
              <div><div style="font-size:8px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;margin-bottom:4px;">Christie's</div><div id="c1" style="font-family:'Cinzel',serif;font-weight:700;color:#f87171;"></div></div>
              <div><div style="font-size:8px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;margin-bottom:4px;">Pawn Shop</div><div id="c2" style="font-family:'Cinzel',serif;font-weight:700;color:#f87171;"></div></div>
              <div><div style="font-size:8px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;margin-bottom:4px;">eBay</div><div id="c3" style="font-family:'Cinzel',serif;font-weight:700;color:#f87171;"></div></div>
              <div><div style="font-size:8px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;margin-bottom:4px;">The Vault</div><div id="cv" style="font-family:'Cinzel',serif;font-weight:700;color:#6ee7b7;"></div></div>
            </div>
            <div style="margin-top:14px;padding:14px;background:rgba(16,185,129,0.08);border:1px solid rgba(52,211,153,0.25);text-align:center;">
              <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#6ee7b7;">You save an estimated <strong id="savings" style="font-family:'Cinzel',serif;font-weight:700;"></strong> compared to auction houses</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section style="padding:80px 20px;background:#080808;border-top:1px solid rgba(201,168,76,0.15);">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">The Process</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">How The Vault Works</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 0;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${svg.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${[
            {n:'01',icon:svg.sparkles,title:'AI Appraisal',desc:'Upload photos and describe your item. Our AI analyzes market data across the internet to give you an accurate price estimate.'},
            {n:'02',icon:svg['shield-check'],title:'List Your Item',desc:'Create your listing with our transparent commission structure. 5%, 7%, 10%, or 15% based on item value.'},
            {n:'03',icon:svg.trending,title:'AI Finds Buyers',desc:'Our AI agents scan collector networks and marketplaces to find the ideal buyers for your rare item.'},
            {n:'04',icon:svg.clock,title:'Close the Deal',desc:'Secure checkout with Stripe. Funds released within 48 hours. You keep the majority, we take our fair commission.'},
          ].map(s => `
            <div style="padding:24px;background:#111;border:1px solid rgba(201,168,76,0.18);border-radius:16px;transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease;" onmouseover="this.style.transform='translateY(-6px)';this.style.borderColor='rgba(201,168,76,0.55)';this.style.boxShadow='0 0 30px rgba(201,168,76,0.12)'" onmouseout="this.style.transform='';this.style.borderColor='rgba(201,168,76,0.18)';this.style.boxShadow=''">
              <div style="font-family:'Cinzel',serif;font-size:44px;font-weight:900;color:rgba(201,168,76,0.12);line-height:1;margin-bottom:10px;">${s.n}</div>
              <div style="color:#C9A84C;margin-bottom:14px;">${s.icon}</div>
              <h3 style="font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">${s.title}</h3>
              <p style="font-size:12px;line-height:1.6;color:#C8BC98;">${s.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    <section style="padding:80px 20px;background:#020202;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">What We Handle</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Categories of Excellence</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 0;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${svg.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(201,168,76,0.12);">
          ${CATEGORIES.map(c => `
            <a href="/browse" style="position:relative;height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-decoration:none;padding:20px;background:#0e0e0e;">
              <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent,rgba(201,168,76,0.14));opacity:0;transition:opacity .3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0"></div>
              <div style="color:#C9A84C;position:relative;z-index:1;">${iconFor(c.iconName)}</div>
              <h3 style="color:#C9A84C;position:relative;z-index:1;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;">${c.name}</h3>
            </a>
          `).join('')}
        </div>
      </div>
    </section>

    <section style="padding:80px 20px;background:#080808;border-top:1px solid rgba(201,168,76,0.15);">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Currently Available</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Featured in The Vault</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 0;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${svg.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${LISTINGS.map(item => `
            <a href="/listing/${item.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-video" style="overflow:hidden;">
                  <img src="${item.image}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </div>
                <div style="padding:14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">${item.category}</span>
                    <span style="color:#a1a1aa;font-size:12px;">Qty 1</span>
                  </div>
                  <h3 style="margin-top:10px;font-weight:600;line-height:1.3;color:#F5EED8;">${item.title}</h3>
                  <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:20px;font-weight:700;color:#e5c07b;">$${item.price}</span>
                    <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Buy Now</span>
                  </div>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
        <div style="text-align:center;margin-top:36px;">
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;">View All Listings ${svg.chevron}</a>
        </div>
      </div>
    </section>
  `,
  browse: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Browse Collection</h2>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          ${CATEGORIES.map(c => `<button onclick="window._filterBrowse('${c.slug}')" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${c.name}</button>`).join('')}
        </div>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;" id="browse-grid">
          ${LISTINGS.map(item => `
            <a href="/listing/${item.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-square" style="overflow:hidden;"><img src="${item.image}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
                <div style="padding:14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">${item.category}</span>
                    <span style="color:#a1a1aa;font-size:12px;">Qty 1</span>
                  </div>
                  <h3 style="margin-top:10px;font-weight:600;line-height:1.3;color:#F5EED8;">${item.title}</h3>
                  <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:20px;font-weight:700;color:#e5c07b;">$${item.price}</span>
                    <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Buy Now</span>
                  </div>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  sell: () => `
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">List an Item</h2>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Submission received.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Title</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="Vintage Rolex Submariner — 1987" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${CATEGORIES.filter(c => c.id !== 'all').map(c => `<option>${c.name}</option>`).join('')}</select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Condition</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Mint</option><option>Near Mint</option><option>Good</option><option>Fair</option></select></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Images (comma separated URLs)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://example.com/a.jpg, https://example.com/b.jpg"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Price (USD)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01" required></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Provenance, grading, authenticity notes..."></textarea></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${svg.gem} Create Listing</button></div>
        </form>
      </div>
    </section>
  `,
  appraisal: () => `
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:40px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">AI-Powered Analysis</p>
          <h1 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,32px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Appraisal Machine</h1>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;margin-top:10px;">Upload a photo and description for an AI estimate.</p>
        </div>
        <div style="background:#141414;border:1px solid rgba(201,168,76,0.35);padding:28px;">
          <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Appraisal request received.</p>';" style="display:grid;gap:16px;">
            <div>
              <label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Upload Photo</label>
              <div style="border:2px dashed rgba(201,168,76,0.35);background:#141414;height:260px;display:flex;align-items:center;justify-content:center;color:#C8BC98;font-size:12px;">Click to upload a photo</div>
            </div>
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Item Name</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="1924 Art Deco Diamond Ring" required></div>
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${CATEGORIES.map(c => `<option>${c.name}</option>`).join('')}</select></div>
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Maker marks, hallmarks, provenance..."></textarea></div>
            <div><button type="submit" style="width:100%;padding:14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;font-weight:700;border-radius:12px;">${svg.sparkles} Get AI Appraisal</button></div>
          </form>
        </div>
      </div>
    </section>
  `,
  proverify: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:42px;">
          <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(201,168,76,0.35);border-radius:999px;margin-bottom:18px;"><span style="width:6px;height:6px;border-radius:50%;background:#C9A84C;"></span><span style="font-family:'Cinzel',serif;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;">Professional Verification</span></div>
          <h1 style="font-family:'Cinzel',serif;font-size:clamp(26px,4vw,46px);font-weight:900;letter-spacing:clamp(4px,1vw,10px);color:#F5EED8;">ProVerify</h1>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:#C8BC98;margin-top:10px;max-width:760px;margin-left:auto;margin-right:auto;">Like Antiques Roadshow, but global. Submit your item to world-class experts who will grade its authenticity, value, and condition on a scale of 1-100.</p>
          <div style="display:inline-flex;align-items:center;gap:24px;margin-top:18px;color:#8A6E2F;font-size:10px;letter-spacing:2px;text-transform:uppercase;"><span>Authenticity 1-100</span><span style="color:#C9A84C;">|</span><span>Value 1-100</span><span style="color:#C9A84C;">|</span><span>Condition 1-100</span></div>
        </div>
        <div style="display:grid;grid-template-columns:1.2fr .8fr;gap:22px;">
          <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif;font-weight:700;letter-spacing:2px;>Submission received.</p>';" style="background:#141414;border:1px solid rgba(201,168,76,0.25);padding:24px;border-radius:18px;display:grid;gap:16px;">
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Item Name</label><input style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="1924 Art Deco Diamond Ring" required></div>
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Description / Provenance</label><textarea style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="4"></textarea></div>
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Image Links</label><input style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://..."></div>
            <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:14px;font-weight:800;cursor:pointer;letter-spacing:2px;">Submit for Expert Review</button></div>
          </form>
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:18px;border-radius:16px;">
            <h3 style="font-family:'Cinzel',serif;font-size:12px;font-weight:700;color:#C9A84C;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;">Review Speed</h3>
            ${[
              {p:'standard',price:'49.99',time:'7-10 days'},
              {p:'express',price:'99.99',time:'3-5 days'},
              {p:'rush',price:'199.99',time:'24-48 hours'},
            ].map(t => `
              <div style="padding:12px;border:1px solid rgba(201,168,76,0.15);border-radius:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#F5EED8;font-weight:700;font-size:12px;text-transform:uppercase;">${t.p}</span><span style="color:#C9A84C;font-family:'Cinzel',serif;font-weight:800;">$${t.price}</span></div>
                <div style="color:#8A6E2F;font-size:11px;margin-top:4px;">${t.time}</div>
              </div>
            `).join('')}
            <div style="margin-top:14px;padding:14px;border:1px solid rgba(201,168,76,0.20);background:rgba(201,168,76,0.06);border-radius:14px;color:#C8BC98;font-size:11px;line-height:1.6;">Fees go directly to the assigned experts. You never share payment or shipping info on this site.</div>
          </div>
        </div>
      </div>
    </section>
  `,
  listingdetail: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <a href="/browse" style="display:inline-flex;align-items:center;gap:8px;color:#C8BC98;text-decoration:none;margin-bottom:18px;">${svg.arrow} Back to Browse</a>
        <div style="display:grid;grid-template-columns:1fr;gap:24px;">
          <div class="aspect-video" style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;overflow:hidden;">
            <img src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
          <div>
            <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">collectibles</span>
            <h1 style="font-family:'Cinzel',serif;font-weight:700;margin-top:12px;font-size:clamp(18px,3vw,28px);">Vault Pass — EMPLOYER{OPS}</h1>
            <p style="color:#e5c07b;font-size:28px;font-weight:700;margin-top:8px;">$129</p>
            <p style="color:#a1a1aa;margin-top:8px;">Condition: Mint &middot; Seller: vaultops</p>
            <div style="margin-top:18px;display:flex;gap:10px;">
              <button onclick="window._add('l1')" style="padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${svg.cart} Add to Cart</button>
              <button onclick="window._toggleW('l1')" style="padding:12px 14px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;border-radius:12px;cursor:pointer;">${svg.heart}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  orders: () => `
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">My Orders</h2>
        <div style="margin-top:20px;display:grid;gap:16px;">
          ${[
            {id:'#VO-4821',status:'confirmed',date:'Jun 3, 2026',amount:'$420.00',method:'stripe',title:'Rare 1965 Silver Coin Set'},
            {id:'#VO-4799',status:'shipped',date:'May 29, 2026',amount:'$240.00',method:'crypto',title:'Vault DFW Limited Watchlist Ticket'},
          ].map(order => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:18px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;">
                <div>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">Order ${order.id}</div>
                  <div style="font-size:12px;color:#C8BC98;">${order.date}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-family:'Cinzel',serif;font-weight:700;color:#FFD97A;">${order.amount}</div>
                  <div style="font-size:10px;color:#8A6E2F;text-transform:capitalize;">${order.method}</div>
                </div>
              </div>
              <div style="padding:12px;background:#141414;border:1px solid rgba(201,168,76,0.10);border-radius:12px;display:flex;align-items:center;gap:12px;">
                <div style="width:48px;height:48px;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:12px;flex-shrink:0;"></div>
                <div style="min-width:0;flex:1;">
                  <div style="font-weight:600;color:#F5EED8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${order.title}</div>
                  <div style="font-size:10px;color:#8A6E2F;margin-top:4px;">Status: <span style="color:#C9A84C;">${order.status}</span></div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  wishlist: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Wishlist</h2>
        <div style="margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${state.wishlist.length === 0 ? '<p style="color:#a1a1aa;">Your wishlist is empty.</p>' : ''}
          ${LISTINGS.filter(i => state.wishlist.includes(i.id)).map(item => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;overflow:hidden;">
              <a href="/listing/${item.id}" style="display:block;">
                <div class="aspect-4-3" style="overflow:hidden;"><img src="${item.image}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
              </a>
              <div style="padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                  <div>
                    <a href="/listing/${item.id}" style="color:#F5EED8;text-decoration:none;font-weight:600;">${item.title}</a>
                    <div style="color:#e5c07b;font-weight:700;margin-top:4px;">$${item.price}</div>
                  </div>
                  <button onclick="window._toggleW('${item.id}')" style="padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${svg.heart}</button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  checkout: (id) => `
    <section style="padding-top:100px;">
      <div style="max-width:980px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Shipping Estimator</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Select destination and service for <strong style="color:#F5EED8;">${id || 'this item'}</strong>.</p>
        <div style="margin-top:22px;background:#141414;border:1px solid rgba(201,168,76,0.25);padding:22px;border-radius:18px;display:grid;grid-template-columns:1fr 1fr;gap:22px;">
          <div style="display:grid;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Destination</label><select id="ship-dest" onchange="window._shipQuote()" style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option value="domestic">Domestic</option><option value="canada">Canada</option><option value="uk">UK / EU</option><option value="row">Rest of World</option></select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Speed</label><select id="ship-speed" onchange="window._shipQuote()" style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option value="standard">Standard</option><option value="express">Express</option><option value="white">White-Glove</option></select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Weight class</label><select id="ship-weight" onchange="window._shipQuote()" style="width:100%;background:#0c0c0c;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option value="standard">Standard (&lt;5 lbs)</option><option value="heavy">Heavy (5-25 lbs)</option><option value="fragile">Fragile / Art</option></select></div>
          </div>
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:18px;border-radius:16px;">
            <h3 style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;margin-bottom:10px;">Estimate</h3>
            <div style="display:grid;gap:10px;color:#C8BC98;font-size:13px;">
              <div style="display:flex;justify-content:space-between;"><span>Base rate</span><span style="color:#F5EED8;" id="ship-base">—</span></div>
              <div style="display:flex;justify-content:space-between;"><span>Speed multiplier</span><span style="color:#F5EED8;" id="ship-mult">1x</span></div>
              <div style="display:flex;justify-content:space-between;"><span>Insurance</span><span style="color:#F5EED8;" id="ship-ins">—</span></div>
              <div style="border-top:1px solid rgba(201,168,76,0.20);padding-top:10px;display:flex;justify-content:space-between;color:#F5EED8;"><span>Estimated total</span><span style="font-family:'Cinzel',serif;font-size:22px;font-weight:800;color:#FFD97A;" id="ship-total">$0.00</span></div>
            </div>
            <p style="color:#8A6E2F;font-size:11px;margin-top:10px;">Final rate confirmed at invoicing.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  walletpay: () => `
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Wallet Pay</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Pay with Solana, USDC, or connect your wallet.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          <button style="padding:14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">Connect Wallet</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Stripe</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Coinbase</button>
        </div>
      </div>
    </section>
  `,
  tokengallery: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Token Gallery</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Turn your authenticated items into collectible digital certificates.</p>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${LISTINGS.slice(0,4).map(item => `
            <a href="/listing/${item.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-video" style="overflow:hidden;"><img src="${item.image}" alt="${item.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
                <div style="padding:14px;">
                  <div style="font-weight:600;color:#F5EED8;line-height:1.3;">${item.title}</div>
                  <div style="color:#e5c07b;font-weight:700;margin-top:8px;">$${item.price}</div>
                </div>
              </div>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  login: () => `
    <section style="padding-top:100px;">
      <div style="max-width:420px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;text-align:center;">Sign In</h2>
        <p style="color:#C8BC98;text-align:center;margin-top:8px;">Local or social login through The Vault API.</p>
        <div style="margin-top:20px;display:grid;gap:10px;">
          <button onclick="window._login('google')" style="padding:12px;background:#ffffff;color:#202124;border:1px solid rgba(255,255,255,0.08);border-radius:12px;font-weight:600;cursor:pointer;">Continue with Google</button>
          <button onclick="window._login('apple')" style="padding:12px;background:#000000;color:#ffffff;border:1px solid rgba(255,255,255,0.18);border-radius:12px;font-weight:600;cursor:pointer;">Continue with Apple</button>
          <button onclick="window._login('local')" style="padding:12px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">Use Local Account</button>
        </div>
        <p style="color:#a1a1aa;font-size:12px;text-align:center;margin-top:14px;">Agents and staff: use admin login at /admin.</p>
      </div>
    </section>
  `,
  admin: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Admin Dashboard</h2>
        <div style="margin-top:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          ${['Listings','Orders','Users'].map(k => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">${k}</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:700;color:#C9A84C;margin-top:6px;">—</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:8px;">Ready for backend connection.</div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  agents: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Agent Fleet</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Autonomous outreach, valuation, and support agents.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${[
            {name:'Outreach Agent',desc:'Find buyers across social and marketplace channels.',endpoint:'/api/agents/outreach'},
            {name:'Appraisal Agent',desc:'Estimate value from photos, description, and market data.',endpoint:'/api/agents/appraisal'},
            {name:'Support Agent',desc:'Answer buyer/seller questions and status requests.',endpoint:'/api/agents/support'},
            {name:'Ops Agent',desc:'Monitor listings, pricing, and fulfillment status.',endpoint:'/api/agents/ops'},
            {name:'ProVerify Agent',desc:'Assign experts, calculate fees, and run verification cycles.',endpoint:'/api/agents/verify'},
            {name:'Leads Agent',desc:'Run outreach campaigns and deliver qualified buyer leads.',endpoint:'/api/agents/leads'},
          ].map(a => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;">${a.name}</div>
                <span style="font-size:9px;color:#C9A84C;letter-spacing:1px;text-transform:uppercase;">Live</span>
              </div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:10px;">${a.desc}</p>
              <div style="color:#8A6E2F;font-size:9px;font-family:monospace,monospace;margin-bottom:10px;word-break:break-all;">${a.endpoint}</div>
              <button onclick="window._agentRun('${a.endpoint}')" style="width:100%;padding:10px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;font-weight:600;">Run Assignment</button>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `,
  agentcommand: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Agent Command Center</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Full fleet control with Samson kill switch and admin override.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
            <h3 style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#F5EED8;margin-bottom:8px;">Command Override</h3>
            <p style="color:#C8BC98;font-size:12px;line-height:1.6;">Send a priority instruction to the active fleet or pause all agents immediately.</p>
            <div style="margin-top:14px;display:grid;gap:10px;">
              <input id="cmd-text" placeholder="Run full system audit." style="width:100%;background:#141414;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);padding:12px 14px;border-radius:12px;outline:none;">
              <button onclick="window._agentCommand('command', document.getElementById('cmd-text')?.value)" style="padding:12px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:12px;font-weight:700;cursor:pointer;">Execute</button>
            </div>
            <div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap;">
              <button onclick="window._samsonToggle()" style="padding:12px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Toggle Samson Kill Switch</button>
              <button onclick="window._agentCommand('audit','appraisal')" style="padding:12px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;">Run Appraisal Audit</button>
              <button onclick="window._agentCommand('audit','buyer_finder')" style="padding:12px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;">Run Buyer Finder Audit</button>
            </div>
          </div>
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
            <h3 style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#F5EED8;margin-bottom:8px;">Tactical Actions</h3>
            <p style="color:#C8BC98;font-size:12px;line-height:1.6;">Promote campaigns, enforce boundaries, and trigger workflow automations.</p>
            <div style="margin-top:18px;display:grid;gap:8px;">
              <button onclick="window._agentCommand('promote','outreach')" style="padding:12px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Promote Outreach</button>
              <button onclick="window._agentCommand('promote','partnerships')" style="padding:12px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Promote Partnerships</button>
              <button onclick="window._agentCommand('workflow','lead_conversion')" style="padding:12px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Run Conversion Workflow</button>
              <button onclick="window._agentCommand('research','professional_watchlist')" style="padding:12px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Research Watchlist</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  agentproject: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Agent Project</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Project lifecycle, target professionals, and verification instructions.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(2,1fr);gap:16px;">
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
            <h3 style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#F5EED8;margin-bottom:8px;">Run Session</h3>
            <div style="color:#C8BC98;font-size:12px;line-height:1.6;">Execute the next agent cycle for this project stream.</div>
            <button onclick="window._agentCommand('run','session')" style="margin-top:18px;width:100%;padding:12px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:12px;font-weight:700;cursor:pointer;">Run Now</button>
          </div>
          <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
            <h3 style="font-family:'Cinzel',serif;font-size:14px;font-weight:700;color:#F5EED8;margin-bottom:8px;">Find Professionals</h3>
            <div style="color:#C8BC98;font-size:12px;line-height:1.6;">Queue a professional discovery sweep for the current category.</div>
            <button onclick="window._agentCommand('find','professionals')" style="margin-top:18px;width:100%;padding:12px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;">Find Professionals</button>
          </div>
        </div>
      </div>
    </section>
  `,
  marketingdashboard: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Marketing Dashboard</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Campaign pipeline and outreach metrics.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          ${[
            {label:'Active Campaigns',value:'—'},
            {label:'Response Rate',value:'—'},
            {label:'Pipeline Revenue',value:'—'},
          ].map(c => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="color:#8A6E2F;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${c.label}</div>
              <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#C9A84C;">${c.value}</div>
            </div>
          `).join('')}
        </div>
        <button onclick="window._agentCommand('marketing','refresh')" style="margin-top:18px;padding:12px 18px;background:#e5c07b;color:#000;border-radius:12px;font-weight:700;cursor:pointer;">Refresh Metrics</button>
      </div>
    </section>
  `,
  about: () => page('About The Vault', 'The elite collector exchange built for transparency, speed, and fair value.'),
  support: () => page('Support Center', 'Get help with listings, checkout, shipping, and authentication.'),
  faq: () => page('FAQ', 'Common questions about fees, authentication, checkout, and shipping.'),
  terms: () => page('Terms of Service', 'Please review the marketplace terms before using The Vault.'),
  privacy: () => page('Privacy Policy', 'We protect your data and transaction privacy.'),
  returns: () => page('Returns & Refunds', 'Returns are reviewed case-by-case within 48 hours of delivery.'),
  shipping: () => `
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">SHIPPING INFORMATION</h2>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:#C8BC98;margin-top:10px;">Safe, insured delivery for your treasures.</p>
        <div style="margin-top:28px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:32px;">
          ${[
            {t:'Insured Shipping',d:'Full value coverage'},
            {t:'Expert Packaging',d:'Museum-grade materials'},
            {t:'Tracking',d:'Real-time updates'},
            {t:'Worldwide',d:'40+ countries'}
          ].map(f => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:14px;">
              <div style="color:#C9A84C;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${f.t}</div>
              <div style="color:#C8BC98;font-size:12px;">${f.d}</div>
            </div>
          `).join('')}
        </div>
        <div style="background:#111;border:1px solid rgba(201,168,76,0.20);padding:24px;border-radius:16px;display:grid;gap:18px;color:#C8BC98;font-size:12px;line-height:1.7;">
          <div><h3 style="font-family:'Cinzel',serif;font-weight:700;color:#C9A84C;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Shipping Arrangements</h3><p>The Vault is a peer-to-peer marketplace. Buyers and sellers arrange shipping directly. We strongly recommend using insured shipping with tracking for all transactions. For items over $5,000, we require signature confirmation and full insurance coverage.</p></div>
          <div><h3 style="font-family:'Cinzel',serif;font-weight:700;color:#C9A84C;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">Insurance Requirements</h3><p>All shipments must be insured for the full transaction value. Sellers should obtain insurance through their chosen carrier. Never ship high-value items uninsured.</p></div>
          <div><h3 style="font-family:'Cinzel',serif;font-weight:700;color:#C9A84C;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">High-Value Items ($25,000+)</h3><p>For transactions exceeding $25,000, we recommend using a professional art shipping service with white-glove delivery and climate-controlled transport.</p></div>
          <div style="display:flex;align-items:center;gap:10px;border:1px solid rgba(201,168,76,0.15);background:rgba(201,168,76,0.06);padding:14px;border-radius:14px;"><span style="color:#C9A84C;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:2px;">Calculator</span><span style="color:#C8BC98;font-size:11px;">Use the shipping calculator on the checkout page for instant estimates.</span></div>
        </div>
        <p style="margin-top:18px;color:#8A6E2F;font-size:11px;text-transform:uppercase;letter-spacing:1px;">Use <a href="/checkout" style="color:#C9A84C;text-decoration:none;">checkout</a> for rates.</p>
      </div>
    </section>
  `,
  nft: () => `
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Solana Certificate Marketplace</h2>
        <p style="color:#C8BC98;margin-top:8px;">Tokenize physical items as on-chain certificates. Browse and list on OpenSea and Magic Eden.</p>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${[
            {name:'OpenSea',desc:"World's largest NFT marketplace. Solana collections supported.",action:'View Collections',href:'https://opensea.io'},
            {name:'Magic Eden',desc:'Solana-native marketplace. Fast minting and trading.',action:'Go to Magic Eden',href:'https://magiceden.io'},
          ].map(m => `
            <div style="background:#111;border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:18px;">
              <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;margin-bottom:6px;">${m.name}</div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:12px;">${m.desc}</p>
              <a href="${m.href}" target="_blank" rel="noopener" style="display:inline-flex;padding:10px 14px;border:1px solid rgba(201,168,76,0.45);color:#C9A84C;text-decoration:none;border-radius:12px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;font-weight:700;">${m.action}</a>
            </div>
          `).join('')}
        </div>
        <div style="margin-top:28px;background:#111;border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:18px;">
          <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;margin-bottom:8px;">Physical Item Tokenization</div>
          <p style="color:#C8BC98;font-size:12px;line-height:1.7;margin-bottom:10px;">Submit item details and photos for certificate minting. Our agents verify condition and provenance before issuing an on-chain record on Solana. The resulting token can be bought, sold, or transferred through OpenSea and Magic Eden.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button onclick="window._agentRun('/api/agents/nft')" style="padding:10px 12px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:12px;font-weight:700;cursor:pointer;">Request Certificate</button>
            <button onclick="window._agentRun('/api/agents/nft/status')" style="padding:10px 12px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;font-weight:600;">Check Status</button>
          </div>
        </div>
      </div>
    </section>
  `,
  contact: () => page('Contact Us', 'Reach the Vault team at ratchetkrewelabs@gmail.com.'),
  directory: () => `
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Directory / Sitemap</h2>
        <div style="margin-top:18px;display:grid;gap:10px;">
          ${[
            ['Home','/'],
            ['Browse Collection','/browse'],
            ['Sell an Item','/sell'],
            ['AI Appraisal','/appraisal'],
            ['ProVerify','/proverify'],
            ['Token Gallery','/tokengallery'],
            ['My Orders','/orders'],
            ['Wishlist','/wishlist'],
            ['Wallet Pay','/walletpay'],
            ['Admin','/admin'],
            ['Agents','/agents'],
            ['Contact Us','/contact'],
            ['Support','/support'],
            ['FAQ','/faq'],
            ['Shipping','/shipping'],
            ['Terms','/terms'],
            ['Privacy','/privacy'],
            ['Returns','/returns'],
          ].map(([label,href]) => `
            <a href="${href}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:12px;color:#F5EED8;text-decoration:none;font-family:'Cinzel',serif;letter-spacing:2px;">
              <span style="font-size:11px;">${label}</span>
              <span style="color:#C9A84C;">${svg.chevron}</span>
            </a>
          `).join('')}
        </div>
      </div>
    </section>
  `,
};

const page = (title, subtitle) => {
  return `
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">${title}</h2>
        <p style="color:#a1a1aa;margin-top:10px;">${subtitle}</p>
        <p style="color:#C8BC98;margin-top:10px;">This section is connected and ready for backend integration.</p>
        <div style="margin-top:18px;"><a href="/" style="color:#C9A84C;text-decoration:none;">${svg.arrow} Back to Home</a></div>
      </div>
    </section>
  `;
}

const render = () => {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = shell();
};

window._toast = (msg, isError = false) => {
  let el = document.getElementById('vault-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vault-toast';
    Object.assign(el.style, {
      position: 'fixed',
      bottom: '18px',
      right: '18px',
      zIndex: '9999',
      maxWidth: '360px',
      padding: '14px 16px',
      borderRadius: '14px',
      border: '1px solid rgba(201,168,76,0.35)',
      background: 'rgba(15,15,15,0.96)',
      color: '#F5EED8',
      fontFamily: "'Cinzel',serif",
      fontSize: '12px',
      letterSpacing: '1px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
    });
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.color = isError ? '#f87171' : '#E8CB7A';
  el.style.borderColor = isError ? 'rgba(248,113,113,0.45)' : 'rgba(201,168,76,0.35)';
  el.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { el.style.display = 'none'; }, 2200);
};

window._add = (id) => {
  const item = LISTINGS.find(i => i.id === id);
  if (item && !state.cart.find(i => i.id === id)) state.cart.push(item);
  render();
};
window._remove = (id) => { state.cart = state.cart.filter(i => i.id !== id); render(); };
window._toggleW = (id) => { state.wishlist = state.wishlist.includes(id) ? state.wishlist.filter(x => x !== id) : [...state.wishlist, id]; render(); };
window._filterBrowse = (slug) => { state._browse = slug; render(); };
window._calc = () => {
  const raw = document.getElementById('calc-value')?.value || '0';
  const num = parseFloat(raw) || 0;
  let rate = 5;
  if (num >= 10000) rate = 15;
  else if (num >= 7500) rate = 10;
  else if (num >= 1000) rate = 7;
  const comm = num * (rate / 100);
  const net = num - comm;
  const fmt = (n) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const e1 = document.getElementById('cv-value'); if (e1) e1.textContent = fmt(num);
  const e2 = document.getElementById('cv-rate'); if (e2) e2.textContent = rate;
  const e3 = document.getElementById('cv-comm'); if (e3) e3.textContent = fmt(comm);
  const e4 = document.getElementById('cv-net'); if (e4) e4.textContent = fmt(net);
  [5,7,10,15].forEach(r => {
    const box = document.getElementById('tier-' + r);
    if (!box) return;
    const active = r === rate;
    box.style.borderColor = active ? '#C9A84C' : 'rgba(201,168,76,0.25)';
    box.style.background = active ? 'rgba(201,168,76,0.08)' : '#141414';
  });
  const comp = document.getElementById('calc-compare');
  if (comp) {
    comp.style.display = num > 0 ? 'block' : 'none';
    if (num > 0) {
      const c1 = document.getElementById('c1'); if (c1) c1.textContent = fmt(num * 0.25);
      const c2 = document.getElementById('c2'); if (c2) c2.textContent = fmt(num * 0.40);
      const c3 = document.getElementById('c3'); if (c3) c3.textContent = fmt(num * 0.135);
      const cv = document.getElementById('cv'); if (cv) cv.textContent = fmt(comm);
      const sv = document.getElementById('savings'); if (sv) sv.textContent = fmt(num * 0.25 - comm);
    }
  }
};

window.addEventListener('popstate', render);
window.addEventListener('load', () => {
  render();
  setTimeout(() => {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = canvas.clientWidth; canvas.height = canvas.clientHeight; };
    resize();
    window.addEventListener('resize', resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1.6 + 0.6, vy: -(Math.random() * 0.6 + 0.2), opacity: Math.random() * 0.5 + 0.2, doRate: Math.random() * 0.01 + 0.005,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.y += p.vy; p.opacity += p.doRate;
        if (p.opacity > 0.7 || p.opacity < 0.1) p.doRate *= -1;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201,168,76,${p.opacity})`;
        ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    draw();
  }, 60);
});

(() => {
  try {
    const db = getDb();
    const read = (store, key) => new Promise((res) => { const tx = db.transaction(store, 'readonly'); const r = tx.objectStore(store).get(key); r.onsuccess = () => res(r.result); });
    const write = (store, key, val) => new Promise((res, rej) => { const tx = db.transaction(store, 'readwrite'); const r = tx.objectStore(store).put(val, key); r.onsuccess = () => res(); r.onerror = () => rej(r.error); });
    const restore = async () => {
      const user = await read('users', 'current');
      if (user) state.user = user;
      const cart = await read('cart', 'items');
      if (cart) state.cart = cart || [];
      const wish = await read('wishlist', 'items');
      if (wish) state.wishlist = wish || [];
      render();
    };
  restore();
  window._login = async (provider) => {
    try {
      const result = await VAULT_API.request('/api/auth/login', { provider });
      state.user = { provider, id: result.id, session: result.session };
      await write('users', 'current', state.user);
      window._toast('Signed in with ' + provider);
      render();
    } catch (e) {
      window._toast('Login failed: ' + e.message, true);
    }
  };
  window._logout = async () => {
    try { await VAULT_API.request('/api/auth/logout', {}); } catch (e) {}
    state.user = null;
    await write('users', 'current', null);
    render();
  };
  const persistOnChange = () => {
    if (!dbReady || !db) return;
    write('cart', 'items', state.cart).catch(() => {});
    write('wishlist', 'items', state.wishlist).catch(() => {});
  };
  const override = (fn) => {
    const prev = window[fn];
    window[fn] = (...args) => { const r = prev(...args); persistOnChange(); return r; };
  };
  override('_add');
  override('_remove');
  override('_toggleW');

  const RATES = {
    commission(price) {
      const n = Number(price) || 0;
      if (n < 1000) return 0.05;
      if (n < 7500) return 0.07;
      if (n < 10000) return 0.10;
      return 0.15;
    },
    shipping(dest, speed) {
      const base = dest === 'domestic' ? 12 : dest === 'canada' ? 18 : dest === 'uk' ? 24 : 29;
      const mult = speed === 'express' ? 1.6 : speed === 'white' ? 3.4 : 1;
      return Number((base * mult).toFixed(2));
    }
  };

  window._shipQuote = function() {
    const dest = document.getElementById('ship-dest')?.value || 'domestic';
    const speed = document.getElementById('ship-speed')?.value || 'standard';
    const shipEl = document.getElementById('ship-cost');
    const orderEl = document.getElementById('ko-order-total');
    const itemEl = document.getElementById('ko-item');
    const commEl = document.getElementById('ko-commission');
    const totalEl = document.getElementById('ko-total');

    const itemText = itemEl?.textContent || 'Selected item';
    const m = String(itemText).match(/(\$\s*[0-9.,]+)/);
    const itemRaw = m ? Number(m[1].replace(/[^0-9.]/g, '')) : 0;
    const comm = itemRaw * RATES.commission(itemRaw);
    const itemTotal = itemRaw + comm;
    const ship = RATES.shipping(dest, speed);
    if (shipEl) shipEl.textContent = '$' + ship.toFixed(2);
    if (commEl) commEl.textContent = '$' + comm.toFixed(2);
    if (totalEl) totalEl.textContent = '$' + itemTotal.toFixed(2);
    if (orderEl) orderEl.textContent = '$' + (itemTotal + ship).toFixed(2);
  };

  window._sendProVerifyMail = function(id) {
    const safeId = encodeURIComponent(id || 'record');
    const subject = encodeURIComponent(`ProVerify Verification #${safeId}`);
    const body = encodeURIComponent(`Hello The Vault team,\n\nI have reviewed ProVerify record #${safeId} and I am ready to discuss next steps.\n\nRegards`);
    const href = `mailto:?subject=${subject}&body=${body}`;
    window.open(href, '_blank', 'noopener,noreferrer');
    window._toast('Opening outreach email...');
  };

  window._checkoutMethodChange = function() {
    const sel = document.getElementById('pay-method')?.value || 'Stripe (Card)';
    const name = String(sel);
    const chip = document.querySelector('[data-method-chip]');
    if (chip) chip.textContent = name;
  };

  window._agentRun = async function(endpoint) {
    try {
      const data = await VAULT_API.request('/run', { endpoint, context: 'agent_run', model: 'hermes-2-free', timestamp: Date.now(), source: 'web_client' });
      window._toast('Agent request dispatched: ' + (data.status || 'queued'));
    } catch (e) {
      window._toast('Agent dispatch failed: ' + e.message, true);
    }
  };

  window._agentCommand = async function(action, value) {
    try {
      const payload = { action, value, context: 'agent_command', model: 'hermes-2-free', timestamp: Date.now(), source: 'web_client' };
      const data = await VAULT_API.request('/command', payload);
      window._toast('Command sent: ' + (data.status || 'accepted'));
    } catch (e) {
      window._toast('Command failed: ' + e.message, true);
    }
  };

  window._samsonToggle = async function() {
    try {
      const data = await VAULT_API.request('/samson/toggle', { context: 'samson', model: 'hermes-2-free', timestamp: Date.now(), source: 'web_client' });
      window._toast('Samson state: ' + (data.armed ? 'ARMED' : 'DISARMED'));
    } catch (e) {
      window._toast('Samson toggle failed: ' + e.message, true);
    }
  };
} catch (e) {
  console.error('Auth init failed', e);
}
})();
