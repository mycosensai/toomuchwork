// ============================================================================
// auth.ts — Session-based authentication using Web Crypto + KV/D1
// ============================================================================
import type { Env, User } from './types.ts';
import { JSON_HEADERS } from './types.ts';
import { users as userDao } from './db.ts';
import { sessions } from './db.ts';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------
function okResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...JSON_HEADERS },
  });
}

function errResponse(code: string, message: string, status = 400, details?: unknown): Response {
  return okResponse({ ok: false as const, error: { code, message, details } }, status);
}

// ---------------------------------------------------------------------------
// JWT via Web Crypto (HS256)
// ---------------------------------------------------------------------------
const JWT_SECRET = 'local-dev-secret-change-me-please-override';

const JWT_KEY_CACHE: { key?: CryptoKey } = {};

async function getJwtKey(): Promise<CryptoKey> {
  if (JWT_KEY_CACHE.key) return JWT_KEY_CACHE.key;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  JWT_KEY_CACHE.key = key;
  return key;
}

async function signJwt(payload: Record<string, unknown>, expSec = 60 * 60 * 24 * 30): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expSec };
  const h = btoa(unescape(encodeURIComponent(JSON.stringify(header))));
  const p = btoa(unescape(encodeURIComponent(JSON.stringify(body))));
  const sig = await crypto.subtle.sign('HMAC', await getJwtKey(), new TextEncoder().encode(`${h}.${p}`));
  const s = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${h}.${p}.${s}`;
}

async function verifyJwt(token: string): Promise<boolean> {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return false;
    const sigBuf = Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
    const ok = await crypto.subtle.verify('HMAC', await getJwtKey(), sigBuf, new TextEncoder().encode(`${h}.${p}`));
    if (!ok) return false;
    const body = JSON.parse(decodeURIComponent(escape(atob(p)))) as Record<string, unknown>;
    if (typeof body.exp === 'number' && body.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

function jwtBody(token: string): Record<string, unknown> | null {
  try {
    const [, p] = token.split('.');
    if (!p) return null;
    return JSON.parse(decodeURIComponent(escape(atob(p))));
  } catch {
    return null;
  }
}

function set(obj: Record<string, string>, k: string, v: string | undefined): Record<string, string> {
  if (v !== undefined) obj[k] = v;
  return obj;
}

// ---------------------------------------------------------------------------
// PBKDF2 password hash (Web Crypto API only)
// ---------------------------------------------------------------------------
async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return {
    hash: Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

async function verifyPassword(password: string, hexHash: string, hexSalt: string): Promise<boolean> {
  const { hash } = await hashPasswordWithSalt(password, hexSalt);
  return hash === hexHash;
}

async function hashPasswordWithSalt(password: string, hexSalt: string): Promise<{ hash: string; salt: string }> {
  const salt = Uint8Array.from(hexSalt.match(/.{1,2}/g) ?? [], h => parseInt(h, 16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: 120_000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['wrapKey', 'unwrapKey'],
  );
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', key));
  return {
    hash: Array.from(raw).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: hexSalt,
  };
}

// ---------------------------------------------------------------------------
// KV/D1 session helpers
// ---------------------------------------------------------------------------
async function createSession(env: Env, userId: string): Promise<{ sid: string; token: string }> {
  const sid = crypto.randomUUID();
  const exp = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  await env.thevault_db.prepare(
    `INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?1, ?2, ?3, ?4)`,
  ).bind(sid, userId, exp, now).run();

  const sessObj = JSON.stringify({ userId, expiresAt: exp, createdAt: now });
  await env.VAULT_KV.put(`sess:${sid}`, sessObj, { expirationTtl: 30 * 24 * 60 * 60 });
  const token = await signJwt({ sub: userId, sid });
  return { sid, token };
}

async function getSessionFromD1(env: Env, sid: string): Promise<{ userId: string; expiresAt: string } | null> {
  const row = await env.thevault_db.prepare(
    `SELECT user_id as userId, expires_at as expiresAt FROM sessions WHERE id = ?1 AND revoked_at IS NULL AND expires_at > datetime('now')`,
  ).bind(sid).first<{ userId: string; expiresAt: string }>();
  return row ?? null;
}

async function revokeSession(env: Env, sid: string): Promise<void> {
  await env.thevault_db.prepare(`UPDATE sessions SET revoked_at = datetime('now') WHERE id = ?1`).bind(sid).run();
  try { await env.VAULT_KV.delete(`sess:${sid}`); } catch { /* best-effort */ }
}

// ---------------------------------------------------------------------------
// ID token verification via Web Crypto API (Google + Apple JWKS)
// ---------------------------------------------------------------------------
type IdTokenResult =
  | { ok: true; sub: string; claims: Record<string, unknown> }
  | { ok: false; reason: string };

async function verifyIdToken(provider: string, idToken: string): Promise<IdTokenResult> {
  try {
    const [hB64] = idToken.split('.');
    const header = JSON.parse(atob(hB64)) as Record<string, unknown>;
    if ((header.alg as string) !== 'RS256') return { ok: false, reason: 'Unexpected alg in ID token header' };
    if ((header.kid as string | undefined) === undefined) return { ok: false, reason: 'Missing kid in header' };

    const jwksUrl =
      provider === 'google'
        ? 'https://www.googleapis.com/oauth2/v3/certs'
        : provider === 'apple'
          ? 'https://appleid.apple.com/auth/keys'
          : '';

    if (!jwksUrl) return { ok: false, reason: 'Unknown provider' };

    const res = await fetch(jwksUrl, { headers: { accept: 'application/json' } });
    if (!res.ok) return { ok: false, reason: `JWKS fetch failed: HTTP ${res.status}` };
    const keysJson = (await res.json()) as { keys: Array<Record<string, unknown>> };
    const jwk = keysJson.keys.find(
      k => (k.kid as string) === (header.kid as string) && (k.kty as string) === 'RSA' && (k.alg as string) === 'RS256',
    );
    if (!jwk) return { ok: false, reason: 'No matching JWK found' };

    const key = await crypto.subtle.importKey(
      'jwk',
      jwk as JsonWebKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    );

    const [, pB64, sB64] = idToken.split('.');
    const sigBuf = Uint8Array.from(atob(sB64), ch => ch.charCodeAt(0));
    const ok = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      key,
      sigBuf,
      new TextEncoder().encode(`${hB64}.${pB64}`),
    );
    if (!ok) return { ok: false, reason: 'Invalid signature' };

    const body = JSON.parse(atob(pB64)) as Record<string, unknown>;
    const exp = typeof body.exp === 'number' ? body.exp : 0;
    if (exp > 0 && exp * 1000 < Date.now()) return { ok: false, reason: 'Token expired' };
    const sub = typeof body.sub === 'string' ? body.sub : crypto.randomUUID();
    return { ok: true, sub, claims: body };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : 'Token verification error' };
  }
}

// ---------------------------------------------------------------------------
// Session resolution from incoming request (Bearer JWT)
// ---------------------------------------------------------------------------
async function resolveSession(env: Env, request: Request): Promise<{ sid: string; userId: string } | null> {
  const auth = request.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (!(await verifyJwt(token))) return null;
  const body = jwtBody(token);
  const sid = typeof body?.sid === 'string' ? (body.sid as string) : null;
  if (!sid) return null;
  const sess = await getSessionFromD1(env, sid);
  if (sess === null) return null;
  return { sid, userId: sess.userId };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------
export async function handleAuth(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);

  // CORS preflight
  if (request.method === 'OPTIONS') return okResponse(null, 204);

  // POST /api/auth/login
  if (url.pathname === '/api/auth/login' && request.method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const provider = typeof body.provider === 'string' ? body.provider : '';

    if (!['google', 'apple', 'local'].includes(provider)) {
      return errResponse('invalid_request', "provider must be 'google', 'apple', or 'local'");
    }

    if (provider === 'google' || provider === 'apple') {
      const token = typeof body.token === 'string' ? body.token : '';
      if (!token) return errResponse('invalid_request', 'token is required for google/apple login');

      const verified = await verifyIdToken(provider, token);
      if (!verified.ok) return errResponse('unauthorized', verified.reason, 401);

      let userRow = await userDao.byEmail(env).bind(verified.claims.email as string);
      let user: User;
      const rows = userRow as unknown as Array<Record<string, unknown>>;
      if (rows && rows.length > 0) {
        const r = rows[0];
        user = {
          id: r.id as string,
          email: r.email as string,
          name: r.name as string,
          role: (r.role as string) as User['role'],
          avatarUrl: (r.avatar_url as string | undefined) ?? undefined,
          provider: (r.provider as string) as User['provider'],
          createdAt: r.created_at as string,
          updatedAt: r.updated_at as string,
        };
      } else {
        const newId = crypto.randomUUID();
        const now = new Date().toISOString();
        const email = (verified.claims.email as string) || `${verified.sub}@${provider}`;
        const name = (verified.claims.name as string) || email;
        const ins = await env.thevault_db.prepare(
          `INSERT INTO users (id, email, name, role, provider, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7) RETURNING *`,
        ).bind(newId, email, name, 'user', provider, now, now).first<Record<string, unknown>>();
        if (!ins) return errResponse('server_error', 'Failed to create user');
        user = {
          id: ins.id as string, email: ins.email as string, name: ins.name as string,
          role: (ins.role as string) as User['role'], provider: (ins.provider as string) as User['provider'],
          createdAt: ins.created_at as string, updatedAt: ins.updated_at as string,
        };
      }

      const { sid, token: jwtToken } = await createSession(env, user.id);
      return okResponse({ token: jwtToken, user, sessionId: sid });
    }

    // local login
    const email = typeof body.email === 'string' ? body.email : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!email || !password) return errResponse('invalid_request', 'email and password required');

    const userRows = (await userDao.byEmail(env).bind(email)) as unknown as Array<Record<string, unknown>> | undefined;
    if (!userRows || userRows.length === 0) {
      // attempt auto-register for demo local accounts
      const { hash, salt } = await hashPassword(password);
      const newId = crypto.randomUUID();
      const now = new Date().toISOString();
      const ins = await env.thevault_db.prepare(
        `INSERT INTO users (id, email, name, role, provider, password_hash, password_salt, created_at, updated_at) VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6, ?7, ?8) RETURNING *`,
      ).bind(newId, email, 'Local User', 'local', hash, salt, now, now).first<Record<string, unknown>>();
      if (!ins) return errResponse('server_error', 'Auto-register failed');
      const user: User = {
        id: ins.id as string, email: ins.email as string, name: ins.name as string,
        role: (ins.role as string) as User['role'], provider: 'local',
        createdAt: ins.created_at as string, updatedAt: ins.updated_at as string,
      };
      const creds = await createSession(env, user.id);
      return okResponse({ token: creds.token, user, sessionId: creds.sid });
    }

    const r = userRows[0];
    const hash = (r.password_hash as string | undefined) ?? '';
    const salt = (r.password_salt as string | undefined) ?? '';
    if (!hash || !(await verifyPassword(password, hash, salt))) {
      return errResponse('unauthorized', 'Invalid email or password', 401);
    }

    const user: User = {
      id: r.id as string, email: r.email as string, name: r.name as string,
      role: (r.role as string) as User['role'],
      avatarUrl: (r.avatar_url as string | undefined) ?? undefined,
      provider: (r.provider as string) as User['provider'],
      createdAt: r.created_at as string, updatedAt: r.updated_at as string,
    };
    const creds = await createSession(env, user.id);
    return okResponse({ token: creds.token, user, sessionId: creds.sid });
  }

  // POST /api/auth/logout
  if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
    const sess = await resolveSession(env, request);
    if (sess) await revokeSession(env, sess.sid);
    return okResponse({ loggedOut: true });
  }

  // GET /api/auth/me
  if (url.pathname === '/api/auth/me' && request.method === 'GET') {
    const auth = request.headers.get('Authorization') ?? '';
    if (!auth.startsWith('Bearer ')) return errResponse('unauthorized', 'Missing Bearer token', 401);

    const token = auth.slice(7);
    if (!(await verifyJwt(token))) return errResponse('unauthorized', 'Invalid token', 401);

    const body = jwtBody(token);
    const sid = typeof body?.sid === 'string' ? (body.sid as string) : null;
    if (!sid) return errResponse('unauthorized', 'Missing sid in token', 401);

    const sess = await getSessionFromD1(env, sid);
    if (!sess) return errResponse('unauthorized', 'Session expired or revoked', 401);

    const rows = (await userDao.byId(env).bind(sess.userId)) as unknown as Array<Record<string, unknown>> | null;
    const row = rows?.[0] ?? null;
    if (!row) return errResponse('unauthorized', 'User not found', 401);

    const user: User = {
      id: row.id as string, email: row.email as string, name: row.name as string,
      role: (row.role as string) as User['role'],
      avatarUrl: (row.avatar_url as string | undefined) ?? undefined,
      provider: (row.provider as string) as User['provider'],
      createdAt: row.created_at as string, updatedAt: row.updated_at as string,
    };
    return okResponse({ user, sessionId: sid });
  }

  return new Response(JSON.stringify({ ok: false as const, error: { code: 'not_found', message: 'Auth endpoint not found' } }), {
    status: 404,
    headers: { 'content-type': 'application/json', ...JSON_HEADERS },
  });
}

export async function requireAuth(request: Request, env: Env): Promise<{ userId: string; sid: string } | Response> {
  const resolved = await resolveSession(env, request);
  if (!resolved) {
    return new Response(
      JSON.stringify({ ok: false as const, error: { code: 'unauthorized', message: 'Authentication required' } }),
      { status: 401, headers: { 'content-type': 'application/json', ...JSON_HEADERS } },
    );
  }
  return resolved;
}
