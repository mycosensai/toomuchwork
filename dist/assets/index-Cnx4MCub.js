(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))l(i);new MutationObserver(i=>{for(const a of i)if(a.type==="childList")for(const c of a.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&l(c)}).observe(document,{childList:!0,subtree:!0});function s(i){const a={};return i.integrity&&(a.integrity=i.integrity),i.referrerPolicy&&(a.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?a.credentials="include":i.crossOrigin==="anonymous"?a.credentials="omit":a.credentials="same-origin",a}function l(i){if(i.ep)return;i.ep=!0;const a=s(i);fetch(i.href,a)}})();const u=(e,t=document)=>t.querySelector(e),o=(e,t={},...s)=>{const l=document.createElement(e);return Object.entries(t).forEach(([i,a])=>{i==="class"?l.className=a:i==="style"&&typeof a=="object"?Object.assign(l.style,a):l.setAttribute(i,a)}),s.flat(1/0).forEach(i=>{typeof i=="string"?l.appendChild(document.createTextNode(i)):i&&l.appendChild(i)}),l},r={cart:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',user:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',star:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',arrow:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',shield:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',gem:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',scan:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><rect x="7" y="7" width="10" height="10" rx="1"/></svg>',price:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>'},g=[{id:"all",name:"All"},{id:"sports-cards",name:"Sports Cards"},{id:"memorabilia",name:"Memorabilia"},{id:"sealed-wax",name:"Sealed Wax"},{id:"coins",name:"Coins & Currency"},{id:"vintage-toys",name:"Vintage Toys"},{id:"comics",name:"Comics"},{id:"autographs",name:"Autographs"},{id:"other",name:"Other"}],m=[{id:"l1",title:"Vault Pass — EMPLOYER{OPS}",price:129,category:"collectibles",image_url:"https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:214,condition:"mint"},{id:"l2",title:"Collectible Card — Obsidian Gold",price:58,category:"sports-cards",image_url:"https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:178,condition:"near-mint"},{id:"l3",title:"Vault DFW Limited Watchlist Ticket",price:240,category:"memorabilia",image_url:"https://images.unsplash.com/photo-1599582909646-2f0a3a6e5c2e?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:99,condition:"mint"},{id:"l4",title:"Rare 1965 Silver Coin Set",price:425,category:"coins",image_url:"https://images.unsplash.com/photo-1610375465536-5b1d2c5d1f3a?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:312,condition:"mint"},{id:"l5",title:"Graded 1990 Comic Collection",price:320,category:"comics",image_url:"https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:145,condition:"near-mint"},{id:"l6",title:"Vintage Toy Robot — 1984",price:190,category:"vintage-toys",image_url:"https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:89,condition:"good"},{id:"l7",title:"Signed Baseball — Authenticated",price:650,category:"sports-cards",image_url:"https://images.unsplash.com/photo-1610189012906-478603565824?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:410,condition:"mint"},{id:"l8",title:"Sealed 1992 Topps Wax Box",price:890,category:"sealed-wax",image_url:"https://images.unsplash.com/photo-1607330289024-1535d6f30c7e?auto=format&fit=crop&w=400&q=80",seller_username:"vaultops",views:220,condition:"mint"}],n={cart:[],wishlist:[]},f=e=>{n.cart.find(t=>t.id===e.id)||n.cart.push(e),d()},v=e=>{n.cart=n.cart.filter(t=>t.id!==e),d()},y=e=>{n.wishlist=n.wishlist.includes(e)?n.wishlist.filter(t=>t!==e):[...n.wishlist,e],d()},p={};function h(e){history.pushState(null,"",`/${e}`),d()}function d(){const e=location.pathname.replace(/^\/+/,"")||"home",t=p[e],s=u("#app");s.innerHTML="";const l=o("header",{class:"header"},o("div",{class:"header-inner"},o("a",{href:"/home",class:"brand",style:{textDecoration:"none"}},"The Vault DFW"),o("nav",{class:"nav"},["home","browse","sell","appraisal","pro-verify","orders","cart","wallet-pay","profile"].map(a=>o("a",{href:`/${a}`,class:location.pathname.replace(/^\/+/,"")===a?"active":""},a.replace("-"," ").replace(/\b\w/g,c=>c.toUpperCase()))))));if(s.appendChild(l),t){const a=o("main",{class:"page"},o("div",{class:"container"},t()));s.appendChild(a)}else s.appendChild(o("main",{class:"page"},o("div",{class:"container"},o("h1",{},"404 — Not Found"))));const i=o("div",{style:{position:"fixed",bottom:"24px",right:"24px",display:"flex",gap:"12px",zIndex:100}},o("button",{class:"btn btn-ghost",title:"Cart",onclick:()=>h("cart")},r.cart),o("button",{class:"btn btn-ghost",title:"Earn / Payouts",onclick:()=>h("profile")},r.price),o("button",{class:"btn btn-ghost",title:"Account",onclick:()=>h("profile")},r.user));s.appendChild(i)}window.addEventListener("popstate",d);p.home=()=>`
  <div class="text-center" style="margin-top: 80px;">
    <div class="badge" style="margin-bottom: 24px;">
      <span style="display:inline-flex;align-items:center;gap:8px;">${r.star} Marketplace</span>
    </div>
    <h1 class="text-gold" style="font-family: ui-serif, Georgia, Cambria, 'Times New Roman', serif; font-size: clamp(40px, 6vw, 72px); font-weight: 800; letter-spacing: 4px;">The Vault DFW</h1>
    <p style="max-width: 860px; margin: 24px auto 0; color: #c8bc98; font-family: ui-serif, Georgia, Cambria, 'Times New Roman', serif; font-style: italic; font-size: clamp(18px, 2vw, 22px); line-height: 1.6;">
      Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.
    </p>
    <div style="margin-top: 36px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
      <a href="/browse" class="btn btn-primary" style="text-decoration: none;">${r.arrow} Browse Collection</a>
      <a href="/appraisal" class="btn btn-ghost" style="text-decoration: none;">${r.scan} AI Appraisal</a>
    </div>
  </div>
`;p.browse=()=>{const e=m.map(t=>`
    <div class="card" style="padding: 0; overflow: hidden;">
      <img src="${t.image_url}" alt="${t.title}" loading="lazy" style="width:100%; aspect-ratio:1/1; object-fit:cover; display:block;" />
      <div style="padding: 16px;">
        <div style="display:flex; justify-content:space-between; align-items:center; gap: 8px;">
          <span class="badge">${t.category}</span>
          <span class="text-muted" style="font-size: 12px;">Qty 1</span>
        </div>
        <h3 style="margin-top: 10px; font-weight: 600; line-height: 1.3;">${t.title}</h3>
        <div style="margin-top: 12px; display:flex; justify-content:space-between; align-items:center;">
          <span class="text-gold" style="font-size: 20px; font-weight: 700;">$${t.price}</span>
          <div style="display:flex; gap:8px;">
            <button class="btn btn-ghost" title="Wishlist" onclick="window._toggleWishlist('${t.id}')">${r.heart}</button>
            <button class="btn btn-primary" onclick="window._addToCart('${t.id}')">${r.cart} Add</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");return`
    <div style="margin-top: 32px;">
      <h2 style="font-size: 28px; font-weight: 700; letter-spacing: 1px;">Browse Collection</h2>
      <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
        ${g.map(t=>`<button class="btn btn-ghost" style="font-size: 12px;">${t.name}</button>`).join("")}
      </div>
      <div style="margin-top: 24px; display:grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 20px;">
        ${e}
      </div>
    </div>
  `};p.cart=()=>{const e=n.cart.map((i,a)=>`
    <div class="card" style="display:flex; gap: 16px; align-items: center; justify-content: space-between;">
      <div style="display:flex; gap:16px; align-items:center;">
        <img src="${i.image_url}" alt="" style="width:64px; height:64px; border-radius: 12px; object-fit:cover; background:#000;" />
        <div>
          <h4 style="font-weight: 600;">${i.title}</h4>
          <span class="text-muted" style="font-size: 12px;">${i.category}</span>
        </div>
      </div>
      <div style="display:flex; gap:12px; align-items:center;">
        <span class="text-gold" style="font-weight:700;">$${i.price}</span>
        <button class="btn btn-ghost" onclick="window._removeFromCart('${i.id}')">Remove</button>
      </div>
    </div>
  `).join(""),t=n.cart.reduce((i,a)=>i+Number(a.price||0),0),s=t*.09,l=t+s;return`
    <div style="margin-top: 32px;">
      <h2 style="font-size: 28px; font-weight: 700;">Your Cart</h2>
      ${n.cart.length===0?'<p class="text-muted" style="margin-top:16px;">Your cart is empty.</p>':`
        <div style="margin-top: 20px; display:grid; grid-template-columns: 1fr 360px; gap: 24px;">
          <div style="display:flex; flex-direction:column; gap:12px;">${e}</div>
          <div class="card" style="height: fit-content;">
            <h3 style="font-weight: 700; margin-bottom: 12px;">Summary</h3>
            <div style="display:flex; justify-content:space-between; color: var(--muted); font-size: 14px;">
              <span>Subtotal</span><span>$${t.toFixed(2)}</span>
            </div>
            <div class="divider" style="margin: 12px 0;"></div>
            <div style="display:flex; justify-content:space-between; color: var(--muted); font-size: 14px;">
              <span>Tax (9%)</span><span>$${s.toFixed(2)}</span>
            </div>
            <div class="divider" style="margin: 12px 0;"></div>
            <div style="display:flex; justify-content:space-between; font-weight: 700;">
              <span>Total</span><span class="text-gold">$${l.toFixed(2)}</span>
            </div>
            <button class="btn btn-primary" style="width:100%; margin-top: 16px;">Checkout</button>
          </div>
        </div>
      `}
    </div>
  `};p.sell=()=>`
  <div style="margin-top: 32px; max-width: 720px;">
    <h2 style="font-size: 28px; font-weight: 700;">List an Item</h2>
    <form onsubmit="event.preventDefault(); alert('Submitted');" style="margin-top: 20px; display:grid; gap: 16px;">
      <div>
        <label class="label">Title</label>
        <input class="input" placeholder="Vintage Rolex Submariner — 1987" required />
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label class="label">Category</label>
          <select class="input">
            ${g.filter(e=>e.id!=="all").map(e=>`<option>${e.name}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="label">Condition</label>
          <select class="input">
            <option>Mint</option><option>Near Mint</option><option>Good</option><option>Fair</option>
          </select>
        </div>
      </div>
      <div>
        <label class="label">Images (comma separated URLs)</label>
        <input class="input" placeholder="https://example.com/a.jpg, https://example.com/b.jpg" />
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label class="label">Price (USD)</label>
          <input class="input" type="number" min="0" step="0.01" required />
        </div>
        <div>
          <label class="label">Shipping</label>
          <input class="input" type="number" min="0" step="0.01" />
        </div>
      </div>
      <div>
        <label class="label">Description</label>
        <textarea class="input" rows="5" placeholder="Provenance, grading, authenticity notes..."></textarea>
      </div>
      <div>
        <button class="btn btn-primary" type="submit">${r.gem} Create Listing</button>
      </div>
    </form>
  </div>
`;p.checkout=()=>`
  <div style="margin-top: 32px; max-width: 760px;">
    <h2 style="font-size: 28px; font-weight: 700;">Checkout</h2>
    <form onsubmit="event.preventDefault(); alert('Order placed');" style="margin-top: 20px; display:grid; gap: 16px;">
      <div>
        <label class="label">Shipping Address</label>
        <textarea class="input" rows="3" required></textarea>
      </div>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <div>
          <label class="label">Card Number</label>
          <input class="input" placeholder="4242 4242 4242 4242" />
        </div>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <input class="input" placeholder="MM/YY" />
          <input class="input" placeholder="CVC" />
        </div>
      </div>
      <div>
        <label class="label">Payment Method</label>
        <select class="input">
          <option>Stripe (Card)</option>
          <option>Coinbase Commerce</option>
          <option>Solana (SOL)</option>
        </select>
      </div>
      <button class="btn btn-primary" type="submit">${r.shield} Pay Securely</button>
    </form>
  </div>
`;["orders","profile","about","support","terms","privacy","returns","shipping","faq"].forEach(e=>{p[e]=()=>`
    <div style="margin-top: 32px;">
      <h2 style="font-size: 28px; font-weight: 700;">${e.replace(/^./,t=>t.toUpperCase()).replace("-"," ")}</h2>
      <p class="text-muted" style="margin-top: 10px;">This section is connected and ready for backend integration.</p>
    </div>
  `});p["wallet-pay"]=()=>`
  <div style="margin-top: 32px; max-width: 720px;">
    <h2 style="font-size: 28px; font-weight: 700;">Wallet Pay</h2>
    <p class="text-muted" style="margin-top: 10px;">Pay with Solana, USDC, or connect your wallet.</p>
    <div style="margin-top: 20px; display:grid; gap: 12px;">
      <button class="btn btn-primary">Connect Wallet</button>
      <button class="btn btn-ghost">Pay with Stripe</button>
      <button class="btn btn-ghost">Pay with Coinbase</button>
    </div>
  </div>
`;window._addToCart=e=>{const t=m.find(s=>s.id===e);t&&f(t)};window._removeFromCart=e=>v(e);window._toggleWishlist=e=>y(e);d();
