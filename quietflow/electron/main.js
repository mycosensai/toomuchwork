const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

// Keep a global reference to prevent GC
let mainWindow = null;
let serverProcess = null;
let bridgeProcess = null;

const NEXT_PORT = 3456; // non-standard to avoid conflicts
const BRIDGE_PORT = 8790; // 8788 is the LAN security bridge (scripts/serve.js)
const isDev = !app.isPackaged;

// Best-effort start of the local RTSP→HLS camera bridge (bridge/bridge-server.cjs).
// If the port is already taken, another instance is running — that's fine.
function startBridge() {
  try {
    bridgeProcess = spawn('node', [path.join(__dirname, '..', 'bridge', 'bridge-server.cjs')], {
      cwd: path.join(__dirname, '..'),
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, PORT: String(BRIDGE_PORT) },
    });
    bridgeProcess.stdout.on('data', (d) => console.log(`[bridge] ${d.toString().trim()}`));
    bridgeProcess.stderr.on('data', (d) => console.error(`[bridge:err] ${d.toString().trim()}`));
    bridgeProcess.on('exit', (code) => {
      console.log(`Camera bridge exited with code ${code}`);
      bridgeProcess = null;
    });
  } catch (err) {
    console.error('Failed to start camera bridge:', err);
    bridgeProcess = null;
  }
}

function stopBridge() {
  if (bridgeProcess) {
    bridgeProcess.kill();
    bridgeProcess = null;
  }
}

// Serve the prebuilt static export (out/) when present — instant load, no
// on-demand compilation. Falls back to `next dev` only if out/ is missing.
function startNextServer() {
  return new Promise((resolve, reject) => {
    let resolved = false;
    const cwd = path.join(__dirname, '..');
    const outDir = path.join(cwd, 'out');
    if (fs.existsSync(outDir) && fs.existsSync(path.join(outDir, 'index.html'))) {
      serverProcess = spawn('node', [path.join(__dirname, 'serve-static.cjs')], {
        cwd,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: false,
        env: { ...process.env, QF_STATIC_PORT: String(NEXT_PORT) },
      });
      serverProcess.stdout.on('data', (d) => console.log(`[static] ${d.toString().trim()}`));
      serverProcess.stderr.on('data', (d) => console.error(`[static:err] ${d.toString().trim()}`));
      serverProcess.on('exit', (code) => {
        console.log(`Static server exited with code ${code}`);
        if (!resolved) { resolved = true; reject(new Error(`Static server exited with code ${code}`)); }
      });
      // Static server binds immediately; poll to be safe.
      waitForPort(resolve, reject);
      return;
    }
    console.log('out/ not found — falling back to next dev (slow first paint)');
    serverProcess = spawn('npx', ['next', 'dev', '-p', String(NEXT_PORT)], {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, NODE_ENV: 'development' },
    });
    serverProcess.stdout.on('data', (d) => console.log(`[next] ${d.toString().trim()}`));
    serverProcess.stderr.on('data', (d) => console.error(`[next:err] ${d.toString().trim()}`));
    serverProcess.on('error', (err) => {
      console.error('Failed to start Next.js server:', err);
      if (!resolved) { resolved = true; reject(err); }
    });
    serverProcess.on('exit', (code) => {
      console.log(`Next.js server exited with code ${code}`);
      if (!resolved) { resolved = true; reject(new Error(`Server exited with code ${code}`)); }
    });
    waitForPort(resolve, reject);
  });
}

function waitForPort(resolve, reject) {
  let resolved = false;
  const http = require('http');
  const start = Date.now();
  const poll = () => {
    const req = http.get({ host: 'localhost', port: NEXT_PORT, path: '/', timeout: 1000 }, (res) => {
      res.resume();
      if (!resolved) { resolved = true; resolve(); }
    });
    req.on('error', () => {
      if (Date.now() - start > 60000) {
        if (!resolved) { resolved = true; reject(new Error('Server did not start in time')); }
        return;
      }
      setTimeout(poll, 400);
    });
    req.on('timeout', () => { req.destroy(); });
  };
  poll();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    title: 'QuietFlow — Live Traffic Intelligence',
    icon: path.join(__dirname, '..', 'public', 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
    backgroundColor: '#0a0a0b',
  });

  // Load the app
  mainWindow.loadURL(`http://localhost:${NEXT_PORT}`);

  // Diagnostic: surface renderer console + load failures (keep for debugging).
  mainWindow.webContents.on('console-message', (e) => {
    console.log(`[render:${e.level}] ${e.message}`);
  });
  mainWindow.webContents.on('did-fail-load', (e, code, desc, url) => {
    console.error(`[did-fail-load] ${code} ${desc} @ ${url}`);
  });
  mainWindow.webContents.on('crashed', (e, killed) => {
    console.error(`[renderer-crashed] killed=${killed}`);
  });
  // Open DevTools so the user can inspect if needed.
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    console.log('Starting camera bridge...');
    startBridge();
    console.log('Starting Next.js server...');
    await startNextServer();
    console.log('Next.js server is ready. Creating window...');
    createWindow();
  } catch (err) {
    console.error('Failed to start:', err);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  stopBridge();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
  stopBridge();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
