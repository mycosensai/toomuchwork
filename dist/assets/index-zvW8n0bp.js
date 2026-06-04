(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))r(e);new MutationObserver(e=>{for(const i of e)if(i.type==="childList")for(const s of i.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function n(e){const i={};return e.integrity&&(i.integrity=e.integrity),e.referrerPolicy&&(i.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?i.credentials="include":e.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(e){if(e.ep)return;e.ep=!0;const i=n(e);fetch(e.href,i)}})();const a={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',cart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',arrow:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'},l={scrolled:!1};window.addEventListener("scroll",()=>{const t=window.scrollY>50;if(l.scrolled!==t){l.scrolled=t;const o=document.getElementById("main-nav");o&&(o.style.background=t?"rgba(8, 8, 8, 0.95)":"transparent",o.style.backdropFilter=t?"blur(14px)":"none",o.style.borderBottom=t?"1px solid rgba(201, 168, 76, 0.2)":"none")}},{passive:!0});const d=()=>{const t=document.getElementById("app");t&&(t.innerHTML=`
    <div style="min-height:100vh;background:#080808;color:#F5EED8;font-family:'Inter',sans-serif;">
      ${p()}
      <main>${c()}</main>
      ${m()}
    </div>
  `,y())},p=()=>{const t=window.location.pathname;return`
    <nav id="main-nav" style="position:fixed;top:0;left:0;right:0;z-index:50;transition:all 0.3s;height:72px;background:transparent;">
      <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#C9A84C;">
          <div style="width:34px;height:34px;border:1px solid #C9A84C;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
            <span style="transform:rotate(-45deg);">${a.diamond}</span>
          </div>
          <span style="font-family:'Cinzel',serif;font-weight:700;letter-spacing:4px;font-size:18px;">THE VAULT</span>
        </a>
        <div style="display:flex;align-items:center;gap:28px;">
          ${["Browse","Sell","Tokens","Support"].map(o=>`<a href="/${o.toLowerCase()}" style="text-decoration:none;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:${t==="/"+o.toLowerCase()?"#E8CB7A":"#C8BC98"};">${o}</a>`).join("")}
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <a href="/wishlist" style="color:#C8BC98;text-decoration:none;">${a.heart}</a>
          <a href="/cart" style="color:#C8BC98;text-decoration:none;">${a.cart}</a>
          <a href="/login" style="padding:10px 20px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;">Sign In</a>
        </div>
      </div>
    </nav>
  `},c=()=>{const t=window.location.pathname;return t==="/"||t==="/home"?g():h()},g=()=>`
  <section style="position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;padding-top:80px;">
    <!-- Kimi Background -->
    <div style="position:absolute;inset:0;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 30%,rgba(201,168,76,0.06) 0%,transparent 70%);"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,#080808,#0a0800 50%,#080808);"></div>
    </div>
    <canvas id="particle-canvas" style="position:absolute;inset:0;pointer-events:none;opacity:0.6;"></canvas>
    
    <!-- Corner Accents -->
    <div style="position:absolute;top:100px;left:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-right:0;border-bottom:0;"></div>
    <div style="position:absolute;top:100px;right:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-left:0;border-bottom:0;"></div>
    <div style="position:absolute;bottom:40px;left:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-right:0;border-top:0;"></div>
    <div style="position:absolute;bottom:40px;right:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-left:0;border-top:0;"></div>

    <div style="position:relative;z-index:10;text-align:center;padding:0 24px;max-width:900px;margin:0 auto;">
      <div style="display:inline-flex;align-items:center;gap:12px;padding:8px 18px;border:1px solid rgba(201,168,76,0.25);margin-bottom:32px;">
        <span style="width:2px;height:2px;background:#C9A84C;border-radius:50%;box-shadow:0 0 8px #C9A84C;"></span>
        <span style="font-size:9px;tracking:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Est. 2024 &middot; Elite Collector Exchange &middot; AI-Powered</span>
      </div>
      <h1 style="font-family:'Cinzel',serif;font-size:clamp(48px,8vw,110px);font-weight:900;letter-spacing:12px;line-height:0.95;margin-bottom:12px;background:linear-gradient(to bottom,#FFD97A,#C9A84C,#8A6E2F);-webkit-background-clip:text;color:transparent;">THE VAULT</h1>
      <p style="font-family:'Cinzel',serif;font-size:clamp(10px,1vw,12px);letter-spacing:8px;color:#C8BC98;text-transform:uppercase;margin-bottom:24px;">Elite Collector Exchange</p>
      
      <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:32px;">
        <div style="width:60px;height:1px;background:linear-gradient(to right,transparent,#C9A84C);"></div>
        <span style="color:#C9A84C;display:flex;transform:scale(0.8);">${a.diamond}</span>
        <div style="width:60px;height:1px;background:linear-gradient(to left,transparent,#C9A84C);"></div>
      </div>

      <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2.5vw,24px);color:#F5EED8;line-height:1.6;margin-bottom:48px;">
        Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.
      </p>

      <div style="display:flex;gap:20px;justify-content:center;">
        <a href="/sell" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">START SELLING ${a.arrow}</a>
        <a href="/browse" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">FIND TREASURES</a>
      </div>
    </div>
  </section>
  ${x()}
  ${f()}
`,x=()=>`
  <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.2);border-bottom:1px solid rgba(0,0,0,0.2);">
    <div style="display:flex;white-space:nowrap;width:max-content;animation:marquee 30s linear infinite;">
      ${Array(4).fill(["5% Commission Under $1,000","7% Commission $1,000 - $7,500","AI-Powered Buyer Matching","Verified Collectors Only"]).flat().map(t=>`
        <span style="display:inline-flex;align-items:center;gap:20px;padding:0 40px;color:#080808;font-family:'Cinzel',serif;font-size:10px;font-weight:700;letter-spacing:3px;">
          ${t.toUpperCase()} <span style="display:flex;transform:scale(0.5);">${a.diamond}</span>
        </span>
      `).join("")}
    </div>
  </div>
`,f=()=>`
  <section style="padding:100px 24px;position:relative;background:transparent;">
    <div style="position:absolute;inset:0;background:radial-gradient(ellipse 60% 40% at 50% 50%,rgba(201,168,76,0.04),transparent);"></div>
    <div style="max-width:800px;margin:0 auto;position:relative;">
      <div style="text-align:center;margin-bottom:48px;">
        <h2 style="font-family:'Cinzel',serif;font-size:28px;letter-spacing:4px;color:#F5EED8;margin-bottom:10px;">COMMISSION CALCULATOR</h2>
        <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:16px;">Know exactly what you keep before you list</p>
      </div>
      <div style="background:rgba(20,20,20,0.4);backdrop-filter:blur(8px);border:1px solid rgba(201,168,76,0.2);padding:40px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.4);">
        <div style="position:absolute;top:0;left:0;width:24px;height:24px;border-top:2px solid #C9A84C;border-left:2px solid #C9A84C;"></div>
        <div style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-bottom:2px solid #C9A84C;border-right:2px solid #C9A84C;"></div>
        <div style="margin-bottom:40px;">
          <label style="display:block;font-size:10px;letter-spacing:4px;color:#C9A84C;text-transform:uppercase;margin-bottom:12px;">Item Value</label>
          <input type="number" id="calc-input" placeholder="0" oninput="updateCalculator()" style="width:100%;background:rgba(0,0,0,0.2);border:none;border-bottom:2px solid #C9A84C;color:#F5EED8;font-family:'Cinzel',serif;font-size:48px;padding:12px 0;outline:none;">
        </div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:rgba(201,168,76,0.1);">
          <div style="background:rgba(8,8,8,0.6);padding:24px;text-align:center;">
            <div style="font-size:8px;letter-spacing:2px;color:#8A6E2F;text-transform:uppercase;margin-bottom:8px;">Item Value</div>
            <div id="res-val" style="font-family:'Cinzel',serif;font-size:20px;color:#F5EED8;">$0.00</div>
          </div>
          <div style="background:rgba(8,8,8,0.8);padding:24px;text-align:center;border-left:1px solid rgba(201,168,76,0.2);border-right:1px solid rgba(201,168,76,0.2);">
            <div style="font-size:8px;letter-spacing:2px;color:#8A6E2F;text-transform:uppercase;margin-bottom:8px;">Commission</div>
            <div id="res-comm" style="font-family:'Cinzel',serif;font-size:24px;color:#C9A84C;font-weight:700;">$0.00</div>
          </div>
          <div style="background:rgba(8,8,8,0.6);padding:24px;text-align:center;">
            <div style="font-size:8px;letter-spacing:2px;color:#8A6E2F;text-transform:uppercase;margin-bottom:8px;">You Receive</div>
            <div id="res-net" style="font-family:'Cinzel',serif;font-size:20px;color:#E8CB7A;">$0.00</div>
          </div>
        </div>
      </div>
    </div>
  </section>
`,m=()=>`
  <footer style="padding:80px 0;border-top:1px solid rgba(201,168,76,0.1);background:transparent;">
    <div style="text-align:center;">
       <div style="font-family:'Cinzel',serif;color:#C9A84C;font-weight:700;letter-spacing:6px;font-size:20px;margin-bottom:12px;">THE VAULT</div>
       <p style="font-size:10px;letter-spacing:4px;color:#8A6E2F;text-transform:uppercase;">&copy; 2024 The Vault. All rights reserved.</p>
    </div>
  </footer>
`,h=()=>`<section style="padding:160px 40px;text-align:center;font-family:'Cinzel',serif;color:#C9A84C;font-size:24px;">COLLECTION REPOSITORY READY</section>`;window.updateCalculator=()=>{const t=parseFloat(document.getElementById("calc-input").value)||0,o=t>=1e4?.05:t>=7500?.1:t>=1e3?.07:.05,n=t*o,r=t-n,e=i=>"$"+i.toLocaleString("en-US",{minimumFractionDigits:2});document.getElementById("res-val").innerText=e(t),document.getElementById("res-comm").innerText=e(n),document.getElementById("res-net").innerText=e(r)};const y=()=>{const t=document.getElementById("particle-canvas");if(!t)return;const o=t.getContext("2d"),n=()=>{t.width=window.innerWidth,t.height=window.innerHeight};window.addEventListener("resize",n),n();const r=Array.from({length:45},()=>({x:Math.random()*t.width,y:Math.random()*t.height,s:Math.random()*1.4+.4,vy:-(Math.random()*.4+.2),o:Math.random()*.4+.2})),e=()=>{o.clearRect(0,0,t.width,t.height),r.forEach(i=>{i.y+=i.vy,i.y<-10&&(i.y=t.height+10),o.beginPath(),o.arc(i.x,i.y,i.s,0,Math.PI*2),o.fillStyle=`rgba(201,168,76,${i.o})`,o.fill()}),requestAnimationFrame(e)};e()};d();
