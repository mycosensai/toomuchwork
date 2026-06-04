(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))c(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const n of o.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&c(n)}).observe(document,{childList:!0,subtree:!0});function r(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function c(a){if(a.ep)return;a.ep=!0;const o=r(a);fetch(a.href,o)}})();const t={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',shield:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',cart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',arrow:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',sparkles:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5Z"/><path d="M5 15 6 18 9 19 6 20 5 23 4 20 1 19 4 18Z"/></svg>',"shield-check":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',trending:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',gem:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',coins:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.5 13.5 16 11M14 16l2.5 2.5M16 11.5 18.5 14"/><circle cx="16" cy="16" r="5.5"/></svg>',landmark:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',palette:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',watch:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 9v4l2 2"/><path d="M9 2h6M9 22h6"/></svg>',trophy:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66 17 12l-7-2.66v4.01A2 2 0 0 1 12 18a2 2 0 0 1-2-2.01V14.66z"/><path d="M17 8l2-4"/></svg>',book:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',chevron:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',xsocial:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',instagram:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',mail:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>'},b={x:"https://x.com/thevault",instagram:"https://instagram.com/thevault",email:"mailto:ratchetkrewelabs@gmail.com"},v=[{id:"fine-jewelry",name:"Fine Jewelry",slug:"jewelry",iconName:"gem"},{id:"rare-coins",name:"Rare Coins",slug:"coins",iconName:"coins"},{id:"luxury-watches",name:"Luxury Watches",slug:"watches",iconName:"watch"},{id:"fine-art",name:"Fine Art",slug:"art",iconName:"palette"},{id:"antiques",name:"Antiques",slug:"antiques",iconName:"landmark"},{id:"sports-memorabilia",name:"Sports Memorabilia",slug:"memorabilia",iconName:"trophy"},{id:"collectibles",name:"Collectibles",slug:"collectibles",iconName:"diamond"},{id:"books",name:"Books & Ephemera",slug:"books",iconName:"book"}],u=[{id:"l1",title:"Vault Pass — EMPLOYER{OPS}",price:129,category:"collectibles",image:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:214,condition:"mint",badge:"new"},{id:"l2",title:"Collectible Card — Obsidian Gold",price:58,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:178,condition:"near-mint",badge:"hot"},{id:"l3",title:"Vault DFW Limited Watchlist Ticket",price:240,category:"collectibles",image:"https://images.unsplash.com/photo-1599582909646-2f0a3a6e5c2e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:99,condition:"mint",badge:"offer"},{id:"l4",title:"Rare 1965 Silver Coin Set",price:425,category:"rare-coins",image:"https://images.unsplash.com/photo-1610375465536-5b1d2c5d1f3a?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:312,condition:"mint",badge:"verified"},{id:"l5",title:"Graded 1990 Comic Collection",price:320,category:"books",image:"https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:145,condition:"near-mint",badge:"verified"},{id:"l6",title:"Vintage Toy Robot — 1984",price:190,category:"collectibles",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:89,condition:"good",badge:"hot"},{id:"l7",title:"Signed Baseball — Authenticated",price:650,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1610189012906-478603565824?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:410,condition:"mint",badge:"verified"},{id:"l8",title:"Sealed 1992 Topps Wax Box",price:890,category:"collectibles",image:"https://images.unsplash.com/photo-1607330289024-1535d6f30c7e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:220,condition:"mint",badge:"new"}],l={cart:[],wishlist:[],user:null},A=e=>({gem:t.gem,coins:t.coins,landmark:t.landmark,palette:t.palette,watch:t.watch,trophy:t.trophy,diamond:t.diamond,book:t.book})[e]||t.diamond,$=["Browse Collection","AI Appraisal","ProVerify","Sell an Item","Token Gallery","Wishlist","My Orders"],E=["About The Vault","FAQ","Contact Us","Shipping Info","Support Center"],B=["Directory / Sitemap","Terms of Service","Privacy Policy","Returns & Refunds"],M=()=>{const e=location.pathname.replace(/^\/+/,"")||"home",i=r=>e===r?"color:#E8CB7A;":"color:#C8BC98;";return`
    <header style="border-bottom:1px solid rgba(201,168,76,0.18);background:rgba(0,0,0,0.7);backdrop-filter:blur(14px);position:sticky;top:0;z-index:50;">
      <div style="max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:12px;"><span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;">The Vault DFW</span></a>
        <nav style="display:none;align-items:center;gap:24px;">
          ${["browse","appraisal","proverify","sell","tokengallery","support"].map(r=>`<a href="/${r}" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;${i(r)}">${r==="tokengallery"?"Tokens":r==="proverify"?"ProVerify":r.charAt(0).toUpperCase()+r.slice(1)}</a>`).join("")}
        </nav>
        <div style="display:none;align-items:center;gap:14px;">
          <a href="/browse" style="color:#C8BC98;text-decoration:none;">${t.search}</a>
          <a href="/wishlist" style="color:#C8BC98;text-decoration:none;">${t.heart}</a>
          <a href="/cart" style="color:#C8BC98;text-decoration:none;">${t.cart}</a>
          <a href="/admin" style="color:#C8BC98;text-decoration:none;">${t.shield}</a>
          <a href="/login" style="padding:8px 14px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;letter-spacing:2px;font-weight:700;">Sign In</a>
        </div>
      </div>
    </header>
    <main style="min-height:100vh;">
      <div style="max-width:1100px;margin:0 auto;padding:0 24px;">${(z[e]||z.home)()}</div>
    </main>
    <footer style="border-top:1px solid rgba(201,168,76,0.18);background:#080808;padding:56px 20px 28px;">
      <div style="max-width:1100px;margin:0 auto;display:grid;grid-template-columns:repeat(2,1fr);gap:32px;">
        <div>
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;"><span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;font-size:14px;">THE VAULT</span></div>
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:13px;color:#C8BC98;line-height:1.6;max-width:280px;">The elite collector exchange. Peer-to-peer marketplace for rare and exclusive items. AI-powered. Blockchain-certified. Collector-first.</p>
          <div style="display:flex;gap:8px;margin-top:14px;">
            <a href="${b.x}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${t.xsocial}</a>
            <a href="${b.instagram}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${t.instagram}</a>
            <a href="${b.email}" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${t.mail}</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Platform</h4>
          ${$.map(r=>`<a href="/browse" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Company</h4>
          ${E.map(r=>`<a href="/about" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Legal</h4>
          ${B.map(r=>`<a href="/terms" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
          <a href="${b.email}" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#C8BC98;text-decoration:none;">${t.mail} ratchetkrewelabs@gmail.com</a>
        </div>
      </div>
      <div style="max-width:1100px;margin:28px auto 0;padding-top:18px;border-top:1px solid rgba(201,168,76,0.10);display:flex;flex-direction:column;gap:10px;align-items:center;">
        <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">&copy; 2024 The Vault. All rights reserved.</p>
      </div>
    </footer>
  `},z={checkout:e=>`
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
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${t.shield} Pay Securely</button></div>
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
      </div>
    </section>
  `,leads:e=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Leads</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Buyer leads for <strong style="color:#F5EED8;">${e||"listing"}</strong>.</p>
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
          <span style="color:#C9A84C;display:inline-flex;">${t.diamond}</span>
          <div style="width:80px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
        </div>
        <p style="max-width:860px;margin:0 auto 36px;color:#F5EED8;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2vw,22px);line-height:1.6;">Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.</p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
          <a href="/sell" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;border:1px solid #C9A84C;">Start Selling ${t.arrow}</a>
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;">Find Treasures</a>
        </div>
        <div style="margin-top:28px;padding:16px;border:1px solid rgba(201,168,76,0.20);background:rgba(201,168,76,0.05);max-width:720px;margin-left:auto;margin-right:auto;">
          <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:13px;line-height:1.6;">Marketplace participation does not guarantee sale. Pricing estimates are generated from historical and third-party data. Items are verified at the time of listing. The Vault may revise commission tiers at any time.</p>
        </div>
      </div>
    </section>

    <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.25);border-bottom:1px solid rgba(0,0,0,0.25);">
      <div style="display:flex;white-space:nowrap;animation:marquee 38s linear infinite;width:max-content;">
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${t.diamond}</span></span>`).join("")}
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${t.diamond}</span></span>`).join("")}
      </div>
    </div>

    <section style="padding:80px 20px;background:#020202;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Transparent Pricing</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Commission Calculator</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 10px;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${t.diamond}</span>
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
            <span style="color:#C9A84C;display:inline-flex;">${t.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${[{n:"01",icon:t.sparkles,title:"AI Appraisal",desc:"Upload photos and describe your item. Our AI analyzes market data across the internet to give you an accurate price estimate."},{n:"02",icon:t["shield-check"],title:"List Your Item",desc:"Create your listing with our transparent commission structure. 5%, 7%, 10%, or 15% based on item value."},{n:"03",icon:t.trending,title:"AI Finds Buyers",desc:"Our AI agents scan collector networks and marketplaces to find the ideal buyers for your rare item."},{n:"04",icon:t.clock,title:"Close the Deal",desc:"Secure checkout with Stripe. Funds released within 48 hours. You keep the majority, we take our fair commission."}].map(e=>`
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
            <span style="color:#C9A84C;display:inline-flex;">${t.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(201,168,76,0.12);">
          ${v.map(e=>`
            <a href="/browse" style="position:relative;height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-decoration:none;padding:20px;background:#0e0e0e;">
              <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent,rgba(201,168,76,0.14));opacity:0;transition:opacity .3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0"></div>
              <div style="color:#C9A84C;position:relative;z-index:1;">${A(e.iconName)}</div>
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
            <span style="color:#C9A84C;display:inline-flex;">${t.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${u.map(e=>`
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
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;">View All Listings ${t.chevron}</a>
        </div>
      </div>
    </section>
  `,browse:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Browse Collection</h2>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          ${v.map(e=>`<button onclick="window._filterBrowse('${e.slug}')" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${e.name}</button>`).join("")}
        </div>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;" id="browse-grid">
          ${u.map(e=>`
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
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${v.filter(e=>e.id!=="all").map(e=>`<option>${e.name}</option>`).join("")}</select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Condition</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Mint</option><option>Near Mint</option><option>Good</option><option>Fair</option></select></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Images (comma separated URLs)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://example.com/a.jpg, https://example.com/b.jpg"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Price (USD)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01" required></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Provenance, grading, authenticity notes..."></textarea></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${t.gem} Create Listing</button></div>
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
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${v.map(e=>`<option>${e.name}</option>`).join("")}</select></div>
            <div><label style="display:block;font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Maker marks, hallmarks, provenance..."></textarea></div>
            <div><button type="submit" style="width:100%;padding:14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;font-weight:700;border-radius:12px;">${t.sparkles} Get AI Appraisal</button></div>
          </form>
        </div>
      </div>
    </section>
  `,proverify:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">ProVerify Authentication</h2>
        <p style="color:#a1a1aa;margin-top:10px;">Submit your item for multi-layer AI + expert authentication.</p>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Submission received.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Item Title</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" required></div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Description / Provenance</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="4"></textarea></div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Image Links</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://..."></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${t["shield-check"]} Submit for Verification</button></div>
        </form>
      </div>
    </section>
  `,listingdetail:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <a href="/browse" style="display:inline-flex;align-items:center;gap:8px;color:#C8BC98;text-decoration:none;margin-bottom:18px;">${t.arrow} Back to Browse</a>
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
              <button onclick="window._add('l1')" style="padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${t.cart} Add to Cart</button>
              <button onclick="window._toggleW('l1')" style="padding:12px 14px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;border-radius:12px;cursor:pointer;">${t.heart}</button>
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
          ${l.wishlist.length===0?'<p style="color:#a1a1aa;">Your wishlist is empty.</p>':""}
          ${u.filter(e=>l.wishlist.includes(e.id)).map(e=>`
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
                  <button onclick="window._toggleW('${e.id}')" style="padding:6px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${t.heart}</button>
                </div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,checkout:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Checkout</h2>
        <form onsubmit="event.preventDefault();this.closest('form').innerHTML='<p style=color:#C9A84C;font-family:Cinzel,serif>Order placed.</p>';" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping Address</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="3" required></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Card Number</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="4242 4242 4242 4242"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="MM/YY"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="CVC"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Payment Method</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Stripe (Card)</option><option>Coinbase Commerce</option><option>Solana (SOL)</option></select></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${t.shield} Pay Securely</button></div>
        </form>
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
          ${u.slice(0,4).map(e=>`
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
          ${[{name:"Outreach Agent",desc:"Find buyers across social and marketplace channels."},{name:"Appraisal Agent",desc:"Estimate value from photos, description, and market data."},{name:"Support Agent",desc:"Answer buyer/seller questions and status requests."},{name:"Ops Agent",desc:"Monitor listings, pricing, and fulfillment status."}].map(e=>`
            <div style="background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;padding:16px;">
              <div style="font-family:'Cinzel',serif;font-weight:700;color:#F5EED8;">${e.name}</div>
              <p style="color:#C8BC98;font-size:12px;margin-top:8px;line-height:1.5;">${e.desc}</p>
              <button onclick="alert('Agent endpoint ready.')" style="margin-top:14px;width:100%;padding:10px;background:transparent;color:#C9A84C;border:1px solid rgba(201,168,76,0.35);border-radius:12px;cursor:pointer;">Configure Agent</button>
            </div>
          `).join("")}
        </div>
      </div>
    </section>
  `,about:()=>x("About The Vault","The elite collector exchange built for transparency, speed, and fair value."),support:()=>x("Support Center","Get help with listings, checkout, shipping, and authentication."),faq:()=>x("FAQ","Common questions about fees, authentication, checkout, and shipping."),terms:()=>x("Terms of Service","Please review the marketplace terms before using The Vault."),privacy:()=>x("Privacy Policy","We protect your data and transaction privacy."),returns:()=>x("Returns & Refunds","Returns are reviewed case-by-case within 48 hours of delivery."),shipping:()=>x("Shipping Info","Standard and expedited options available at checkout."),contact:()=>x("Contact Us","Reach the Vault team at ratchetkrewelabs@gmail.com."),directory:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Directory / Sitemap</h2>
        <div style="margin-top:18px;display:grid;gap:10px;">
          ${[["Home","/"],["Browse Collection","/browse"],["Sell an Item","/sell"],["AI Appraisal","/appraisal"],["ProVerify","/proverify"],["Token Gallery","/tokengallery"],["My Orders","/orders"],["Wishlist","/wishlist"],["Wallet Pay","/walletpay"],["Admin","/admin"],["Agents","/agents"],["Contact Us","/contact"],["Support","/support"],["FAQ","/faq"],["Shipping","/shipping"],["Terms","/terms"],["Privacy","/privacy"],["Returns","/returns"]].map(([e,i])=>`
            <a href="${i}" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:12px;color:#F5EED8;text-decoration:none;font-family:'Cinzel',serif;letter-spacing:2px;">
              <span style="font-size:11px;">${e}</span>
              <span style="color:#C9A84C;">${t.chevron}</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>
  `};function x(e,i){return`
    <section style="padding-top:100px;">
      <div style="max-width:900px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">${e}</h2>
        <p style="color:#a1a1aa;margin-top:10px;">${i}</p>
        <p style="color:#C8BC98;margin-top:10px;">This section is connected and ready for backend integration.</p>
        <div style="margin-top:18px;"><a href="/" style="color:#C9A84C;text-decoration:none;">${t.arrow} Back to Home</a></div>
      </div>
    </section>
  `}const g=()=>{const e=document.getElementById("app");e&&(e.innerHTML=M())};window._add=e=>{const i=u.find(r=>r.id===e);i&&!l.cart.find(r=>r.id===e)&&l.cart.push(i),g()};window._remove=e=>{l.cart=l.cart.filter(i=>i.id!==e),g()};window._toggleW=e=>{l.wishlist=l.wishlist.includes(e)?l.wishlist.filter(i=>i!==e):[...l.wishlist,e],g()};window._filterBrowse=e=>{l._browse=e,g()};window._calc=()=>{var w;const e=((w=document.getElementById("calc-value"))==null?void 0:w.value)||"0",i=parseFloat(e)||0;let r=5;i>=1e4?r=15:i>=7500?r=10:i>=1e3&&(r=7);const c=i*(r/100),a=i-c,o=d=>"$"+d.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),n=document.getElementById("cv-value");n&&(n.textContent=o(i));const s=document.getElementById("cv-rate");s&&(s.textContent=r);const p=document.getElementById("cv-comm");p&&(p.textContent=o(c));const f=document.getElementById("cv-net");f&&(f.textContent=o(a)),[5,7,10,15].forEach(d=>{const y=document.getElementById("tier-"+d);if(!y)return;const h=d===r;y.style.borderColor=h?"#C9A84C":"rgba(201,168,76,0.25)",y.style.background=h?"rgba(201,168,76,0.08)":"#141414"});const m=document.getElementById("calc-compare");if(m&&(m.style.display=i>0?"block":"none",i>0)){const d=document.getElementById("c1");d&&(d.textContent=o(i*.25));const y=document.getElementById("c2");y&&(y.textContent=o(i*.4));const h=document.getElementById("c3");h&&(h.textContent=o(i*.135));const C=document.getElementById("cv");C&&(C.textContent=o(c));const k=document.getElementById("savings");k&&(k.textContent=o(i*.25-c))}};window.addEventListener("popstate",g);window.addEventListener("load",()=>{g(),setTimeout(()=>{const e=document.getElementById("particle-canvas");if(!e)return;const i=e.getContext("2d"),r=()=>{e.width=e.clientWidth,e.height=e.clientHeight};r(),window.addEventListener("resize",r);const c=Array.from({length:50},()=>({x:Math.random()*e.width,y:Math.random()*e.height,size:Math.random()*1.6+.6,vy:-(Math.random()*.6+.2),opacity:Math.random()*.5+.2,doRate:Math.random()*.01+.005})),a=()=>{i.clearRect(0,0,e.width,e.height),c.forEach(o=>{o.y+=o.vy,o.opacity+=o.doRate,(o.opacity>.7||o.opacity<.1)&&(o.doRate*=-1),o.y<-10&&(o.y=e.height+10,o.x=Math.random()*e.width),i.beginPath(),i.arc(o.x,o.y,o.size,0,Math.PI*2),i.fillStyle=`rgba(201,168,76,${o.opacity})`,i.fill()}),requestAnimationFrame(a)};a()},60)});(()=>{try{const e=getDb(),i=(n,s)=>new Promise(p=>{const m=e.transaction(n,"readonly").objectStore(n).get(s);m.onsuccess=()=>p(m.result)}),r=(n,s,p)=>new Promise((f,m)=>{const d=e.transaction(n,"readwrite").objectStore(n).put(p,s);d.onsuccess=()=>f(),d.onerror=()=>m(d.error)});(async()=>{const n=await i("users","current");n&&(l.user=n);const s=await i("cart","items");s&&(l.cart=s||[]);const p=await i("wishlist","items");p&&(l.wishlist=p||[]),g()})(),window._login=async n=>{try{const s=await VAULT_API.request("/api/auth/login",{provider:n});l.user={provider:n,id:s.id,session:s.session},await r("users","current",l.user),g()}catch(s){alert("Login failed: "+s.message)}},window._logout=async()=>{try{await VAULT_API.request("/api/auth/logout",{})}catch{}l.user=null,await r("users","current",null),g()};const a=()=>{!dbReady||!e||(r("cart","items",l.cart).catch(()=>{}),r("wishlist","items",l.wishlist).catch(()=>{}))},o=n=>{const s=window[n];window[n]=(...p)=>{const f=s(...p);return a(),f}};o("_add"),o("_remove"),o("_toggleW")}catch(e){console.error("Auth init failed",e)}})();
