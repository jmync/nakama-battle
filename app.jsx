import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

/* ---------- BRACKET (4 groups) ---------- */
const GROUP_COLOR = { A: '#ff4d6d', B: '#ffffff', C: '#ff2d2d', D: '#b23bff' };
const BK_COLS = [
  { label: 'GROUP CLASH', ids: ['A1', 'A2', 'B1', 'B2'] },
  { label: 'SHOWDOWN', ids: ['GFA', 'GFB'] },
  { label: 'SEMI-FINAL', ids: ['SF1'] },
  { label: 'FINALS', ids: ['F'] },
  { label: 'SEMI-FINAL', ids: ['SF2'] },
  { label: 'SHOWDOWN', ids: ['GFC', 'GFD'] },
  { label: 'GROUP CLASH', ids: ['C1', 'C2', 'D1', 'D2'] },
];
const BK = {
  A1: { g: 'A', title: 'A · Match 1' }, A2: { g: 'A', title: 'A · Match 2' },
  B1: { g: 'B', title: 'B · Match 1' }, B2: { g: 'B', title: 'B · Match 2' },
  C1: { g: 'C', title: 'C · Match 1' }, C2: { g: 'C', title: 'C · Match 2' },
  D1: { g: 'D', title: 'D · Match 1' }, D2: { g: 'D', title: 'D · Match 2' },
  GFA: { g: 'A', title: 'Group A Decider', feeders: ['A1', 'A2'] },
  GFB: { g: 'B', title: 'Group B Decider', feeders: ['B1', 'B2'] },
  GFC: { g: 'C', title: 'Group C Decider', feeders: ['C1', 'C2'] },
  GFD: { g: 'D', title: 'Group D Decider', feeders: ['D1', 'D2'] },
  SF1: { title: 'Semi-Final 1', feeders: ['GFA', 'GFB'], hot: true },
  SF2: { title: 'Semi-Final 2', feeders: ['GFC', 'GFD'], hot: true },
  F: { title: 'Finals', feeders: ['SF1', 'SF2'], fin: true },
};

function Bracket() {
  const innerRef = useRef(null);
  const refs = useRef({});
  const [paths, setPaths] = useState([]);
  const [dim, setDim] = useState({ w: 0, h: 0 });

  function compute() {
    const inner = innerRef.current;
    if (!inner) return;
    const ir = inner.getBoundingClientRect();
    const lines = [];
    Object.entries(BK).forEach(([id, m]) => {
      if (!m.feeders) return;
      const tgt = refs.current[id];
      if (!tgt) return;
      const tr = tgt.getBoundingClientRect();
      const tcx = tr.left + tr.width / 2;
      const y2 = tr.top - ir.top + tr.height / 2;
      m.feeders.forEach((fid) => {
        const f = refs.current[fid];
        if (!f) return;
        const fr = f.getBoundingClientRect();
        const fcx = fr.left + fr.width / 2;
        let x1, x2;
        if (fcx < tcx) { x1 = fr.right - ir.left; x2 = tr.left - ir.left; }
        else { x1 = fr.left - ir.left; x2 = tr.right - ir.left; }
        const y1 = fr.top - ir.top + fr.height / 2;
        const midX = (x1 + x2) / 2;
        lines.push({ d: `M${x1} ${y1} H${midX} V${y2} H${x2}`, c: GROUP_COLOR[m.g || BK[fid].g] || '#5a4f86' });
      });
    });
    setDim({ w: inner.scrollWidth, h: inner.scrollHeight });
    setPaths(lines);
  }

  useLayoutEffect(() => {
    compute();
    const ro = new ResizeObserver(() => compute());
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener('resize', compute);
    const t1 = setTimeout(compute, 250);
    const t2 = setTimeout(compute, 700);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="card fmt-wide">
      <span className="tag">Tournament Bracket · Head-to-Head</span>
      <h3 style={{ marginBottom: 4 }}>Group Clash <span style={{ margin: '0 8px' }}>→</span> Showdown <span style={{ margin: '0 8px' }}>→</span> Semi-Finals <span style={{ margin: '0 8px' }}>→</span> Finals</h3>
      <p>Before the battle begins, all teams are drawn into Groups A–D via a live roulette. Group winners then climb the ladder to the Finals.</p>
      <div className="bk-legend">
        {['A', 'B', 'C', 'D'].map((g) => (
          <span className="lg" key={g}><i style={{ background: GROUP_COLOR[g] }}></i>Group {g}</span>
        ))}
      </div>
      <div className="bk-scroll">
        <div className="bk-inner" ref={innerRef}>
          <svg className="bk-svg" width={dim.w} height={dim.h}>
            {paths.map((p, i) => (
              <path key={i} d={p.d} fill="none" stroke={p.c} strokeOpacity="0.5" strokeWidth="2" strokeLinejoin="round" />
            ))}
          </svg>
          {BK_COLS.map((r, ci) => (
            <div className="bk-col" key={ci}>
              <div className="bk-rlabel">{r.label}</div>
              <div className="bk-matches">
                {r.ids.map((id) => {
                  const m = BK[id];
                  return (
                    <div className={'bk-match' + (m.fin ? ' fin' : '') + (m.hot ? ' hot' : '')} key={id} ref={(el) => (refs.current[id] = el)}>
                      <div className="bk-mtitle" style={{ color: m.g ? GROUP_COLOR[m.g] : undefined }}>{m.title}</div>
                      <div className="bk-team"><span>TBD</span><b>0%</b></div>
                      <div className="bk-vs">VS</div>
                      <div className="bk-team"><span>TBD</span><b>0%</b></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bk-update">We'll keep this bracket updated as the battle unfolds.</div>
    </div>
  );
}

/* ---------- shared bits ---------- */
function SecHead({ idx, title, wide }) {
  return (
    <div className={'sec-head' + (wide ? ' fmt-wide' : '')}>
      <span className="idx">{idx}</span>
      <h2>{title}</h2>
      <span className="accent"></span>
    </div>
  );
}

/* ---------- MECHANICS ---------- */
function Mechanics() {
  return (
    <div className="panel">
      <SecHead idx="01" title="Mechanics" />
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card outline">
          <span className="tag">Format</span>
          <h3>Chorus Battle</h3>
          <p>Three to four voices, one stage. Recorded inside <strong>Smule</strong>.</p>
        </div>
        <div className="card outline">
          <span className="tag">Song length</span>
          <div className="big">TV-SIZE</div>
          <p style={{ marginTop: 8 }}>Short (TV-size) version through the <strong>Showdown</strong>. Sing the verses and pre-choruses, then end after the <strong>first chorus</strong>. The <strong>Semi-Finals &amp; Finals</strong> are sung <strong>full version</strong>.</p>
        </div>
        <div className="card outline">
          <span className="tag">Song picks</span>
          <h3>Roulette System</h3>
          <p>Roulette runs the show. Spins decide your <strong>artist</strong>, <strong>genre</strong>, <strong>songs</strong>, and <strong>matchups</strong> across the stages.</p>
        </div>
      </div>

      <div className="grid two">
        <div className="card">
          <span className="tag">How songs drop</span>
          <h3>Announced via Discord</h3>
          <p>All song assignments are announced through our <strong>Discord</strong>. Keep an eye on it so you never miss your match-up.</p>
        </div>
        <div className="card">
          <span className="tag">Creative freedom</span>
          <h3>Remix? Go ahead.</h3>
          <p>Reinterpret, rearrange, restyle. Remixes are welcome and you're free to adjust the key to fit your team's range.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- RULES ---------- */
function Rules() {
  const dos = [
    ['One team only', 'A contestant may join only ONE team.'],
    ['Record in Smule', 'All entries must be recorded within Smule.'],
    ['Tag your entry', 'Every entry must include #NKMACB1 in the description.'],
    ['Songbook format', 'Title your entry exactly like this: 【#NKMACB1】song_name 【team_name】.'],
    ['Finalists on record', 'Finalist entries get an empty track from our official account, so they stay saved on our Smule profile as the permanent record of the Act 1 finalists.'],
    ['Finalists cover photo', 'Finalists use the custom graphic we provide as their entry’s cover photo.'],
  ];
  const donts = [
    ['No late entries', 'Late entries will not be accepted under any circumstances.'],
    ['No outside vocals', 'Pre-recorded or externally edited vocals are not allowed.'],
    ['Short version (through Showdown)', 'Through the Showdown, sing the TV-size version: verses and pre-choruses, ending after the first chorus. Full-length is not allowed until the Semi-Finals & Finals.'],
  ];
  const others = [
    'A watch party happens as results drop, so everyone watches together while the advancing teams are announced.',
    'From the Showdown stage onward, every team gets judges’ critiques and feedback, not just a score.',
    'Respect all participants.',
    "Let's keep it short, enjoyable, and stress-free.",
  ];
  return (
    <div className="panel">
      <SecHead idx="02" title="Rules" />
      <div className="grid two" style={{ marginBottom: 18 }}>
        <div className="card outline">
          <span className="tag" style={{ color: 'var(--blue-soft)' }}>Do</span>
          <ul className="list" style={{ marginTop: 14 }}>
            {dos.map(([a, b]) => (
              <li key={a}><span className="mk ok">✓</span><span><b>{a}</b><small>{b}</small></span></li>
            ))}
          </ul>
        </div>
        <div className="card outline">
          <span className="tag" style={{ color: 'var(--ember)' }}>Don't</span>
          <ul className="list" style={{ marginTop: 14 }}>
            {donts.map(([a, b]) => (
              <li key={a}><span className="mk no">✕</span><span><b>{a}</b><small>{b}</small></span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="banner" style={{ marginBottom: 22 }}>
        <span className="ic">
          <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="39" cy="37" r="15" fill="var(--ink)"></circle>
            <circle cx="81" cy="37" r="15" fill="var(--ink)"></circle>
            <path d="M60 29 C84 29 98 46 98 66 C98 88 82 100 60 100 C38 100 22 88 22 66 C22 46 36 29 60 29 Z" fill="var(--ink)"></path>
            <path d="M37 59 L56 64 A10.5 12 0 0 1 37 66 Z" fill="currentColor" stroke="none"></path>
            <path d="M83 59 L64 64 A10.5 12 0 0 0 83 66 Z" fill="currentColor" stroke="none"></path>
            <ellipse cx="60" cy="79" rx="5.5" ry="4" fill="currentColor" stroke="none"></ellipse>
            <path d="M60 83 q-4.5 4.5 -8 1.5 M60 83 q4.5 4.5 8 1.5" fill="none" stroke="currentColor" strokeWidth="2.4"></path>
          </svg>
        </span>
        <span>Any violation of the above rules will result in <b>disqualification</b>.</span>
      </div>

      <div className="card">
        <span className="tag">Good vibes / house notes</span>
        <ul className="list" style={{ marginTop: 14 }}>
          {others.map((o) => (
            <li key={o}><span className="mk dot">♪</span><span>{o}</span></li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- FORMAT ---------- */
function Format() {
  const stages = [
    ['STAGE 01', 'Qualifiers', 'A roulette picks the language: Japanese, Korean, or English. Pick any song in the language you land on. Only the top 16 advance to the bracket, so give it all you’ve got.'],
    ['STAGE 02', 'Group Clash', 'An artist or producer is spun via roulette for each group. Pick any song from the artist or producer you land on. Top 8 advance.'],
    ['STAGE 03', 'Showdown', 'Group winners go head-to-head. JP songs are picked by us, and matchups are assigned via roulette. Winners advance to the Semi-Finals.'],
    ['STAGE 04', 'Semi-Finals', 'A genre is spun via roulette, then head-to-head rivals pick a song within that genre for each other. Same genre for both, so every pick stays fair.'],
    ['STAGE 05', 'Finals', 'Theme: 7 Deadly Sins (#RRTB-inspired). Pick your own song for the theme. Full version, with a touch of mashup to unleash your creativity.'],
  ];
  return (
    <div className="panel">
      <SecHead idx="03" title="Event Format" wide />

      <div className="roadmap fmt-wide">
        {stages.map(([n, name, d], i) => (
          <div className={'stage' + (i === 4 ? ' final' : '')} key={n}>
            <div className="st-num">{n}</div>
            <div className="st-name">{name}</div>
            <div className="st-d">{d}</div>
          </div>
        ))}
      </div>

      <div className="fmt-wide" style={{ marginBottom: 22 }}>
        <div className="card outline" style={{ borderColor: 'var(--ember)' }}>
          <span className="tag" style={{ color: 'var(--ember)' }}>Finals · Theme</span>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <span className="fire-ic">
              <svg viewBox="0 0 120 120" fill="none">
                <path d="M60 8 C72 26 80 30 70 46 C65 53 53 53 49 45 C41 30 48 24 60 8 Z" fill="#ff5630"></path>
                <path d="M40 24 C47 35 50 40 43 50 C39 55 30 52 31 44 C32 35 34 30 40 24 Z" fill="#ff8a3c"></path>
                <path d="M80 24 C73 35 70 40 77 50 C81 55 90 52 89 44 C88 35 86 30 80 24 Z" fill="#ff8a3c"></path>
                <g stroke="#ff2d2d" strokeWidth="4.5" strokeLinejoin="round">
                  <circle cx="36" cy="58" r="13" fill="var(--ink)"></circle>
                  <circle cx="84" cy="58" r="13" fill="var(--ink)"></circle>
                  <path d="M60 50 C80 50 92 64 92 81 C92 100 78 110 60 110 C42 110 28 100 28 81 C28 64 40 50 60 50 Z" fill="var(--ink)"></path>
                </g>
                <path d="M40 76 L56 81 A9 10.5 0 0 1 40 83 Z" fill="#ff2d2d" stroke="none"></path>
                <path d="M80 76 L64 81 A9 10.5 0 0 0 80 83 Z" fill="#ff2d2d" stroke="none"></path>
                <ellipse cx="60" cy="94" rx="5" ry="3.6" fill="#ff2d2d" stroke="none"></ellipse>
                <path d="M60 98 q-4 4 -7 1.3 M60 98 q4 4 7 1.3" fill="none" stroke="#ff2d2d" strokeWidth="2.2" strokeLinecap="round"></path>
              </svg>
            </span>
            7 Deadly Sins
          </h3>
          <p>Both teams choose their own song based on the <strong>theme assigned to them</strong> via roulette. In the <strong>Finals</strong>, songs are sung full version. You'll also submit a short <strong>interpretation</strong> so we can see if you captured the theme.</p>
          <div className="sins">
            {['Pride', 'Greed', 'Lust', 'Envy', 'Gluttony', 'Wrath', 'Sloth'].map((s) => (
              <span className="sin" key={s}>
                <span className="sin-ic">
                  <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="39" cy="37" r="15" fill="var(--ink)"></circle>
                    <circle cx="81" cy="37" r="15" fill="var(--ink)"></circle>
                    <path d="M60 29 C84 29 98 46 98 66 C98 88 82 100 60 100 C38 100 22 88 22 66 C22 46 36 29 60 29 Z" fill="var(--ink)"></path>
                    <path d="M37 59 L56 64 A10.5 12 0 0 1 37 66 Z" fill="currentColor" stroke="none"></path>
                    <path d="M83 59 L64 64 A10.5 12 0 0 0 83 66 Z" fill="currentColor" stroke="none"></path>
                    <ellipse cx="60" cy="79" rx="5.5" ry="4" fill="currentColor" stroke="none"></ellipse>
                    <path d="M60 83 q-4.5 4.5 -8 1.5 M60 83 q4.5 4.5 8 1.5" fill="none" stroke="currentColor" strokeWidth="2.4"></path>
                  </svg>
                </span>
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      <Bracket />
    </div>
  );
}

/* ---------- JUDGING ---------- */
const JUDGES = [
  { name: 'Pikoyin', platform: 'YouTube', url: 'https://www.youtube.com/@Pikoyinn', img: '/judges/pikoyin.png', zoom: 1.45, pos: '50% 46%' },
  { name: 'Furiyachan', platform: 'Smule', url: 'https://www.smule.com/Furiyachan', img: '/judges/furiyachan.jpg' },
  { name: 'Noon', platform: 'X', url: 'https://x.com/noon0096_', img: '/judges/N00N.png', zoom: 2.4, pos: '33% 28%' },
  { pending: true },
];

function Judging() {
  const crit = [
    ['Vocal Blend, Timing & Tune', 40, 'var(--pink)'],
    ['Creativity / Battle Vibe', 30, 'var(--blue)'],
    ['Expression & Emotion', 20, 'var(--gold)'],
    ['Overall Impact', 10, 'var(--ember)'],
  ];
  const [show, setShow] = useState(false);
  useEffect(() => { const t = setTimeout(() => setShow(true), 120); return () => clearTimeout(t); }, []);
  return (
    <div className="panel">
      <SecHead idx="04" title="Judging · Vocals Only" />
      <div className="grid two">
        <div className="card outline">
          <span className="tag">Scorecard · 100 pts</span>
          <div className="crit" style={{ marginTop: 18 }}>
            {crit.map(([label, pts, c]) => (
              <div className="row" key={label}>
                <span className="label">{label}</span>
                <span className="pts">{pts}</span>
                <span className="bar"><i style={{ width: show ? pts + '%' : 0, background: c, boxShadow: `0 0 14px ${c}` }}></i></span>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <span className="tag">Who judges</span>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            Judged by our nakama
            <span className="panda-ic">
              <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="39" cy="37" r="15" fill="var(--ink)"></circle>
                <circle cx="81" cy="37" r="15" fill="var(--ink)"></circle>
                <path d="M60 29 C84 29 98 46 98 66 C98 88 82 100 60 100 C38 100 22 88 22 66 C22 46 36 29 60 29 Z" fill="var(--ink)"></path>
                <path d="M37 59 L56 64 A10.5 12 0 0 1 37 66 Z" fill="currentColor" stroke="none"></path>
                <path d="M83 59 L64 64 A10.5 12 0 0 0 83 66 Z" fill="currentColor" stroke="none"></path>
                <ellipse cx="60" cy="79" rx="5.5" ry="4" fill="currentColor" stroke="none"></ellipse>
                <path d="M60 83 q-4.5 4.5 -8 1.5 M60 83 q4.5 4.5 8 1.5" fill="none" stroke="currentColor" strokeWidth="2.4"></path>
              </svg>
            </span>
          </h3>
          <p>A mix of trusted singers and friends score every battle.</p>
        </div>
      </div>

      <h3 className="judges-title">Meet the Judges</h3>
      <div className="judges-grid">
        {JUDGES.map((j, i) => (
          j.pending ? (
            <div className="judge-card pending" key={i}>
              <div className="judge-ava"><span>?</span></div>
              <div className="judge-name">Pending</div>
              <div className="judge-link">To be revealed</div>
            </div>
          ) : (
            <a className="judge-card" href={j.url} target="_blank" rel="noopener" key={i}>
              <div className="judge-ava"><img src={j.img} alt={j.name} loading="lazy" onLoad={(e) => e.currentTarget.classList.add('loaded')} style={{ transform: j.zoom ? `scale(${j.zoom})` : undefined, transformOrigin: j.pos || 'center', objectPosition: j.pos || 'center' }} /></div>
              <div className="judge-name">{j.name}</div>
              <div className="judge-link">{j.platform} ↗</div>
            </a>
          )
        ))}
      </div>
    </div>
  );
}

/* ---------- VISIT COUNTER ---------- */
function VisitCounter() {
  const [count, setCount] = useState(null);
  useEffect(() => {
    let alive = true;
    fetch('https://abacus.jasoncameron.dev/hit/nkma-chorus-battle/visits')
      .then((r) => r.json())
      .then((d) => { if (alive && typeof d.value === 'number') setCount(d.value); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  if (count === null) return null;
  return (
    <div className="visits">
      <svg className="visits-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M1.5 12 C4 6.5 8 4 12 4 C16 4 20 6.5 22.5 12 C20 17.5 16 20 12 20 C8 20 4 17.5 1.5 12 Z"></path>
        <circle cx="12" cy="12" r="3.2"></circle>
      </svg>
      <span className="visits-n">{count.toLocaleString()}</span>
    </div>
  );
}

/* ---------- PRIZES ---------- */
function Prizes() {
  const sched = [
    ['Opens', 'Registration opens', 'Released during the CB opening. 20 to 35 slots, and may be adjusted if lots of teams want to join.'],
    ['Jul 5', 'Registration closes', 'Last call.'],
    ['Jul – Sep', 'Battle window', 'Qualifiers through Finals run across this estimated window.'],
  ];
  return (
    <div className="panel">
      <SecHead idx="05" title="Prizes & Schedule" />
      <div className="podium" style={{ marginBottom: 30 }}>
        <div className="prize gold">
          <div className="medal">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 5 L24 21"></path>
              <path d="M30 5 L24 21"></path>
              <circle cx="24" cy="31" r="11"></circle>
              <circle cx="24" cy="31" r="4.5"></circle>
            </svg>
          </div>
          <div className="pl">1st Place</div>
          <div className="amt">$160</div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Winner takes the crown, and the cash.</p>
        </div>
        <div className="prize silver">
          <div className="medal">
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 5 L24 21"></path>
              <path d="M30 5 L24 21"></path>
              <circle cx="24" cy="31" r="11"></circle>
              <circle cx="24" cy="31" r="4.5"></circle>
            </svg>
          </div>
          <div className="pl">2nd Place</div>
          <div className="amt">$80</div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Second place still walks away rewarded.</p>
        </div>
      </div>

      <div className="payout-note">
        <span className="tag" style={{ color: 'var(--gold-soft)' }}>Payout</span>
        <p style={{ marginTop: 8 }}>Prizes are sent via <strong>PayPal</strong>. If every member of the winning team is Filipino, <strong>GCash</strong> is also an option.</p>
      </div>

      <div className="card outline">
        <span className="tag">Schedule · Estimated Jul – Sep · UPDATE!</span>
        <div className="timeline" style={{ marginTop: 8 }}>
          {sched.map(([when, what, sub]) => (
            <div className="tl" key={what}>
              <div className="when">{when}</div>
              <div className="what">{what}<small>{sub}</small></div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

/* ---------- APP ---------- */
const TABS = [
  ['Mechanics', 'c-pink', Mechanics],
  ['Rules', 'c-blue', Rules],
  ['Format', 'c-gold', Format],
  ['Judging', 'c-pink', Judging],
  ['Prizes & Schedule', 'c-ember', Prizes],
];

function RegisterModal({ onClose }) {
  const [teamName, setTeamName] = useState('');
  const [leader, setLeader] = useState('');
  const [members, setMembers] = useState([{ smule: '', discord: '' }, { smule: '', discord: '' }]);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState(false);
  const [sealed, setSealed] = useState(false);

  function updateMember(i, key, val) {
    setMembers((p) => p.map((m, j) => (j === i ? { ...m, [key]: val } : m)));
    setError(false);
  }
  function addMember() {
    setMembers((p) => (p.length >= 4 ? p : [...p, { smule: '', discord: '' }]));
  }
  function removeMember(i) {
    setMembers((p) => (p.length <= 1 ? p : p.filter((_, j) => j !== i)));
  }
  function submit() {
    const hasMember = members.some((m) => m.smule.trim() && m.discord.trim());
    const ok = teamName.trim() && leader.trim() && hasMember && agree;
    if (!ok) { setError(false); setTimeout(() => setError(true), 0); return; }
    setSealed(true); setError(false);
  }

  const canRemove = members.length > 1;
  const fieldsComplete =
    teamName.trim() && leader.trim() && members.some((m) => m.smule.trim() && m.discord.trim());
  useEffect(() => { if (!fieldsComplete && agree) setAgree(false); }, [fieldsComplete, agree]);

  return (
    <div className={'reg-root' + (sealed ? ' is-sealed' : '')}>
      <div className="reg-halftone" aria-hidden="true"></div>
      <div className="reg-grain" aria-hidden="true"></div>

      {!sealed && <div className="reg-close" onClick={onClose} aria-label="Close">&times;</div>}

      {!sealed && (
        <div id="rg-scroll" className="reg-scroll">
          <div className={'reg-form' + (error ? ' shake' : '')}>
            <div className="reg-kicker">TEAM REGISTRATION</div>
            <h1 className="reg-h1">#NKMACB ACT&nbsp;1<br /><span className="hot">&ldquo;Sing Beyond Limits&rdquo;</span></h1>
            <p className="reg-lead">So, your team is ready to take on the challenge? Let&rsquo;s make it official.</p>

            <div className="reg-field">
              <label className="reg-label">TEAM NAME <span className="req">*</span></label>
              <input className="reg-input" value={teamName} onChange={(e) => { setTeamName(e.target.value); setError(false); }} placeholder="Your answer" />
            </div>

            <div className="reg-field">
              <label className="reg-label">LEADER <span className="req">*</span></label>
              <input className="reg-input" value={leader} onChange={(e) => { setLeader(e.target.value); setError(false); }} placeholder="Your answer" />
            </div>

            <div className="reg-field reg-members">
              <label className="reg-label">MEMBERS <span className="req">*</span></label>
              <div className="reg-sub">Add each member with their Smule ID and Discord ID</div>
              <div className="reg-rows">
                {members.map((m, i) => (
                  <div className="reg-row" key={i}>
                    <div className="reg-num">{i + 1}</div>
                    <input className="reg-input" value={m.smule} onChange={(e) => updateMember(i, 'smule', e.target.value)} placeholder="Smule ID" />
                    <input className="reg-input" value={m.discord} onChange={(e) => updateMember(i, 'discord', e.target.value)} placeholder="Discord ID" />
                    <div className={'reg-rm' + (canRemove ? '' : ' off')} onClick={() => removeMember(i)}>&times;</div>
                  </div>
                ))}
              </div>
              {members.length < 4 ? (
                <div className="reg-add" onClick={addMember}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1.6v10.8M1.6 7h10.8" stroke="#ff5159" strokeWidth="1.8" strokeLinecap="round"></path></svg>
                  ADD MEMBER
                </div>
              ) : (
                <div className="reg-max">Maximum of 4 members reached.</div>
              )}
            </div>

            <div className={'reg-agree' + (fieldsComplete ? '' : ' locked')}
                 onClick={() => { if (fieldsComplete) { setAgree((a) => !a); setError(false); } }}
                 aria-disabled={!fieldsComplete}>
              <div className={'reg-check' + (agree ? ' on' : '')}>
                {agree && (<svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8.4l3.2 3.2L13 4.8" stroke="#0d0709" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"></path></svg>)}
              </div>
              <div className="reg-agree-txt">Once you join, there&rsquo;s no backing out. The mechanics are tough, so make sure your team is fully committed before you register.{!fieldsComplete && <span className="reg-agree-hint"> Fill in your team details first.</span>}</div>
            </div>

            {error && <div className="reg-err">Fill every required field and accept the commitment to seal your entry.</div>}

            <div className={'reg-submit' + (agree ? '' : ' disabled')} onClick={() => { if (agree) submit(); }} aria-disabled={!agree}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.6" stroke="#0d0709" strokeWidth="1.8"></circle><path d="M9 5.6v3.4l2.4 1.4" stroke="#0d0709" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <span>SEAL YOUR ENTRY</span>
            </div>
          </div>
        </div>
      )}

      {sealed && (
        <div className="reg-sealed">
          <div className="reg-stampring"></div>
          <div className="reg-stamp">
            <div className="reg-stamp-box"><span>SEALED</span></div>
          </div>
          <div className="reg-seal-badge">
            <div className="reg-seal-glow"></div>
            <img src="/badge.png" alt="Nakama Chorus Battle seal" />
          </div>
          <div className="reg-sealed-1">Your team is locked in. No backing out now.</div>
          <div className="reg-sealed-2">We&rsquo;re so excited to hear your performance soon. Check Discord to keep you updated.</div>
          <button className="reg-gotit" onClick={onClose}>Got it!</button>
        </div>
      )}
    </div>
  );
}

// ---- deterministic crowd + particle builders (seeded, mirrors the design) ----
function buildParticles() {
  const colors = ['#ff3b47', '#ff6068', '#ffb24d', '#ffd9b3', '#ff3b47', '#ff6068', '#ff8a52'];
  let seed = 29;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const arr = [];
  for (let i = 0; i < 12; i++) {
    const sz = 2 + rnd() * 3.5;
    const dur = (6 + rnd() * 8).toFixed(1);
    const delay = (-rnd() * 14).toFixed(1);
    const sway = (2.2 + rnd() * 2.4).toFixed(1);
    const c = colors[Math.floor(rnd() * colors.length)];
    arr.push({
      left: (rnd() * 100).toFixed(1) + '%',
      size: sz.toFixed(1) + 'px',
      color: c,
      glow: (sz * 1.3).toFixed(0) + 'px',
      riseAnim: 'nk-prise ' + dur + 's linear ' + delay + 's infinite',
      swayAnim: 'nk-pdrift ' + sway + 's ease-in-out infinite',
    });
  }
  return arr;
}
function buildCrowd() {
  const colors = ['#ff4d59', '#ffd9b3', '#ff4d59', '#ffb24d', '#fff2e6', '#ff7ab0', '#ff4d59', '#6fe0ff', '#ff4d59', '#ffa64d'];
  let seed = 13;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const N = 32;
  const arr = [];
  for (let i = 0; i < N; i++) {
    const back = i % 3 === 0;
    const left = Math.max(-2, Math.min(102, (i / (N - 1)) * 100 + (rnd() - 0.5) * 4));
    const scale = back ? 0.74 + rnd() * 0.2 : 1.08 + rnd() * 0.55;
    const dur = (1.5 + rnd() * 1.7).toFixed(2);
    const delay = (-rnd() * 2.2).toFixed(2);
    arr.push({
      left: left.toFixed(1) + '%',
      scale: scale.toFixed(2),
      color: colors[Math.floor(rnd() * colors.length)],
      hasStick: rnd() > 0.12,
      stickAnim: 'nk-stick ' + dur + 's ease-in-out ' + delay + 's infinite',
      armX: Math.round(rnd() * 36 - 4) + 'px',
      opacity: back ? 0.82 : 1,
      z: back ? 1 : 2,
      shade: back ? '#020203' : '#050506',
    });
  }
  return arr.sort((a, b) => a.z - b.z);
}
// soundwave ring path generator
function wavePath(R, amp, cycles, pts) {
  let d = '';
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2;
    const r = R + amp * Math.sin(a * cycles);
    const x = 260 + r * Math.cos(a);
    const y = 260 + r * Math.sin(a);
    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
  }
  return d + 'Z';
}
// rock fragments that break off the split seam and tumble down each side
function buildDebris() {
  let seed = 71;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  const shades = ['#1a0f12', '#241317', '#0f0a0c', '#2a1519', '#160d10'];
  const arr = [];
  for (let i = 0; i < 40; i++) {
    const side = i % 2 === 0 ? -1 : 1; // -1 left half, +1 right half
    const sz = (7 + rnd() * 20).toFixed(0);
    const seam = ((rnd() * 2 - 1) * 185).toFixed(0);     // start y along the FULL edge height (-185..185px)
    const drift = (side * (24 + rnd() * 150)).toFixed(0);// horizontal outward drift (px)
    const fall = (110 + rnd() * 260).toFixed(0);         // fall distance (px)
    const rot = ((rnd() * 2 - 1) * 540).toFixed(0);      // tumble rotation
    const dur = (0.9 + rnd() * 0.9).toFixed(2);
    const delay = (rnd() * 0.18).toFixed(2);
    const radius = (rnd() > 0.5 ? '40% 60% 55% 45%' : '55% 45% 50% 50% / 55% 50% 50% 45%');
    arr.push({
      side, size: sz + 'px', seam: seam + 'px',
      color: shades[Math.floor(rnd() * shades.length)],
      radius,
      // CSS custom props consumed by the keyframe
      style: { '--dx': drift + 'px', '--dy': fall + 'px', '--rot': rot + 'deg',
               animation: `nk-debris ${dur}s cubic-bezier(.3,.5,.5,1) ${delay}s forwards` },
    });
  }
  return arr;
}

const CROWD = buildCrowd();
const PARTICLES = buildParticles();
const DEBRIS = buildDebris();
const WAVE_BIG = wavePath(224, 9, 50, 620);
const WAVE_SMALL = wavePath(212, 5, 34, 620);

function App() {
  const [tab, setTab] = useState(0);
  const [opened, setOpened] = useState(false);
  const [hover, setHover] = useState(false);
  const [crowdShown, setCrowdShown] = useState(false);
  const [crowdClosing, setCrowdClosing] = useState(false);
  const [rulebook, setRulebook] = useState(false);
  const [rbClosing, setRbClosing] = useState(false);
  const [regShown, setRegShown] = useState(false);
  const [regClosing, setRegClosing] = useState(false);
  const crowdTimer = useRef(null);
  const regTimer = useRef(null);
  const rbTimer = useRef(null);
  const [agh, setAgh] = useState(false);
  const aghTimer = useRef(null);

  function sealClick() {
    // panda yelps, then the seal opens as it fades
    setAgh(true);
    if (aghTimer.current) clearTimeout(aghTimer.current);
    aghTimer.current = setTimeout(() => { setAgh(false); toggleSeal(); }, 620);
  }

  function openRulebook() {
    if (rbTimer.current) clearTimeout(rbTimer.current);
    setRulebook(true); setRbClosing(false);
  }
  function closeRulebook() {
    setRbClosing(true);
    rbTimer.current = setTimeout(() => { setRulebook(false); setRbClosing(false); }, 200);
  }

  function toggleSeal() {
    if (!opened) {
      if (crowdTimer.current) clearTimeout(crowdTimer.current);
      setOpened(true); setCrowdShown(true); setCrowdClosing(false);
    } else {
      setOpened(false); setCrowdClosing(true);
      crowdTimer.current = setTimeout(() => { setCrowdShown(false); setCrowdClosing(false); }, 520);
    }
  }
  function openReg() {
    if (regTimer.current) clearTimeout(regTimer.current);
    setRegShown(true); setRegClosing(false);
  }
  function closeReg() {
    setRegClosing(true);
    regTimer.current = setTimeout(() => { setRegShown(false); setRegClosing(false); }, 200);
  }

  const anyModal = rulebook || regShown;
  useEffect(() => {
    document.body.style.overflow = anyModal ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [anyModal]);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (regShown) closeReg();
      else if (rulebook) closeRulebook();
      else if (opened) toggleSeal();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const Active = TABS[tab][2];

  return (
    <React.Fragment>
      <section className={'sealhero' + (opened ? ' is-open' : '')} data-screen-label="Hero">
        <div className="sh-halftone" aria-hidden="true"></div>
        <div className="sh-grain" aria-hidden="true"></div>
        <div className="sh-dark" aria-hidden="true"></div>
        <div className="sh-cone" aria-hidden="true"></div>

        <div className="sh-edge sh-edge-l" aria-hidden="true">EST &middot; 2026</div>
        <div className="sh-edge sh-edge-r" aria-hidden="true">NAKAMA &middot; CHORUS</div>
        <div className="sh-vinyl sh-vinyl-1" aria-hidden="true"></div>
        <div className="sh-vinyl sh-vinyl-2" aria-hidden="true"></div>

        {/* rising glow particles (when open) */}
        {opened && (
          <div className="sh-particles" aria-hidden="true">
            {PARTICLES.map((p, i) => (
              <div key={i} className="sh-prise" style={{ left: p.left, animation: p.riseAnim }}>
                <div className="sh-pdot" style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.glow} ${p.color}`, animation: p.swayAnim }}></div>
              </div>
            ))}
          </div>
        )}

        {/* cheering crowd */}
        {crowdShown && (
          <div className={'sh-crowd' + (crowdClosing ? ' closing' : '')} aria-hidden="true">
            <div className="sh-crowd-haze"></div>
            <div className="sh-crowd-floor"></div>
            {CROWD.map((p, i) => (
              <div key={i} className="sh-fan-pos" style={{ left: p.left, zIndex: p.z }}>
                <div className="sh-fan" style={{ transform: `scale(${p.scale})`, opacity: p.opacity }}>
                  {p.hasStick && (
                    <div className="sh-stick" style={{ left: `calc(50% + ${p.armX})`, animation: p.stickAnim }}>
                      <div className="sh-stick-rod" style={{ background: `linear-gradient(to top, rgba(5,3,4,.55), ${p.color})`, boxShadow: `0 0 9px ${p.color}` }}></div>
                      <div className="sh-stick-tip" style={{ background: p.color, boxShadow: `0 0 11px ${p.color},0 0 24px ${p.color}` }}></div>
                    </div>
                  )}
                  <div className="sh-body">
                    <div className="sh-head" style={{ background: p.shade }}></div>
                    <div className="sh-torso" style={{ background: p.shade }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* center stack */}
        <div className="sh-center">
          {/* SEAL */}
          <div className="sh-seal-wrap">
            <div className="sh-seal-stage">
              <div
                className="sh-hit"
                onClick={sealClick}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                style={{ pointerEvents: opened ? 'none' : 'auto' }}
              ></div>

              {/* glow + soundwave behind */}
              <div className={'sh-behind' + (opened ? ' fade' : '')}>
                <div className="sh-glow"></div>
                <div className="sh-waves" style={{ opacity: hover ? 1 : 0.6 }}>
                  <div className="sh-wave-spin" style={{ animation: hover ? 'nk-rot 7s linear infinite' : 'nk-rot 16s linear infinite' }}>
                    <svg viewBox="0 0 520 520" className="sh-wave-svg"><path d={WAVE_BIG} fill="none" stroke="rgba(232,53,72,.7)" strokeWidth="1.6"></path></svg>
                  </div>
                  <div className="sh-wave-spin" style={{ animation: hover ? 'nk-rot-rev 9s linear infinite' : 'nk-rot-rev 22s linear infinite' }}>
                    <svg viewBox="0 0 520 520" className="sh-wave-svg"><path d={WAVE_SMALL} fill="none" stroke="rgba(237,230,218,.18)" strokeWidth="1"></path></svg>
                  </div>
                </div>
              </div>

              {/* badge halves */}
              <img className="sh-badge sh-badge-l" src="/badge.png" alt="Nakama Chorus Battle seal"
                   style={{ transform: `translate(-50%,-50%) translateX(${opened ? '-285px' : '0'})` }} />
              <img className="sh-badge sh-badge-r" src="/badge.png" alt=""
                   style={{ transform: `translate(-50%,-50%) translateX(${opened ? '285px' : '0'})` }} />

              {/* rock fragments breaking off the split seam */}
              {opened && (
                <React.Fragment>
                  <div className="sh-debris sh-debris-l" aria-hidden="true">
                    {DEBRIS.filter((d) => d.side < 0).map((d, i) => (
                      <span key={i} className="sh-shard"
                        style={{ top: d.seam, width: d.size, height: d.size, background: d.color, borderRadius: d.radius, ...d.style }} />
                    ))}
                  </div>
                  <div className="sh-debris sh-debris-r" aria-hidden="true">
                    {DEBRIS.filter((d) => d.side > 0).map((d, i) => (
                      <span key={i} className="sh-shard"
                        style={{ top: d.seam, width: d.size, height: d.size, background: d.color, borderRadius: d.radius, ...d.style }} />
                    ))}
                  </div>
                </React.Fragment>
              )}


              {/* ruler on top (fades on open) */}
              <div className={'sh-extras' + (opened ? ' fade' : '')}>
                <div className="sh-ruler" style={{ opacity: hover ? 1 : 0 }}>
                  <div className="sh-ruler-rot" style={{ animation: hover ? 'nk-rot 1s linear infinite' : 'nk-rot 5s linear infinite' }}>
                    <div className="sh-ruler-band"></div>
                    <div className="sh-ruler-tick"></div>
                  </div>
                </div>
              </div>

              {/* panda eyes overlay: default / hover / hurt — each rides its half through the split */}
              <div className="sh-eyelayer" aria-hidden="true">
                {(() => {
                  const hurt = opened || agh;
                  const stroke = hover && !hurt ? 11 : 4.6;
                  const pathL = hurt ? 'M5 13.5 L25 11.5 L25 14 L5 15.5 Z' : (hover ? 'M11.5 9.5 L17 5 L16.5 13 L11 17.5 Z' : 'M5 11.4 L25 10.4 L25 12.8 L5 13.8 Z');
                  const pathR = hurt ? 'M25 13.5 L5 11.5 L5 14 L25 15.5 Z' : (hover ? 'M18.5 9.5 L13 5 L13.5 13 L19 17.5 Z' : 'M25 11.4 L5 10.4 L5 12.8 L25 13.8 Z');
                  return (
                    <React.Fragment>
                      <div className="sh-eyebox" style={{ transform: `translate(-50%,-50%) translateX(${opened ? '-285px' : '0'})` }}>
                        <div className="sh-eyesvg" style={{ left: '25px' }}>
                          <svg viewBox="0 0 30 21"><path d={pathL} fill="#e0354a" stroke="#e0354a" strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" /></svg>
                        </div>
                      </div>
                      <div className="sh-eyebox" style={{ transform: `translate(-50%,-50%) translateX(${opened ? '285px' : '0'})` }}>
                        <div className="sh-eyesvg" style={{ left: '62px' }}>
                          <svg viewBox="0 0 30 21"><path d={pathR} fill="#e0354a" stroke="#e0354a" strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round" /></svg>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* CLOSED hint */}
          {!opened && (
            <div className={'sh-hint' + (agh ? ' agh' : '') + (hover && !agh ? ' nudge' : '')} onClick={sealClick}>
              {agh ? 'NOOOO' : hover ? "stoppp, you'll hurt me" : ''}
            </div>
          )}

          {/* OPENED panel */}
          {opened && (
            <div className="sh-open">
              <div className="sh-tag">SING&nbsp;BEYOND&nbsp;<span className="hot">LIMITS.</span></div>
              <div className="sh-hashes">#SMULE &nbsp;&middot;&nbsp; #SMUTAITES &nbsp;&middot;&nbsp; #NKMACB1</div>
              <div className="sh-actions">
                <button className="sh-act primary" onClick={(e) => { e.stopPropagation(); openRulebook(); }}>
                  <img className="sh-act-ico" src="/panda-mark-dark.png" alt="" />
                  <span>CB INFO</span>
                </button>
                <button className="sh-act ghost" onClick={(e) => { e.stopPropagation(); openReg(); }}>
                  <img className="sh-act-ico" src="/panda-mark.png" alt="" />
                  <span>REGISTER TEAM</span>
                </button>
                <a className="sh-act ghost" href="https://discord.gg/YujuKC9WXP" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#ff5159" aria-hidden="true"><path d="M20.32 4.94A19.6 19.6 0 0 0 15.45 3.4a.07.07 0 0 0-.08.04c-.21.38-.45.87-.61 1.25a18.1 18.1 0 0 0-5.43 0c-.16-.39-.4-.87-.62-1.25a.08.08 0 0 0-.08-.04 19.5 19.5 0 0 0-4.87 1.54.07.07 0 0 0-.03.03C.78 9.6-.07 14.15.35 18.64a.08.08 0 0 0 .03.06 19.7 19.7 0 0 0 5.96 3.04.08.08 0 0 0 .09-.03c.46-.63.87-1.29 1.22-1.99a.08.08 0 0 0-.04-.11c-.65-.25-1.27-.55-1.87-.9a.08.08 0 0 1-.01-.13c.13-.1.25-.2.37-.3a.07.07 0 0 1 .08-.01c3.93 1.8 8.18 1.8 12.06 0a.07.07 0 0 1 .08.01c.12.1.24.2.37.3a.08.08 0 0 1-.01.13c-.6.35-1.22.65-1.87.9a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .09.03 19.6 19.6 0 0 0 5.97-3.04.08.08 0 0 0 .03-.06c.5-5.18-.84-9.69-3.55-13.67a.06.06 0 0 0-.03-.03ZM8.02 15.9c-1.18 0-2.15-1.08-2.15-2.41s.95-2.42 2.15-2.42c1.21 0 2.17 1.1 2.15 2.42 0 1.33-.95 2.41-2.15 2.41Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.41s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.15 2.42 0 1.33-.94 2.41-2.15 2.41Z"/></svg>
                  <span>JOIN DISCORD</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* click anywhere to close */}
        {opened && <div className="sh-closelayer" onClick={toggleSeal}></div>}

        {/* footer */}
        <div className="sh-footer">
          <span className="sh-sponsor">This event is sponsored.</span>
        </div>
      </section>

      {/* ====== CB INFO RULEBOOK MODAL (real content) ====== */}
      {rulebook && (
        <div className={'hiw-modal ' + (rbClosing ? 'closing' : 'opening')} role="dialog" aria-modal="true">
          <button className="hiw-close" onClick={closeRulebook} aria-label="Close">&times;</button>
          <div className="hiw-head">
            <div className="hiw-tag">ACT 1 &middot; RULEBOOK</div>
            <div className="hiw-tabs">
              {TABS.map(([name], i) => (
                <button key={name} className={'hiw-tab' + (tab === i ? ' active' : '')} onClick={() => setTab(i)}>
                  <span className="hiw-tab-num">{String(i + 1).padStart(2, '0')}</span>{name}
                </button>
              ))}
            </div>
          </div>
          <div className="hiw-panel">
            <div className="hiw-body" key={tab} data-screen-label={TABS[tab][0]}>
              <Active />
            </div>
          </div>
        </div>
      )}

      {/* ====== REGISTER TEAM MODAL ====== */}
      {regShown && (
        <div className="reg-overlay" role="dialog" aria-modal="true">
          <div className="reg-backdrop" onClick={closeReg}></div>
          <div className={'reg-card ' + (regClosing ? 'closing' : 'opening')}>
            <RegisterModal onClose={closeReg} />
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export default App;
