import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Honor a host-provided PORT (Render/Railway/Heroku-style); fall back to
// Vite's defaults (5173 dev, 4173 preview) when it isn't set.
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

export default defineConfig({
  // Root-served deployment (Render / Node host serving at /).
  base: '/',
  plugins: [react()],
  server: {
    port,
    open: true,
    // forward registration API to the local Node server during dev
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  preview: {
    port,
  },
});
