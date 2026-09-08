// Minimal static file server for the prebuilt QuietFlow export (out/).
// Used by electron/main.js so the app opens instantly in a window without
// running a Next.js dev/prod server (which stalls on on-demand compilation).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'out');
const PORT = process.env.QF_STATIC_PORT ? Number(process.env.QF_STATIC_PORT) : 3456;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  // Resolve within ROOT (prevent path traversal).
  let filePath = path.normalize(path.join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) {
      // SPA-ish fallback: serve index.html for unknown non-asset routes.
      if (!path.extname(urlPath)) {
        filePath = path.join(ROOT, 'index.html');
      } else {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
    }
    fs.readFile(filePath, (e, data) => {
      if (e) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      res.end(data);
    });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[static] QuietFlow export serving on http://localhost:${PORT}`);
});
