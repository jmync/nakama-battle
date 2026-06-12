// Tiny Node server: serves the built static site AND proxies team
// registrations to NocoDB Cloud. The NocoDB API token lives only here
// (server env), never in the browser.
import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env locally (Render injects env vars directly, so this is a no-op there).
try {
  if (typeof process.loadEnvFile === 'function' && fs.existsSync(path.join(__dirname, '.env'))) {
    process.loadEnvFile(path.join(__dirname, '.env'));
  }
} catch { /* ignore */ }
const app = express();
app.use(express.json({ limit: '32kb' }));

const PORT = process.env.PORT || 3000;

// --- NocoDB config (set these in Render env / .env) ---
const NOCODB_BASE_URL = process.env.NOCODB_BASE_URL || 'https://app.nocodb.com';
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID;   // e.g. "m1234567890abcd"
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;         // xc-token

app.post('/api/register', async (req, res) => {
  try {
    if (!NOCODB_TABLE_ID || !NOCODB_TOKEN) {
      return res.status(503).json({ ok: false, error: 'Registration is not configured yet.' });
    }
    const { teamName, leader, members } = req.body || {};
    const cleanMembers = Array.isArray(members)
      ? members.filter((m) => m && m.smule?.trim() && m.discord?.trim())
      : [];

    if (!teamName?.trim() || !leader?.trim() || cleanMembers.length === 0) {
      return res.status(400).json({ ok: false, error: 'Missing required fields.' });
    }

    // Flatten members into a readable text block for a single NocoDB cell.
    const membersText = cleanMembers
      .map((m, i) => `${i + 1}. Smule: ${m.smule.trim()} | Discord: ${m.discord.trim()}`)
      .join('\n');

    const record = {
      'Team Name': teamName.trim(),
      'Leader': leader.trim(),
      'Members': membersText,
      'Member Count': cleanMembers.length,
      'Submitted At': new Date().toISOString(),
    };

    const url = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'xc-token': NOCODB_TOKEN },
      body: JSON.stringify(record),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error('NocoDB error', r.status, text);
      return res.status(502).json({ ok: false, error: 'Could not save your entry. Try again.' });
    }
    return res.json({ ok: true });
  } catch (err) {
    console.error('register failed', err);
    return res.status(500).json({ ok: false, error: 'Something went wrong. Try again.' });
  }
});

// serve the built site
const dist = path.join(__dirname, 'dist');
app.use(express.static(dist));
app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));

app.listen(PORT, '0.0.0.0', () => console.log(`NKMA server on :${PORT}`));
