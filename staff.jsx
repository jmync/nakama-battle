import React, { useState, useEffect, useRef } from 'react';

const CATEGORIES = ['Language', 'Artist / Producer', 'Genre', 'Matchup', 'Theme'];

function StaffApp() {
  const [pass, setPass] = useState(sessionStorage.getItem('nkma_staff') || '');
  const [authed, setAuthed] = useState(false);
  const [input, setInput] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  // try existing stored pass on mount
  useEffect(() => {
    if (pass) verify(pass, true);
    // eslint-disable-next-line
  }, []);

  async function verify(code, silent) {
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/staff/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: code }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Wrong passcode.');
      sessionStorage.setItem('nkma_staff', code);
      setPass(code); setAuthed(true);
      loadData(code);
    } catch (e) {
      if (!silent) setErr(e.message || 'Wrong passcode.');
      sessionStorage.removeItem('nkma_staff');
      setPass('');
    } finally { setBusy(false); }
  }

  async function loadData(code) {
    try {
      const r = await fetch('/api/staff/data', { headers: { 'x-staff-pass': code } });
      const d = await r.json();
      if (d.ok) setData(d);
    } catch { /* ignore */ }
  }

  function logout() {
    sessionStorage.removeItem('nkma_staff');
    setAuthed(false); setPass(''); setData(null); setInput('');
  }

  if (!authed) {
    return (
      <div className="staff-gate">
        <div className="staff-gate-box">
          <div className="staff-lock">🔒</div>
          <div className="staff-gate-title">STAFF ACCESS</div>
          <div className="staff-gate-sub">Enter the passcode to continue.</div>
          <input
            className="staff-input" type="password" value={input} autoFocus
            onChange={(e) => { setInput(e.target.value); setErr(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') verify(input); }}
            placeholder="Passcode"
          />
          {err && <div className="staff-err">{err}</div>}
          <button className="staff-btn" disabled={busy || !input} onClick={() => verify(input)}>
            {busy ? 'Checking…' : 'Enter'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-wrap">
      <header className="staff-top">
        <div className="staff-brand">NKMA <span>STAFF</span></div>
        <button className="staff-logout" onClick={logout}>Log out</button>
      </header>

      {!data ? (
        <div className="staff-loading">Loading…</div>
      ) : (
        <div className="staff-grid">
          <TeamsPanel data={data} />
          <PollPanel data={data} />
          <RoulettePanel pass={pass} data={data} reload={() => loadData(pass)} />
        </div>
      )}
    </div>
  );
}

function TeamsPanel({ data }) {
  return (
    <section className="staff-card staff-wide">
      <h2>Registered Teams <span className="staff-count">{data.teams.length} / {data.slotLimit}</span></h2>
      {data.teams.length === 0 ? (
        <p className="staff-empty">No registrations yet.</p>
      ) : (
        <div className="staff-table-wrap">
          <table className="staff-table">
            <thead><tr><th>#</th><th>Team</th><th>Leader</th><th>Members</th></tr></thead>
            <tbody>
              {data.teams.map((t, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td><b>{t.team}</b></td>
                  <td>{t.leader}</td>
                  <td className="staff-members">{t.members}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function PollPanel({ data }) {
  const { yes, no, total, yesTeams } = data.poll;
  const pct = total ? Math.round((yes / total) * 100) : 0;
  return (
    <section className="staff-card">
      <h2>Extend-Slots Poll</h2>
      <div className="staff-poll-nums">
        <div className="staff-stat yes"><div className="n">{yes}</div><div className="k">Yes</div></div>
        <div className="staff-stat no"><div className="n">{no}</div><div className="k">No</div></div>
        <div className="staff-stat"><div className="n">{total}</div><div className="k">Total</div></div>
      </div>
      <div className="staff-bar"><div className="staff-bar-fill" style={{ width: pct + '%' }}></div></div>
      <div className="staff-bar-label">{pct}% want more slots</div>
      {yesTeams.length > 0 && (
        <div className="staff-yes-teams">
          <div className="staff-sub">Teams who voted Yes:</div>
          <div className="staff-chips">{yesTeams.map((t, i) => <span key={i} className="staff-chip">{t}</span>)}</div>
        </div>
      )}
    </section>
  );
}

function RoulettePanel({ pass, data, reload }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [label, setLabel] = useState('');
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const [highlight, setHighlight] = useState(-1);
  const spinRef = useRef(null);

  const opts = data.options.filter((o) => o.category === category);

  async function addOption() {
    if (!label.trim()) return;
    await fetch('/api/staff/roulette/option', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass },
      body: JSON.stringify({ category, label: label.trim() }),
    });
    setLabel(''); reload();
  }
  async function removeOption(id) {
    await fetch('/api/staff/roulette/option/delete', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass },
      body: JSON.stringify({ id }),
    });
    reload();
  }

  function spin() {
    if (spinning || opts.length < 2) return;
    setSpinning(true); setWinner(null);
    const finalIdx = Math.floor(Math.random() * opts.length);
    let ticks = 0;
    const totalTicks = 22 + finalIdx + opts.length * 3;
    let delay = 60;
    const step = () => {
      setHighlight((h) => (h + 1) % opts.length);
      ticks++;
      if (ticks >= totalTicks) {
        setHighlight(finalIdx);
        const w = opts[finalIdx];
        setWinner(w);
        setSpinning(false);
        // save result
        fetch('/api/staff/roulette/result', {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'x-staff-pass': pass },
          body: JSON.stringify({ category, result: w.label }),
        }).then(reload);
        return;
      }
      if (ticks > totalTicks - 6) delay += 55; // ease out near the end
      spinRef.current = setTimeout(step, delay);
    };
    step();
  }
  useEffect(() => () => clearTimeout(spinRef.current), []);

  return (
    <section className="staff-card staff-wide">
      <h2>Roulette</h2>
      <div className="staff-cat-row">
        {CATEGORIES.map((c) => (
          <button key={c} className={'staff-cat' + (c === category ? ' active' : '')}
            onClick={() => { setCategory(c); setWinner(null); setHighlight(-1); }}>{c}</button>
        ))}
      </div>

      <div className="staff-add-row">
        <input className="staff-input sm" value={label} placeholder={'Add a ' + category.toLowerCase() + ' option'}
          onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addOption(); }} />
        <button className="staff-btn sm" onClick={addOption} disabled={!label.trim()}>Add</button>
      </div>

      <div className="staff-wheel">
        {opts.length === 0 ? (
          <p className="staff-empty">Add at least 2 options to spin.</p>
        ) : (
          <div className="staff-options">
            {opts.map((o, i) => (
              <div key={o.id} className={'staff-opt' + (i === highlight ? ' lit' : '') + (winner && winner.id === o.id ? ' won' : '')}>
                <span>{o.label}</span>
                <button className="staff-opt-x" onClick={() => removeOption(o.id)} disabled={spinning}>×</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="staff-spin-row">
        <button className="staff-btn spin" onClick={spin} disabled={spinning || opts.length < 2}>
          {spinning ? 'Spinning…' : 'SPIN'}
        </button>
        {winner && !spinning && <div className="staff-winner">→ <b>{winner.label}</b></div>}
      </div>

      {data.results.length > 0 && (
        <div className="staff-results">
          <div className="staff-sub">Recent spins</div>
          {data.results.map((r, i) => (
            <div key={i} className="staff-result-row"><span className="staff-result-cat">{r.category}</span> {r.result}</div>
          ))}
        </div>
      )}
    </section>
  );
}

export default StaffApp;
