import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    root: '.',
    publicDir: 'public',
    server: { host: '0.0.0.0', port: 5173 },
    preview: { host: '0.0.0.0', port: 5173 },
    envPrefix: 'VITE_',
  };
});
