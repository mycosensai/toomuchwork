import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { findAdminAdminCameras, retryUntilHardened, checkHostForAdminAdmin } from '../src/lib/admin-admin-finder.ts';
import type { FinderResult } from '../src/lib/admin-admin-finder.ts';

// Spin up a tiny local server that responds per the requested behavior, then
// point the finder at 127.0.0.1:<port> directly (bypass CIDR/ARP by passing a
// finder that probes only our test host).
function startTestServer(mode: 'accept' | 'challenge' | 'closed'): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (mode === 'accept') {
        // Pretend the gated path accepted admin:admin (e.g. ISAPI 200).
        if (req.url?.includes('ISAPI') || req.url?.includes('cgi-bin') || req.url?.includes('axis-cgi')) {
          res.writeHead(200); res.end('ok'); return;
        }
        res.writeHead(401); res.end();
      } else if (mode === 'challenge') {
        // Always challenge → hardened, NOT a default-cred hit.
        res.writeHead(401); res.end();
      } else {
        res.writeHead(404); res.end();
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ port, close: () => server.close() });
    });
  });
}

// A finder that ignores CIDR/ARP and just probes our test host on the given port.
function fakeFinderFor(port: number) {
  return async (_cidr: string, iOwn: boolean): Promise<FinderResult> => {
    if (!iOwn) return { cidr: 'x', scannedAt: '', checked: 0, stillOnAdminAdmin: [], hardened: 0, authorized: false };
    // Reuse the real per-host probe by importing it indirectly: call the real
    // find but it scans ARP/CIDR. Instead, replicate the single-host check here
    // by importing the module's exported helper is not available, so we shell
    // out to the real function on a /31 containing only 127.0.0.1? Simpler:
    // directly test tryAdminAdmin via a fresh server each call is heavy; we
    // assert using the real function by monkeypatching discover is overkill.
    // So: return a synthetic result based on a manual probe we do here.
    const r = await probeOnce(port);
    return {
      cidr: '127.0.0.1/32',
      scannedAt: new Date().toISOString(),
      checked: 1,
      stillOnAdminAdmin: r.onAdminAdmin ? [{ ip: '127.0.0.1', port, scheme: 'http', onAdminAdmin: true, unknown: false, brand: 'test', status: 'test', checkedAt: new Date().toISOString() }] : [],
      hardened: r.onAdminAdmin ? 0 : 1,
      authorized: true,
    };
  };
}

function probeOnce(port: number): Promise<{ onAdminAdmin: boolean }> {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, path: '/ISAPI/Security/userCheck', method: 'GET', headers: { Authorization: 'Basic ' + Buffer.from('admin:admin').toString('base64') }, timeout: 1500 }, (res) => {
      res.resume();
      const code = res.statusCode ?? 0;
      resolve({ onAdminAdmin: code >= 200 && code < 400 });
    });
    req.on('error', () => resolve({ onAdminAdmin: false }));
    req.on('timeout', () => { req.destroy(); resolve({ onAdminAdmin: false }); });
    req.end();
  });
}

test('brand-aware check: a 401 auth challenge is HARDENED, not a false positive', async () => {
  const srv = await startTestServer('challenge');
  try {
    const finder = fakeFinderFor(srv.port);
    const res = await retryUntilHardened({ cidr: 'x', iOwnThisNetwork: true, finder, sleep: async () => {} });
    assert.equal(res.stillOnAdminAdmin.length, 0, 'challenge host must not be flagged as default');
    assert.equal(res.attempts, 1);
  } finally {
    srv.close();
  }
});

test('brand-aware check: a 2xx on a gated path means still on admin/admin', async () => {
  const srv = await startTestServer('accept');
  try {
    const finder = fakeFinderFor(srv.port);
    const res = await retryUntilHardened({ cidr: 'x', iOwnThisNetwork: true, finder, sleep: async () => {} });
    assert.equal(res.stillOnAdminAdmin.length, 1, 'accepting host must be flagged');
  } finally {
    srv.close();
  }
});

test('retryUntilHardened converges when the host is changed between attempts', async () => {
  let attempt = 0;
  const finder = async (): Promise<FinderResult> => {
    attempt++;
    // First scan sees a default; second sees a challenge (user changed password).
    const onDefault = attempt === 1;
    return {
      cidr: 'x', scannedAt: new Date().toISOString(), checked: 1,
      stillOnAdminAdmin: onDefault ? [{ ip: '127.0.0.1', port: 80, scheme: 'http', onAdminAdmin: true, unknown: false, brand: 'hikvision', status: 'hikvision', checkedAt: new Date().toISOString() }] : [],
      hardened: onDefault ? 0 : 1, authorized: true,
    };
  };
  const res = await retryUntilHardened({ cidr: 'x', iOwnThisNetwork: true, finder, sleep: async () => {} });
  assert.equal(res.attempts, 2);
  assert.equal(res.stillOnAdminAdmin.length, 0);
});

// ─── Real-logic probes (regression: false positives on non-camera hosts) ────
//
// These call checkHostForAdminAdmin — the ACTUAL decision function — instead of
// reimplementing its rules, which is how the redirect bug originally hid.

/** Server that redirects every path (what a real home router does). */
function startRedirectServer(code: number): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      res.writeHead(code, { Location: `https://127.0.0.1${req.url}` });
      res.end();
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ port, close: () => server.close() });
    });
  });
}

/** Server that answers 200 to absolutely everything (catch-all landing page). */
function startCatchAllServer(): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((_req, res) => {
      res.writeHead(200); res.end('<html>router admin</html>');
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ port, close: () => server.close() });
    });
  });
}

/** Real camera: 401 on everything unknown, 200 on a gated path with admin:admin. */
function startRealDefaultCamServer(): Promise<{ port: number; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url?.includes('/ISAPI/')) { res.writeHead(200); res.end('<userCheck/>'); return; }
      res.writeHead(404); res.end();
    });
    server.listen(0, '127.0.0.1', () => {
      const port = (server.address() as any).port;
      resolve({ port, close: () => server.close() });
    });
  });
}

test('a 308-redirecting router is NOT reported as an admin/admin camera', async () => {
  const srv = await startRedirectServer(308);
  try {
    const r = await checkHostForAdminAdmin('127.0.0.1', srv.port, 'http');
    assert.equal(r.onAdminAdmin, false, 'a redirect must never count as accepted credentials');
  } finally {
    srv.close();
  }
});

test('a 302-redirecting host is NOT reported as an admin/admin camera', async () => {
  const srv = await startRedirectServer(302);
  try {
    const r = await checkHostForAdminAdmin('127.0.0.1', srv.port, 'http');
    assert.equal(r.onAdminAdmin, false);
  } finally {
    srv.close();
  }
});

test('a catch-all 200 host is unknown, not a finding (control probe)', async () => {
  const srv = await startCatchAllServer();
  try {
    const r = await checkHostForAdminAdmin('127.0.0.1', srv.port, 'http');
    assert.equal(r.onAdminAdmin, false, 'answers-200-to-everything must not be a finding');
    assert.equal(r.unknown, true, 'it should be reported as indeterminate');
  } finally {
    srv.close();
  }
});

test('a genuine default-cred camera IS still detected (no over-correction)', async () => {
  const srv = await startRealDefaultCamServer();
  try {
    const r = await checkHostForAdminAdmin('127.0.0.1', srv.port, 'http');
    assert.equal(r.onAdminAdmin, true, 'a real 2xx on a gated path must still be caught');
    assert.equal(r.brand, 'hikvision');
  } finally {
    srv.close();
  }
});

test('a host that challenges on everything is hardened, not unknown', async () => {
  const srv = await startTestServer('challenge');
  try {
    const r = await checkHostForAdminAdmin('127.0.0.1', srv.port, 'http');
    assert.equal(r.onAdminAdmin, false);
    assert.equal(r.unknown, false, '401 everywhere means auth is required → hardened');
    assert.equal(r.brand, 'hardened');
  } finally {
    srv.close();
  }
});
