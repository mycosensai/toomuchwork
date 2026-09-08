// Cloudflare Worker: community reports + corrections (D1-backed)
// Deploy: wrangler deploy  (needs vars: DB binding "DB")
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

    // ── Density / correction reports ──
    if (url.pathname === '/reports' && req.method === 'GET') {
      const since = url.searchParams.get('since') || new Date(Date.now() - 6 * 3600 * 1000).toISOString();
      const { results } = await env.DB.prepare(
        'SELECT * FROM reports WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT 500'
      ).bind(since).all();
      return new Response(JSON.stringify(results), { headers: { ...cors, 'content-type': 'application/json' } });
    }
    if (url.pathname === '/reports' && req.method === 'POST') {
      const r = await req.json();
      if (!r.locationId || !r.density) return new Response('bad', { status: 400, headers: cors });
      await env.DB.prepare(
        'INSERT OR REPLACE INTO reports (id, locationId, locationName, density, comment, timestamp, authorId, helpful) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(r.id, r.locationId, r.locationName || '', r.density, r.comment || '', r.timestamp || new Date().toISOString(), r.authorId || 'anon', r.helpful || 0).run();
      return new Response('ok', { headers: cors });
    }

    // ── Signal corrections (camera down, traffic clear/jam, crowd wrong) ──
    if (url.pathname === '/corrections' && req.method === 'GET') {
      const since = url.searchParams.get('since') || new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { results } = await env.DB.prepare(
        'SELECT * FROM corrections WHERE timestamp >= ? ORDER BY timestamp DESC LIMIT 1000'
      ).bind(since).all();
      return new Response(JSON.stringify(results), { headers: { ...cors, 'content-type': 'application/json' } });
    }
    if (url.pathname === '/corrections' && req.method === 'POST') {
      const c = await req.json();
      if (!c.targetId || !c.correctionType) return new Response('bad', { status: 400, headers: cors });
      await env.DB.prepare(
        'INSERT OR REPLACE INTO corrections (id, kind, correctionType, targetId, targetType, note, timestamp, authorId) VALUES (?,?,?,?,?,?,?,?)'
      ).bind(c.id, 'correction', c.correctionType, c.targetId, c.targetType || 'camera', c.note || '', c.timestamp || new Date().toISOString(), c.authorId || 'anon').run();
      return new Response('ok', { headers: cors });
    }

    return new Response('not found', { status: 404, headers: cors });
  }
};
