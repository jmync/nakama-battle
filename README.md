# NAKAMA Chorus Battle

Landing page for the **NKMA Chorus Battle** — a Smule chorus singing tournament (teams of up to 4). Built with React + Vite.

## Tech

- **React 18** (UI)
- **Vite 5** (dev server + build)
- Plain CSS (`styles.css`) and a canvas background animation (`background.js`)

## Getting started

```bash
npm install
npm run dev
```

The dev server runs at **http://localhost:5173/** and auto-opens your browser. Edits to `app.jsx`, `styles.css`, or `background.js` hot-reload instantly.

> Run `npm run dev` with no extra args. On Windows, passing flags like `npm run dev -- --port 3000` is mis-parsed and fed to Vite as a folder path. To change the port, set `server.port` in `vite.config.js` instead.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Build the production bundle into `dist/` |
| `npm run preview` | Serve the built `dist/` locally |

## Project structure

```
index.html        Vite entry HTML
main.jsx          App entry — mounts React, imports CSS + background
app.jsx           Main UI (hero, tabs: Mechanics / Rules / Format / Judging / Prizes)
styles.css        Styles
background.js      Animated canvas background (particles, music notes)
vite.config.js    Vite + React plugin config
```

## Event

- **Format:** Chorus Battle (teams of up to 4), recorded in Smule
- **Stages:** Qualifiers → Group Clash → Showdown → Semi-Finals → Finals
- **Register:** https://forms.gle/beS1DQGHGpst4zJ39
- **Discord:** https://discord.gg/YujuKC9WXP

`#NKMACB1`
