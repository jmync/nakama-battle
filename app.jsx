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
      <SecHead idx="// 01" title="Mechanics" />
      <div className="grid three" style={{ marginBottom: 16 }}>
        <div className="card outline">
          <span className="tag">Format</span>
          <h3>Chorus Battle</h3>
          <p>Four voices, one stage. Recorded inside <strong>Smule</strong>.</p>
        </div>
        <div className="card outline">
          <span className="tag">Time limit</span>
          <div className="big">2:00</div>
          <p style={{ marginTop: 8 }}>Short version (max <strong>2 minutes</strong>) through the <strong>Showdown</strong>. The <strong>Semi-Finals &amp; Finals</strong> are sung <strong>full version</strong>.</p>
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
    ['Tag your entry', 'Every entry must include #NKMA_CHORUSBATTLE in the description.'],
  ];
  const donts = [
    ['No late entries', 'Late entries will not be accepted under any circumstances.'],
    ['No outside vocals', 'Pre-recorded or externally edited vocals are not allowed.'],
    ['Short version (through Showdown)', 'Full-length recordings are not allowed through the Showdown. The Semi-Finals & Finals are sung full version.'],
  ];
  const others = [
    "Once you join, there's no backing out. The mechanics are tough, so make sure your team is fully committed before you register.",
    'Entries will have a watch party on Discord or elsewhere. Announcements soon.',
    'From the Showdown stage onward, every team gets judges’ critiques and feedback, not just a score.',
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
            <circle cx="31" cy="34" r="16" fill="currentColor" stroke="none"></circle>
            <circle cx="89" cy="34" r="16" fill="currentColor" stroke="none"></circle>
            <circle cx="60" cy="63" r="40" fill="currentColor" stroke="none"></circle>
            <ellipse cx="45" cy="58" rx="11" ry="14.5" transform="rotate(-20 45 58)" fill="var(--ink)" stroke="none"></ellipse>
            <ellipse cx="75" cy="58" rx="11" ry="14.5" transform="rotate(20 75 58)" fill="var(--ink)" stroke="none"></ellipse>
            <circle cx="45" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
            <circle cx="75" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
            <ellipse cx="60" cy="73" rx="6" ry="4.3" fill="var(--ink)" stroke="none"></ellipse>
            <path d="M60 77 v5 M60 82 q-7 6 -13 1 M60 82 q7 6 13 1" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round"></path>
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
    ['STAGE 02', 'Group Clash', 'A genre is spun via roulette for each group. Any song works, but stick to your group’s genre. Top 8 advance.'],
    ['STAGE 03', 'Showdown', 'Group winners go head-to-head. Songs are picked by us, and matchups are assigned via roulette. Winners advance to the Semi-Finals.'],
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
                <circle cx="34" cy="58" r="12" fill="#ff2d2d" stroke="none"></circle>
                <circle cx="86" cy="58" r="12" fill="#ff2d2d" stroke="none"></circle>
                <circle cx="60" cy="82" r="32" fill="#ff2d2d" stroke="none"></circle>
                <ellipse cx="47" cy="77" rx="8.5" ry="11.5" transform="rotate(-18 47 77)" fill="var(--ink)" stroke="none"></ellipse>
                <ellipse cx="73" cy="77" rx="8.5" ry="11.5" transform="rotate(18 73 77)" fill="var(--ink)" stroke="none"></ellipse>
                <circle cx="48" cy="78" r="3.4" fill="#fff" stroke="none"></circle>
                <circle cx="72" cy="78" r="3.4" fill="#fff" stroke="none"></circle>
                <ellipse cx="60" cy="92" rx="4.6" ry="3.3" fill="var(--ink)" stroke="none"></ellipse>
                <path d="M60 95 v3 M60 98 q-5 4 -9 1 M60 98 q5 4 9 1" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round"></path>
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
                    <circle cx="31" cy="34" r="16" fill="currentColor" stroke="none"></circle>
                    <circle cx="89" cy="34" r="16" fill="currentColor" stroke="none"></circle>
                    <circle cx="60" cy="63" r="40" fill="currentColor" stroke="none"></circle>
                    <ellipse cx="45" cy="58" rx="11" ry="14.5" transform="rotate(-20 45 58)" fill="var(--ink)" stroke="none"></ellipse>
                    <ellipse cx="75" cy="58" rx="11" ry="14.5" transform="rotate(20 75 58)" fill="var(--ink)" stroke="none"></ellipse>
                    <circle cx="45" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
                    <circle cx="75" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
                    <ellipse cx="60" cy="73" rx="6" ry="4.3" fill="var(--ink)" stroke="none"></ellipse>
                    <path d="M60 77 v5 M60 82 q-7 6 -13 1 M60 82 q7 6 13 1" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round"></path>
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
  { name: 'Pikoyin', platform: 'YouTube', url: 'https://www.youtube.com/@Pikoyinn', img: '/judges/pikoyin.png' },
  { name: 'Furiyachan', platform: 'Smule', url: 'https://www.smule.com/Furiyachan', img: '/judges/furiyachan.jpg' },
  { pending: true },
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
                <circle cx="31" cy="34" r="16" fill="currentColor" stroke="none"></circle>
                <circle cx="89" cy="34" r="16" fill="currentColor" stroke="none"></circle>
                <circle cx="60" cy="63" r="40" fill="currentColor" stroke="none"></circle>
                <ellipse cx="45" cy="58" rx="11" ry="14.5" transform="rotate(-20 45 58)" fill="var(--ink)" stroke="none"></ellipse>
                <ellipse cx="75" cy="58" rx="11" ry="14.5" transform="rotate(20 75 58)" fill="var(--ink)" stroke="none"></ellipse>
                <circle cx="45" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
                <circle cx="75" cy="59" r="4.5" fill="#fff" stroke="none"></circle>
                <ellipse cx="60" cy="73" rx="6" ry="4.3" fill="var(--ink)" stroke="none"></ellipse>
                <path d="M60 77 v5 M60 82 q-7 6 -13 1 M60 82 q7 6 13 1" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round"></path>
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
              <div className="judge-ava"><img src={j.img} alt={j.name} loading="lazy" /></div>
              <div className="judge-name">{j.name}</div>
              <div className="judge-link">{j.platform} ↗</div>
            </a>
          )
        ))}
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
          <div className="d">The lights are hot and the bracket is waiting. Rally your team, find your voice, and see how far you can climb. Everyone's welcome, but only the bold step up.</div>
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
            <span className="l2">
              CH<span className="o-mascot"><span className="o-letter">O</span><span className="mascot-overlay" aria-hidden="true">
                <span className="mascot-ring">
                  <span className="mascot-hint">
                    <svg viewBox="0 0 120 120" fill="none" stroke="#ff2d2d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                      <g className="panda-body">
                        <ellipse cx="44" cy="54" rx="13" ry="17" transform="rotate(-20 44 54)" fill="#ff2d2d" stroke="none"></ellipse>
                        <ellipse cx="76" cy="54" rx="13" ry="17" transform="rotate(20 76 54)" fill="#ff2d2d" stroke="none"></ellipse>
                        <ellipse cx="60" cy="74" rx="7" ry="5" fill="#ff2d2d" stroke="none"></ellipse>
                        <path d="M60 78 v4 M60 82 q-7 6 -13 1 M60 82 q7 6 13 1" fill="none" stroke="#ff2d2d" strokeWidth="2.8" strokeLinecap="round"></path>
                      </g>
                      <g className="panda-eyes">
                        <circle className="eye" cx="45" cy="55" r="5.4" fill="#fff" stroke="none"></circle>
                        <circle className="eye" cx="75" cy="55" r="5.4" fill="#fff" stroke="none"></circle>
                      </g>
                    </svg>
                  </span>
                </span>
              </span></span>RUS <em>Battle</em>
            </span>
          </h1>
        </div>
        <div className="act">
          <span className="ln"></span>
          <span className="act-txt">ACT <em>1</em></span>
          <span className="ln"></span>
        </div>
        <p className="tagline">"Sing beyond limits."</p>
        <p className="subline">#SMULE · #SMUTAITES · #NKMA_CHORUSBATTLE</p>

        <div className="cta-row">
          <a className="btn btn-primary" href="https://forms.gle/beS1DQGHGpst4zJ39" target="_blank" rel="noopener">REGISTER TEAM ↗</a>
          <a className="btn btn-ghost" href="https://discord.gg/YujuKC9WXP" target="_blank" rel="noopener">JOIN DISCORD ↗</a>
        </div>

        <div className="hero-stats">
          <div className="s"><div className="n">16</div><div className="k">Teams advancing</div></div>
          <div className="s"><div className="n">5</div><div className="k">Stages</div></div>
          <div className="s"><div className="n">2:00</div><div className="k">Time cap</div></div>
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
        <div className="marquee">#NKMA</div>
        <small className="sponsor">This event is sponsored.</small>
      </footer>
    </React.Fragment>
  );
}

export default App;
