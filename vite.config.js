import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Honor a host-provided PORT (Render/Railway/Heroku-style); fall back to
// Vite's defaults (5173 dev, 4173 preview) when it isn't set.
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

export default defineConfig({
  // Served from https://jmync.github.io/nakama-battle/ on GitHub Pages,
  // so assets must resolve under that subpath.
  base: '/nakama-battle/',
  plugins: [react()],
  server: {
    port,
    open: true,
  },
  preview: {
    port,
  },
});
