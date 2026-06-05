import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from https://jmync.github.io/nakama-battle/ on GitHub Pages,
  // so assets must resolve under that subpath.
  base: '/nakama-battle/',
  plugins: [react()],
  server: {
    open: true,
  },
});
