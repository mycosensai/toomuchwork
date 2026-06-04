(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const i of n)if(i.type==="childList")for(const a of i.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&r(a)}).observe(document,{childList:!0,subtree:!0});function o(n){const i={};return n.integrity&&(i.integrity=n.integrity),n.referrerPolicy&&(i.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?i.credentials="include":n.crossOrigin==="anonymous"?i.credentials="omit":i.credentials="same-origin",i}function r(n){if(n.ep)return;n.ep=!0;const i=o(n);fetch(n.href,i)}})();const l={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',arrow:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'},s={scrolled:!1,samson:"SAFE"},d="https://thevault-api.ratchetkrewelabs.workers.dev",p=async(e,t={})=>(await fetch(`${d}${e}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)})).json();window.addEventListener("scroll",()=>{const e=window.scrollY>50;if(s.scrolled!==e){s.scrolled=e;const t=document.getElementById("main-nav");t&&(t.style.background=e?"rgba(8, 8, 8, 0.95)":"transparent",t.style.backdropFilter=e?"blur(14px)":"none",t.style.borderBottom=e?"1px solid rgba(201, 168, 76, 0.2)":"none")}},{passive:!0});const c=()=>{const e=document.getElementById("app");e&&(e.innerHTML=`
    <div style="min-height:100vh;background:#080808;color:#F5EED8;font-family:'Inter',sans-serif;">
      ${g()}
      <main>${f()}</main>
      ${u()}
    </div>
  `,v())},g=()=>{const e=window.location.pathname,t=[{name:"Marketplace",p:"/browse"},{name:"Appraisal",p:"/appraisal"},{name:"ProVerify",p:"/proverify"},{name:"Tokenize",p:"/tokens"},{name:"Direct Deals",p:"/deals"},{name:"DeFi Wallet",p:"/wallet"}];return`
    <nav id="main-nav" style="position:fixed;top:0;left:0;right:0;z-index:50;transition:all 0.3s;height:72px;background:transparent;">
      <div style="max-width:1300px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#C9A84C;">
          <div style="width:34px;height:34px;border:1px solid #C9A84C;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
             <span style="transform:rotate(-45deg);">${l.diamond}</span>
          </div>
          <span style="font-family:'Cinzel',serif;font-weight:700;letter-spacing:4px;font-size:16px;">THE VAULT</span>
        </a>
        <div style="display:flex;align-items:center;gap:24px;">
          ${t.map(o=>`<a href="${o.p}" style="text-decoration:none;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${e===o.p?"#E8CB7A":"#C8BC98"};font-weight:600;">${o.name}</a>`).join("")}
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid rgba(201,168,76,0.15);background:rgba(201,168,76,0.05);">
             <span style="width:5px;height:5px;border-radius:50%;background:#6ee7b7;box-shadow:0 0 10px #6ee7b7;"></span>
             <span style="font-size:8px;letter-spacing:2px;color:#C9A84C;font-family:'Cinzel',serif;">${s.samson}</span>
          </div>
          <a href="/login" style="padding:10px 20px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;font-weight:700;text-transform:uppercase;">Sign In</a>
        </div>
      </div>
    </nav>
  `},f=()=>{const e=window.location.pathname;return e==="/"||e==="/home"?x():e==="/appraisal"?y():e==="/tokens"?h():e==="/proverify"?b():`<section style="padding:160px 40px;text-align:center;font-family:'Cinzel',serif;color:#C9A84C;font-size:24px;">REPOSITORY SECTION: ${e.toUpperCase()} READY</section>`},x=()=>`
  <section style="position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;padding-top:80px;">
    <div style="position:absolute;inset:0;">
      <div style="position:absolute;inset:0;background:radial-gradient(ellipse 80% 60% at 50% 30%,rgba(201,168,76,0.06) 0%,transparent 70%);"></div>
      <div style="position:absolute;inset:0;background:linear-gradient(to bottom,#080808,#0a0800 50%,#080808);"></div>
    </div>
    <canvas id="particle-canvas" style="position:absolute;inset:0;pointer-events:none;opacity:0.6;"></canvas>
    
    <div style="position:absolute;top:100px;left:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-right:0;border-bottom:0;"></div>
    <div style="position:absolute;top:100px;right:40px;width:120px;height:120px;border:1px solid rgba(201,168,76,0.15);border-left:0;border-bottom:0;"></div>

    <div style="position:relative;z-index:10;text-align:center;padding:0 24px;max-width:900px;margin:0 auto;">
      <div style="display:inline-flex;align-items:center;gap:12px;padding:8px 18px;border:1px solid rgba(201,168,76,0.25);margin-bottom:32px;background:rgba(201,168,76,0.03);">
        <span style="width:2px;height:2px;background:#C9A84C;border-radius:50%;box-shadow:0 0 8px #C9A84C;"></span>
        <span style="font-size:9px;tracking:4px;text-transform:uppercase;color:#C9A84C;font-family:'Cinzel',serif;">Est. 2024 &middot; Elite Collector Exchange &middot; AI-Powered</span>
      </div>
      <h1 style="font-family:'Cinzel',serif;font-size:clamp(48px,8vw,110px);font-weight:900;letter-spacing:12px;line-height:0.95;margin-bottom:12px;background:linear-gradient(to bottom,#FFD97A,#C9A84C,#8A6E2F);-webkit-background-clip:text;color:transparent;">THE VAULT</h1>
      <p style="font-family:'Cinzel',serif;font-size:11px;letter-spacing:8px;color:#C8BC98;text-transform:uppercase;margin-bottom:32px;">Elite Collector Exchange</p>
      
      <p style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:clamp(18px,2.5vw,24px);color:#F5EED8;line-height:1.6;margin-bottom:48px;">
        Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.
      </p>

      <div style="display:flex;gap:20px;justify-content:center;">
        <a href="/sell" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">START SELLING ${l.arrow}</a>
        <a href="/browse" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">FIND TREASURES</a>
      </div>
    </div>
  </section>
  ${m()}
`,m=()=>`
  <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.2);border-bottom:1px solid rgba(0,0,0,0.2);">
    <div style="display:flex;white-space:nowrap;width:max-content;animation:marquee 30s linear infinite;">
      ${Array(6).fill(["5% Commission Under $1,000","7% Commission $1,000-$7,500","Marketplace Tokenization Active","Verified Collectors Only"]).flat().map(e=>`
        <span style="display:inline-flex;align-items:center;gap:20px;padding:0 40px;color:#080808;font-family:'Cinzel',serif;font-size:9px;font-weight:700;letter-spacing:3px;">
          ${e.toUpperCase()} <span style="display:flex;transform:scale(0.5);">${l.diamond}</span>
        </span>
      `).join("")}
    </div>
  </div>
`,y=()=>`
  <section style="padding:140px 24px 80px;max-width:800px;margin:0 auto;position:relative;">
    <div style="text-align:center;margin-bottom:64px;">
       <h2 style="font-family:'Cinzel',serif;font-size:32px;letter-spacing:4px;color:#F5EED8;margin-bottom:10px;">AI APPRAISAL MACHINE</h2>
       <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:18px;">Strict Market Evidence Protocol Active</p>
    </div>
    <div style="background:rgba(20,20,20,0.4);border:1px solid rgba(201,168,76,0.2);padding:40px;position:relative;box-shadow:0 20px 80px rgba(0,0,0,0.5);">
        <div style="position:absolute;top:0;left:0;width:24px;height:24px;border-top:2px solid #C9A84C;border-left:2px solid #C9A84C;"></div>
        <div style="position:absolute;bottom:0;right:0;width:24px;height:24px;border-bottom:2px solid #C9A84C;border-right:2px solid #C9A84C;"></div>
        <div style="display:grid;gap:28px;">
          <div>
            <label style="display:block;font-size:9px;letter-spacing:3px;color:#C9A84C;text-transform:uppercase;margin-bottom:8px;">Item Description & Provenance</label>
            <textarea id="app-desc" style="width:100%;height:140px;background:rgba(0,0,0,0.3);border:1px solid rgba(201,168,76,0.15);color:#F5EED8;padding:16px;outline:none;font-family:inherit;font-size:13px;" placeholder="Describe everything you know about the item..."></textarea>
          </div>
          <button onclick="window.runAppraisal()" style="padding:16px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;font-family:'Cinzel',serif;font-weight:700;letter-spacing:2px;cursor:pointer;">REQUEST AI VALUATION</button>
          <div id="app-res" style="border:1px solid rgba(201,168,76,0.15);padding:24px;background:rgba(201,168,76,0.03);min-height:100px;display:flex;align-items:center;justify-content:center;color:#8A6E2F;font-size:12px;text-align:center;">
             Valuation results will appear here after evidence analysis.
          </div>
        </div>
    </div>
  </section>
`,h=()=>`
  <section style="padding:140px 24px 80px;max-width:900px;margin:0 auto;">
    <div style="text-align:center;margin-bottom:48px;">
       <h2 style="font-family:'Cinzel',serif;font-size:32px;letter-spacing:4px;color:#F5EED8;margin-bottom:10px;">ITEM TOKENIZATION</h2>
       <p style="font-family:'Cormorant Garamond',serif;font-style:italic;color:#C8BC98;font-size:18px;">Issue Digital Certificates of Authenticity</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
       <div style="background:rgba(20,20,20,0.4);border:1px solid rgba(201,168,76,0.25);padding:32px;border-radius:1px;">
          <h3 style="font-family:'Cinzel',serif;font-size:12px;color:#C9A84C;margin-bottom:20px;letter-spacing:2px;">MINT NEW CERTIFICATE</h3>
          <div style="display:grid;gap:16px;">
             <input id="token-id" placeholder="LISTING ID REFERENCE" style="background:transparent;border:1px solid rgba(201,168,76,0.2);padding:12px;color:#F5EED8;font-size:11px;">
             <input id="token-owner" placeholder="DEFI WALLET ADDRESS" style="background:transparent;border:1px solid rgba(201,168,76,0.2);padding:12px;color:#F5EED8;font-size:11px;">
             <button onclick="window.runMint()" style="padding:14px;background:#C9A84C;color:#000;font-weight:700;font-family:'Cinzel',serif;font-size:10px;letter-spacing:2px;">INITIATE ON-CHAIN MINT</button>
          </div>
       </div>
       <div style="border:1px solid rgba(201,168,76,0.15);padding:32px;background:rgba(10,10,10,0.4);">
          <h3 style="font-family:'Cinzel',serif;font-size:12px;color:#8A6E2F;margin-bottom:12px;letter-spacing:2px;">NETWORK STATUS</h3>
          <p style="font-size:12px;color:#C8BC98;line-height:1.7;">Physical items are verified by our appraisal fleet before minting. Each NFT contains high-resolution provenance data and current valuation stored immutably on-chain.</p>
       </div>
    </div>
  </section>
`,b=()=>`<section style="padding:160px 40px;text-align:center;font-family:'Cinzel',serif;color:#C9A84C;font-size:24px;">PROVERIFY EXPERT NETWORK READY</section>`,u=()=>`
  <footer style="padding:100px 0;border-top:1px solid rgba(201,168,76,0.1);background:transparent;">
    <div style="text-align:center;">
       <div style="font-family:'Cinzel',serif;color:#C9A84C;font-weight:700;letter-spacing:6px;font-size:18px;margin-bottom:16px;">THE VAULT</div>
       <div style="display:flex;justify-content:center;gap:32px;margin-bottom:32px;">
          ${["About","FAQ","Contact","Terms","Privacy"].map(e=>`<a href="/${e.toLowerCase()}" style="color:#8A6E2F;text-decoration:none;font-size:9px;letter-spacing:2px;text-transform:uppercase;">${e}</a>`).join("")}
       </div>
       <p style="font-size:9px;letter-spacing:4px;color:#8A6E2F;text-transform:uppercase;opacity:0.6;">&copy; 2024 The Vault &middot; Professional Consignment Registry</p>
    </div>
  </footer>
`;window.runAppraisal=async()=>{const e=document.getElementById("app-desc").value;if(!e)return alert("Enter description");document.getElementById("app-res").innerText="CONSULTING MARKET DATA EVIDENCE...";try{const t=await p("/api/agents/appraisal",{description:e,model:"hermes-3-flash"});document.getElementById("app-res").innerHTML=`<div style="color:#C9A84C;font-family:'Cinzel',serif;font-size:14px;margin-bottom:8px;">${t.valuation||"Under Investigation"}</div><p style="color:#C8BC98;font-size:11px;">${t.reasoning||""}</p>`}catch{document.getElementById("app-res").innerText="ERROR: PROTOCOL TIMEOUT. TRY AGAIN."}};window.runMint=async()=>{const e={listingId:document.getElementById("token-id").value,ownerId:document.getElementById("token-owner").value};if(!e.listingId||!e.ownerId)return alert("Fill fields");try{const t=await p("/api/tokenize",e);alert("MINT REQUEST INITIATED: "+t.id)}catch{alert("MINT FAILED: NETWORK SYNC ERROR")}};const v=()=>{const e=document.getElementById("particle-canvas");if(!e)return;const t=e.getContext("2d"),o=()=>{e.width=window.innerWidth,e.height=window.innerHeight};window.addEventListener("resize",o),o();const r=Array.from({length:45},()=>({x:Math.random()*e.width,y:Math.random()*e.height,s:Math.random()*1.4+.4,vy:-(Math.random()*.4+.2),o:Math.random()*.4+.2})),n=()=>{t.clearRect(0,0,e.width,e.height),r.forEach(i=>{i.y+=i.vy,i.y<-10&&(i.y=e.height+10),t.beginPath(),t.arc(i.x,i.y,i.s,0,Math.PI*2),t.fillStyle=`rgba(201,168,76,${i.o})`,t.fill()}),requestAnimationFrame(n)};n()};c();
