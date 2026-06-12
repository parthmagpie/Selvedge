/* ============================================================
   FACTORY UPLOAD FLOW — the "magic moment"
   step machine: choose -> analyzing -> review -> published
   ============================================================ */
function FactoryUpload({ go }) {
  const [step, setStep] = useState('choose');         // choose | analyzing | review | published
  const [sourceId, setSourceId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);              // analysis phase index
  const [fields, setFields] = useState(null);
  const fileRef = useRef(null);

  // Sample rolls a worker could "photograph"
  const samples = ['merino-forest', 'selvedge-indigo', 'velvet-plum', 'organic-canvas-oat', 'tweed-olive', 'silk-charmeuse-blush']
    .map(id => LISTINGS.find(l => l.id === id));

  const phases = ['Reading weave structure', 'Classifying fibre & material', 'Sampling colour family', 'Estimating roll yardage', 'Drafting your listing'];

  const begin = (listing) => {
    setSourceId(listing.id);
    setStep('analyzing');
    setProgress(0); setPhase(0);
  };

  // drive the analysis animation
  useEffect(() => {
    if (step !== 'analyzing') return;
    let p = 0;
    const prog = setInterval(() => {
      p = Math.min(100, p + (2 + Math.random() * 4));
      setProgress(p);
      setPhase(Math.min(phases.length - 1, Math.floor(p / (100 / phases.length))));
      if (p >= 100) clearInterval(prog);
    }, 95);
    const done = setTimeout(() => {
      const l = LISTINGS.find(x => x.id === sourceId);
      const c = COLORS[l.color];
      setFields({
        material: l.material,
        texture: l.weave[0].toUpperCase() + l.weave.slice(1),
        composition: l.composition,
        colorName: l.colorName, color: l.color, family: c.family,
        yards: l.yards, width: l.width, weight: l.weight,
        price: l.price, title: l.title, confidence: l.confidence,
      });
      setStep('review');
    }, 4400);
    return () => { clearInterval(prog); clearTimeout(done); };
  }, [step, sourceId]);

  const source = sourceId ? LISTINGS.find(l => l.id === sourceId) : null;
  const upd = (k, v) => setFields(f => ({ ...f, [k]: v }));

  const Stepper = () => {
    const idx = { choose: 0, analyzing: 1, review: 1, published: 2 }[step];
    const labels = ['Photograph', 'AI drafts it', 'Publish'];
    return (
      <div className="up-stepper">
        {labels.map((l, i) => (
          <React.Fragment key={l}>
            <div className={'ust' + (i <= idx ? ' done' : '') + (i === idx ? ' now' : '')}>
              <span className="ust-dot">{i < idx ? <Icon name="check" size={13} /> : i + 1}</span>{l}
            </div>
            {i < labels.length - 1 && <span className={'ust-line' + (i < idx ? ' done' : '')} />}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="page-upload">
      <div className="up-hero-bg" aria-hidden="true" />
      <div className="wrap up-wrap">
        <div className="up-head">
          <div className="eyebrow" style={{ color: 'var(--clay-soft)' }}>For factories</div>
          <h1 className="display up-title">List a roll in the time<br />it takes to photograph it.</h1>
          <p className="up-sub">No measuring. No spec sheets. No data entry. Point, shoot, publish — our computer vision does the paperwork.</p>
        </div>

        <Stepper />

        <div className="up-stage">
          {/* ---------------- CHOOSE ---------------- */}
          {step === 'choose' && (
            <div className="up-choose">
              <button className="up-drop" onClick={() => fileRef.current && fileRef.current.click()}>
                <span className="up-drop-ic"><Icon name="camera" size={30} /></span>
                <strong>Photograph a fabric roll</strong>
                <span className="up-drop-sub">Drag a photo here, or tap to use your camera</span>
                <span className="btn btn-clay btn-sm" style={{ marginTop: 6, pointerEvents: 'none' }}>Open camera</span>
              </button>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={() => begin(samples[Math.floor(Math.random() * samples.length)])} />
              <div className="up-or"><span>or try it with a sample roll</span></div>
              <div className="up-samples">
                {samples.map(l => (
                  <button key={l.id} className="up-sample" onClick={() => begin(l)}>
                    <FabricSwatch listing={l} />
                    <span className="up-sample-tag mono">{l.material}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---------------- ANALYZING ---------------- */}
          {step === 'analyzing' && source && (
            <div className="up-analyzing">
              <div className="up-scanwrap">
                <FabricSwatch listing={source} />
                <div className="up-scan-grid" />
                <div className="md-scan up-scanline" />
                <div className="up-retics"><span /><span /><span /><span /></div>
              </div>
              <div className="up-analyzing-side">
                <div className="up-ai-label mono"><span className="hc-ai-dot" /> ANALYSING IMAGE</div>
                <div className="up-progress"><i style={{ width: progress + '%' }} /></div>
                <div className="up-progress-pct mono">{Math.round(progress)}%</div>
                <ul className="up-phases">
                  {phases.map((p, i) => (
                    <li key={p} className={i < phase ? 'done' : (i === phase ? 'active' : '')}>
                      <span className="uph-ic">{i < phase ? <Icon name="check" size={13} /> : (i === phase ? <span className="uph-spin" /> : <span className="uph-pend" />)}</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ---------------- REVIEW ---------------- */}
          {step === 'review' && fields && source && (
            <div className="up-review">
              <div className="up-review-photo">
                <FabricSwatch listing={source} />
                <div className="up-conf-badge">
                  <div className="mono">AI confidence</div>
                  <div className="up-conf-num display">{fields.confidence}%</div>
                  <div className="up-conf-bar"><i style={{ width: fields.confidence + '%' }} /></div>
                  <button className="up-retake" onClick={() => setStep('choose')}><Icon name="camera" size={14} /> Retake</button>
                </div>
              </div>
              <div className="up-form">
                <div className="up-form-head">
                  <h3 className="serif">We drafted your listing.</h3>
                  <p>Everything below was filled in by AI. Tweak anything, then publish.</p>
                </div>

                <label className="uf-field uf-full">
                  <span className="uf-k">Listing title <i className="uf-ai mono">AI</i></span>
                  <input value={fields.title} onChange={e => upd('title', e.target.value)} />
                </label>

                <div className="uf-row">
                  <label className="uf-field">
                    <span className="uf-k">Material <i className="uf-ai mono">AI</i></span>
                    <div className="select-wrap">
                      <select value={fields.material} onChange={e => upd('material', e.target.value)}>
                        {MATERIALS.map(m => <option key={m}>{m}</option>)}
                      </select>
                      <Icon name="arrow" size={13} style={{ transform: 'rotate(90deg)' }} />
                    </div>
                  </label>
                  <label className="uf-field">
                    <span className="uf-k">Texture / weave <i className="uf-ai mono">AI</i></span>
                    <input value={fields.texture} onChange={e => upd('texture', e.target.value)} />
                  </label>
                </div>

                <label className="uf-field uf-full">
                  <span className="uf-k">Colour family <i className="uf-ai mono">AI</i></span>
                  <div className="uf-colors">
                    {Object.entries(COLORS).map(([key, col]) => (
                      <button key={key} type="button" title={col.name}
                        className={'uf-color' + (fields.color === key ? ' on' : '')}
                        style={{ background: col.dot }} onClick={() => upd('color', key) || upd('colorName', col.name)}
                        onMouseDown={() => { upd('color', key); upd('colorName', col.name); upd('family', col.family); }} />
                    ))}
                  </div>
                  <span className="uf-colorname mono">{fields.colorName} · {fields.family}</span>
                </label>

                <div className="uf-row uf-row-3">
                  <label className="uf-field">
                    <span className="uf-k">Yardage <i className="uf-ai mono">AI</i></span>
                    <div className="uf-unit"><input type="number" value={fields.yards} onChange={e => upd('yards', +e.target.value)} /><span>yd</span></div>
                  </label>
                  <label className="uf-field">
                    <span className="uf-k">Width <i className="uf-ai mono">AI</i></span>
                    <div className="uf-unit"><input type="number" value={fields.width} onChange={e => upd('width', +e.target.value)} /><span>in</span></div>
                  </label>
                  <label className="uf-field">
                    <span className="uf-k">Weight <i className="uf-ai mono">AI</i></span>
                    <div className="uf-unit"><input type="number" value={fields.weight} onChange={e => upd('weight', +e.target.value)} /><span>gsm</span></div>
                  </label>
                </div>

                <div className="uf-price">
                  <div>
                    <span className="uf-k">Your price <i className="uf-ai mono">suggested</i></span>
                    <div className="uf-unit uf-price-in"><span className="uf-cur">$</span><input type="number" value={fields.price} onChange={e => upd('price', +e.target.value)} /><span>/yd</span></div>
                  </div>
                  <div className="uf-payout">
                    <div className="uf-payout-l mono">You receive (90%)</div>
                    <div className="uf-payout-v display">${(fields.price * fields.yards * 0.9).toFixed(0)}</div>
                    <div className="uf-payout-s">on full sell-through of {fields.yards} yd</div>
                  </div>
                </div>

                <button className="btn btn-clay btn-lg up-publish" onClick={() => { setStep('published'); window.scrollTo(0, 0); }}>
                  Publish listing <Icon name="arrow" size={18} />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- PUBLISHED ---------------- */}
          {step === 'published' && fields && source && (
            <div className="up-published">
              <div className="up-pub-check"><Icon name="check" size={40} /></div>
              <h2 className="display">You&rsquo;re live.</h2>
              <p>Your roll is now in front of 9,000 designers. We&rsquo;ll email you the moment it sells — and handle the shipping label.</p>
              <div className="up-pub-card">
                <ListingCard listing={{ ...source, title: fields.title, material: fields.material, color: fields.color, colorName: fields.colorName, yards: fields.yards, price: fields.price, location: FACTORIES[source.factory].location, badges: source.badges }} go={() => {}} favs={new Set()} toggleFav={() => {}} />
                <div className="up-pub-meta">
                  <span className="tag" style={{ background: 'var(--forest)', color: 'var(--paper)', borderColor: 'transparent' }}><span className="hc-ai-dot" style={{ background: 'var(--clay-soft)' }} /> Live now</span>
                  <div className="up-pub-line"><span className="mono">Listed</span><b>just now · {fields.confidence}% AI confidence</b></div>
                  <div className="up-pub-line"><span className="mono">Potential payout</span><b>${(fields.price * fields.yards * 0.9).toFixed(0)} at full sell-through</b></div>
                </div>
              </div>
              <div className="up-pub-cta">
                <button className="btn btn-primary btn-lg" onClick={() => { setStep('choose'); setSourceId(null); setFields(null); }}>List another roll</button>
                <button className="btn btn-ghost btn-lg" onClick={() => go('#/browse')}>See it in the marketplace <Icon name="arrow" size={16} /></button>
              </div>
            </div>
          )}
        </div>

        {step === 'choose' && (
          <div className="up-feats">
            <div className="up-feat"><span className="up-feat-ic"><Icon name="bolt" size={20} /></span><b>~8 seconds</b><span>average time from photo to a ready-to-publish draft</span></div>
            <div className="up-feat"><span className="up-feat-ic"><Icon name="sparkle" size={20} /></span><b>4 specs, auto</b><span>material, texture, colour and yardage detected for you</span></div>
            <div className="up-feat"><span className="up-feat-ic"><Icon name="leaf" size={20} /></span><b>90% to you</b><span>keep the lion&rsquo;s share — we take 10% only on a sale</span></div>
          </div>
        )}
      </div>
    </div>
  );
}
window.FactoryUpload = FactoryUpload;
