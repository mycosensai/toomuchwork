import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRIDGE = path.join(__dirname, '..', 'bridge', 'bridge-server.cjs');

/** Start the bridge on a random free port; returns {port, stop}. */
async function startBridge() {
  const port = 18790 + Math.floor(Math.random() * 500);
  const proc = spawn('node', [BRIDGE], {
    env: { ...process.env, PORT: String(port) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  // Wait for the listen line.
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('bridge did not start')), 8000);
    proc.stdout.on('data', (d) => {
      if (d.toString().includes('listening')) { clearTimeout(timer); resolve(); }
    });
    proc.on('exit', (code) => { clearTimeout(timer); reject(new Error(`bridge exited ${code}`)); });
  });
  return {
    port,
    base: `http://127.0.0.1:${port}`,
    stop: () => { try { proc.kill(); } catch {} },
  };
}

test('camera bridge: /health reports ok with zero cameras', async () => {
  const b = await startBridge();
  try {
    const res = await fetch(`${b.base}/health`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.ok, true);
    assert.equal(body.cameras, 0);
    assert.equal(body.streams, 0);
  } finally {
    b.stop();
  }
});

test('camera bridge: /register rejects missing rtsp URL (400)', async () => {
  const b = await startBridge();
  try {
    const res = await fetch(`${b.base}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'x', name: 'X' }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.ok, false);
  } finally {
    b.stop();
  }
});

test('camera bridge: unknown camera HLS playlist is 404', async () => {
  const b = await startBridge();
  try {
    const res = await fetch(`${b.base}/hls/nope/index.m3u8`);
    assert.equal(res.status, 404);
  } finally {
    b.stop();
  }
});
