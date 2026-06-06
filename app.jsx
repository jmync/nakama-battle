import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';

/* ---------- BRACKET (4 groups) ---------- */
const GROUP_COLOR = { A: '#ff4d6d', B: '#ffffff', C: '#ff2d2d', D: '#b23bff' };
const BK_COLS = [
  { label: 'GROUP ROUNDS', ids: ['A1', 'A2', 'B1', 'B2'] },
  { label: 'KNOCKOUT', ids: ['GFA', 'GFB'] },
  { label: 'SEMI-FINAL', ids: ['SF1'] },
  { label: 'FINALS', ids: ['F'] },
  { label: 'SEMI-FINAL', ids: ['SF2'] },
  { label: 'KNOCKOUT', ids: ['GFC', 'GFD'] },
  { label: 'GROUP ROUNDS', ids: ['C1', 'C2', 'D1', 'D2'] },
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
      <h3 style={{ marginBottom: 4 }}>Knockout <span style={{ margin: '0 8px' }}>→</span> Semi-Finals <span style={{ margin: '0 8px' }}>→</span> Finals</h3>
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
      <SecHead idx="// 01" title="Mechanics" />
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card outline">
          <span className="tag">Format</span>
          <h3>Trio Battle</h3>
          <p>Three voices, one stage. Recorded inside <strong>Smule</strong>.</p>
        </div>
        <div className="card outline">
          <span className="tag">Time limit</span>
          <div className="big">2:00</div>
          <p style={{ marginTop: 8 }}>Short version (max <strong>2 minutes</strong>) through the <strong>Semi-Finals</strong>. Only the <strong>Finals</strong> are sung <strong>full version</strong>.</p>
        </div>
        <div className="card outline">
          <span className="tag">Song picks</span>
          <h3>Roulette System</h3>
          <p>Roulette runs the show. A <strong>genre</strong> roulette and a <strong>song</strong> roulette decide the picks across the stages.</p>
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
          <p>Reinterpret, rearrange, restyle. Remixes are welcome and you're free to adjust the key to fit your trio's range.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- RULES ---------- */
function Rules() {
  const dos = [
    ['One team only', 'A contestant may join only ONE trio team.'],
    ['Record in Smule', 'All entries must be recorded within Smule.'],
    ['Tag your entry', 'Every entry must include #NKMA_TRIOBATTLE in the description.'],
  ];
  const donts = [
    ['No late entries', 'Late entries will not be accepted under any circumstances.'],
    ['No outside vocals', 'Pre-recorded or externally edited vocals are not allowed.'],
    ['Short version (through Semi-Finals)', 'Full-length recordings are not allowed through the Semi-Finals. Only the Finals are sung full version.'],
  ];
  const others = [
    "Once you join, there's no backing out. The mechanics are tough, so make sure your trio is fully committed before you register.",
    'Entries will have a watch party on Discord or elsewhere. Announcements soon.',
    'From the Knockout stage onward, every team gets judges’ critiques and feedback, not just a score.',
    'Respect all participants.',
    "Let's keep it short, enjoyable, and stress-free.",
  ];
  return (
    <div className="panel">
      <SecHead idx="// 02" title="Rules" />
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
          <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="33" cy="36" r="12"></circle>
            <circle cx="87" cy="36" r="12"></circle>
            <circle cx="60" cy="64" r="37"></circle>
            <ellipse cx="46" cy="60" rx="8.5" ry="12" transform="rotate(-12 46 60)"></ellipse>
            <ellipse cx="74" cy="60" rx="8.5" ry="12" transform="rotate(12 74 60)"></ellipse>
            <circle cx="47" cy="62" r="3" fill="currentColor" stroke="none"></circle>
            <circle cx="73" cy="62" r="3" fill="currentColor" stroke="none"></circle>
            <circle cx="60" cy="74" r="3.4" fill="currentColor" stroke="none"></circle>
            <path d="M53 81 q7 7 14 0"></path>
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
    ['STAGE 01', 'Qualifiers', 'Pick a song performed by teams in chorus battles from 2016–2021 (YouTube or Smule). Top 16 advances.'],
    ['STAGE 02', 'Group Rounds', 'A genre is spun via roulette for each group. Any song works, but stick to your group’s genre. Top 8 advance.'],
    ['STAGE 03', 'Knockout', 'Head-to-head group deciders. Songs are picked by us, and groups are assigned via roulette. Winners advance to the Semi-Finals.'],
    ['STAGE 04', 'Semi-Finals', 'A genre is spun via roulette, then head-to-head rivals pick a song within that genre for each other. Same genre for both, so every pick stays fair.'],
    ['STAGE 05', 'Finals', 'Theme: 7 Deadly Sins (#RRTB-inspired). Pick your own song for the theme. Full version, with a touch of mashup to unleash your creativity.'],
  ];
  return (
    <div className="panel">
      <SecHead idx="// 03" title="Event Format" wide />

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
                <g stroke="#ff2d2d" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
                  <circle cx="34" cy="58" r="10"></circle>
                  <circle cx="86" cy="58" r="10"></circle>
                  <circle cx="60" cy="82" r="31"></circle>
                  <ellipse cx="47" cy="78" rx="7.5" ry="10.5" transform="rotate(-12 47 78)"></ellipse>
                  <ellipse cx="73" cy="78" rx="7.5" ry="10.5" transform="rotate(12 73 78)"></ellipse>
                  <path d="M54 98 q6 6 12 0"></path>
                </g>
                <circle cx="48" cy="80" r="2.6" fill="#ff2d2d"></circle>
                <circle cx="72" cy="80" r="2.6" fill="#ff2d2d"></circle>
                <circle cx="60" cy="92" r="2.8" fill="#ff2d2d"></circle>
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
                    <circle cx="33" cy="36" r="12"></circle>
                    <circle cx="87" cy="36" r="12"></circle>
                    <circle cx="60" cy="64" r="37"></circle>
                    <ellipse cx="46" cy="60" rx="8.5" ry="12" transform="rotate(-12 46 60)"></ellipse>
                    <ellipse cx="74" cy="60" rx="8.5" ry="12" transform="rotate(12 74 60)"></ellipse>
                    <circle cx="47" cy="62" r="3" fill="currentColor" stroke="none"></circle>
                    <circle cx="73" cy="62" r="3" fill="currentColor" stroke="none"></circle>
                    <circle cx="60" cy="74" r="3.4" fill="currentColor" stroke="none"></circle>
                    <path d="M53 81 q7 7 14 0"></path>
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
      <SecHead idx="// 04" title="Judging · Vocals Only" />
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
                <circle cx="33" cy="36" r="12"></circle>
                <circle cx="87" cy="36" r="12"></circle>
                <circle cx="60" cy="64" r="37"></circle>
                <ellipse cx="46" cy="60" rx="8.5" ry="12" transform="rotate(-12 46 60)"></ellipse>
                <ellipse cx="74" cy="60" rx="8.5" ry="12" transform="rotate(12 74 60)"></ellipse>
                <circle cx="47" cy="62" r="3" fill="currentColor" stroke="none"></circle>
                <circle cx="73" cy="62" r="3" fill="currentColor" stroke="none"></circle>
                <circle cx="60" cy="74" r="3.4" fill="currentColor" stroke="none"></circle>
                <path d="M53 81 q7 7 14 0"></path>
              </svg>
            </span>
          </h3>
          <p>A mix of trusted singers and friends score every battle.</p>
          <div style={{ height: 16 }}></div>
          <span className="tag" style={{ color: 'var(--pink-soft)' }}>Fair &amp; pressure-free</span>
          <p style={{ marginTop: 8 }}>To keep things fair and stress-free, <strong>judges remain anonymous</strong>. It's all about the voices.</p>
        </div>
      </div>
    </div>
  );
}

/* ---------- PRIZES ---------- */
function Prizes() {
  const sched = [
    ['Opens', 'Registration opens', 'The moment the Open Call is posted on Smule. 20 to 30 slots, and may be adjusted if lots of teams want to join.'],
    ['Jul 1', 'Registration closes', 'Last call.'],
    ['Jul – Sep', 'Battle window', 'Qualifiers through Finals run across this estimated window.'],
  ];
  return (
    <div className="panel">
      <SecHead idx="// 05" title="Prizes & Schedule" />
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
          <div className="amt">$150</div>
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
          <div className="amt">$60</div>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Second place still walks away rewarded.</p>
        </div>
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

      <div className="form-cta" style={{ marginTop: 26 }}>
        <div>
          <div className="t">Dare to take the stage?</div>
          <div className="d">The lights are hot and the bracket is waiting. Rally your trio, find your voice, and see how far you can climb. Everyone's welcome, but only the bold step up.</div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a className="btn btn-primary" href="https://forms.gle/beS1DQGHGpst4zJ39" target="_blank" rel="noopener">REGISTER ↗</a>
          <a className="btn btn-ghost" href="https://discord.gg/YujuKC9WXP" target="_blank" rel="noopener">DISCORD ↗</a>
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

function App() {
  const [tab, setTab] = useState(0);
  const tabsRef = useRef(null);

  function go(i) {
    setTab(i);
    if (tabsRef.current) {
      const y = tabsRef.current.getBoundingClientRect().top + window.scrollY - 8;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }
  const Active = TABS[tab][2];

  return (
    <React.Fragment>
      {/* HERO */}
      <section className="hero" data-screen-label="Hero">
        <div className="title-wrap">
          <h1 className="title">
            <span className="l1">NAKAMA</span>
            <span className="l2">Trio <em>Battle</em></span>
          </h1>
          <div className="hero-mascot">
            <div className="mascot-ring">
              <span className="mascot-hint">
                <svg viewBox="0 0 120 120" fill="none" stroke="#ff2d2d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="33" cy="36" r="12"></circle>
                  <circle cx="87" cy="36" r="12"></circle>
                  <circle cx="60" cy="64" r="37"></circle>
                  <ellipse cx="46" cy="60" rx="8.5" ry="12" transform="rotate(-12 46 60)"></ellipse>
                  <ellipse cx="74" cy="60" rx="8.5" ry="12" transform="rotate(12 74 60)"></ellipse>
                  <circle cx="47" cy="62" r="3" fill="#ff2d2d" stroke="none"></circle>
                  <circle cx="73" cy="62" r="3" fill="#ff2d2d" stroke="none"></circle>
                  <circle cx="60" cy="74" r="3.4" fill="#ff2d2d" stroke="none"></circle>
                  <path d="M53 81 q7 7 14 0"></path>
                </svg>
              </span>
            </div>
          </div>
        </div>
        <div className="act">
          <span className="ln"></span>
          <span className="act-txt">ACT <em>1</em></span>
          <span className="ln"></span>
        </div>
        <p className="tagline">"Sing beyond limits. <span className="q">This is your challenge.</span>"</p>
        <p className="subline">#SMULE · #SMUTAITES · #NKMA_TRIOBATTLE</p>

        <div className="cta-row">
          <a className="btn btn-primary" href="https://forms.gle/beS1DQGHGpst4zJ39" target="_blank" rel="noopener">REGISTER TEAM ↗</a>
          <a className="btn btn-ghost" href="https://discord.gg/YujuKC9WXP" target="_blank" rel="noopener">JOIN DISCORD ↗</a>
        </div>

        <div className="hero-stats">
          <div className="s"><div className="n">16</div><div className="k">Teams advancing</div></div>
          <div className="s"><div className="n">5</div><div className="k">Stages</div></div>
          <div className="s"><div className="n">2:00</div><div className="k">Round cap</div></div>
        </div>

        <div className="scroll-hint" aria-hidden="true">
          <span className="ln"></span>
          <span className="chev">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9l7 7 7-7"></path></svg>
          </span>
          <span className="ln"></span>
        </div>
      </section>

      {/* TABS */}
      <div className="tabs-wrap" ref={tabsRef}>
        <div className="tabs">
          {TABS.map(([name, c], i) => (
            <button key={name} className={'tab ' + c + (tab === i ? ' active' : '')} onClick={() => go(i)}>
              <span className="num">{String(i + 1).padStart(2, '0')}</span>{name}
            </button>
          ))}
        </div>
      </div>

      {/* PANELS */}
      <main className="panel-area" data-screen-label={TABS[tab][0]}>
        <Active key={tab} />
      </main>

      {/* FOOTER */}
      <footer className="foot">
        <div className="marquee">SING BEYOND LIMITS</div>
        <div className="links">
          <a className="btn btn-primary" href="https://forms.gle/beS1DQGHGpst4zJ39" target="_blank" rel="noopener">REGISTER ↗</a>
          <a className="btn btn-ghost" href="https://discord.gg/YujuKC9WXP" target="_blank" rel="noopener">DISCORD ↗</a>
        </div>
        <small className="sponsor">This event is sponsored.</small>
      </footer>
    </React.Fragment>
  );
}

export default App;
