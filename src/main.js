// https://github.com/mycosensai/toomuchwork
// THE VAULT — FEATURE & TOKENIZATION ENGINE
// Full transparency. Expanded tabs. Anti-hallucination Appraisal.

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const svg = {
  diamond: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l7 13"/><path d="M2 9h20"/></svg>',
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  cart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>',
  arrow: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  shield: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>',
};

const state = { cart: [], wishlist: [], user: null, scrolled: false, samson: 'SAFE' };

// Configuration for Worker connection
const API_URL = 'https://thevault-api.ratchetkrewelabs.workers.dev';

const request = async (path, body = {}) => {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
};

window.addEventListener('scroll', () => {
  const isS = window.scrollY > 50;
  if (state.scrolled !== isS) {
    state.scrolled = isS;
    const n = document.getElementById('main-nav');
    if (n) {
      n.style.background = isS ? 'rgba(8, 8, 8, 0.95)' : 'transparent';
      n.style.backdropFilter = isS ? 'blur(14px)' : 'none';
      n.style.borderBottom = isS ? '1px solid rgba(201, 168, 76, 0.2)' : 'none';
    }
  }
}, { passive: true });

const render = () => {
  const app = document.getElementById('app');
  if (!app) return;
  app.innerHTML = `
    <div style="min-height:100vh;background:#080808;color:#F5EED8;font-family:'Inter',sans-serif;">
      ${nav()}
      <main>${dispatch()}</main>
      ${footer()}
    </div>
  `;
  initParticles();
};

const nav = () => {
  const path = window.location.pathname;
  const tabs = [
    { name: 'Marketplace', p: '/browse' },
    { name: 'Appraisal', p: '/appraisal' },
    { name: 'ProVerify', p: '/proverify' },
    { name: 'Tokenize', p: '/tokens' },
    { name: 'Direct Deals', p: '/deals' },
    { name: 'DeFi Wallet', p: '/wallet' }
  ];
  
  return `
    <nav id="main-nav" style="position:fixed;top:0;left:0;right:0;z-index:50;transition:all 0.3s;height:72px;background:transparent;">
      <div style="max-width:1300px;margin:0 auto;padding:0 24px;height:100%;display:flex;align-items:center;justify-content:space-between;">
        <a href="/" style="display:flex;align-items:center;gap:12px;text-decoration:none;color:#C9A84C;">
          <div style="width:34px;height:34px;border:1px solid #C9A84C;transform:rotate(45deg);display:flex;align-items:center;justify-content:center;">
             <span style="transform:rotate(-45deg);">${svg.diamond}</span>
          </div>
          <span style="font-family:'Cinzel',serif;font-weight:700;letter-spacing:4px;font-size:16px;">THE VAULT</span>
        </a>
        <div style="display:flex;align-items:center;gap:24px;">
          ${tabs.map(t => `<a href="${t.p}" style="text-decoration:none;font-size:9px;letter-spacing:3px;text-transform:uppercase;color:${path === t.p ? '#E8CB7A' : '#C8BC98'};font-weight:600;">${t.name}</a>`).join('')}
        </div>
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="display:flex;align-items:center;gap:6px;padding:6px 12px;border:1px solid rgba(201,168,76,0.15);background:rgba(201,168,76,0.05);">
             <span style="width:5px;height:5px;border-radius:50%;background:#6ee7b7;box-shadow:0 0 10px #6ee7b7;"></span>
             <span style="font-size:8px;letter-spacing:2px;color:#C9A84C;font-family:'Cinzel',serif;">${state.samson}</span>
          </div>
          <a href="/login" style="padding:10px 20px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:9px;letter-spacing:2px;font-weight:700;text-transform:uppercase;">Sign In</a>
        </div>
      </div>
    </nav>
  `;
};

const dispatch = () => {
  const path = window.location.pathname;
  if (path === '/' || path === '/home') return home();
  if (path === '/appraisal') return appraisal();
  if (path === '/tokens') return tokens();
  if (path === '/proverify') return proVerify();
  return `<section style="padding:160px 40px;text-align:center;font-family:'Cinzel',serif;color:#C9A84C;font-size:24px;">REPOSITORY SECTION: ${path.toUpperCase()} READY</section>`;
};

const home = () => `
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
        <a href="/sell" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">START SELLING ${svg.arrow}</a>
        <a href="/browse" style="display:inline-flex;align-items:center;gap:12px;padding:16px 36px;border:1px solid #C9A84C;color:#C9A84C;text-decoration:none;font-family:'Cinzel',serif;font-size:11px;font-weight:700;letter-spacing:2px;border-radius:2px;">FIND TREASURES</a>
      </div>
    </div>
  </section>
  ${marquee()}
`;

const marquee = () => `
  <div style="background:#C9A84C;padding:12px 0;overflow:hidden;border-top:1px solid rgba(0,0,0,0.2);border-bottom:1px solid rgba(0,0,0,0.2);">
    <div style="display:flex;white-space:nowrap;width:max-content;animation:marquee 30s linear infinite;">
      ${Array(6).fill(['5% Commission Under $1,000', '7% Commission $1,000-$7,500', 'Marketplace Tokenization Active', 'Verified Collectors Only']).flat().map(t => `
        <span style="display:inline-flex;align-items:center;gap:20px;padding:0 40px;color:#080808;font-family:'Cinzel',serif;font-size:9px;font-weight:700;letter-spacing:3px;">
          ${t.toUpperCase()} <span style="display:flex;transform:scale(0.5);">${svg.diamond}</span>
        </span>
      `).join('')}
    </div>
  </div>
`;

const appraisal = () => `
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
`;

const tokens = () => `
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
`;

const proVerify = () => `<section style="padding:160px 40px;text-align:center;font-family:'Cinzel',serif;color:#C9A84C;font-size:24px;">PROVERIFY EXPERT NETWORK READY</section>`;

const footer = () => `
  <footer style="padding:100px 0;border-top:1px solid rgba(201,168,76,0.1);background:transparent;">
    <div style="text-align:center;">
       <div style="font-family:'Cinzel',serif;color:#C9A84C;font-weight:700;letter-spacing:6px;font-size:18px;margin-bottom:16px;">THE VAULT</div>
       <div style="display:flex;justify-content:center;gap:32px;margin-bottom:32px;">
          ${['About', 'FAQ', 'Contact', 'Terms', 'Privacy'].map(l => `<a href="/${l.toLowerCase()}" style="color:#8A6E2F;text-decoration:none;font-size:9px;letter-spacing:2px;text-transform:uppercase;">${l}</a>`).join('')}
       </div>
       <p style="font-size:9px;letter-spacing:4px;color:#8A6E2F;text-transform:uppercase;opacity:0.6;">&copy; 2024 The Vault &middot; Professional Consignment Registry</p>
    </div>
  </footer>
`;

window.runAppraisal = async () => {
  const desc = document.getElementById('app-desc').value;
  if (!desc) return alert('Enter description');
  document.getElementById('app-res').innerText = 'CONSULTING MARKET DATA EVIDENCE...';
  try {
    const res = await request('/api/agents/appraisal', { description: desc, model: 'hermes-3-flash' });
    document.getElementById('app-res').innerHTML = `<div style="color:#C9A84C;font-family:'Cinzel',serif;font-size:14px;margin-bottom:8px;">${res.valuation || 'Under Investigation'}</div><p style="color:#C8BC98;font-size:11px;">${res.reasoning || ''}</p>`;
  } catch (e) {
    document.getElementById('app-res').innerText = 'ERROR: PROTOCOL TIMEOUT. TRY AGAIN.';
  }
};

window.runMint = async () => {
  const body = { listingId: document.getElementById('token-id').value, ownerId: document.getElementById('token-owner').value };
  if (!body.listingId || !body.ownerId) return alert('Fill fields');
  try {
    const res = await request('/api/tokenize', body);
    alert('MINT REQUEST INITIATED: ' + res.id);
  } catch (e) {
    alert('MINT FAILED: NETWORK SYNC ERROR');
  }
};

const initParticles = () => {
  const c = document.getElementById('particle-canvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
  window.addEventListener('resize', resize); resize();
  const ps = Array.from({length: 45}, () => ({
    x: Math.random()*c.width, y: Math.random()*c.height, s: Math.random()*1.4+0.4, vy: -(Math.random()*0.4+0.2), o: Math.random()*0.4+0.2
  }));
  const loop = () => {
    ctx.clearRect(0,0,c.width,c.height);
    ps.forEach(p => {
      p.y += p.vy; if (p.y < -10) p.y = c.height + 10;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
      ctx.fillStyle = `rgba(201,168,76,${p.o})`; ctx.fill();
    });
    requestAnimationFrame(loop);
  };
  loop();
};

render();
