/* ============================================================
   MARKETPLACE / BROWSE
   ============================================================ */
function Marketplace({ go, favs, toggleFav, initialFilter }) {
  useReveal();
  const [materials, setMaterials] = useState(new Set(initialFilter && initialFilter.material ? [initialFilter.material] : []));
  const [colorFams, setColorFams] = useState(new Set());
  const [maxPrice, setMaxPrice] = useState(30);
  const [minYards, setMinYards] = useState(0);
  const [sort, setSort] = useState('new');
  const [onlyFavs, setOnlyFavs] = useState(false);
  const [drawer, setDrawer] = useState(false);

  const toggleIn = (set, val, setter) => {
    const n = new Set(set); n.has(val) ? n.delete(val) : n.add(val); setter(n);
  };
  const clearAll = () => { setMaterials(new Set()); setColorFams(new Set()); setMaxPrice(30); setMinYards(0); setOnlyFavs(false); };

  const matCounts = useMemo(() => {
    const m = {}; LISTINGS.forEach(l => m[l.material] = (m[l.material] || 0) + 1); return m;
  }, []);

  const filtered = useMemo(() => {
    let r = LISTINGS.filter(l =>
      (materials.size === 0 || materials.has(l.material)) &&
      (colorFams.size === 0 || colorFams.has(COLORS[l.color].family)) &&
      l.price <= maxPrice &&
      l.yards >= minYards &&
      (!onlyFavs || (favs && favs.has(l.id)))
    );
    const s = {
      new: (a, b) => a.addedDays - b.addedDays,
      'price-lo': (a, b) => a.price - b.price,
      'price-hi': (a, b) => b.price - a.price,
      yards: (a, b) => b.yards - a.yards,
    }[sort];
    return [...r].sort(s);
  }, [materials, colorFams, maxPrice, minYards, sort, onlyFavs, favs]);

  const activeCount = materials.size + colorFams.size + (maxPrice < 30 ? 1 : 0) + (minYards > 0 ? 1 : 0) + (onlyFavs ? 1 : 0);

  const FilterPanel = () => (
    <div className="filters">
      <div className="filt-block">
        <div className="filt-h">Material</div>
        <div className="filt-checks">
          {MATERIALS.map(m => (
            <label key={m} className={'fcheck' + (materials.has(m) ? ' on' : '')}>
              <input type="checkbox" checked={materials.has(m)} onChange={() => toggleIn(materials, m, setMaterials)} />
              <span className="fbox"><Icon name="check" size={13} /></span>
              <span className="flabel">{m}</span>
              <span className="fcount mono">{matCounts[m] || 0}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="filt-block">
        <div className="filt-h">Color family</div>
        <div className="filt-swatches">
          {COLOR_FAMILIES.map(f => {
            const sample = Object.values(COLORS).find(c => c.family === f);
            const on = colorFams.has(f);
            return (
              <button key={f} className={'fswatch' + (on ? ' on' : '')} onClick={() => toggleIn(colorFams, f, setColorFams)}>
                <span className="fsw-dot" style={{ background: sample.dot }} />
                {f}
              </button>
            );
          })}
        </div>
      </div>

      <div className="filt-block">
        <div className="filt-h">Max price <span className="filt-val mono">${maxPrice}/yd</span></div>
        <input type="range" min="8" max="30" step="1" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="range" />
        <div className="range-ends mono"><span>$8</span><span>$30+</span></div>
      </div>

      <div className="filt-block">
        <div className="filt-h">Min yardage <span className="filt-val mono">{minYards} yd</span></div>
        <input type="range" min="0" max="60" step="2" value={minYards} onChange={e => setMinYards(+e.target.value)} className="range" />
        <div className="range-ends mono"><span>0</span><span>60+ yd</span></div>
      </div>

      <div className="filt-block">
        <label className={'ftoggle' + (onlyFavs ? ' on' : '')}>
          <input type="checkbox" checked={onlyFavs} onChange={() => setOnlyFavs(v => !v)} />
          <span className="ftog-track"><span className="ftog-knob" /></span>
          <span>Saved only <Icon name="heart" size={14} style={{ verticalAlign: '-2px' }} /></span>
        </label>
      </div>

      <button className="btn btn-ghost btn-sm filt-clear" onClick={clearAll} disabled={activeCount === 0}>
        Clear all{activeCount > 0 ? ` (${activeCount})` : ''}
      </button>
    </div>
  );

  return (
    <div className="page-browse">
      <div className="browse-head">
        <div className="wrap">
          <div className="eyebrow">The marketplace</div>
          <h1 className="display browse-title">Rescued fabric,<br />by the yard.</h1>
          <p className="browse-sub">Small, irregular, gorgeous. Every roll below is real deadstock from a working mill — photographed, spec&rsquo;d by AI, and ready to cut.</p>
        </div>
      </div>

      <div className="wrap browse-body">
        <aside className="browse-aside">
          <div className="aside-sticky"><FilterPanel /></div>
        </aside>

        <main className="browse-main">
          <div className="browse-bar">
            <div className="browse-count">
              <strong>{filtered.length}</strong> {filtered.length === 1 ? 'fabric' : 'fabrics'}
              <button className="filt-mobile-btn btn btn-ghost btn-sm" onClick={() => setDrawer(true)}>
                <Icon name="filter" size={15} /> Filters{activeCount > 0 ? ` · ${activeCount}` : ''}
              </button>
            </div>
            <div className="browse-sort">
              <label className="mono">Sort</label>
              <div className="select-wrap">
                <select value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="new">Newest</option>
                  <option value="price-lo">Price: low to high</option>
                  <option value="price-hi">Price: high to low</option>
                  <option value="yards">Most yardage</option>
                </select>
                <Icon name="arrow" size={14} style={{ transform: 'rotate(90deg)' }} />
              </div>
            </div>
          </div>

          {activeCount > 0 && (
            <div className="active-chips">
              {[...materials].map(m => <button key={'m' + m} className="chip" onClick={() => toggleIn(materials, m, setMaterials)}>{m} <Icon name="close" size={12} /></button>)}
              {[...colorFams].map(f => <button key={'c' + f} className="chip" onClick={() => toggleIn(colorFams, f, setColorFams)}>{f} <Icon name="close" size={12} /></button>)}
              {maxPrice < 30 && <button className="chip" onClick={() => setMaxPrice(30)}>&le; ${maxPrice}/yd <Icon name="close" size={12} /></button>}
              {minYards > 0 && <button className="chip" onClick={() => setMinYards(0)}>&ge; {minYards} yd <Icon name="close" size={12} /></button>}
              {onlyFavs && <button className="chip" onClick={() => setOnlyFavs(false)}>Saved <Icon name="close" size={12} /></button>}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="browse-empty">
              <Icon name="search" size={34} />
              <h3 className="serif">No fabric matches just yet</h3>
              <p>Try widening your filters — the inventory turns over fast.</p>
              <button className="btn btn-primary btn-sm" onClick={clearAll}>Clear filters</button>
            </div>
          ) : (
            <div className="browse-grid">
              {filtered.map(l => <div className="reveal in" key={l.id}><ListingCard listing={l} go={go} favs={favs} toggleFav={toggleFav} /></div>)}
            </div>
          )}
        </main>
      </div>

      {drawer && (
        <div className="drawer-scrim" onClick={() => setDrawer(false)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-head"><h3 className="serif">Filters</h3><button onClick={() => setDrawer(false)}><Icon name="close" /></button></div>
            <FilterPanel />
            <button className="btn btn-primary drawer-apply" onClick={() => setDrawer(false)}>Show {filtered.length} fabrics</button>
          </div>
        </div>
      )}
    </div>
  );
}
window.Marketplace = Marketplace;
