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
      <p>Before the Group Clash begins, all teams are drawn into Groups A–D via a live roulette. Group winners then climb the ladder to the Finals.</p>
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
          <p>Reinterpret, rearrange, restyle. Remixes are welcome and you're free to adjust the key to fit your team's range. Translating the song into a different language is allowed too :)</p>
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
  const timeline = [
    { num: 'STAGE 01', name: 'Qualifiers', run: 'July 01 – July 09', judge: 'July 10 – July 12',
      body: 'A roulette picks the language: Japanese, Korean, or English. Pick any song in the language you land on. Only the Top 16 teams advance to the bracket, so give it everything you’ve got.' },
    { num: 'STAGE 02', name: 'Group Clash', run: 'July 13 – July 21', judge: 'July 22 – July 24',
      body: 'Head-to-head begins here, all the way to the Finals. An artist or producer is spun via roulette for each group. Pick any song from the artist or producer you land on. The Top 8 teams advance.' },
    { num: 'STAGE 03', name: 'Showdown', run: 'July 25 – August 02', judge: 'August 03 – August 05',
      body: 'Group winners go head-to-head. Songs are picked by us, and matchups are assigned via roulette. Winners advance to the Semi-Finals.' },
    { num: 'STAGE 04', name: 'Semi-Finals', run: 'August 06 – August 19', judge: 'August 20 – August 22',
      body: 'A genre is spun via roulette, then head-to-head rivals pick a song within that genre for each other. Same genre for both teams, keeping every pick fair.' },
    { num: 'STAGE 05', name: 'Finals', run: 'August 23 – September 05', judge: 'September 06 – September 08', fin: true,
      theme: '7 Deadly Sins',
      body: 'Theme: 7 Deadly Sins (#RRTB-inspired). Both teams choose their own song based on the theme assigned to them via roulette. Sung full version with a touch of mashup to unleash your creativity. You’ll also submit a short interpretation so we can see if you captured the theme.' },
  ];
  const [sub, setSub] = useState('schedule');
  return (
    <div className="panel">
      <SecHead idx="03" title="Event Format" wide />

      <div className="fmt-subtabs fmt-wide">
        <button className={'fmt-subtab' + (sub === 'schedule' ? ' active' : '')} onClick={() => setSub('schedule')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Schedule
        </button>
        <button className={'fmt-subtab' + (sub === 'bracket' ? ' active' : '')} onClick={() => setSub('bracket')}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 5h5v6h5v8M4 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M14 11h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          Tournament Bracket
        </button>
      </div>

      {sub === 'bracket' ? (
        <Bracket />
      ) : (
      <React.Fragment>
      <div className="tline fmt-wide">
        {timeline.map((s) => (
          <div className={'tline-row' + (s.fin ? ' fin' : '')} key={s.num}>
            <div className="tline-rail" aria-hidden="true"><img className="tline-dot" src={s.fin ? '/panda-mark.png' : '/panda-mark-gold.png'} alt="" /></div>
            <div className="tline-card">
              <div className="tline-head">
                <span className="tline-num">{s.num}</span>
                <span className="tline-name">{s.name}</span>
              </div>
              <div className="tline-dates">
                <span className="tline-date"><b>Run</b>{s.run}</span>
                <span className="tline-date"><b>{s.fin ? 'Final Judging' : 'Judging'}</b>{s.judge}</span>
              </div>
              <p className="tline-body">{s.body}</p>
              {s.fin && (
                <div className="tline-sins">
                  <span className="tline-sins-label">{s.theme}</span>
                  {['Pride', 'Greed', 'Lust', 'Envy', 'Gluttony', 'Wrath', 'Sloth'].map((sin) => (
                    <span className="sin" key={sin}>
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
                      {sin}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      </React.Fragment>
      )}
    </div>
  );
}

/* ---------- JUDGING ---------- */
const JUDGES = [
  { name: 'Pikoyin', img: '/judges/pikoyin.png', zoom: 1.45, pos: '50% 46%', links: [
    { platform: 'YouTube', url: 'https://www.youtube.com/@Pikoyinn' },
    { platform: 'X', url: 'https://x.com/pikoyin' },
  ] },
  { name: 'Furiyachan', img: '/judges/furiyachan.jpg', links: [
    { platform: 'Smule', url: 'https://www.smule.com/Furiyachan' },
  ] },
  { name: 'Noon', img: '/judges/N00N.png', zoom: 2.4, pos: '33% 28%', links: [
    { platform: 'X', url: 'https://x.com/noon0096_' },
    { platform: 'YouTube', url: 'https://www.youtube.com/@noonofficiaI' },
  ] },
  { name: 'Jinx', img: '/judges/jinx.jpg', zoom: 2.1, pos: '50% 30%', links: [
    { platform: 'X', url: 'https://x.com/juicy_jinxy' },
    { platform: 'YouTube', url: 'https://www.youtube.com/@juicy_jinxy' },
  ] },
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
            <div className="judge-card" key={i}>
              <div className="judge-ava"><img src={j.img} alt={j.name} loading="lazy" onLoad={(e) => e.currentTarget.classList.add('loaded')} style={{ transform: j.zoom ? `scale(${j.zoom})` : undefined, transformOrigin: j.pos || 'center', objectPosition: j.pos || 'center' }} /></div>
              <div className="judge-name">{j.name}</div>
              <div className="judge-links">
                {j.links.map((l) => (
                  <a className="judge-link" href={l.url} target="_blank" rel="noopener" key={l.url}>{l.platform} ↗</a>
                ))}
              </div>
            </div>
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
    ['Opens', 'Registration opens', 'Released during the CB opening. 20 to 35 slots.'],
    ['Jul 1', 'Registration closes', 'Last call.'],
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
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState('');

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
  async function submit() {
    const hasMember = members.some((m) => m.smule.trim() && m.discord.trim());
    const ok = teamName.trim() && leader.trim() && hasMember && agree;
    if (!ok) { setError(false); setTimeout(() => setError(true), 0); return; }
    setError(false); setSubmitErr(''); setSubmitting(true);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, leader, members }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || 'Failed to save.');
      setSealed(true);
    } catch (e) {
      setSubmitErr(e.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
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

            <div className="reg-divider" aria-hidden="true"></div>

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
            {submitErr && <div className="reg-err">{submitErr}</div>}

            <div className={'reg-submit' + (agree && !submitting ? '' : ' disabled')} onClick={() => { if (agree && !submitting) submit(); }} aria-disabled={!agree || submitting}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="6.6" stroke="#0d0709" strokeWidth="1.8"></circle><path d="M9 5.6v3.4l2.4 1.4" stroke="#0d0709" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"></path></svg>
              <span>{submitting ? 'SEALING…' : 'SEAL YOUR ENTRY'}</span>
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
            <img src="/seal-full.png" alt="Nakama Chorus Battle seal" />
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

function SlotsFullModal({ onClose }) {
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState('');
  const [err, setErr] = useState('');
  const [pollTeam, setPollTeam] = useState('');

  async function vote(choice) {
    if (busy || voted) return;
    if (choice === 'yes' && !pollTeam.trim()) { setErr('Please enter your team name first.'); return; }
    setBusy(true); setPending(choice); setErr('');
    try {
      const r = await fetch('/api/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vote: choice, teamName: pollTeam.trim() || 'Anonymous' }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || 'Could not record your vote.');
      if (choice === 'no') { onClose(); return; }  // No = quiet tally, just close
      setVoted(true);                                // Yes = show thank-you
    } catch (e) {
      setErr(e.message || 'Something went wrong.');
    } finally {
      setBusy(false); setPending('');
    }
  }

  return (
    <div className="full-root">
      <div className="reg-halftone" aria-hidden="true"></div>
      <div className="reg-grain" aria-hidden="true"></div>
      <div className="reg-close" onClick={onClose} aria-label="Close">&times;</div>

      <div className="full-body">
        <div className="full-badge">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><rect x="4" y="10" width="16" height="10" rx="2" stroke="#ff5159" strokeWidth="1.8"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#ff5159" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </div>
        <div className="full-kicker">REGISTRATION CLOSED</div>
        <h2 className="full-title">All slots are <span className="hot">FULL</span></h2>
        <p className="full-lead">Every team slot for Act 1 has been taken. But it&rsquo;s not over yet.</p>

        {!voted ? (
          <React.Fragment>
            <div className="full-divider" aria-hidden="true"></div>
            <div className="full-poll-q">Should we open up more slots?</div>
            <div className="full-poll-sub">Your vote helps us decide whether to give more teams a chance. Voting <b>Yes</b>? Enter your team name (one vote per team).</div>
            <input className="full-input" value={pollTeam} maxLength={60}
              onChange={(e) => { setPollTeam(e.target.value); setErr(''); }} placeholder="Your team name (for Yes votes)" />
            <div className="full-poll-btns">
              <button className="full-vote yes" disabled={busy} onClick={() => vote('yes')}>
                {pending === 'yes'
                  ? <><span className="full-spin" aria-hidden="true"></span>Casting…</>
                  : <><svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M4 9.5l3.2 3.2L14 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>Yes, open more!</>}
              </button>
              <button className="full-vote no" disabled={busy} onClick={() => vote('no')}>
                {pending === 'no'
                  ? <><span className="full-spin dark" aria-hidden="true"></span>Casting…</>
                  : <><svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M13 5l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>No, keep it 35</>}
              </button>
            </div>
            {err && <div className="full-err">{err}</div>}
          </React.Fragment>
        ) : (
          <div className="full-thanks">
            <div className="full-check">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none"><path d="M5 12.5l4.5 4.5L19 7" stroke="#e0354a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div className="full-thanks-1">Vote counted!</div>
            <div className="full-thanks-2">Thanks. If enough teams want in, we&rsquo;ll open more slots. Watch Discord.</div>
            <button className="full-done" onClick={onClose}>Got it</button>
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [fullShown, setFullShown] = useState(false);
  const [fullClosing, setFullClosing] = useState(false);
  const fullTimer = useRef(null);
  const [slotsFull, setSlotsFull] = useState(false);
  const crowdTimer = useRef(null);
  const regTimer = useRef(null);
  const rbTimer = useRef(null);
  const rbPanelRef = useRef(null);
  const [agh, setAgh] = useState(false);
  const aghTimer = useRef(null);
  const [sobs, setSobs] = useState(false);
  const sobsTimer = useRef(null);

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
      // panda sobs after being shut again
      setSobs(true);
      if (sobsTimer.current) clearTimeout(sobsTimer.current);
      sobsTimer.current = setTimeout(() => setSobs(false), 2200);
    }
  }
  function openReg() {
    // use the slot status already fetched in the background — open instantly
    if (slotsFull) {
      setFullShown(true);
      return;
    }
    if (regTimer.current) clearTimeout(regTimer.current);
    setRegShown(true); setRegClosing(false);
  }
  function closeReg() {
    setRegClosing(true);
    regTimer.current = setTimeout(() => { setRegShown(false); setRegClosing(false); }, 200);
  }
  function closeFull() {
    setFullClosing(true);
    if (fullTimer.current) clearTimeout(fullTimer.current);
    fullTimer.current = setTimeout(() => { setFullShown(false); setFullClosing(false); }, 200);
  }

  // fetch slot status in the background so REGISTER opens instantly
  useEffect(() => {
    let alive = true;
    fetch('/api/slots').then((r) => r.json()).then((d) => { if (alive) setSlotsFull(!!d.full); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // On mobile, skip the tap-to-open seal and show the content directly
  // (the split animation doesn't fit small screens). No crowd/split drama.
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width:720px)');
    const apply = () => {
      setIsMobile(mq.matches);
      if (mq.matches) { setOpened(true); setCrowdShown(true); setCrowdClosing(false); }
      else { setOpened(false); setCrowdShown(false); }
    };
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  // reset the rulebook scroll to top whenever the tab changes
  useEffect(() => {
    if (rbPanelRef.current) rbPanelRef.current.scrollTop = 0;
  }, [tab]);

  const anyModal = rulebook || regShown || fullShown;
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
      <section className={'sealhero' + (opened ? ' is-open' : '') + (anyModal ? ' modal-bg' : '') + (isMobile ? ' mobile-direct' : '')} data-screen-label="Hero">
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
            <div className={'sh-hint' + (agh ? ' agh' : '') + (sobs && !hover && !agh ? ' sob' : '') + (hover && !agh ? ' nudge' : '') + (!hover && !agh && !sobs ? ' rest' : '')} onClick={sealClick}>
              {agh ? 'NOOOO' : hover ? 'pleasee' : sobs ? '(sobs)' : "don't wake me"}
            </div>
          )}

          {/* OPENED panel */}
          {opened && (
            <div className="sh-open">
              <div className="sh-tag">SING BEYOND <span className="hot">LIMITS.</span></div>
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
          <div className="hiw-panel" ref={rbPanelRef}>
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

      {/* ====== SLOTS FULL + POLL MODAL ====== */}
      {fullShown && (
        <div className="reg-overlay" role="dialog" aria-modal="true">
          <div className="reg-backdrop" onClick={closeFull}></div>
          <div className={'full-card ' + (fullClosing ? 'closing' : 'opening')}>
            <SlotsFullModal onClose={closeFull} />
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

export default App;
