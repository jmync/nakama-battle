import React, { useState, useEffect, useRef } from 'react';

/* ---------- helpers ---------- */
const pad = (n) => String(n).padStart(2, '0');
function toLocalInput(ms) {
  const d = new Date(ms);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}
function parseT(str) { if (!str) return null; const t = Date.parse(str); return isNaN(t) ? null : t; }
function parts(ms) { ms = Math.max(0, ms); const s = Math.floor(ms / 1000); return { days: pad(Math.floor(s / 86400)), hours: pad(Math.floor((s % 86400) / 3600)), mins: pad(Math.floor((s % 3600) / 60)), secs: pad(s % 60) }; }
function fmt(ms) { if (!ms) return ''; const d = new Date(ms); return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }) + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); }
function relTime(ms, now) {
  if (!ms) return ''; let d = ms - now; const past = d < 0; d = Math.abs(d);
  const sec = Math.floor(d / 1000), days = Math.floor(sec / 86400), hrs = Math.floor((sec % 86400) / 3600), mins = Math.floor((sec % 3600) / 60);
  let str; if (days > 0) str = days + 'd ' + hrs + 'h'; else if (hrs > 0) str = hrs + 'h ' + mins + 'm'; else str = Math.max(mins, 0) + 'm';
  return past ? str + ' ago' : 'in ' + str;
}
function statusViz(st) {
  if (st === 'live') return { label: 'LIVE', color: '#45d182', bg: 'rgba(69,209,130,0.14)', border: 'rgba(69,209,130,0.42)' };
  if (st === 'done') return { label: 'DONE', color: '#8c8082', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.12)' };
  return { label: 'LOCKED', color: '#e0a23c', bg: 'rgba(224,162,60,0.13)', border: 'rgba(224,162,60,0.36)' };
}

const SEED_STAGES = () => {
  const now = Date.now(), H = 3600000, D = 86400000;
  return [
    { id: 's1', name: 'Qualifiers', desc: '', start: toLocalInput(now - 2 * D), end: toLocalInput(now + 2 * H), status: 'live' },
    { id: 's2', name: 'Group Clash', desc: '', start: toLocalInput(now + 1 * D), end: toLocalInput(now + 1 * D + 3 * H), status: 'locked' },
    { id: 's3', name: 'Showdown', desc: '', start: toLocalInput(now + 3 * D), end: toLocalInput(now + 3 * D + 3 * H), status: 'locked' },
    { id: 's4', name: 'Semi-Finals', desc: '', start: toLocalInput(now + 5 * D), end: toLocalInput(now + 5 * D + 3 * H), status: 'locked' },
    { id: 's5', name: 'Finals', desc: '', start: toLocalInput(now + 7 * D), end: toLocalInput(now + 7 * D + 4 * H), status: 'locked' },
  ];
};

function StaffApp() {
  const [pass, setPass] = useState(sessionStorage.getItem('nkma_staff') || '');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => { if (pass) verify(pass, true); /* eslint-disable-next-line */ }, []);

  async function verify(code, silent) {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/staff/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ passcode: code }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Wrong passcode.');
      sessionStorage.setItem('nkma_staff', code); setPass(code); setAuthed(true); loadData(code);
    } catch (e) { if (!silent) setErr(e.message || 'Wrong passcode.'); sessionStorage.removeItem('nkma_staff'); setPass(''); }
    finally { setBusy(false); }
  }
  async function loadData(code) {
    try { const r = await fetch('/api/staff/data', { headers: { 'x-staff-pass': code } }); const d = await r.json(); if (d.ok) setData(d); } catch { /* ignore */ }
  }
  function logout() { sessionStorage.removeItem('nkma_staff'); setAuthed(false); setPass(''); setData(null); setInput(''); }

  if (!authed) {
    return (
      <div className="st2-gate">
        <div className="st2-gate-box">
          <div className="st2-lock"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><rect x="4.5" y="10.5" width="15" height="10" rx="2.2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg></div>
          <div className="st2-gate-title">NKMA <span>STAFF</span></div>
          <div className="st2-gate-sub">Enter the passcode to continue.</div>
          <input className="st2-input" type="password" value={input} autoFocus
            onChange={(e) => { setInput(e.target.value); setErr(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') verify(input); }} placeholder="Passcode" />
          {err && <div className="st2-err">{err}</div>}
          <button className="st2-btn" disabled={busy || !input} onClick={() => verify(input)}>{busy ? 'Checking…' : 'Enter'}</button>
        </div>
      </div>
    );
  }
  return <Dashboard pass={pass} data={data} reload={() => loadData(pass)} onLogout={logout} />;
}

function Dashboard({ pass, data, reload, onLogout }) {
  const [view, setView] = useState('schedule');
  const [now, setNow] = useState(Date.now());
  // schedule + registration are stored locally for now
  const [stages, setStages] = useState(() => {
    try { const r = localStorage.getItem('nkma_stages_v1'); if (r) return JSON.parse(r); } catch {} return SEED_STAGES();
  });
  const [regAt, setRegAt] = useState(() => localStorage.getItem('nkma_reg_v1') || toLocalInput(Date.now() + 12 * 3600000));

  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { try { localStorage.setItem('nkma_stages_v1', JSON.stringify(stages)); } catch {} }, [stages]);
  useEffect(() => { try { localStorage.setItem('nkma_reg_v1', regAt); } catch {} }, [regAt]);

  const teams = data?.teams || [];
  const poll = data?.poll || { yes: 0, no: 0, total: 0, yesTeams: [] };
  const maxTeams = data?.slotLimit || 35;
  const options = data?.options || [];
  const doneCount = stages.filter((s) => s.status === 'done').length;
  const totalItems = options.length;

  const nav = [
    { key: 'schedule', label: 'Schedule', badge: doneCount + '/' + stages.length },
    { key: 'teams', label: 'Teams', badge: teams.length + '/' + maxTeams },
    { key: 'poll', label: 'Extension', badge: poll.yes + '/' + poll.total },
    { key: 'categories', label: 'Roulette', badge: '' + totalItems },
  ];

  return (
    <div className="st2-shell">
      <aside className="st2-side">
        <div className="st2-brand"><div className="st2-logo">N</div><div className="st2-brandtxt">NKMA <span>STAFF</span></div></div>
        <div className="st2-cp">CONTROL PANEL</div>
        <nav className="st2-nav">
          {nav.map((n) => (
            <button key={n.key} className={'st2-navbtn' + (view === n.key ? ' active' : '')} onClick={() => setView(n.key)}>
              <span>{n.label}</span><span className="st2-badge">{n.badge}</span>
            </button>
          ))}
        </nav>
        <div className="st2-side-foot"><button className="st2-logout" onClick={onLogout}>Log out</button></div>
      </aside>

      <main className="st2-main">
        <div className="st2-page">
          {view === 'schedule' && <ScheduleView stages={stages} setStages={setStages} regAt={regAt} setRegAt={setRegAt} now={now} />}
          {view === 'teams' && <TeamsView teams={teams} maxTeams={maxTeams} />}
          {view === 'poll' && <PollView poll={poll} />}
          {view === 'categories' && <RouletteView pass={pass} options={options} reload={reload} />}
        </div>
      </main>
    </div>
  );
}

/* ============ SCHEDULE ============ */
function ScheduleView({ stages, setStages, regAt, setRegAt, now }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [savedKey, setSavedKey] = useState(null);
  const flashRef = useRef(null);

  function flash(k) { setSavedKey(k); clearTimeout(flashRef.current); flashRef.current = setTimeout(() => setSavedKey(null), 1800); }
  function startEdit(s) { setEditingId(s.id); setDraft({ ...s }); }
  function saveEdit() { setStages((arr) => arr.map((x) => x.id === draft.id ? { ...draft } : x)); const id = draft.id; setEditingId(null); setDraft(null); flash(id); }

  // active stage logic (mirrors the design)
  let active = null, mode = 'start';
  const live = stages.find((s) => s.status === 'live');
  if (live) { active = live; mode = 'end'; }
  else {
    const fut = stages.filter((s) => s.status !== 'done').map((s) => ({ s, t: parseT(s.start) })).filter((x) => x.t && x.t > now).sort((a, b) => a.t - b.t);
    if (fut.length) { active = fut[0].s; mode = 'start'; }
    else { const rem = stages.filter((s) => s.status !== 'done'); if (rem.length) active = rem[0]; }
  }
  const allDone = stages.every((s) => s.status === 'done');
  const target = active ? (mode === 'end' ? parseT(active.end) : parseT(active.start)) : null;
  const showDigits = !!(active && target && !allDone);
  const cd = parts(showDigits ? target - now : 0);
  let cdLabel = '—';
  if (allDone) cdLabel = 'ALL STAGES COMPLETE'; else if (!active) cdLabel = 'NO ACTIVE STAGE';
  else if (!target) cdLabel = (mode === 'end' ? 'NO END TIME SET' : 'NO START TIME SET');
  else cdLabel = (mode === 'end' ? 'TIME REMAINING' : 'STARTS IN');
  const idx = active ? stages.indexOf(active) : -1;
  const aviz = statusViz(active ? active.status : 'locked');
  let pct = 0;
  if (active && mode === 'end') { const st = parseT(active.start), en = parseT(active.end); if (st && en && en > st) pct = Math.min(100, Math.max(0, (now - st) / (en - st) * 100)); }
  const upNext = stages.filter((s) => (!active || s.id !== active.id) && s.status !== 'done').map((s) => ({ s, t: parseT(s.start) })).filter((x) => x.t && x.t > now).sort((a, b) => a.t - b.t)[0]?.s;

  const regMs = parseT(regAt);
  const regOpen = !regMs || regMs <= now;
  const rp = parts(regMs ? regMs - now : 0);

  return (
    <div>
      <div className="st2-head"><h1>Schedule</h1><p>Stage timeline and the registration window — countdown tracks the active stage.</p></div>

      {/* hero countdown */}
      <section className="st2-hero">
        <div className="st2-hero-row">
          <div className="st2-hero-left">
            <div className="st2-mono-label">CURRENT STAGE</div>
            <div className="st2-hero-name">{active ? active.name : (allDone ? 'All stages complete' : 'No active stage')}</div>
            <div className="st2-hero-meta">
              <span className="st2-pill" style={{ color: aviz.color, background: aviz.bg, borderColor: aviz.border }}>
                <span className="st2-dot" style={{ background: aviz.color, animation: active && active.status === 'live' ? 'nkpulse 1.4s infinite' : 'none' }}></span>{active ? aviz.label : '—'}
              </span>
              {active && <span className="st2-muted">{'Stage ' + (idx + 1) + ' of ' + stages.length}</span>}
            </div>
            {upNext && <div className="st2-upnext"><span>UP NEXT</span><i></i><b>{upNext.name}</b></div>}
          </div>
          <div className="st2-hero-right">
            <div className="st2-cd-label">{cdLabel}</div>
            {showDigits ? (
              <div>
                <div className="st2-digits">
                  {[['DAYS', cd.days], ['HRS', cd.hours], ['MIN', cd.mins], ['SEC', cd.secs]].map(([k, v], i) => (
                    <div className="st2-digit-col" key={k}><div className={'st2-digit' + (i === 3 ? ' hot' : '')}>{v}</div><div className="st2-digit-k">{k}</div></div>
                  ))}
                </div>
                <div className="st2-cd-target">{fmt(target)}</div>
              </div>
            ) : <div className="st2-cd-empty">--:--:--</div>}
          </div>
        </div>
        <div className="st2-prog"><div className="st2-prog-fill" style={{ width: pct + '%' }}></div></div>
      </section>

      {/* timeline bar */}
      <div className="st2-section-label">TOURNAMENT TIMELINE</div>
      <section className="st2-card st2-tlbar">
        {stages.map((s, i) => {
          const act = active && active.id === s.id;
          const trackBg = s.status === 'done' ? '#ec4257' : (s.status === 'live' ? '#45d182' : 'rgba(255,255,255,0.08)');
          const sStart = parseT(s.start), sEnd = parseT(s.end);
          let hint = '', hc = '#8c8082';
          if (s.status === 'done') hint = 'Completed';
          else if (s.status === 'live') { hint = sEnd ? ('Ends ' + relTime(sEnd, now)) : 'Live now'; hc = '#45d182'; }
          else { hint = sStart ? ('Starts ' + relTime(sStart, now)) : 'No start time'; hc = '#e0a23c'; }
          return (
            <div className="st2-tlcol" key={s.id}>
              <div className="st2-track" style={{ background: trackBg, animation: s.status === 'live' ? 'nkpulse 1.4s infinite' : 'none' }}></div>
              <div className="st2-tlname"><span className="st2-tlnum">{pad(i + 1)}</span><span style={{ color: act ? '#f5efef' : (s.status === 'locked' ? '#8c8082' : '#c8bdbf') }}>{s.name}</span></div>
              <div className="st2-tlhint" style={{ color: hc }}>{hint}</div>
            </div>
          );
        })}
      </section>

      {/* stage setup cards */}
      <div className="st2-section-label">STAGE SETUP</div>
      <div className="st2-stage-grid">
        {stages.map((s, i) => {
          const editing = editingId === s.id;
          const act = active && active.id === s.id;
          const v = statusViz(s.status);
          const sStart = parseT(s.start), sEnd = parseT(s.end);
          if (editing) {
            return (
              <div className="st2-stage editing" key={s.id}>
                <div className="st2-edit-top">
                  <div className="st2-stage-num" style={{ color: '#ec4257' }}>{pad(i + 1)}</div>
                  <input className="st2-edit-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Stage name" />
                  <select className="st2-select" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}>
                    <option value="locked">Locked</option><option value="live">Live</option><option value="done">Done</option>
                  </select>
                </div>
                <div className="st2-edit-dates">
                  <div><div className="st2-mini-label">Start</div><input type="datetime-local" className="st2-dt" defaultValue={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} /></div>
                  <div><div className="st2-mini-label">End</div><input type="datetime-local" className="st2-dt" defaultValue={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} /></div>
                </div>
                <input className="st2-dt full" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="Short note / description (optional)" />
                <div className="st2-edit-actions">
                  <button className="st2-ghost" onClick={() => { setEditingId(null); setDraft(null); }}>Cancel</button>
                  <button className="st2-save" onClick={saveEdit}>Save</button>
                </div>
              </div>
            );
          }
          return (
            <div className={'st2-stage' + (act ? ' active' : '')} key={s.id}>
              <div className="st2-stage-top">
                <div className="st2-stage-num" style={{ color: act ? '#ec4257' : '#574c4e' }}>{pad(i + 1)}</div>
                <div className="st2-stage-info">
                  <div className="st2-stage-name">{s.name}</div>
                  <div className="st2-stage-meta">
                    <span className="st2-pill" style={{ color: v.color, background: v.bg, borderColor: v.border }}>
                      <span className="st2-dot" style={{ background: v.color, animation: s.status === 'live' ? 'nkpulse 1.4s infinite' : 'none' }}></span>{v.label}
                    </span>
                  </div>
                </div>
                <button className={'st2-edit-btn' + (savedKey === s.id ? ' saved' : '')} onClick={() => startEdit(s)}>{savedKey === s.id ? 'Saved' : 'Edit'}</button>
              </div>
              <div className="st2-stage-dates">
                <div className="st2-date-box"><div className="st2-mini-label">Start</div><div className="st2-date-val">{sStart ? fmt(sStart) : 'Not set'}</div></div>
                <div className="st2-date-box"><div className="st2-mini-label">End</div><div className="st2-date-val">{sEnd ? fmt(sEnd) : 'Not set'}</div></div>
              </div>
              {s.desc && s.desc.trim() && <div className="st2-stage-desc">{s.desc}</div>}
            </div>
          );
        })}
      </div>

      {/* registration window */}
      <div className="st2-section-label">REGISTRATION WINDOW</div>
      <section className="st2-card st2-reg">
        <div className="st2-reg-left">
          <div className="st2-reg-title">Registration opens</div>
          <p className="st2-reg-sub">Set when teams can start signing up.</p>
          <div className="st2-reg-row">
            <input type="datetime-local" className="st2-dt" defaultValue={regAt} onChange={(e) => setRegAt(e.target.value)} />
            <button className={'st2-regsave' + (savedKey === 'reg' ? ' saved' : '')} onClick={() => flash('reg')}>{savedKey === 'reg' ? 'Saved' : 'Save'}</button>
          </div>
        </div>
        <div className="st2-reg-right">
          {regOpen ? (
            <div className="st2-reg-open"><span className="st2-dot" style={{ background: '#45d182', animation: 'nkpulse 1.4s infinite' }}></span>REGISTRATION OPEN</div>
          ) : (
            <div className="st2-reg-cd">
              <div className="st2-reg-cd-label">OPENS IN</div>
              <div className="st2-digits sm">
                {[['DAYS', rp.days], ['HRS', rp.hours], ['MIN', rp.mins], ['SEC', rp.secs]].map(([k, val], i) => (
                  <div className="st2-digit-col" key={k}><div className={'st2-digit sm' + (i === 3 ? ' hot' : '')}>{val}</div><div className="st2-digit-k">{k}</div></div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/* ============ TEAMS ============ */
function TeamsView({ teams, maxTeams }) {
  const totalMembers = teams.reduce((a, t) => a + (Number(t.count) || (t.members ? t.members.split('\n').length : 0)), 0);
  const fillPct = maxTeams > 0 ? Math.round(teams.length / maxTeams * 100) : 0;
  const slotsLeft = Math.max(0, maxTeams - teams.length);
  const avg = teams.length > 0 ? (totalMembers / teams.length).toFixed(1) : '0.0';
  return (
    <div>
      <div className="st2-head"><h1>Registered Teams <span className="st2-h1count">{teams.length}</span><span className="st2-h1max"> / {maxTeams}</span></h1><p>Roster of signed-up teams and their members.</p></div>
      <div className="st2-stat-grid">
        <div className="st2-stat hot"><div className="st2-stat-k">REGISTERED</div><div className="st2-stat-n red">{teams.length}<span> / {maxTeams}</span></div><div className="st2-stat-bar"><div className="st2-stat-fill" style={{ width: fillPct + '%' }}></div></div></div>
        <div className="st2-stat"><div className="st2-stat-k">SLOTS LEFT</div><div className="st2-stat-n">{slotsLeft}</div><div className="st2-stat-sub">open spots remaining</div></div>
        <div className="st2-stat"><div className="st2-stat-k">TOTAL MEMBERS</div><div className="st2-stat-n">{totalMembers}</div><div className="st2-stat-sub">{avg} avg per team</div></div>
        <div className="st2-stat"><div className="st2-stat-k">FILL RATE</div><div className="st2-stat-n green">{fillPct}<span>%</span></div><div className="st2-stat-sub">of bracket filled</div></div>
      </div>
      <section className="st2-card st2-table">
        <div className="st2-tr st2-th"><div>#</div><div>TEAM</div><div>LEADER</div><div>MEMBERS</div></div>
        {teams.length === 0 ? <div className="st2-empty">No registrations yet.</div> : teams.map((t, i) => (
          <div className="st2-tr" key={i}>
            <div className="st2-tnum">{pad(i + 1)}</div>
            <div className="st2-tname">{t.team}</div>
            <div className="st2-tleader">{t.leader}</div>
            <div className="st2-tmembers">{String(t.members || '').split('\n').map((m, j) => <div key={j}>{m}</div>)}</div>
          </div>
        ))}
      </section>
    </div>
  );
}

/* ============ POLL / EXTENSION ============ */
function PollView({ poll }) {
  const yes = poll.yes, no = poll.no, total = poll.total;
  const pct = total > 0 ? Math.round(yes / total * 100) : 0;
  const yesTeams = poll.yesTeams || [];
  return (
    <div>
      <div className="st2-head"><h1>Extension</h1><p>Where teams stand on opening up more slots.</p></div>
      <section className="st2-card" style={{ padding: '26px', marginBottom: '22px' }}>
        <div className="st2-stat-grid">
          <div className="st2-pollstat green"><div className="st2-pollnum green">{yes}</div><div className="st2-stat-k">VOTED YES</div></div>
          <div className="st2-pollstat"><div className="st2-pollnum red">{no}</div><div className="st2-stat-k">VOTED NO</div></div>
          <div className="st2-pollstat"><div className="st2-pollnum">{total}</div><div className="st2-stat-k">TOTAL VOTES</div></div>
          <div className="st2-pollstat"><div className="st2-pollnum green">{pct}<span>%</span></div><div className="st2-stat-k">IN FAVOR</div></div>
        </div>
        <div className="st2-pollbar"><div className="st2-pollbar-fill" style={{ width: pct + '%' }}></div></div>
        <div className="st2-muted" style={{ marginTop: 10 }}>{pct}% of votes are in favor of more slots</div>
      </section>
      <section className="st2-card st2-table">
        <div className="st2-yeshead"><div className="st2-mono-label">TEAMS WHO VOTED YES</div><div className="st2-yeschip">{yes} TEAMS</div></div>
        {yesTeams.length === 0 ? <div className="st2-empty">No teams have voted yes yet.</div> : yesTeams.map((n, i) => (
          <div className="st2-yesrow" key={i}><span className="st2-tnum">{pad(i + 1)}</span><span className="st2-yesname">{n}</span><span className="st2-yestag"><span className="st2-dot" style={{ background: '#45d182' }}></span>YES</span></div>
        ))}
      </section>
    </div>
  );
}

/* ============ ROULETTE / CATEGORIES ============ */
function RouletteView({ pass, options, reload }) {
  // derive categories from option rows (Category -> [options])
  const cats = [];
  const byCat = {};
  options.forEach((o) => { if (!byCat[o.category]) { byCat[o.category] = []; cats.push(o.category); } byCat[o.category].push(o); });
  const [active, setActive] = useState(cats[0] || null);
  const [newCat, setNewCat] = useState('');
  const [newItem, setNewItem] = useState('');
  const [search, setSearch] = useState('');

  const activeCat = active && byCat[active] ? active : (cats[0] || null);
  const items = activeCat ? byCat[activeCat] : [];
  const q = search.trim().toLowerCase();
  const shownCats = q ? cats.filter((c) => c.toLowerCase().includes(q)) : cats;

  async function addOption(category, label) {
    await fetch('/api/staff/roulette/option', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass }, body: JSON.stringify({ category, label }) });
    reload();
  }
  async function removeOption(id) {
    await fetch('/api/staff/roulette/option/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass }, body: JSON.stringify({ id }) });
    reload();
  }
  // a category exists only via its options; "adding a category" seeds a placeholder option
  function addCategory() {
    const c = newCat.trim(); if (!c) return;
    addOption(c, 'Option 1'); setActive(c); setNewCat('');
  }
  function addItem() { const v = newItem.trim(); if (!v || !activeCat) return; addOption(activeCat, v); setNewItem(''); }
  async function removeCategory(c) {
    for (const o of byCat[c]) { await fetch('/api/staff/roulette/option/delete', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass }, body: JSON.stringify({ id: o.id }) }); }
    reload();
  }

  return (
    <div>
      <div className="st2-head"><h1>Roulette</h1><p>Build the categories and the option list inside each. Add a category, then add its options.</p></div>
      <div className="st2-roulette">
        {/* left: categories */}
        <div className="st2-catpane">
          <div className="st2-catpane-head"><div className="st2-mono-label">CATEGORIES</div><div className="st2-tlnum">{cats.length}</div></div>
          <div className="st2-catadd">
            <input className="st2-input2" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addCategory(); }} placeholder="New category…" />
            <button className="st2-plus" onClick={addCategory}>+</button>
          </div>
          {cats.length > 6 && <input className="st2-input2 search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search categories…" />}
          <div className="st2-catlist">
            {shownCats.length === 0 ? <div className="st2-empty sm">No categories match.</div> : shownCats.map((c) => {
              const a = c === activeCat;
              return (
                <div className={'st2-catrow' + (a ? ' active' : '')} key={c}>
                  <button className="st2-catbtn" onClick={() => setActive(c)}><span className="st2-catname">{c}</span><span className="st2-catcount">{byCat[c].length}</span></button>
                  <button className="st2-catx" onClick={() => removeCategory(c)}>×</button>
                </div>
              );
            })}
          </div>
        </div>
        {/* right: options */}
        {!activeCat ? (
          <div className="st2-noopts">No categories yet — add one on the left to start building its option list.</div>
        ) : (
          <section className="st2-optpane">
            <div className="st2-optpane-head"><div className="st2-optcat">{activeCat}</div><div className="st2-mono-label">{items.length} OPTIONS</div></div>
            <div className="st2-optadd">
              <input className="st2-input2 big" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addItem(); }} placeholder="Add an option…" />
              <button className="st2-addbtn" onClick={addItem}>Add</button>
            </div>
            {items.length === 1 && <div className="st2-warn">⚠ Add at least 2 options to this category.</div>}
            {items.length === 0 ? <div className="st2-empty">No options yet — add the first one above.</div> : (
              <div className="st2-optlist">
                {items.map((o, i) => (
                  <div className="st2-optrow" key={o.id}><span className="st2-tnum">{pad(i + 1)}</span><span className="st2-opttxt">{o.label}</span><button className="st2-optx" onClick={() => removeOption(o.id)}>×</button></div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

export default StaffApp;
