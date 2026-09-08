const { contextBridge } = require('electron');

// Expose a minimal API to the renderer process
contextBridge.exposeInMainWorld('quietflow', {
  platform: process.platform,
  isElectron: true,
  version: process.env.npm_package_version || '0.1.0',
});
