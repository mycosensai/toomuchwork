#!/usr/bin/env node
/**
 * QuietFlow Camera Bridge — RTSP → HLS transcoder.
 *
 * A static web app cannot open an RTSP socket, so this small local server
 * owns that connection: it accepts camera registrations, spawns ffmpeg to
 * transcode each RTSP stream into an HLS playlist, and serves the playlists
 * + segments to the app at http://127.0.0.1:8788/hls/<id>/index.m3u8.
 *
 * SECURITY MODEL
 *  - Binds ONLY to 127.0.0.1 (never exposed to the LAN or internet).
 *  - Credentials (rtsp://user:pass@host/...) live in memory ONLY and are
 *    never written to disk. Restarting the bridge forgets every camera.
 *  - Requires ffmpeg on PATH (checked at startup).
 *  - No auth on /register because the socket is loopback-only; any local
 *    process can already read your camera streams anyway.
 *
 * USAGE
 *   node bridge/bridge-server.cjs            # starts on 127.0.0.1:8788
 *   PORT=9000 node bridge/bridge-server.cjs  # custom port
 *   Node >= 18 (uses global fetch).
 *
 * ENDPOINTS
 *   POST   /register            {id,name,rtspUrl,brand} → 201 | 400
 *   GET    /hls/:id/index.m3u8  starts stream on demand → HLS playlist
 *   GET    /hls/:id/segment-*.ts media segments
 *   GET    /health              {ok, cameras, streams}
 *   DELETE /:id                 stops the stream and forgets the camera
 */

const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = Number(process.env.PORT || 8790);
const HOST = '127.0.0.1';
const HLS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'qf-bridge-'));
const SEGMENT_TIME = 2; // seconds per HLS segment
const MAX_STREAMS = 16; // hard cap to protect the machine

/** id → { id, name, rtspUrl, brand, ffmpeg, hlsDir, startedAt, alive } */
const cameras = new Map();

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function send(res, code, body, headers = {}) {
  const data = typeof body === 'string' ? body : JSON.stringify(body);
  res.writeHead(code, {
    'Content-Type': typeof body === 'string' ? headers['Content-Type'] || 'application/octet-stream' : 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    ...headers,
  });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (c) => { raw += c; if (raw.length > 64 * 1024) { req.destroy(); reject(new Error('body too large')); } });
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(new Error('invalid JSON')); }
    });
    req.on('error', reject);
  });
}

/** Spawn the ffmpeg transcode for a camera. Returns the child process. */
function startStream(cam) {
  if (cam.ffmpeg) return cam.ffmpeg;
  const hlsDir = path.join(HLS_DIR, cam.id);
  fs.mkdirSync(hlsDir, { recursive: true });
  cam.hlsDir = hlsDir;

  const playlist = path.join(hlsDir, 'index.m3u8');
  const args = [
    '-hide_banner', '-loglevel', 'error',
    '-rtsp_transport', 'tcp',
    '-i', cam.rtspUrl,
    '-an',                                  // drop audio — cameras are silent
    '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency',
    '-g', String(SEGMENT_TIME * 2), '-keyint_min', String(SEGMENT_TIME * 2),
    '-sc_threshold', '0',
    '-f', 'hls',
    '-hls_time', String(SEGMENT_TIME),
    '-hls_list_size', '6',
    '-hls_flags', 'delete_segments+append_list',
    '-hls_segment_filename', path.join(hlsDir, 'segment-%03d.ts'),
    playlist,
  ];

  log(`[start] ${cam.id} (${cam.name}) → ${hlsDir}`);
  const child = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
  cam.ffmpeg = child;
  cam.startedAt = Date.now();
  cam.alive = true;
  child.stderr.on('data', (d) => {
    const msg = d.toString().trim();
    if (msg) log(`[ffmpeg:${cam.id}] ${msg}`);
  });
  child.on('exit', (code) => {
    log(`[stop] ${cam.id} exited code ${code}`);
    cam.ffmpeg = null;
    cam.alive = false;
    // Restart with backoff if the stream was live and the camera is still registered.
    if (cam.retry !== false) {
      cam.retry = (cam.retry || 0) + 1;
      if (cam.retry <= 5) {
        const delay = Math.min(5000, 500 * cam.retry);
        log(`[retry] ${cam.id} in ${delay}ms (attempt ${cam.retry})`);
        cam.retryTimer = setTimeout(() => { cam.retry = undefined; startStream(cam); }, delay);
      }
    }
  });
  return child;
}

function stopStream(cam) {
  clearTimeout(cam.retryTimer);
  cam.retry = false;
  if (cam.ffmpeg) {
    cam.ffmpeg.kill('SIGTERM');
    setTimeout(() => cam.ffmpeg?.kill('SIGKILL'), 3000).unref();
    cam.ffmpeg = null;
  }
  cam.alive = false;
  try { fs.rmSync(cam.hlsDir, { recursive: true, force: true }); } catch {}
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;

  if (req.method === 'OPTIONS') return send(res, 204, '');

  // POST /register
  if (req.method === 'POST' && p === '/register') {
    try {
      const body = await readBody(req);
      const { id, name, rtspUrl, brand } = body || {};
      if (!id || !name || !rtspUrl || !/^rtsp:\/\//i.test(String(rtspUrl))) {
        return send(res, 400, { ok: false, error: 'id, name and an rtsp:// URL are required' });
      }
      if (cameras.size >= MAX_STREAMS && !cameras.has(id)) {
        return send(res, 429, { ok: false, error: `max ${MAX_STREAMS} cameras` });
      }
      // Replace existing (restart stream with new URL) or create.
      if (cameras.has(id)) stopStream(cameras.get(id));
      const cam = { id, name, rtspUrl, brand: brand || 'other', ffmpeg: null, hlsDir: null, startedAt: null, alive: false, retry: undefined };
      cameras.set(id, cam);
      log(`[register] ${id} ${name} ${rtspUrl.replace(/:\/\/[^@]+@/, '://***@')}`);
      startStream(cam);
      return send(res, 201, { ok: true, id, hlsUrl: `http://${HOST}:${PORT}/hls/${id}/index.m3u8` });
    } catch (err) {
      return send(res, 400, { ok: false, error: err.message });
    }
  }

  // DELETE /:id
  if (req.method === 'DELETE') {
    const id = p.replace(/^\//, '');
    const cam = cameras.get(id);
    if (!cam) return send(res, 404, { ok: false, error: 'unknown camera' });
    stopStream(cam);
    cameras.delete(id);
    log(`[delete] ${id}`);
    return send(res, 200, { ok: true });
  }

  // GET /health
  if (req.method === 'GET' && p === '/health') {
    const streams = [...cameras.values()].filter((c) => c.alive).length;
    return send(res, 200, {
      ok: true,
      ffmpeg: process.env.QF_FFMPEG_PATH || 'ffmpeg',
      cameras: cameras.size,
      streams,
      hlsDir: HLS_DIR,
      version: 1,
    });
  }

  // GET /hls/:id/index.m3u8 and segments
  const hlsMatch = p.match(/^\/hls\/([^/]+)\/(index\.m3u8|segment-\d+\.ts)$/);
  if (req.method === 'GET' && hlsMatch) {
    const id = hlsMatch[1];
    const file = hlsMatch[2];
    const cam = cameras.get(id);
    if (!cam || !cam.hlsDir) return send(res, 404, { ok: false, error: 'camera not registered' });
    const filePath = path.join(cam.hlsDir, file);
    if (!fs.existsSync(filePath)) return send(res, 404, { ok: false, error: 'stream not ready yet — retry in a moment' });
    const data = fs.readFileSync(filePath);
    const isPlaylist = file === 'index.m3u8';
    return send(res, 200, data, {
      'Content-Type': isPlaylist ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
    });
  }

  return send(res, 404, { ok: false, error: 'not found' });
});

// Fail fast if ffmpeg is missing.
const { execFileSync } = require('child_process');
try {
  execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' });
} catch {
  console.error('ffmpeg not found on PATH — install it (winget install Gyan.FFmpeg) and retry.');
  process.exit(1);
}

server.on('error', (err) => {
  if (err?.code === 'EADDRINUSE') {
    console.error(`QuietFlow camera bridge already running on http://${HOST}:${PORT} — leaving it to the existing instance.`);
    process.exit(0); // another instance is fine; don't crash a host app
  }
  console.error('Camera bridge error:', err);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  log(`QuietFlow camera bridge listening on http://${HOST}:${PORT}`);
  log(`HLS output dir: ${HLS_DIR}`);
  log(`Register a camera: POST /register {id,name,rtspUrl,brand}`);
});

process.on('SIGINT', () => {
  for (const cam of cameras.values()) stopStream(cam);
  server.close(() => process.exit(0));
});
process.on('SIGTERM', () => process.exit(0));
