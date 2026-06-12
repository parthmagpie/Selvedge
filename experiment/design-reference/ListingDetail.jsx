/* ============================================================
   LISTING DETAIL
   ============================================================ */
function ListingDetail({ id, go, favs, toggleFav }) {
  useReveal();
  const listing = LISTINGS.find(l => l.id === id) || LISTINGS[0];
  const c = COLORS[listing.color];
  const factory = FACTORIES[listing.factory];
  const [view, setView] = useState(0);
  const [qty, setQty] = useState(Math.min(4, listing.yards));
  const [added, setAdded] = useState(false);
  const isFav = favs && favs.has(listing.id);

  useEffect(() => { setView(0); setQty(Math.min(4, listing.yards)); setAdded(false); window.scrollTo(0, 0); }, [id]);

  // four "crops" of the same weave at different zooms
  const crops = [
    { scale: 1, label: 'Full' }, { scale: 2.4, label: 'Detail' },
    { scale: 4, label: 'Macro' }, { scale: 1.6, label: 'Drape' },
  ];

  const specs = [
    { k: 'Material', v: listing.title.replace(/^\d+(oz|-Wale|-Style)?\s*/i, ''), icon: 'layers' },
    { k: 'Composition', v: listing.composition, icon: 'tag' },
    { k: 'Weave / texture', v: listing.weave[0].toUpperCase() + listing.weave.slice(1), icon: 'grid' },
    { k: 'Color family', v: listing.colorName + ' · ' + c.family, icon: 'eye', dot: c.dot },
    { k: 'Weight', v: listing.weight + ' gsm', icon: 'scale' },
    { k: 'Usable width', v: listing.width + ' in', icon: 'ruler' },
    { k: 'Available', v: '~' + listing.yards + ' yd', icon: 'layers' },
  ];

  const related = LISTINGS.filter(l => l.id !== listing.id &&
    (l.material === listing.material || COLORS[l.color].family === c.family)).slice(0, 4);

  const total = (qty * listing.price).toFixed(0);

  return (
    <div className="page-detail">
      <div className="wrap detail-crumb">
        <a href="#/browse" onClick={(e) => { e.preventDefault(); go('#/browse'); }}>Marketplace</a>
        <span>/</span><span>{listing.material}</span><span>/</span>
        <span className="crumb-now">{listing.title}</span>
      </div>

      <div className="wrap detail-top">
        {/* ---------- Gallery ---------- */}
        <div className="detail-gallery">
          <div className="dg-main">
            <FabricSwatch listing={listing} style={{ transform: 'scale(' + crops[view].scale + ')' }} />
            <span className="dg-conf"><span className="hc-ai-dot" /><span className="mono">AI&nbsp;detected&nbsp;·&nbsp;{listing.confidence}%</span></span>
            <button className={'card-fav dg-fav' + (isFav ? ' on' : '')} onClick={() => toggleFav && toggleFav(listing.id)}>
              <Icon name="heart" size={18} />
            </button>
          </div>
          <div className="dg-thumbs">
            {crops.map((cr, i) => (
              <button key={i} className={'dg-thumb' + (i === view ? ' on' : '')} onClick={() => setView(i)}>
                <FabricSwatch listing={listing} style={{ transform: 'scale(' + cr.scale + ')' }} grain={false} />
                <span className="mono">{cr.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ---------- Buy panel ---------- */}
        <div className="detail-info">
          <div className="di-badges">
            {listing.badges.map(b => <span key={b} className="tag"><Icon name="leaf" size={12} /> {b}</span>)}
          </div>
          <h1 className="display detail-title">{listing.title}</h1>
          <div className="di-meta">
            <span className="dot" style={{ background: c.dot }} /> {listing.colorName}
            <span className="di-dot-sep">·</span> {listing.material}
            <span className="di-dot-sep">·</span> {listing.weight} gsm
          </div>
          <p className="di-story">{listing.story}</p>

          <div className="di-price-row">
            <div className="di-price display">${listing.price}<span className="di-per">/ yard</span></div>
            <div className="di-avail mono">{listing.yards} yd in stock</div>
          </div>

          <div className="di-buy">
            <div className="qty">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} aria-label="Less"><Icon name="minus" size={16} /></button>
              <span><b>{qty}</b> yd</span>
              <button onClick={() => setQty(q => Math.min(listing.yards, q + 1))} aria-label="More"><Icon name="plus" size={16} /></button>
            </div>
            <button className={'btn btn-primary di-add' + (added ? ' is-added' : '')} onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 2200); }}>
              {added ? <><Icon name="check" size={18} /> Added — ${total}</> : <>Add {qty} yd · ${total}</>}
            </button>
          </div>
          <div className="di-buy2">
            <button className="btn btn-ghost" onClick={() => { setView(1); }}>Order a swatch · $3</button>
            <button className="btn btn-ghost">Inquire about full roll</button>
          </div>
          <div className="di-reassure">
            <span><Icon name="check" size={15} /> Swatches ship in 48h</span>
            <span><Icon name="check" size={15} /> 10% supports the mill</span>
            <span><Icon name="check" size={15} /> Carbon-neutral delivery</span>
          </div>
        </div>
      </div>

      {/* ---------- Specs + Origin ---------- */}
      <div className="wrap detail-lower">
        <div className="detail-specs reveal">
          <div className="ds-head">
            <div className="eyebrow">AI-extracted specification</div>
            <span className="ds-stamp mono">computer-vision draft · mill-verified</span>
          </div>
          <div className="specs-grid">
            {specs.map(s => (
              <div className="spec-cell" key={s.k}>
                <span className="spec-ic"><Icon name={s.icon} size={17} /></span>
                <div>
                  <div className="spec-k mono">{s.k}</div>
                  <div className="spec-v">{s.dot && <span className="dot" style={{ background: s.dot, marginRight: 7, verticalAlign: '-1px' }} />}{s.v}</div>
                </div>
              </div>
            ))}
            <div className="spec-cell spec-care">
              <span className="spec-ic"><Icon name="sparkle" size={17} /></span>
              <div><div className="spec-k mono">Care</div><div className="spec-v">{listing.care}</div></div>
            </div>
          </div>
        </div>

        <div className="detail-origin reveal">
          <div className="eyebrow" style={{ marginBottom: 18 }}>Origin</div>
          <div className="origin-card">
            <div className="origin-tex"><FabricSwatch listing={listing} sheen={false} /></div>
            <div className="origin-body">
              <h3 className="serif">{listing.factory}</h3>
              <div className="origin-loc"><Icon name="pin" size={14} /> {factory.location}</div>
              <p>{factory.blurb}</p>
              <div className="origin-stats">
                <div><b className="display">{factory.since}</b><span>Weaving since</span></div>
                <div><b className="display">{factory.rolls}</b><span>Rolls listed</span></div>
                <div><b className="display">{factory.rating}</b><span><Icon name="star" size={12} style={{ verticalAlign: '-1px', color: 'var(--gold)' }} /> rating</span></div>
              </div>
              <div className="origin-certs">{factory.certs.map(ct => <span key={ct} className="tag">{ct}</span>)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Related ---------- */}
      <div className="wrap section detail-related">
        <div className="feat-head reveal in">
          <div><div className="eyebrow">You may also like</div><h2 className="display sec-title">In the same family.</h2></div>
          <button className="btn btn-ghost" onClick={() => go('#/browse')}>Back to marketplace <Icon name="arrow" size={16} /></button>
        </div>
        <div className="feat-grid">
          {related.map(l => <div className="reveal in" key={l.id}><ListingCard listing={l} go={go} favs={favs} toggleFav={toggleFav} /></div>)}
        </div>
      </div>
    </div>
  );
}
window.ListingDetail = ListingDetail;
