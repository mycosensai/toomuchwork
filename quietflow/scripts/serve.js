// QuietFlow local security bridge — runs the admin/admin finder server-side.
//
// The app is a static export (next.config output:"export") with no server, and
// browsers can't scan a LAN (no ARP/TCP/CORS). So the LAN scan lives here: a
// tiny localhost HTTP server that calls the real TS modules.
//
// Start:  node scripts/serve.js            (listens on 127.0.0.1:8788)
// Then in the app → Security panel → "Find admin/admin cameras".
//
// Authorization: every request must include iOwnThisNetwork:true. The server
// refuses otherwise. This only scans a network you own.

import http from 'node:http';
import { findAdminAdminCameras, retryUntilHardened } from '../src/lib/admin-admin-finder.ts';

const PORT = Number(process.env.PORT || 8788);
const HOST = '127.0.0.1';

function send(res, code, body) {
  const data = JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(data);
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') { send(res, 204, {}); return; }
  if (req.method !== 'POST') { send(res, 405, { error: 'POST only' }); return; }

  const path = (req.url || '/').split('?')[0];
  if (path !== '/api/find' && path !== '/api/harden') {
    send(res, 404, { error: 'not found' });
    return;
  }

  let payload = {};
  try {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    payload = JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    send(res, 400, { error: 'invalid JSON' });
    return;
  }

  const { cidr, iOwnThisNetwork, maxAttempts, retryMs } = payload;
  if (!iOwnThisNetwork) {
    send(res, 403, { authorized: false, error: 'You must confirm you own this network (iOwnThisNetwork:true).' });
    return;
  }
  if (!cidr || !cidr.includes('/')) {
    send(res, 400, { error: 'cidr required, e.g. "192.168.1.0/24"' });
    return;
  }

  try {
    if (path === '/api/harden') {
      const result = await retryUntilHardened({
        cidr,
        iOwnThisNetwork: true,
        maxAttempts: maxAttempts ?? 8,
        retryMs: retryMs ?? 5000,
      });
      send(res, 200, result);
      return;
    }
    // default: /api/find
    const result = await findAdminAdminCameras(cidr, true);
    send(res, 200, result);
  } catch (e) {
    send(res, 500, { error: String(e) });
  }
});

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`QuietFlow security bridge already has a listener on http://${HOST}:${PORT}. Stop the existing bridge or set PORT to a free port.`);
  } else {
    console.error(err);
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`QuietFlow security bridge listening on http://${HOST}:${PORT}`);
  console.log('Endpoints: POST /api/find {cidr,iOwnThisNetwork} · POST /api/harden {cidr,iOwnThisNetwork,maxAttempts,retryMs}');
});
