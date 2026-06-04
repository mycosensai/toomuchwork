// The Vault DFW API client — production build integration.
// Base URL is injected at build time via VITE_API_BASE and falls back to `/api`.
// Auth state lives in sessionStorage with expiry; no global window secrets are used.

const resolveBase = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE) {
    return String(import.meta.env.VITE_API_BASE).replace(/\/+$/, '');
  }
  return '/api';
};

const JSON_HEADERS = { 'content-type': 'application/json' };

const getAuthHeaders = () => {
  const token = getToken();
  if (!token) return JSON_HEADERS;
  return { ...JSON_HEADERS, authorization: `Bearer ${token}` };
};

const getToken = () => {
  try {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem('vault_session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.expiresAt) return null;
    if (Date.now() > Number(parsed.expiresAt)) {
      sessionStorage.removeItem('vault_session');
      return null;
    }
    return parsed.token || null;
  } catch {
    return null;
  }
};

const setToken = (token, ttlMs = 1000 * 60 * 60) => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    const payload = { token, expiresAt: Date.now() + ttlMs };
    sessionStorage.setItem('vault_session', JSON.stringify(payload));
  } catch {
    // ignore storage failures
  }
};

const clearToken = () => {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem('vault_session');
  } catch {
    // ignore
  }
};

const buildBody = (payload = {}, opts = {}) => {
  const { strict = true } = opts;
  const base = { ...payload };
  if (strict) {
    base.model = payload.model || 'hermes-2-free';
    base.timestamp = payload.timestamp || Date.now();
    base.source = payload.source || 'web_client';
  }
  return base;
};

const normalizeResponse = (raw) => {
  if (!raw || typeof raw !== 'object') return { data: raw };
  if ('data' in raw || 'error' in raw) return raw;
  return { data: raw };
};

const request = async (path, payload = {}, options = {}) => {
  const { signal, strict = true, headers: extraHeaders = {} } = options;
  const base = resolveBase();
  const url = `${base}${path}`;

  const fetcher = () => fetch(url, {
    method: 'POST',
    headers: { ...getAuthHeaders(), ...extraHeaders },
    body: JSON.stringify(buildBody(payload, { strict })),
    signal,
  });

  let res;
  try {
    res = await fetcher();
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new Error('Network error: ' + (err?.message || 'request failed'));
  }

  const text = await res.text().catch(() => '');
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : {};
  } catch {
    parsed = { raw: text };
  }

  if (!res.ok) {
    const message = (parsed && parsed.error && parsed.error.message) || text || res.statusText || `API ${res.status}`;
    const error = new Error(String(message));
    error.status = res.status;
    error.body = parsed;
    throw error;
  }

  return normalizeResponse(parsed);
};

if (typeof window !== 'undefined') {
  window.VAULT_API = { request, getToken, setToken, clearToken };
}
