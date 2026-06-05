import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Honor a host-provided PORT (Render/Railway/Heroku-style); fall back to
// Vite's defaults (5173 dev, 4173 preview) when it isn't set.
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

export default defineConfig({
  // Root-served deployment (custom domain / Vercel / Netlify / Node host).
  // NOTE: GitHub Pages serves from /nakama-battle/ — switch this back to
  // '/nakama-battle/' if deploying there, or assets will 404.
  base: '/',
  plugins: [react()],
  server: {
    port,
    open: true,
  },
  preview: {
    port,
  },
});
