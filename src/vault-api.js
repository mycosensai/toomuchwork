// The Vault DFW API client stub
// TODO: replace with real backend URL and auth headers.

const DEFAULT_BASE = '/api';

const resolveBase = () => {
  if (typeof window !== 'undefined' && window.__VAULT_API_BASE__) return window.__VAULT_API_BASE__;
  return DEFAULT_BASE;
};

const headers = () => {
  const h = { 'content-type': 'application/json' };
  if (typeof window !== 'undefined' && window.__VAULT_API_TOKEN__) {
    h['authorization'] = `Bearer ${window.__VAULT_API_TOKEN__}`;
  }
  return h;
};

const request = async (path, payload = {}) => {
  const base = resolveBase().replace(/\/+$/, '');
  const url = `${base}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      ...payload,
      model: payload.model || 'hermes-2-free',
      timestamp: payload.timestamp || Date.now(),
      source: payload.source || 'web_client',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  return res.json().catch(() => ({}));
};

if (typeof window !== 'undefined') {
  window.VAULT_API = { request };
}
