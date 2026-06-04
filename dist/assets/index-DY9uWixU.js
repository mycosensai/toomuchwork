(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const l of document.querySelectorAll('link[rel="modulepreload"]'))f(l);new MutationObserver(l=>{for(const n of l)if(n.type==="childList")for(const m of n.addedNodes)m.tagName==="LINK"&&m.rel==="modulepreload"&&f(m)}).observe(document,{childList:!0,subtree:!0});function t(l){const n={};return l.integrity&&(n.integrity=l.integrity),l.referrerPolicy&&(n.referrerPolicy=l.referrerPolicy),l.crossOrigin==="use-credentials"?n.credentials="include":l.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function f(l){if(l.ep)return;l.ep=!0;const n=t(l);fetch(l.href,n)}})();const o={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',shield:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',cart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',arrow:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',sparkles:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5Z"/><path d="M5 15 6 18 9 19 6 20 5 23 4 20 1 19 4 18Z"/></svg>',"shield-check":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',trending:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',gem:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',coins:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.5 13.5 16 11M14 16l2.5 2.5M16 11.5 18.5 14"/><circle cx="16" cy="16" r="5.5"/></svg>',landmark:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',palette:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',watch:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 9v4l2 2"/><path d="M9 2h6M9 22h6"/></svg>',trophy:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66 17 12l-7-2.66v4.01A2 2 0 0 1 12 18a2 2 0 0 1-2-2.01V14.66z"/><path d="M17 8l2-4"/></svg>',book:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',chevron:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',xsocial:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',instagram:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',mail:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>',logo:'<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="12" height="12" rx="1"/></svg>'},C={x:"https://x.com/thevault",instagram:"https://instagram.com/thevault",email:"mailto:ratchetkrewelabs@gmail.com"},k=[{id:"fine-jewelry",name:"Fine Jewelry",slug:"jewelry",iconName:"gem"},{id:"rare-coins",name:"Rare Coins",slug:"coins",iconName:"coins"},{id:"luxury-watches",name:"Luxury Watches",slug:"watches",iconName:"watch"},{id:"fine-art",name:"Fine Art",slug:"art",iconName:"palette"},{id:"antiques",name:"Antiques",slug:"antiques",iconName:"landmark"},{id:"sports-memorabilia",name:"Sports Memorabilia",slug:"memorabilia",iconName:"trophy"},{id:"collectibles",name:"Collectibles",slug:"collectibles",iconName:"diamond"},{id:"books",name:"Books & Ephemera",slug:"books",iconName:"book"}],w=[{id:"l1",title:"Vault Pass — EMPLOYER{OPS}",price:129,category:"collectibles",image:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:214,condition:"mint",badge:"new"},{id:"l2",title:"Collectible Card — Obsidian Gold",price:58,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:178,condition:"near-mint",badge:"hot"},{id:"l3",title:"Vault DFW Limited Watchlist Ticket",price:240,category:"collectibles",image:"https://images.unsplash.com/photo-1599582909646-2f0a3a6e5c2e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:99,condition:"mint",badge:"offer"},{id:"l4",title:"Rare 1965 Silver Coin Set",price:425,category:"rare-coins",image:"https://images.unsplash.com/photo-1610375465536-5b1d2c5d1f3a?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:312,condition:"mint",badge:"verified"},{id:"l5",title:"Graded 1990 Comic Collection",price:320,category:"books",image:"https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:145,condition:"near-mint",badge:"verified"},{id:"l6",title:"Vintage Toy Robot — 1984",price:190,category:"collectibles",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:89,condition:"good",badge:"hot"},{id:"l7",title:"Signed Baseball — Authenticated",price:650,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1610189012906-478603565824?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:410,condition:"mint",badge:"verified"},{id:"l8",title:"Sealed 1992 Topps Wax Box",price:890,category:"collectibles",image:"https://images.unsplash.com/photo-1607330289024-1535d6f30c7e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:220,condition:"mint",badge:"new"}],p={cart:[],wishlist:[],user:null,_status:""},S=e=>({gem:o.gem,coins:o.coins,landmark:o.landmark,palette:o.palette,watch:o.watch,trophy:o.trophy,diamond:o.diamond,book:o.book})[e]||o.diamond,M=["Browse Collection","AI Appraisal","ProVerify","Sell an Item","Token Gallery","Wishlist","My Orders"],I=["About The Vault","FAQ","Contact Us","Shipping Info","Support Center"],P=["Directory / Sitemap","Terms of Service","Privacy Policy","Returns & Refunds"],D=()=>{const e=location.pathname.replace(/^\/+/,"")||"home",i=t=>e===t?"color:#E8CB7A;":"color:#C8BC98;";return`
    <header style="border-bottom:1px solid rgba(201,168,76,0.18);background:rgba(0,0,0,0.7);backdrop-filter:blur(14px);position:sticky;top:0;z-index:50;">
      <div style="max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:12px;">${o.logo} <span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;">The Vault DFW Exchange</span></a>
        <nav style="display:none;align-items:center;gap:24px;">
          ${["browse","appraisal","proverify","sell","tokengallery","nft","support"].map(t=>`<a href="/${t}" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;${i(t)}">${t==="tokengallery"?"Tokens":t==="proverify"?"ProVerify":t==="nft"?"NFT":t.charAt(0).toUpperCase()+t.slice(1)}</a>`).join("")}
        </nav>
        <div style="display:none;align-items:center;gap:14px;">
          <a href="/browse" style="color:#C8BC98;text-decoration:none;">${o.search}</a>
          <a href="/wishlist" style="color:#C8BC98;text-decoration:none;">${o.heart}</a>
          <a href="/cart" style="color:#C8BC98;text-decoration:none;">${o.cart}</a>
          <a href="/admin" style="color:#C8BC98;text-decoration:none;">${o.shield}</a>
          <a href="/login" style="padding:8px 14px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;font-weight:700;">Sign In</a>
        </div>
      </div>
    </header>
    <main style="min-height:100vh;">
      <div style="max-width:1100px;margin:0 auto;padding:0 24px;">${(F[e]||F.home)()}</div>
    </main>
    <footer style="border-top:1px solid rgba(201,168,76,0.18);background:#080808;padding:56px 20px 28px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(2,1fr);gap:32px;">
        <div>
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;font-size:14px;">THE VAULT</span></div>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:#C8BC98;line-height:1.6;max-width:280px;">The elite collector exchange. Peer-to-peer marketplace for rare and exclusive items. AI-powered. Blockchain-certified. Collector-first.</p>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <a href="${C.x}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${o.xsocial}</a>
            <a href="${C.instagram}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${o.instagram}</a>
            <a href="${C.email}" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${o.mail}</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Platform</h4>
          ${M.map(t=>`<a href="/browse" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${t}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Company</h4>
          ${I.map(t=>`<a href="/about" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${t}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Legal</h4>
          ${P.map(t=>`<a href="/terms" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${t}</a>`).join("")}
          <a href="${C.email}" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#C8BC98;text-decoration:none;">${o.mail} ratchetkrewelabs@gmail.com</a>
        </div>
      </div>
      <div style="max-width:1100px;margin:28px auto 0;padding-top:18px;border-top:1px solid rgba(201,168,76,0.10);display:flex;flex-direction:column;gap:10px;align-items:center;">
        <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">&copy; 2024 The Vault. All rights reserved.</p>
      </div>
    </footer>
  `},F={checkout:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Checkout</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Complete purchase for item <strong style="color:#F5EED8;">${e||"selected"}</strong>.</p>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Order placed.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping Address</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="3" required></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Card Number</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="4242 4242 4242 4242"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="MM/YY"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="CVC"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Payment Method</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Stripe (Card)</option><option>Coinbase Commerce</option><option>Solana (SOL)</option></select></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${o.shield} Pay Securely</button></div>
        </form>
      </div>
    </section>
  `,cryptocheckout:e=>`
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
  `,walletpay:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Wallet Pay</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Wallet checkout for <strong style="color:#F5EED8;">${e||"selected"}</strong>.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          <button style="padding:14px;background:#e5c07b;color:#000;border-radius:12px;font-weight:700;cursor:pointer;">Connect Wallet</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Stripe</button>
          <button style="padding:14px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:12px;cursor:pointer;">Pay with Coinbase</button>
        </div>
      </div>
    </section>
  `,certificate:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Digital Certificate</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Authenticity certificate for <strong style="color:#F5EED8;">${e||"this item"}</strong>.</p>
      </div>
    </section>
  `,proverifyresult:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">ProVerify Result</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Verification <strong style="color:#F5EED8;">${e?"#"+e:"record"}</strong>.</p>
        <div style="margin-top:22px;display:grid;gap:14px;">
          <div style="background:#111;border:1px solid rgba(201,168,76,0.25);padding:16px;border-radius:16px;color:#C8BC98;font-size:12px;line-height:1.6;">
            Professional verification complete. Use the outreach email below to begin the buyer/seller introduction directly.
          </div>
          <a href="mailto:?subject=ProVerify%20Verification%20%23${encodeURIComponent(e||"record")}&body=Hello%20The%20Vault%20team%2C%0A%0AI%20have%20reviewed%20ProVerify%20record%20%23${encodeURIComponent(e||"record")}%20and%20I%20am%20ready%20to%20discuss%20next%20steps.%0A%0ARegards" style="display:inline-flex;align-items:center;gap:10px;padding:12px 14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border-radius:12px;text-decoration:none;font-family:'Cinzel',serif;font-weight:700;border:1px solid #C9A84C;">
            ${o.mail} Send ProVerify Outreach Email
          </a>
        </div>
      </div>
    </section>
  `,leads:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Professional Leads</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Qualified professionals interested in your item category.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;">
          ${[{name:"Elena Rossi",title:"Senior Curator, European Art",institution:"Louvre Dept.",interest:"very_interested",offer:"$14,200"},{name:"David Chen",title:"Private Collector / Dealer",institution:"Hong Kong",interest:"interested",offer:"$10,800"},{name:"Sarah Mitchell",title:"Estate Director",institution:"Mitchell Estates",interest:"contacted",offer:""},{name:"Marcus Webb",title:"Certified Appraiser",institution:"Webb & Co.",interest:"interested",offer:"$9,500"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><div style="color:#F5EED8;font-weight:700;font-size:12px;">${e.name}</div><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:${e.interest==="very_interested"?"#6ee7b7":e.interest==="interested"?"#C9A84C":"#8A6E2F"};">${e.interest.replace("_"," ")}</span></div>
              <div style="color:#C8BC98;font-size:11px;margin-bottom:4px;">${e.title}</div>
              <div style="color:#8A6E2F;font-size:10px;margin-bottom:8px;">${e.institution}</div>
              ${e.offer?`<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 10px;background:#C9A84C/8;border:1px solid rgba(201,168,76,0.25);border-radius:999px;color:#C9A84C;font-size:11px;font-weight:700;">Offer: ${e.offer}</div>`:""}
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,socialleads:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Social Buyer Intelligence</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Real public mentions from X, Reddit, and Instagram.</p>
        <div style="margin-top:22px;display:grid;gap:12px;">
          ${[{platform:"x",author:"@chronowise",content:"Looking for a vintage diver that holds value.",status:"contacted"},{platform:"reddit",author:"u/collectr_nyc",content:"Anyone selling authenticated vintage pieces in DFW?",status:"interested"},{platform:"instagram",author:"@horologist_daily",content:"Condition matters more than box + papers for 1980s pieces.",status:"new"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><span style="font-size:9px;letter-spacing:1px;text-transform:uppercase;color:#C9A84C;">${e.platform}</span><span style="font-size:10px;color:${e.status==="contacted"?"#60a5fa":e.status==="interested"?"#6ee7b7":"#C9A84C"};">${e.status.replace("_"," ")}</span></div>
              <div style="color:#F5EED8;font-weight:700;font-size:12px;margin-bottom:6px;">${e.author}</div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:8px;">"${e.content}"</p>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button onclick="window._toast('Mark contacted')" style="padding:8px 10px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:10px;cursor:pointer;">Contacted</button>
                <button onclick="window._toast('Mark interested')" style="padding:8px 10px;background:transparent;color:#f5f5f5;border:1px solid rgba(255,255,255,0.08);border-radius:10px;cursor:pointer;">Interested</button>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,notfound:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;text-align:center;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Page Not Found</h2>
        <p style="color:#a1a1aa;margin-top:10px;">The requested page does not exist.</p>
        <a href="/" style="display:inline-flex;align-items:center;gap:10px;margin-top:18px;padding:12px 14px;background:#e5c07b;color:#000;border-radius:12px;text-decoration:none;font-weight:700;">Return Home</a>
      </div>
    </section>
  `,home:()=>`
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
          <span style="color:#C9A84C;display:inline-flex;">${o.diamond}</span>
          <div style="width:80px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
        </div>
        <p style="max-width:860px;margin:0 auto 36px;color:#F5EED8;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2vw,22px);line-height:1.6;">Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.</p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
          <a href="/sell" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;border:1px solid #C9A84C;">Start Selling ${o.arrow}</a>
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;">Find Treasures</a>
        </div>
        <div style="margin-top:28px;padding:16px;border:1px solid rgba(201,168,76,0.20);background:rgba(201,168,76,0.05);max-width:720px;margin-left:auto;margin-right:auto;">
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:13px;line-height:1.6;">Marketplace participation does not guarantee sale. Pricing estimates are generated from historical and third-party data. Items are verified at the time of listing. The Vault may revise commission tiers at any time.</p>
        </div>
      </div>
    </section>

    <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.25);border-bottom:1px solid rgba(0,0,0,0.25);">
      <div style="display:flex;white-space:nowrap;animation:marquee 38s linear infinite;width:max-content;">
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${o.diamond}</span></span>`).join("")}
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${o.diamond}</span></span>`).join("")}
      </div>
    </div>

    <section style="padding:80px 20px;background:#020202;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Transparent Pricing</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Commission Calculator</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 10px;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${o.diamond}</span>
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
            ${[{r:5,range:"Under $1,000",label:"Entry"},{r:7,range:"$1,000-$7,500",label:"Standard"},{r:10,range:"$7,500-$10,000",label:"Premium"},{r:15,range:"$10,000+",label:"Elite"}].map(e=>`
              <div id="tier-${e.r}" style="padding:14px;border:1px solid rgba(201,168,76,0.25);background:#141414;text-align:center;transition:all .2s;">
                <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:800;color:#C9A84C;">${e.r}%</div>
                <div style="font-size:9px;letter-spacing:1px;color:#C8BC98;text-transform:uppercase;line-height:1.5;">${e.range}<br/>${e.label}</div>
              </div>
            `).join("")}
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
            <span style="color:#C9A84C;display:inline-flex;">${o.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${[{n:"01",icon:o.sparkles,title:"AI Appraisal",desc:"Upload photos and describe your item. Our AI analyzes market data across the internet to give you an accurate price estimate."},{n:"02",icon:o["shield-check"],title:"List Your Item",desc:"Create your listing with our transparent commission structure. 5%, 7%, 10%, or 15% based on item value."},{n:"03",icon:o.trending,title:"AI Finds Buyers",desc:"Our AI agents scan collector networks and marketplaces to find the ideal buyers for your rare item."},{n:"04",icon:o.clock,title:"Close the Deal",desc:"Secure checkout with Stripe. Funds released within 48 hours. You keep the majority, we take our fair commission."}].map(e=>`
            <div style="padding:24px;background:#111;border:1px solid rgba(201,168,76,0.18);border-radius:16px;transition:transform .25s ease, border-color .25s ease, box-shadow .25s ease;" onmouseover="this.style.transform='translateY(-6px)';this.style.borderColor='rgba(201,168,76,0.55)';this.style.boxShadow='0 0 30px rgba(201,168,76,0.12)'" onmouseout="this.style.transform='';this.style.borderColor='rgba(201,168,76,0.18)';this.style.boxShadow=''">
              <div style="font-family:'Cinzel',serif;font-size:44px;font-weight:900;color:rgba(201,168,76,0.12);line-height:1;margin-bottom:10px;">${e.n}</div>
              <div style="color:#C9A84C;margin-bottom:14px;">${e.icon}</div>
              <h3 style="font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">${e.title}</h3>
              <p style="font-size:12px;line-height:1.6;color:#C8BC98;">${e.desc}</p>
            </div>
          `).join("")}
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
            <span style="color:#C9A84C;display:inline-flex;">${o.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(201,168,76,0.12);">
          ${k.map(e=>`
            <a href="/browse" style="position:relative;height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-decoration:none;padding:20px;background:#0e0e0e;">
              <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent,rgba(201,168,76,0.14));opacity:0;transition:opacity .3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0"></div>
              <div style="color:#C9A84C;position:relative;z-index:1;">${S(e.iconName)}</div>
              <h3 style="color:#C9A84C;position:relative;z-index:1;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;">${e.name}</h3>
            </a>
          `).join("")}
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
            <span style="color:#C9A84C;display:inline-flex;">${o.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${w.map(e=>`
            <a href="/listing/${e.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-video" style="overflow:hidden;">
                  <img src="${e.image}" alt="${e.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </div>
                <div style="padding:14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">${e.category}</span>
                    <span style="color:#a1a1aa;font-size:12px;">Qty 1</span>
                  </div>
                  <h3 style="margin-top:10px;font-weight:600;line-height:1.3;color:#F5EED8;">${e.title}</h3>
                  <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:20px;font-weight:700;color:#e5c07b;">$${e.price}</span>
                    <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Buy Now</span>
                  </div>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
        <div style="text-align:center;margin-top:36px;">
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;">View All Listings ${o.chevron}</a>
        </div>
      </div>
    </section>
  `,browse:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Browse Collection</h2>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          ${k.map(e=>`<button onclick="window._filterBrowse('${e.slug}')" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${e.name}</button>`).join("")}
        </div>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;" id="browse-grid">
          ${w.map(e=>`
            <a href="/listing/${e.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-square" style="overflow:hidden;"><img src="${e.image}" alt="${e.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
                <div style="padding:14px;">
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                    <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">${e.category}</span>
                    <span style="color:#a1a1aa;font-size:12px;">Qty 1</span>
                  </div>
                  <h3 style="margin-top:10px;font-weight:600;line-height:1.3;color:#F5EED8;">${e.title}</h3>
                  <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-size:20px;font-weight:700;color:#e5c07b;">$${e.price}</span>
                    <span style="font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Buy Now</span>
                  </div>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `,sell:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">List an Item</h2>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Submission received.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Title</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="Vintage Rolex Submariner — 1987" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${k.filter(e=>e.id!=="all").map(e=>`<option>${e.name}</option>`).join("")}</select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Condition</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Mint</option><option>Near Mint</option><option>Good</option><option>Fair</option></select></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Images (comma separated URLs)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://example.com/a.jpg, https://example.com/b.jpg"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Price (USD)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01" required></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Provenance, grading, authenticity notes..."></textarea></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${o.gem} Create Listing</button></div>
        </form>
      </div>
    </section>
  `,appraisal:()=>`
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
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${k.map(e=>`<option>${e.name}</option>`).join("")}</select></div>
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Maker marks, hallmarks, provenance..."></textarea></div>
            <div><button type="submit" style="width:100%;padding:14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;font-weight:700;border-radius:12px;">${o.sparkles} Get AI Appraisal</button></div>
          </form>
        </div>
      </div>
    </section>
  `,proverify:()=>`
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
            ${[{p:"standard",price:"49.99",time:"7-10 days"},{p:"express",price:"99.99",time:"3-5 days"},{p:"rush",price:"199.99",time:"24-48 hours"}].map(e=>`
              <div style="padding:12px;border:1px solid rgba(201,168,76,0.15);border-radius:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;"><span style="color:#F5EED8;font-weight:700;font-size:12px;text-transform:uppercase;">${e.p}</span><span style="color:#C9A84C;font-family:'Cinzel',serif;font-weight:800;">$${e.price}</span></div>
                <div style="color:#8A6E2F;font-size:11px;margin-top:4px;">${e.time}</div>
              </div>
            `).join("")}
            <div style="margin-top:14px;padding:14px;border:1px solid rgba(201,168,76,0.20);background:rgba(201,168,76,0.06);border-radius:14px;color:#C8BC98;font-size:11px;line-height:1.6;">Fees go directly to the assigned experts. You never share payment or shipping info on this site.</div>
          </div>
        </div>
      </div>
    </section>
  `,listingdetail:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <a href="/browse" style="display:inline-flex;align-items:center;gap:8px;color:#C8BC98;text-decoration:none;margin-bottom:18px;">${o.arrow} Back to Browse</a>
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
              <button onclick="window._add('l1')" style="padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${o.cart} Add to Cart</button>
              <button onclick="window._toggleW('l1')" style="padding:12px 14px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;border-radius:12px;cursor:pointer;">${o.heart}</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,orders:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">My Orders</h2>
        <div style="margin-top:20px;display:grid;gap:16px;">
          ${[{id:"#VO-4821",status:"confirmed",date:"Jun 3, 2026",amount:"$420.00",method:"stripe",title:"Rare 1965 Silver Coin Set"},{id:"#VO-4799",status:"shipped",date:"May 29, 2026",amount:"$240.00",method:"crypto",title:"Vault DFW Limited Watchlist Ticket"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:18px;border-radius:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px;">
                <div>
                  <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">Order ${e.id}</div>
                  <div style="font-size:12px;color:#C8BC98;">${e.date}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-family:'Cinzel',serif;font-weight:700;color:#FFD97A;">${e.amount}</div>
                  <div style="font-size:10px;color:#8A6E2F;text-transform:capitalize;">${e.method}</div>
                </div>
              </div>
              <div style="padding:12px;background:#141414;border:1px solid rgba(201,168,76,0.10);border-radius:12px;display:flex;align-items:center;gap:12px;">
                <div style="width:48px;height:48px;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:12px;flex-shrink:0;"></div>
                <div style="min-width:0;flex:1;">
                  <div style="font-weight:600;color:#F5EED8;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${e.title}</div>
                  <div style="font-size:10px;color:#8A6E2F;margin-top:4px;">Status: <span style="color:#C9A84C;">${e.status}</span></div>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,wishlist:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Wishlist</h2>
        <div style="margin-top:18px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${p.wishlist.length===0?'<p style="color:#a1a1aa;">Your wishlist is empty.</p>':""}
          ${w.filter(e=>p.wishlist.includes(e.id)).map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;overflow:hidden;">
              <a href="/listing/${e.id}" style="display:block;">
                <div class="aspect-4-3" style="overflow:hidden;"><img src="${e.image}" alt="${e.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
              </a>
              <div style="padding:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                  <div>
                    <a href="/listing/${e.id}" style="color:#F5EED8;text-decoration:none;font-weight:600;">${e.title}</a>
                    <div style="color:#e5c07b;font-weight:700;margin-top:4px;">$${e.price}</div>
                  </div>
                  <button onclick="window._toggleW('${e.id}')" style="padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${o.heart}</button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,checkout:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:980px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Shipping Estimator</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Select destination and service for <strong style="color:#F5EED8;">${e||"this item"}</strong>.</p>
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
  `,walletpay:()=>`
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
  `,tokengallery:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Token Gallery</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Turn your authenticated items into collectible digital certificates.</p>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${w.slice(0,4).map(e=>`
            <a href="/listing/${e.id}" style="display:block;text-decoration:none;">
              <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
                <div class="aspect-video" style="overflow:hidden;"><img src="${e.image}" alt="${e.title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block;" /></div>
                <div style="padding:14px;">
                  <div style="font-weight:600;color:#F5EED8;line-height:1.3;">${e.title}</div>
                  <div style="color:#e5c07b;font-weight:700;margin-top:8px;">$${e.price}</div>
                </div>
              </div>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `,login:()=>`
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
  `,admin:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Admin Dashboard</h2>
        <div style="margin-top:20px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          ${["Listings","Orders","Users"].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">${e}</div>
              <div style="font-family:'Cinzel',serif;font-size:24px;font-weight:700;color:#C9A84C;margin-top:6px;">—</div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:8px;">Ready for backend connection.</div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,agents:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Agent Fleet</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Autonomous outreach, valuation, and support agents.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
          ${[{name:"Outreach Agent",desc:"Find buyers across social and marketplace channels.",endpoint:"/api/agents/outreach"},{name:"Appraisal Agent",desc:"Estimate value from photos, description, and market data.",endpoint:"/api/agents/appraisal"},{name:"Support Agent",desc:"Answer buyer/seller questions and status requests.",endpoint:"/api/agents/support"},{name:"Ops Agent",desc:"Monitor listings, pricing, and fulfillment status.",endpoint:"/api/agents/ops"},{name:"ProVerify Agent",desc:"Assign experts, calculate fees, and run verification cycles.",endpoint:"/api/agents/verify"},{name:"Leads Agent",desc:"Run outreach campaigns and deliver qualified buyer leads.",endpoint:"/api/agents/leads"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;">${e.name}</div>
                <span style="font-size:9px;color:#C9A84C;letter-spacing:1px;text-transform:uppercase;">Live</span>
              </div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:10px;">${e.desc}</p>
              <div style="color:#8A6E2F;font-size:9px;font-family:monospace,monospace;margin-bottom:10px;word-break:break-all;">${e.endpoint}</div>
              <button onclick="window._agentRun('${e.endpoint}')" style="width:100%;padding:10px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;font-weight:600;">Run Assignment</button>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,agentcommand:()=>`
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
  `,agentproject:()=>`
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
  `,marketingdashboard:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Marketing Dashboard</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Campaign pipeline and outreach metrics.</p>
        <div style="margin-top:22px;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
          ${[{label:"Active Campaigns",value:"—"},{label:"Response Rate",value:"—"},{label:"Pipeline Revenue",value:"—"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="color:#8A6E2F;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${e.label}</div>
              <div style="font-family:'Cinzel',serif;font-size:22px;font-weight:700;color:#C9A84C;">${e.value}</div>
            </div>
          `).join("")}
        </div>
        <button onclick="window._agentCommand('marketing','refresh')" style="margin-top:18px;padding:12px 18px;background:#e5c07b;color:#000;border-radius:12px;font-weight:700;cursor:pointer;">Refresh Metrics</button>
      </div>
    </section>
  `,about:()=>h("About The Vault","The elite collector exchange built for transparency, speed, and fair value."),support:()=>h("Support Center","Get help with listings, checkout, shipping, and authentication."),faq:()=>h("FAQ","Common questions about fees, authentication, checkout, and shipping."),terms:()=>h("Terms of Service","Please review the marketplace terms before using The Vault."),privacy:()=>h("Privacy Policy","We protect your data and transaction privacy."),returns:()=>h("Returns & Refunds","Returns are reviewed case-by-case within 48 hours of delivery."),shipping:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">SHIPPING INFORMATION</h2>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:18px;color:#C8BC98;margin-top:10px;">Safe, insured delivery for your treasures.</p>
        <div style="margin-top:28px;display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:32px;">
          ${[{t:"Insured Shipping",d:"Full value coverage"},{t:"Expert Packaging",d:"Museum-grade materials"},{t:"Tracking",d:"Real-time updates"},{t:"Worldwide",d:"40+ countries"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);padding:16px;border-radius:14px;">
              <div style="color:#C9A84C;font-weight:700;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">${e.t}</div>
              <div style="color:#C8BC98;font-size:12px;">${e.d}</div>
            </div>
          `).join("")}
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
  `,nft:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Solana Certificate Marketplace</h2>
        <p style="color:#C8BC98;margin-top:8px;">Tokenize physical items as on-chain certificates. Browse and list on OpenSea and Magic Eden.</p>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${[{name:"OpenSea",desc:"World's largest NFT marketplace. Solana collections supported.",action:"View Collections",href:"https://opensea.io"},{name:"Magic Eden",desc:"Solana-native marketplace. Fast minting and trading.",action:"Go to Magic Eden",href:"https://magiceden.io"}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.25);border-radius:16px;padding:18px;">
              <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;margin-bottom:6px;">${e.name}</div>
              <p style="color:#C8BC98;font-size:12px;line-height:1.6;margin-bottom:12px;">${e.desc}</p>
              <a href="${e.href}" target="_blank" rel="noopener" style="display:inline-flex;padding:10px 14px;border:1px solid rgba(201,168,76,0.45);color:#C9A84C;text-decoration:none;border-radius:12px;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;font-weight:700;">${e.action}</a>
            </div>
          `).join("")}
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
  `,contact:()=>h("Contact Us","Reach the Vault team at ratchetkrewelabs@gmail.com."),directory:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Directory / Sitemap</h2>
        <div style="margin-top:18px;display:grid;gap:10px;">
          ${[["Home","/"],["Browse Collection","/browse"],["Sell an Item","/sell"],["AI Appraisal","/appraisal"],["ProVerify","/proverify"],["Token Gallery","/tokengallery"],["My Orders","/orders"],["Wishlist","/wishlist"],["Wallet Pay","/walletpay"],["Admin","/admin"],["Agents","/agents"],["Contact Us","/contact"],["Support","/support"],["FAQ","/faq"],["Shipping","/shipping"],["Terms","/terms"],["Privacy","/privacy"],["Returns","/returns"]].map(([e,i])=>`
            <a href="${i}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:12px;color:#F5EED8;text-decoration:none;font-family:'Cinzel',serif;letter-spacing:2px;">
              <span style="font-size:11px;">${e}</span>
              <span style="color:#C9A84C;">${o.chevron}</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `},h=(e,i)=>`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">${e}</h2>
        <p style="color:#a1a1aa;margin-top:10px;">${i}</p>
        <p style="color:#C8BC98;margin-top:10px;">This section is connected and ready for backend integration.</p>
        <div style="margin-top:18px;"><a href="/" style="color:#C9A84C;text-decoration:none;">${o.arrow} Back to Home</a></div>
      </div>
    </section>
  `,u=()=>{const e=document.getElementById("app");e&&(e.innerHTML=D())};window._toast=(e,i=!1)=>{let t=document.getElementById("vault-toast");t||(t=document.createElement("div"),t.id="vault-toast",Object.assign(t.style,{position:"fixed",bottom:"18px",right:"18px",zIndex:"9999",maxWidth:"360px",padding:"14px 16px",borderRadius:"14px",border:"1px solid rgba(201,168,76,0.35)",background:"rgba(15,15,15,0.96)",color:"#F5EED8",fontFamily:"'Cinzel',serif",fontSize:"12px",letterSpacing:"1px",boxShadow:"0 10px 30px rgba(0,0,0,0.35)"}),document.body.appendChild(t)),t.textContent=e,t.style.color=i?"#f87171":"#E8CB7A",t.style.borderColor=i?"rgba(248,113,113,0.45)":"rgba(201,168,76,0.35)",t.style.display="block",clearTimeout(window._toastTimer),window._toastTimer=setTimeout(()=>{t.style.display="none"},2200)};window._add=e=>{const i=w.find(t=>t.id===e);i&&!p.cart.find(t=>t.id===e)&&p.cart.push(i),u()};window._remove=e=>{p.cart=p.cart.filter(i=>i.id!==e),u()};window._toggleW=e=>{p.wishlist=p.wishlist.includes(e)?p.wishlist.filter(i=>i!==e):[...p.wishlist,e],u()};window._filterBrowse=e=>{p._browse=e,u()};window._calc=()=>{var c;const e=((c=document.getElementById("calc-value"))==null?void 0:c.value)||"0",i=parseFloat(e)||0;let t=5;i>=1e4?t=15:i>=7500?t=10:i>=1e3&&(t=7);const f=i*(t/100),l=i-f,n=x=>"$"+x.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),m=document.getElementById("cv-value");m&&(m.textContent=n(i));const r=document.getElementById("cv-rate");r&&(r.textContent=t);const a=document.getElementById("cv-comm");a&&(a.textContent=n(f));const s=document.getElementById("cv-net");s&&(s.textContent=n(l)),[5,7,10,15].forEach(x=>{const g=document.getElementById("tier-"+x);if(!g)return;const y=x===t;g.style.borderColor=y?"#C9A84C":"rgba(201,168,76,0.25)",g.style.background=y?"rgba(201,168,76,0.08)":"#141414"});const d=document.getElementById("calc-compare");if(d&&(d.style.display=i>0?"block":"none",i>0)){const x=document.getElementById("c1");x&&(x.textContent=n(i*.25));const g=document.getElementById("c2");g&&(g.textContent=n(i*.4));const y=document.getElementById("c3");y&&(y.textContent=n(i*.135));const v=document.getElementById("cv");v&&(v.textContent=n(f));const b=document.getElementById("savings");b&&(b.textContent=n(i*.25-f))}};window.addEventListener("popstate",u);window.addEventListener("load",()=>{u(),setTimeout(()=>{const e=document.getElementById("particle-canvas");if(!e)return;const i=e.getContext("2d"),t=()=>{e.width=e.clientWidth,e.height=e.clientHeight};t(),window.addEventListener("resize",t);const f=Array.from({length:50},()=>({x:Math.random()*e.width,y:Math.random()*e.height,size:Math.random()*1.6+.6,vy:-(Math.random()*.6+.2),opacity:Math.random()*.5+.2,doRate:Math.random()*.01+.005})),l=()=>{i.clearRect(0,0,e.width,e.height),f.forEach(n=>{n.y+=n.vy,n.opacity+=n.doRate,(n.opacity>.7||n.opacity<.1)&&(n.doRate*=-1),n.y<-10&&(n.y=e.height+10,n.x=Math.random()*e.width),i.beginPath(),i.arc(n.x,n.y,n.size,0,Math.PI*2),i.fillStyle=`rgba(201,168,76,${n.opacity})`,i.fill()}),requestAnimationFrame(l)};l()},60)});(()=>{try{const e=getDb(),i=(r,a)=>new Promise(s=>{const c=e.transaction(r,"readonly").objectStore(r).get(a);c.onsuccess=()=>s(c.result)}),t=(r,a,s)=>new Promise((d,c)=>{const g=e.transaction(r,"readwrite").objectStore(r).put(s,a);g.onsuccess=()=>d(),g.onerror=()=>c(g.error)});(async()=>{const r=await i("users","current");r&&(p.user=r);const a=await i("cart","items");a&&(p.cart=a||[]);const s=await i("wishlist","items");s&&(p.wishlist=s||[]),u()})(),window._login=async r=>{try{const a=await VAULT_API.request("/api/auth/login",{provider:r});p.user={provider:r,id:a.id,session:a.session},await t("users","current",p.user),window._toast("Signed in with "+r),u()}catch(a){window._toast("Login failed: "+a.message,!0)}},window._logout=async()=>{try{await VAULT_API.request("/api/auth/logout",{})}catch{}p.user=null,await t("users","current",null),u()};const l=()=>{!dbReady||!e||(t("cart","items",p.cart).catch(()=>{}),t("wishlist","items",p.wishlist).catch(()=>{}))},n=r=>{const a=window[r];window[r]=(...s)=>{const d=a(...s);return l(),d}};n("_add"),n("_remove"),n("_toggleW");const m={commission(r){const a=Number(r)||0;return a<1e3?.05:a<7500?.07:a<1e4?.1:.15},shipping(r,a){return Number(((r==="domestic"?12:r==="canada"?18:r==="uk"?24:29)*(a==="express"?1.6:a==="white"?3.4:1)).toFixed(2))}};window._shipQuote=function(){var E,B;const r=((E=document.getElementById("ship-dest"))==null?void 0:E.value)||"domestic",a=((B=document.getElementById("ship-speed"))==null?void 0:B.value)||"standard",s=document.getElementById("ship-cost"),d=document.getElementById("ko-order-total"),c=document.getElementById("ko-item"),x=document.getElementById("ko-commission"),g=document.getElementById("ko-total"),y=(c==null?void 0:c.textContent)||"Selected item",v=String(y).match(/(\$\s*[0-9.,]+)/),b=v?Number(v[1].replace(/[^0-9.]/g,"")):0,z=b*m.commission(b),A=b+z,$=m.shipping(r,a);s&&(s.textContent="$"+$.toFixed(2)),x&&(x.textContent="$"+z.toFixed(2)),g&&(g.textContent="$"+A.toFixed(2)),d&&(d.textContent="$"+(A+$).toFixed(2))},window._sendProVerifyMail=function(r){const a=encodeURIComponent(r||"record"),s=encodeURIComponent(`ProVerify Verification #${a}`),d=encodeURIComponent(`Hello The Vault team,

I have reviewed ProVerify record #${a} and I am ready to discuss next steps.

Regards`),c=`mailto:?subject=${s}&body=${d}`;window.open(c,"_blank","noopener,noreferrer"),window._toast("Opening outreach email...")},window._checkoutMethodChange=function(){var d;const r=((d=document.getElementById("pay-method"))==null?void 0:d.value)||"Stripe (Card)",a=String(r),s=document.querySelector("[data-method-chip]");s&&(s.textContent=a)},window._agentRun=async function(r){try{const a=await VAULT_API.request("/run",{endpoint:r,context:"agent_run",model:"step-3.7-flash",timestamp:Date.now(),source:"web_client"});window._toast("Agent request dispatched: "+(a.status||"queued"))}catch(a){window._toast("Agent dispatch failed: "+a.message,!0)}},window._agentCommand=async function(r,a){try{const s={action:r,value:a,context:"agent_command",model:"hermes-2-free",timestamp:Date.now(),source:"web_client"},d=await VAULT_API.request("/command",s);window._toast("Command sent: "+(d.status||"accepted"))}catch(s){window._toast("Command failed: "+s.message,!0)}},window._samsonToggle=async function(){try{const r=await VAULT_API.request("/samson/toggle",{context:"samson",model:"hermes-2-free",timestamp:Date.now(),source:"web_client"});window._toast("Samson state: "+(r.armed?"ARMED":"DISARMED"))}catch(r){window._toast("Samson toggle failed: "+r.message,!0)}}}catch(e){console.error("Auth init failed",e)}})();
