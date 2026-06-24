const replaceAll = (str, find, replace) => String(str).split(find).join(replace);
const shellEnd = (mainJs) => replaceAll(mainJs, `}, eslint-disable-next-line no-unused-vars`, `const logout = () => {
if (state.user) {
state.user = null;
location.href = '/';
}
};

const loginForm = `
<section style="padding-top:110px;">
  <div style="max-width:460px;margin:0 auto;background:#131313;border:1px solid rgba(201,168,76,0.18);border-radius:20px;padding:26px;">
    <div style="text-align:center;margin-bottom:12px;">
      <div style="font-family:'Cinzel',serif;letter-spacing:4px;color:#C9A84C;font-size:12px;text-transform:uppercase;">ACCOUNT ACCESS</div>
      <h1 style="font-family:'Cinzel',serif;font-weight:900;font-size:22px;color:#F5EED8;margin-top:10px;">Sign In</h1>
      <p style="color:#C8BC98;margin-top:8px;font-size:14px;">Access your listings, orders, and agent fleet.</p>
    </div>
    <div style="display:grid;gap:14px;margin-top:18px;">
      ${[
        { provider: 'google', label: 'Continue with Google', accent: '#ffffff', icon: `gl` },
        { provider: 'apple', label: 'Continue with Apple', accent: '#C8BC98', icon: `apple` },
        { provider: 'x', label: 'Continue with X', accent: '#C8BC98', icon: `x` },
      ].map((item) => `
        <button type="button" onclick="window._login('${item.provider}')" style="display:inline-flex;align-items:center;justify-content:center;gap:12px;width:100%;padding:14px;background:transparent;color:${item.accent};border:1px solid rgba(201,168,76,0.35);border-radius:14px;font-weight:700;cursor:pointer;">${svg.icon} ${item.label}</button>
      `).join('')}
      <button type="button" onclick="window._login('email')" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;width:100%;padding:14px;background:linear-gradient(to bottom right,#C9A84C,#8A6E2F);color:#080808;border:1px solid transparent;border-radius:14px;font-weight:700;cursor:pointer;">Sign in with Email</button>
      <p style="color:#a1a1aa;font-size:12px;text-align:center;margin-top:10px;">No vault account yet? <a href="#register" style="color:#C9A84C;text-decoration:none;">Create one</a></p>
    </div>
  </div>
</section>
`;
