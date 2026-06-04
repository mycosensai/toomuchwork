(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))a(n);new MutationObserver(n=>{for(const t of n)if(t.type==="childList")for(const d of t.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&a(d)}).observe(document,{childList:!0,subtree:!0});function r(n){const t={};return n.integrity&&(t.integrity=n.integrity),n.referrerPolicy&&(t.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?t.credentials="include":n.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(n){if(n.ep)return;n.ep=!0;const t=r(n);fetch(n.href,t)}})();const i={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',search:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',shield:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',cart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',arrow:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',sparkles:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3 13.5 8.5 19 10 13.5 11.5 12 17 10.5 11.5 5 10 10.5 8.5Z"/><path d="M5 15 6 18 9 19 6 20 5 23 4 20 1 19 4 18Z"/></svg>',"shield-check":'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>',clock:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>',trending:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>',gem:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',coins:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="8" r="6"/><path d="M18.5 13.5 16 11M14 16l2.5 2.5M16 11.5 18.5 14"/><circle cx="16" cy="16" r="5.5"/></svg>',landmark:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18"/><path d="M5 21V10l7-5 7 5v11"/><path d="M9 21v-6h6v6"/></svg>',palette:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',watch:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="7"/><path d="M12 9v4l2 2"/><path d="M9 2h6M9 22h6"/></svg>',trophy:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66 17 12l-7-2.66v4.01A2 2 0 0 1 12 18a2 2 0 0 1-2-2.01V14.66z"/><path d="M17 8l2-4"/></svg>',book:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',chevron:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>',xsocial:'<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',instagram:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>',mail:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 7L2 7"/></svg>'},x={x:"https://x.com/thevault",instagram:"https://instagram.com/thevault",email:"mailto:ratchetkrewelabs@gmail.com"},m=[{id:"fine-jewelry",name:"Fine Jewelry",slug:"jewelry",iconName:"gem"},{id:"rare-coins",name:"Rare Coins",slug:"coins",iconName:"coins"},{id:"luxury-watches",name:"Luxury Watches",slug:"watches",iconName:"watch"},{id:"fine-art",name:"Fine Art",slug:"art",iconName:"palette"},{id:"antiques",name:"Antiques",slug:"antiques",iconName:"landmark"},{id:"sports-memorabilia",name:"Sports Memorabilia",slug:"memorabilia",iconName:"trophy"},{id:"collectibles",name:"Collectibles",slug:"collectibles",iconName:"diamond"},{id:"books",name:"Books & Ephemera",slug:"books",iconName:"book"}],f=[{id:"l1",title:"Vault Pass — EMPLOYER{OPS}",price:129,category:"collectibles",image:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:214,condition:"mint",badge:"new"},{id:"l2",title:"Collectible Card — Obsidian Gold",price:58,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:178,condition:"near-mint",badge:"hot"},{id:"l3",title:"Vault DFW Limited Watchlist Ticket",price:240,category:"collectibles",image:"https://images.unsplash.com/photo-1599582909646-2f0a3a6e5c2e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:99,condition:"mint",badge:"offer"},{id:"l4",title:"Rare 1965 Silver Coin Set",price:425,category:"rare-coins",image:"https://images.unsplash.com/photo-1610375465536-5b1d2c5d1f3a?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:312,condition:"mint",badge:"verified"},{id:"l5",title:"Graded 1990 Comic Collection",price:320,category:"books",image:"https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:145,condition:"near-mint",badge:"verified"},{id:"l6",title:"Vintage Toy Robot — 1984",price:190,category:"collectibles",image:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:89,condition:"good",badge:"hot"},{id:"l7",title:"Signed Baseball — Authenticated",price:650,category:"sports-memorabilia",image:"https://images.unsplash.com/photo-1610189012906-478603565824?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:410,condition:"mint",badge:"verified"},{id:"l8",title:"Sealed 1992 Topps Wax Box",price:890,category:"collectibles",image:"https://images.unsplash.com/photo-1607330289024-1535d6f30c7e?auto=format&fit=crop&w=400&q=80",seller:"vaultops",views:220,condition:"mint",badge:"new"}],l={cart:[],wishlist:[]},$=e=>({gem:i.gem,coins:i.coins,landmark:i.landmark,palette:i.palette,watch:i.watch,trophy:i.trophy,diamond:i.diamond,book:i.book})[e]||i.diamond,A=()=>`
  <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:rgba(201,168,76,0.12);">
    ${m.map(e=>`
      <a href="/browse" style="position:relative;height:180px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-decoration:none;padding:20px;background:#0e0e0e;">
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent,rgba(201,168,76,0.14));opacity:0;transition:opacity .3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0"></div>
        <div style="color:#C9A84C;position:relative;z-index:1;">${$(e.iconName)}</div>
        <h3 style="color:#C9A84C;position:relative;z-index:1;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;">${e.name}</h3>
      </a>
    `).join("")}
  </div>
`,k=e=>`
  <div style="padding:0;overflow:hidden;background:#111;border:1px solid rgba(201,168,76,0.15);border-radius:16px;">
    <img src="${e.image}" alt="${e.title}" loading="lazy" style="width:100%;aspect-ratio:1/1;object-fit:cover;display:block;" />
    <div style="padding:14px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
        <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#C9A84C;border:1px solid rgba(201,168,76,0.30);padding:6px 10px;border-radius:999px;">${e.category}</span>
        <span style="color:#a1a1aa;font-size:12px;">Qty 1</span>
      </div>
      <h3 style="margin-top:10px;font-weight:600;line-height:1.3;">${e.title}</h3>
      <div style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:20px;font-weight:700;color:#e5c07b;">$${e.price}</span>
        <div style="display:flex;gap:8px;">
          <button onclick="window._toggleW('${e.id}')" style="padding:8px 10px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${i.heart}</button>
          <button onclick="window._add('${e.id}')" style="padding:8px 10px;border-radius:12px;border:1px solid transparent;background:#e5c07b;color:#000000;font-weight:700;cursor:pointer;">Add</button>
        </div>
      </div>
    </div>
  </div>
`,z={home:()=>`
    <section style="position:relative;overflow:hidden;background:#020202;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 70% 50% at 50% 25%,rgba(201,168,76,0.08),transparent 55%);"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,#080808,#020202,#080808);"></div>
      <canvas id="particle-canvas" style="position:absolute;inset:0;pointer-events:none;"></canvas>
      <div style="position:relative;z-index:2;text-align:center;padding:140px 20px 60px;max-width:1100px;margin:0 auto;">
        <div style="display:inline-flex;align-items:center;gap:10px;padding:8px 14px;border:1px solid rgba(201,168,76,0.35);border-radius:999px;margin-bottom:28px;">
          <span style="width:6px;height:6px;border-radius:50%;background:#C9A84C;box-shadow:0 0 10px #C9A84C;"></span>
          <span style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;">Est. 2024 &middot; Elite Collector Exchange &middot; AI-Powered</span>
        </div>
        <h1 style="font-family:'Cinzel',serif;font-size:clamp(44px,7vw,96px);font-weight:900;letter-spacing:clamp(6px,1.2vw,18px);line-height:0.95;background:linear-gradient(to bottom,#FFD97A,#C9A84C,#8A6E2F);-webkit-background-clip:text;background-clip:text;color:transparent;">The Vault DFW</h1>
        <p style="font-family:'Cinzel',serif;font-size:clamp(11px,1.2vw,13px);letter-spacing:clamp(6px,1vw,14px);color:#C8BC98;text-transform:uppercase;margin-top:14px;">Elite Collector Exchange</p>
        <div style="display:flex;align-items:center;justify-content:center;gap:14px;margin:18px 0 26px;">
          <div style="width:80px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
          <span style="color:#C9A84C;display:inline-flex;">${i.diamond}</span>
          <div style="width:80px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
        </div>
        <p style="max-width:860px;margin:0 auto 36px;color:#F5EED8;font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2vw,22px);line-height:1.6;">Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.</p>
        <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
          <a href="/sell" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;">Start Selling ${i.arrow}</a>
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;font-weight:700;">Find Treasures</a>
        </div>
      </div>
    </section>

    <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.25);border-bottom:1px solid rgba(0,0,0,0.25);">
      <div style="display:flex;white-space:nowrap;animation:marquee 38s linear infinite;width:max-content;">
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${i.diamond}</span></span>`).join("")}
        ${["5% Commission Under $1,000","7% Commission $1,000-$7,500","10% Commission $7,500-$10,000","5% Commission Over $10,000","AI-Powered Buyer Matching","Verified Collectors Only","Real-Time Market Pricing"].map(e=>`<span style="display:inline-flex;align-items:center;gap:18px;padding:0 28px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">${e} <span style="display:inline-flex;">${i.diamond}</span></span>`).join("")}
      </div>
    </div>

    <section style="padding:80px 20px;background:#020202;">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Transparent Pricing</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Commission Calculator</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 10px;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${i.diamond}</span>
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
            <span style="color:#C9A84C;display:inline-flex;">${i.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;">
          ${[{n:"01",icon:i.sparkles,title:"AI Appraisal",desc:"Upload photos and describe your item. Our AI analyzes market data across the internet to give you an accurate price estimate."},{n:"02",icon:i["shield-check"],title:"List Your Item",desc:"Create your listing with our transparent commission structure. 5%, 7%, 10%, or 15% based on item value."},{n:"03",icon:i.trending,title:"AI Finds Buyers",desc:"Our AI agents scan collector networks and marketplaces to find the ideal buyers for your rare item."},{n:"04",icon:i.clock,title:"Close the Deal",desc:"Secure checkout with Stripe. Funds released within 48 hours. You keep the majority, we take our fair commission."}].map(e=>`
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
            <span style="color:#C9A84C;display:inline-flex;">${i.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        ${A()}
      </div>
    </section>

    <section style="padding:80px 20px;background:#080808;border-top:1px solid rgba(201,168,76,0.15);">
      <div style="max-width:1100px;margin:0 auto;">
        <div style="text-align:center;margin-bottom:56px;">
          <p style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:#C9A84C;margin-bottom:10px;">Currently Available</p>
          <h2 style="font-family:'Cinzel',serif;font-size:clamp(22px,3vw,34px);font-weight:700;color:#F5EED8;letter-spacing:4px;">Featured in The Vault</h2>
          <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:14px 0 0;">
            <div style="width:56px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
            <span style="color:#C9A84C;display:inline-flex;">${i.diamond}</span>
            <div style="width:56px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;">
          ${f.map(k).join("")}
        </div>
        <div style="text-align:center;margin-top:36px;">
          <a href="/browse" style="display:inline-flex;align-items:center;gap:10px;padding:12px 18px;border:1px solid rgba(201,168,76,0.6);color:#C9A84C;font-family:'Cinzel',serif;letter-spacing:2px;border-radius:14px;text-decoration:none;">View All Listings ${i.chevron}</a>
        </div>
      </div>
    </section>
  `,browse:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:1100px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;color:#F5EED8;">Browse Collection</h2>
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
          ${m.map(e=>`<button style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.08);background:transparent;color:#f5f5f5;cursor:pointer;">${e.name}</button>`).join("")}
        </div>
        <div style="margin-top:24px;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:20px;">
          ${f.map(k).join("")}
        </div>
      </div>
    </section>
  `,sell:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:720px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">List an Item</h2>
        <form onsubmit="event.preventDefault();alert('Submitted');" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Title</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="Vintage Rolex Submariner — 1987" required></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Category</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;">${m.filter(e=>e.id!=="all").map(e=>`<option>${e.name}</option>`).join("")}</select></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Condition</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Mint</option><option>Near Mint</option><option>Good</option><option>Fair</option></select></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Images (comma separated URLs)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="https://example.com/a.jpg, https://example.com/b.jpg"></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Price (USD)</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01" required></div>
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" type="number" min="0" step="0.01"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Description</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="5" placeholder="Provenance, grading, authenticity notes..."></textarea></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${i.gem} Create Listing</button></div>
        </form>
      </div>
    </section>
  `,checkout:()=>`
    <section style="padding-top:100px;">
      <div style="max-width:760px;margin:0 auto;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;font-weight:700;letter-spacing:2px;">Checkout</h2>
        <form onsubmit="event.preventDefault();alert('Order placed');" style="margin-top:22px;display:grid;gap:16px;">
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Shipping Address</label><textarea style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" rows="3" required></textarea></div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Card Number</label><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="4242 4242 4242 4242"></div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="MM/YY"><input style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;" placeholder="CVC"></div>
          </div>
          <div><label style="display:block;color:#a1a1aa;font-size:13px;font-weight:600;margin-bottom:8px;">Payment Method</label><select style="width:100%;background:#141414;border:1px solid rgba(255,255,255,0.08);color:#f5f5f5;padding:12px 14px;border-radius:12px;outline:none;"><option>Stripe (Card)</option><option>Coinbase Commerce</option><option>Solana (SOL)</option></select></div>
          <div><button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;background:#e5c07b;color:#000000;border:1px solid transparent;border-radius:12px;font-weight:700;cursor:pointer;">${i.shield} Pay Securely</button></div>
        </form>
      </div>
    </section>
  `},B=()=>{const e=location.pathname.replace(/^\/+/,"")||"home",o=r=>e===r?"color:#E8CB7A;":"color:#C8BC98;";return`
    <header style="border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(0,0,0,0.7);backdrop-filter:blur(14px);position:sticky;top:0;z-index:50;">
      <div style="max-width:1200px;margin:0 auto;padding:18px 24px;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="text-decoration:none;display:inline-flex;align-items:center;gap:12px;"><span style="font-family:'Cinzel',serif;font-weight:800;letter-spacing:4px;color:#C9A84C;">The Vault DFW</span></a>
        <nav style="display:none;align-items:center;gap:24px;">
          ${["browse","appraisal","proverify","sell","token-gallery","support"].map(r=>`<a href="/${r}" style="font-size:11px;letter-spacing:3px;text-transform:uppercase;text-decoration:none;${o(r)}">${r==="proverify"?"ProVerify":r.charAt(0).toUpperCase()+r.slice(1)}</a>`).join("")}
        </nav>
        <div style="display:none;align-items:center;gap:14px;">
          <a href="/browse" style="color:#C8BC98;text-decoration:none;">${i.search}</a>
          <a href="/wishlist" style="color:#C8BC98;text-decoration:none;">${i.heart}</a>
          <a href="/orders" style="color:#C8BC98;text-decoration:none;">${i.cart}</a>
          <a href="/admin" style="color:#C8BC98;text-decoration:none;">${i.shield}</a>
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
            <a href="${x.x}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${i.xsocial}</a>
            <a href="${x.instagram}" target="_blank" rel="noopener" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${i.instagram}</a>
            <a href="${x.email}" style="width:32px;height:32px;border:1px solid rgba(201,168,76,0.25);display:inline-flex;align-items:center;justify-content:center;color:#C8BC98;text-decoration:none;">${i.mail}</a>
          </div>
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Platform</h4>
          ${["Browse Collection","AI Appraisal","ProVerify","Sell an Item","Token Gallery","Wishlist","My Orders"].map(r=>`<a href="/browse" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Company</h4>
          ${["About The Vault","FAQ","Contact Us","Shipping Info","Support Center"].map(r=>`<a href="/about" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
        </div>
        <div>
          <h4 style="font-size:9px;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;font-weight:700;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(201,168,76,0.18);">Legal</h4>
          ${["Terms of Service","Privacy Policy","Returns & Refunds"].map(r=>`<a href="/terms" style="display:block;font-size:12px;color:#C8BC98;text-decoration:none;margin-bottom:8px;letter-spacing:1px;">${r}</a>`).join("")}
          <a href="${x.email}" style="display:inline-flex;align-items:center;gap:8px;margin-top:10px;font-size:12px;color:#C8BC98;text-decoration:none;">${i.mail} ratchetkrewelabs@gmail.com</a>
        </div>
      </div>
      <div style="max-width:1100px;margin:28px auto 0;padding-top:18px;border-top:1px solid rgba(201,168,76,0.10);display:flex;flex-direction:column;gap:10px;align-items:center;">
        <p style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#8A6E2F;">&copy; 2024 The Vault. All rights reserved.</p>
      </div>
    </footer>
  `},g=()=>{const e=document.getElementById("app");e&&(e.innerHTML=B())};window._add=e=>{const o=f.find(r=>r.id===e);o&&!l.cart.find(r=>r.id===e)&&l.cart.push(o),g()};window._remove=e=>{l.cart=l.cart.filter(o=>o.id!==e),g()};window._toggleW=e=>{l.wishlist=l.wishlist.includes(e)?l.wishlist.filter(o=>o!==e):[...l.wishlist,e],g()};window._calc=()=>{var b;const e=((b=document.getElementById("calc-value"))==null?void 0:b.value)||"0",o=parseFloat(e)||0;let r=5;o>=1e4?r=15:o>=7500?r=10:o>=1e3&&(r=7);const a=o*(r/100),n=o-a,t=s=>"$"+s.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}),d=document.getElementById("cv-value");d&&(d.textContent=t(o));const h=document.getElementById("cv-rate");h&&(h.textContent=r);const y=document.getElementById("cv-comm");y&&(y.textContent=t(a));const u=document.getElementById("cv-net");u&&(u.textContent=t(n)),[5,7,10,15].forEach(s=>{const p=document.getElementById("tier-"+s);if(!p)return;const c=s===r;p.style.borderColor=c?"#C9A84C":"rgba(201,168,76,0.25)",p.style.background=c?"rgba(201,168,76,0.08)":"#141414"});const v=document.getElementById("calc-compare");if(v&&(v.style.display=o>0?"block":"none",o>0)){const s=document.getElementById("c1");s&&(s.textContent=t(o*.25));const p=document.getElementById("c2");p&&(p.textContent=t(o*.4));const c=document.getElementById("c3");c&&(c.textContent=t(o*.135));const w=document.getElementById("cv");w&&(w.textContent=t(a));const C=document.getElementById("savings");C&&(C.textContent=t(o*.25-a))}};window.addEventListener("popstate",g);window.addEventListener("load",()=>{g(),setTimeout(()=>{const e=document.getElementById("particle-canvas");if(!e)return;const o=e.getContext("2d"),r=()=>{e.width=e.clientWidth,e.height=e.clientHeight};r(),window.addEventListener("resize",r);const a=Array.from({length:40},()=>({x:Math.random()*e.width,y:Math.random()*e.height,size:Math.random()*1.6+.6,vy:-(Math.random()*.6+.2),opacity:Math.random()*.5+.2,doRate:Math.random()*.01+.005})),n=()=>{o.clearRect(0,0,e.width,e.height),a.forEach(t=>{t.y+=t.vy,t.opacity+=t.doRate,(t.opacity>.7||t.opacity<.1)&&(t.doRate*=-1),t.y<-10&&(t.y=e.height+10,t.x=Math.random()*e.width),o.beginPath(),o.arc(t.x,t.y,t.size,0,Math.PI*2),o.fillStyle=`rgba(201,168,76,${t.opacity})`,o.fill()}),requestAnimationFrame(n)};n()},60)});
