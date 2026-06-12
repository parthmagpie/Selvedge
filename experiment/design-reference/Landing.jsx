/* ============================================================
   LANDING PAGE
   ============================================================ */
function Landing({ go, favs, toggleFav }) {
  useReveal();
  const pick = (id) => LISTINGS.find(l => l.id === id);
  const heroTiles = ['belgian-linen-ecru', 'selvedge-indigo', 'merino-forest', 'silk-oxblood', 'corduroy-rust'].map(pick);
  const featured = ['belgian-linen-ecru', 'selvedge-indigo', 'silk-charmeuse-blush', 'tweed-olive',
                    'velvet-plum', 'hemp-twill-sage', 'wool-boucle-stone', 'linen-clay'].map(pick);
  const mills = Object.keys(FACTORIES);

  const [track, setTrack] = useState('buyers');
  const buyerSteps = [
    { n: '01', t: 'Browse by feel', d: 'Filter 4,000+ live yardages by material, color family, weight and price. Every roll is photographed and spec\u2019d.', icon: 'search' },
    { n: '02', t: 'Order the exact cut', d: 'Buy the precise yardage you need — no minimums, no pallet quantities. Small and irregular is the point.', icon: 'ruler' },
    { n: '03', t: 'Make something', d: 'Swatches ship in 48 hours, full cuts within a week. Each fabric carries its mill and fibre story.', icon: 'sparkle' },
  ];
  const factorySteps = [
    { n: '01', t: 'Photograph the roll', d: 'A worker snaps one photo on any phone. No measuring tape, no spec sheets, no data entry.', icon: 'camera' },
    { n: '02', t: 'AI writes the listing', d: 'Computer vision estimates material, texture, color family and yardage — a ready listing in seconds.', icon: 'sparkle' },
    { n: '03', t: 'Get paid', d: 'Approve and publish. We handle the storefront, logistics and payments. You keep 90% of every sale.', icon: 'check' },
  ];
  const steps = track === 'buyers' ? buyerSteps : factorySteps;

  const stats = [
    { v: '92M', u: 'tonnes', l: 'of textiles landfilled every year' },
    { v: '4,200+', u: 'rolls', l: 'rescued and re-homed to date' },
    { v: '38', u: 'mills', l: 'across 11 countries listing surplus' },
    { v: '90%', u: 'to makers', l: 'of every sale paid to the factory' },
  ];

  return (
    <div className="page-landing">
      {/* ===================== HERO ===================== */}
      <section className="hero">
        <div className="hero-bg-tile" aria-hidden="true">
          <FabricSwatch listing={pick('belgian-linen-ecru')} />
        </div>
        <div className="wrap hero-inner">
          <div className="hero-copy">
            <div className="eyebrow kicker-line reveal in">Premium deadstock, by the yard</div>
            <h1 className="display hero-title reveal in">
              The finest fabric<br />never made it<br /><em>off the floor.</em>
            </h1>
            <p className="hero-sub reveal in">
              The world&rsquo;s best mills leave behind small, irregular runs of pristine fabric that big
              brands can&rsquo;t use. Selvedge rescues that deadstock and routes it to the designers,
              students and upcyclers who will.
            </p>
            <div className="hero-cta reveal in">
              <button className="btn btn-primary btn-lg" onClick={() => go('#/browse')}>
                Browse fabrics <Icon name="arrow" size={18} style={{ marginLeft: -2 }} />
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => go('#/upload')}>List your inventory</button>
            </div>
            <div className="hero-trust reveal in">
              <div className="hero-avatars">
                {['silk-oxblood', 'merino-forest', 'denim-washed', 'tweed-olive'].map(id => (
                  <span key={id} className="hero-av"><FabricSwatch listing={pick(id)} sheen={false} /></span>
                ))}
              </div>
              <span><strong>4,200+ rolls</strong> rescued from landfill by a community of 9,000 makers</span>
            </div>
          </div>

          <div className="hero-collage reveal in">
            <div className="hc-tile hc-1"><FabricSwatch listing={heroTiles[0]} />
              <span className="hc-spec mono">100% linen</span></div>
            <div className="hc-tile hc-2"><FabricSwatch listing={heroTiles[1]} />
              <span className="hc-spec mono">14oz selvedge</span></div>
            <div className="hc-tile hc-3"><FabricSwatch listing={heroTiles[2]} /></div>
            <div className="hc-tile hc-4"><FabricSwatch listing={heroTiles[3]} /></div>
            <div className="hc-ai">
              <span className="hc-ai-dot" /> <span className="mono">AI&nbsp;·&nbsp;detected</span>
              <div className="hc-ai-row"><span>Material</span><b>Heavy Linen</b></div>
              <div className="hc-ai-row"><span>Color</span><b>Ecru / Neutral</b></div>
              <div className="hc-ai-row"><span>Est. yardage</span><b>~42 yd</b></div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MILL MARQUEE ===================== */}
      <section className="marquee-sec">
        <div className="wrap"><span className="eyebrow eyebrow-ink">Surplus from mills that supply the houses you know</span></div>
        <div className="marquee">
          <div className="marquee-track">
            {[...mills, ...mills].map((m, i) => <span key={i} className="marquee-item serif">{m}</span>)}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="section how" id="how">
        <div className="wrap">
          <div className="how-head reveal">
            <div>
              <div className="eyebrow">How it works</div>
              <h2 className="display sec-title">Two sides of one<br />circular loop.</h2>
            </div>
            <div className="how-tabs">
              <button className={track === 'buyers' ? 'on' : ''} onClick={() => setTrack('buyers')}>For designers</button>
              <button className={track === 'factories' ? 'on' : ''} onClick={() => setTrack('factories')}>For factories</button>
            </div>
          </div>
          <div className="how-grid">
            {steps.map((s, i) => (
              <div className="how-step reveal" key={s.n} style={{ transitionDelay: (i * 70) + 'ms' }}>
                <div className="how-step-top">
                  <span className="how-n mono">{s.n}</span>
                  <span className="how-ic"><Icon name={s.icon} size={22} /></span>
                </div>
                <h3 className="how-t">{s.t}</h3>
                <p>{s.d}</p>
              </div>
            ))}
          </div>
          <div className="how-foot reveal">
            {track === 'factories'
              ? <button className="btn btn-clay" onClick={() => go('#/upload')}>See the magic — upload a roll <Icon name="arrow" size={17} /></button>
              : <button className="btn btn-primary" onClick={() => go('#/browse')}>Start browsing <Icon name="arrow" size={17} /></button>}
          </div>
        </div>
      </section>

      {/* ===================== STATS BAND ===================== */}
      <section className="stats-band">
        <div className="wrap stats-grid">
          {stats.map((s, i) => (
            <div className="stat reveal" key={s.l} style={{ transitionDelay: (i * 60) + 'ms' }}>
              <div className="stat-v display">{s.v} <span className="stat-u mono">{s.u}</span></div>
              <div className="stat-l">{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== FEATURED ===================== */}
      <section className="section featured">
        <div className="wrap">
          <div className="feat-head reveal">
            <div>
              <div className="eyebrow">This week&rsquo;s arrivals</div>
              <h2 className="display sec-title">Freshly rescued.</h2>
            </div>
            <button className="btn btn-ghost" onClick={() => go('#/browse')}>View all 4,200 <Icon name="arrow" size={16} /></button>
          </div>
          <div className="feat-grid">
            {featured.map(l => <div className="reveal" key={l.id}><ListingCard listing={l} go={go} favs={favs} toggleFav={toggleFav} /></div>)}
          </div>
        </div>
      </section>

      {/* ===================== WHY NOW ===================== */}
      <section className="section why" id="why">
        <div className="why-tex" aria-hidden="true"><FabricSwatch listing={pick('merino-forest')} sheen={false} /></div>
        <div className="wrap why-inner">
          <div className="why-copy reveal">
            <div className="eyebrow" style={{ color: 'var(--clay-soft)' }}>Why now</div>
            <h2 className="display why-title">Waste just<br />became a<br /><em>liability.</em></h2>
            <p>
              From the EU&rsquo;s Extended Producer Responsibility rules to France&rsquo;s ban on
              destroying unsold textiles, the law is turning landfilled fabric from a write-off into a
              fine. Mills suddenly need a circular home for every leftover metre — and a paper trail to prove it.
            </p>
            <ul className="why-list">
              <li><Icon name="check" size={18} /> <span><b>EPR mandates</b> make producers pay for textile waste across the EU from 2025.</span></li>
              <li><Icon name="check" size={18} /> <span><b>Anti-destruction laws</b> now penalise incinerating or dumping unsold stock.</span></li>
              <li><Icon name="check" size={18} /> <span><b>Digital Product Passports</b> will require traceable fibre histories by 2027.</span></li>
            </ul>
            <p className="why-kicker">Selvedge turns that obligation into income — with the documentation built in.</p>
          </div>
          <div className="why-cards reveal">
            <div className="why-card">
              <div className="wc-big display">€0</div>
              <div className="wc-l">Cost to a mill to list. We take 10% only when a roll sells.</div>
            </div>
            <div className="why-card alt">
              <div className="wc-big display">100%</div>
              <div className="wc-l">Traceable. Every listing carries fibre, mill and origin data.</div>
            </div>
            <div className="why-card">
              <div className="wc-big display">48h</div>
              <div className="wc-l">From photo to live listing — including AI spec extraction.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== MAGIC MOMENT TEASER ===================== */}
      <section className="section magic">
        <div className="wrap magic-inner">
          <div className="magic-copy reveal">
            <div className="eyebrow">The magic moment</div>
            <h2 className="display sec-title">One photo.<br />A full listing<br />in seconds.</h2>
            <p>
              Factory floors don&rsquo;t have time for spreadsheets. A worker photographs a roll and our
              computer vision estimates material, texture, color family and approximate yardage —
              auto-drafting a listing before they&rsquo;ve put the phone down.
            </p>
            <button className="btn btn-clay btn-lg" onClick={() => go('#/upload')}>
              Try the upload flow <Icon name="camera" size={18} />
            </button>
          </div>
          <div className="magic-demo reveal">
            <div className="md-phone">
              <div className="md-photo"><FabricSwatch listing={pick('tweed-olive')} />
                <div className="md-scan" /></div>
              <div className="md-readout">
                <div className="md-row"><span className="mono">material</span><b>Lambswool Tweed</b></div>
                <div className="md-row"><span className="mono">texture</span><b>Flecked / Donegal</b></div>
                <div className="md-row"><span className="mono">color</span><b><span className="dot" style={{ background: COLORS.olive.dot, marginRight: 6 }} />Olive</b></div>
                <div className="md-row"><span className="mono">yardage</span><b>~16 yd</b></div>
                <div className="md-conf"><span className="mono">confidence 94%</span><span className="md-bar"><i style={{ width: '94%' }} /></span></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CLOSING CTA ===================== */}
      <section className="closing">
        <div className="closing-tex" aria-hidden="true">
          {heroTiles.map((l, i) => <FabricSwatch key={i} listing={l} sheen={false} />)}
        </div>
        <div className="wrap closing-inner reveal">
          <h2 className="display closing-title">Beautiful fabric<br />deserves a second cut.</h2>
          <div className="closing-cta">
            <button className="btn btn-light btn-lg" onClick={() => go('#/browse')}>Browse fabrics <Icon name="arrow" size={18} /></button>
            <button className="btn btn-clay btn-lg" onClick={() => go('#/upload')}>List your inventory <Icon name="upload" size={17} /></button>
          </div>
          <div className="closing-note mono">No listing fees · 10% only when you sell · Paid out weekly</div>
        </div>
      </section>
    </div>
  );
}
window.Landing = Landing;
