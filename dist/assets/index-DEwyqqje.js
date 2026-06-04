(function(){const a=document.createElement("link").relList;if(a&&a.supports&&a.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))i(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&i(n)}).observe(document,{childList:!0,subtree:!0});function s(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(t){if(t.ep)return;t.ep=!0;const r=s(t);fetch(t.href,r)}})();const o={diamond:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',heart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',cart:'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',arrow:'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>'},l={scrolled:!1};window.addEventListener("scroll",()=>{const e=window.scrollY>50;if(l.scrolled!==e){l.scrolled=e;const a=document.querySelector("nav");a&&(a.className=`fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 lg:h-20 ${e?"bg-[#080808]/95 backdrop-blur-xl border-b border-[#C9A84C]/20":"bg-transparent"}`)}},{passive:!0});const c=()=>{const e=document.getElementById("app");e&&(e.innerHTML=`
    <div class="min-h-screen bg-[#080808] selection:bg-[#C9A84C] selection:text-[#080808]">
      ${p()}
      <main>${x()}</main>
      ${d()}
    </div>
  `,g())},p=()=>{const e=window.location.pathname;return`
    <nav class="fixed top-0 left-0 right-0 z-50 transition-all duration-300 h-16 lg:h-20 bg-transparent">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <a href="/" class="flex items-center gap-3 group">
          <div class="w-8 h-8 lg:w-9 lg:h-9 border border-[#C9A84C] rotate-45 flex items-center justify-center group-hover:shadow-[0_0_15px_rgba(201,168,76,0.3)] transition-shadow">
            <span class="text-[#C9A84C] -rotate-45">${o.diamond}</span>
          </div>
          <span class="font-cinzel text-lg lg:text-xl font-bold tracking-[4px] text-[#C9A84C]">THE VAULT</span>
        </a>
        <div class="hidden md:flex items-center gap-8">
          ${["Browse","Appraisal","ProVerify","Sell","Tokens","Support"].map(a=>`<a href="/${a.toLowerCase()}" class="text-[10px] tracking-[3px] uppercase ${e==="/"+a.toLowerCase()?"text-[#E8CB7A]":"text-[#C8BC98] hover:text-[#E8CB7A]"}">${a}</a>`).join("")}
        </div>
        <div class="hidden md:flex items-center gap-4">
          <a href="/wishlist" class="text-[#C8BC98] hover:text-[#C9A84C] transition-colors">${o.heart}</a>
          <a href="/cart" class="text-[#C8BC98] hover:text-[#C9A84C] transition-colors">${o.cart}</a>
          <a href="/login" class="px-5 py-2 border border-[#C9A84C] text-[#C9A84C] text-[10px] tracking-[3px] uppercase font-cinzel font-semibold hover:bg-[#C9A84C] hover:text-[#080808] transition-all">Sign In</a>
        </div>
      </div>
    </nav>
  `},x=()=>{const e=window.location.pathname;return e==="/"||e==="/home"?b():'<section class="pt-40 text-center font-cinzel text-gold">Route Under Construction</section>'},b=()=>`
  <section class="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
    <div class="absolute inset-0">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_30%,rgba(201,168,76,0.06)_0%,transparent_70%)]"></div>
      <div class="absolute inset-0 bg-gradient-to-b from-[#080808] via-[#0a0800] to-[#080808]"></div>
    </div>
    <canvas id="particle-canvas" class="absolute inset-0 pointer-events-none opacity-50"></canvas>
    
    <div class="absolute top-20 left-10 w-32 h-32 border border-[#C9A84C]/15 border-r-0 border-b-0 hidden lg:block"></div>
    <div class="absolute top-20 right-10 w-32 h-32 border border-[#C9A84C]/15 border-l-0 border-b-0 hidden lg:block"></div>
    <div class="absolute bottom-20 left-10 w-32 h-32 border border-[#C9A84C]/15 border-r-0 border-t-0 hidden lg:block"></div>
    <div class="absolute bottom-20 right-10 w-32 h-32 border border-[#C9A84C]/15 border-l-0 border-t-0 hidden lg:block"></div>

    <div class="relative z-10 text-center px-4 max-w-4xl mx-auto">
      <div class="inline-flex items-center gap-3 px-5 py-2 border border-[#C9A84C]/25 mb-8">
        <span class="w-1.5 h-1.5 bg-[#C9A84C] rounded-full animate-pulse"></span>
        <span class="text-[9px] tracking-[4px] uppercase text-[#C9A84C] font-medium">Est. 2024 &middot; Elite Collector Exchange &middot; AI-Powered</span>
      </div>
      <h1 class="font-cinzel text-5xl sm:text-7xl lg:text-9xl font-black tracking-[12px] uppercase leading-[0.9] mb-3">
        <span class="bg-gradient-to-b from-[#FFD97A] via-[#C9A84C] to-[#8A6E2F] bg-clip-text text-transparent">THE VAULT</span>
      </h1>
      <p class="font-cinzel text-xs sm:text-sm tracking-[10px] text-[#C8BC98] uppercase mb-6">Elite Collector Exchange</p>
      
      <div class="flex items-center justify-center gap-4 mb-10">
        <div class="w-16 h-px bg-gradient-to-r from-transparent to-[#C9A84C]"></div>
        <span class="text-[#C9A84C] rotate-45 scale-75">${o.diamond}</span>
        <div class="w-16 h-px bg-gradient-to-l from-transparent to-[#C9A84C]"></div>
      </div>

      <p class="font-cormorant italic text-lg sm:text-xl md:text-2xl text-[#F5EED8] leading-relaxed max-w-2xl mx-auto mb-12">
        Are you tired of getting screwed on the pricing, commissions and fees associated with exchanging your treasures? This is your answer for that problem.
      </p>

      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <a href="/sell" class="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-br from-[#C9A84C] to-[#8A6E2F] text-[#080808] font-cinzel text-[11px] tracking-[3px] uppercase font-bold hover:shadow-[0_0_40px_rgba(201,168,76,0.4)] hover:-translate-y-0.5 transition-all">Start Selling ${o.arrow}</a>
        <a href="/browse" class="inline-flex items-center justify-center gap-2 px-10 py-4 border border-[#C9A84C] text-[#C9A84C] font-cinzel text-[11px] tracking-[3px] uppercase font-semibold hover:bg-[#C9A84C]/10 hover:-translate-y-0.5 transition-all">Find Treasures</a>
      </div>
    </div>
  </section>
  ${h()}
  ${v()}
  ${d()}
`,h=()=>`
  <div class="bg-[#C9A84C] py-3 overflow-hidden border-y border-black/20">
    <div class="flex whitespace-nowrap animate-marquee">
      ${Array(4).fill(0).map(()=>`
        <span class="inline-flex items-center gap-6 px-10">
          <span class="font-cinzel text-[10px] font-bold tracking-[3px] text-[#080808] uppercase">5% Commission Under $1,000</span>
          <span class="text-[#080808] rotate-45 scale-50">${o.diamond}</span>
          <span class="font-cinzel text-[10px] font-bold tracking-[3px] text-[#080808] uppercase">AI-Powered Buyer Matching</span>
          <span class="text-[#080808] rotate-45 scale-50">${o.diamond}</span>
        </span>
      `).join("")}
    </div>
  </div>
`,v=()=>`
  <section class="py-24 px-4 relative overflow-hidden bg-transparent">
    <div class="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(201,168,76,0.04),transparent)]"></div>
    <div class="max-w-3xl mx-auto relative">
      <div class="text-center mb-12">
        <h2 class="font-cinzel text-3xl font-bold text-[#F5EED8] tracking-[4px] mb-3">Commission Calculator</h2>
        <p class="font-cormorant italic text-base text-[#C8BC98]">Know exactly what you keep before you list</p>
      </div>
      <div class="bg-[#141414]/40 backdrop-blur-sm border border-[#C9A84C]/25 p-8 relative shadow-2xl">
        <div class="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#C9A84C]"></div>
        <div class="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-[#C9A84C]"></div>
        <div class="grid gap-6">
           <div>
             <label class="text-[10px] tracking-[4px] uppercase text-[#C9A84C] block mb-2">Item Value</label>
             <input type="number" id="calc-input" placeholder="0" class="w-full bg-black/20 border-b border-[#C9A84C] text-[#F5EED8] font-cinzel text-5xl py-4 outline-none placeholder:opacity-20" oninput="updateCalculator()">
           </div>
           <div id="calc-res" class="grid grid-cols-3 gap-1 pt-6 text-center">
             <div class="bg-black/40 p-4 border border-[#C9A84C]/10"><div class="text-[8px] text-[#8A6E2F]">Item Value</div><div id="res-val" class="font-cinzel text-[#F5EED8]">$0</div></div>
             <div class="bg-black/60 p-4 border border-[#C9A84C]/40"><div class="text-[8px] text-[#8A6E2F]">Commission</div><div id="res-comm" class="font-cinzel text-[#C9A84C] font-bold">$0</div></div>
             <div class="bg-black/40 p-4 border border-[#C9A84C]/10"><div class="text-[8px] text-[#8A6E2F]">You Receive</div><div id="res-net" class="font-cinzel text-[#E8CB7A]">$0</div></div>
           </div>
        </div>
      </div>
    </div>
  </section>
`,d=()=>`
  <footer class="border-t border-[#C9A84C]/10 bg-transparent py-20">
    <div class="max-w-7xl mx-auto px-4 text-center">
       <div class="font-cinzel text-[#C9A84C] font-bold tracking-[6px] mb-4 text-lg">THE VAULT</div>
       <p class="text-[#8A6E2F] text-[10px] tracking-[3px] uppercase font-light">&copy; 2024 The Vault. All rights reserved.</p>
    </div>
  </footer>
`;window.updateCalculator=()=>{const e=parseFloat(document.getElementById("calc-input").value)||0,a=e>=1e4?.05:e>=7500?.1:e>=1e3?.07:.05,s=e*a,i=e-s,t=r=>"$"+r.toLocaleString();document.getElementById("res-val").innerText=t(e),document.getElementById("res-comm").innerText=t(s),document.getElementById("res-net").innerText=t(i)};const g=()=>{const e=document.getElementById("particle-canvas");if(!e)return;const a=e.getContext("2d"),s=()=>{e.width=window.innerWidth,e.height=window.innerHeight};window.addEventListener("resize",s),s();const i=Array.from({length:40},()=>({x:Math.random()*e.width,y:Math.random()*e.height,s:Math.random()*1.5+.5,vy:-(Math.random()*.5+.2),o:Math.random()*.5+.2})),t=()=>{a.clearRect(0,0,e.width,e.height),i.forEach(r=>{r.y+=r.vy,r.y<-10&&(r.y=e.height+10),a.beginPath(),a.arc(r.x,r.y,r.s,0,Math.PI*2),a.fillStyle=`rgba(201,168,76,${r.o})`,a.fill()}),requestAnimationFrame(t)};t()};c();
