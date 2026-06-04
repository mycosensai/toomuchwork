import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  css: {
    postcss: {
      config: false
    }
  }
});
