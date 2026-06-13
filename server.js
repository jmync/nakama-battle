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
const NOCODB_TABLE_ID = process.env.NOCODB_TABLE_ID;   // registrations table
const NOCODB_POLL_TABLE_ID = process.env.NOCODB_POLL_TABLE_ID; // poll votes table
const NOCODB_TOKEN = process.env.NOCODB_TOKEN;         // xc-token
const SLOT_LIMIT = Number(process.env.SLOT_LIMIT || 35); // max teams; set in env to adjust

const nocoHeaders = { 'Content-Type': 'application/json', 'xc-token': NOCODB_TOKEN };

// how many registrations exist right now
async function registrationCount() {
  const url = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records?limit=1000&fields=Team Name`;
  const r = await fetch(url, { headers: nocoHeaders });
  if (!r.ok) throw new Error('count failed');
  const data = await r.json();
  return Array.isArray(data?.list) ? data.list.length : 0;
}

// current slot status for the frontend
app.get('/api/slots', async (_req, res) => {
  try {
    if (!NOCODB_TABLE_ID || !NOCODB_TOKEN) {
      return res.json({ count: 0, limit: SLOT_LIMIT, full: false, configured: false });
    }
    const count = await registrationCount();
    res.json({ count, limit: SLOT_LIMIT, full: count >= SLOT_LIMIT, configured: true });
  } catch (e) {
    console.error('slots failed', e);
    res.json({ count: 0, limit: SLOT_LIMIT, full: false, configured: true });
  }
});

// record a Yes/No vote on extending the slots
app.post('/api/poll', async (req, res) => {
  try {
    if (!NOCODB_POLL_TABLE_ID || !NOCODB_TOKEN) {
      return res.status(503).json({ ok: false, error: 'Poll is not configured yet.' });
    }
    const vote = String(req.body?.vote || '').toLowerCase();
    const teamName = String(req.body?.teamName || '').trim();
    if (vote !== 'yes' && vote !== 'no') {
      return res.status(400).json({ ok: false, error: 'Invalid vote.' });
    }
    if (!teamName) {
      return res.status(400).json({ ok: false, error: 'Please enter your team name.' });
    }

    // anti-spam: one vote per team name
    try {
      const listUrl = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_POLL_TABLE_ID}/records?limit=1000&fields=Team Name`;
      const listRes = await fetch(listUrl, { headers: nocoHeaders });
      if (listRes.ok) {
        const data = await listRes.json();
        const rows = Array.isArray(data?.list) ? data.list : [];
        const wanted = teamName.toLowerCase();
        if (rows.some((row) => String(row['Team Name'] || '').trim().toLowerCase() === wanted)) {
          return res.status(409).json({ ok: false, error: 'Your team already voted. Thanks!' });
        }
      }
    } catch (e) { console.error('poll pre-check failed', e); }

    const record = {
      'Team Name': teamName,
      'Vote': vote === 'yes' ? 'Yes' : 'No',
      'Submitted At': new Date().toISOString(),
    };
    const url = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_POLL_TABLE_ID}/records`;
    const r = await fetch(url, { method: 'POST', headers: nocoHeaders, body: JSON.stringify(record) });
    if (!r.ok) {
      console.error('poll write error', r.status, await r.text());
      return res.status(502).json({ ok: false, error: 'Could not record your vote.' });
    }
    res.json({ ok: true });
  } catch (e) {
    console.error('poll failed', e);
    res.status(500).json({ ok: false, error: 'Something went wrong.' });
  }
});

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

    const recordsUrl = `${NOCODB_BASE_URL}/api/v2/tables/${NOCODB_TABLE_ID}/records`;
    const headers = { 'Content-Type': 'application/json', 'xc-token': NOCODB_TOKEN };

    // Slot cap + duplicate-name guard: read existing rows first.
    // (Pull names + a generous limit so the count is accurate up to the cap.)
    try {
      const listRes = await fetch(`${recordsUrl}?limit=1000&fields=Team Name`, { headers });
      if (listRes.ok) {
        const data = await listRes.json();
        const rows = Array.isArray(data?.list) ? data.list : [];
        if (rows.length >= SLOT_LIMIT) {
          return res.status(409).json({ ok: false, error: 'Registration is full. All slots have been taken.' });
        }
        const wanted = teamName.trim().toLowerCase();
        const dup = rows.some((row) => String(row['Team Name'] || '').trim().toLowerCase() === wanted);
        if (dup) {
          return res.status(409).json({ ok: false, error: 'That team name is already registered. Pick another.' });
        }
      }
    } catch (e) {
      console.error('pre-check failed', e); // if the check fails, fall through and still attempt the insert
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

    const r = await fetch(recordsUrl, {
      method: 'POST',
      headers,
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
