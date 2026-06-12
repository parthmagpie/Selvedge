/* ============================================================
   SHARED COMPONENTS — Nav, Footer, FabricSwatch, Icon, hooks
   ============================================================ */
const { useState, useEffect, useRef, useMemo } = React;

// ---------- Icons (thin line) ----------
const Icon = ({ name, size = 20, stroke = 1.6, style }) => {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
    strokeWidth: stroke, strokeLinecap: 'round', strokeLinejoin: 'round', style };
  const paths = {
    arrow:   <path d="M5 12h14M13 6l6 6-6 6" />,
    arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
    search:  <><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>,
    camera:  <><path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z" /><circle cx="12" cy="12.5" r="3.2" /></>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />,
    leaf:    <><path d="M11 20A7 7 0 0 1 4 13c0-6 7-9 16-9 0 9-3 16-9 16z" /><path d="M4 20c4-6 8-8 12-9" /></>,
    check:   <path d="M4 12l5 5L20 6" />,
    ruler:   <><rect x="3" y="8" width="18" height="8" rx="1" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></>,
    scale:   <><path d="M12 3v18M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zM19 7l-2.5 6a3 3 0 0 0 5 0L19 7z" /></>,
    pin:     <><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>,
    star:    <path d="M12 3l2.6 5.6L21 9.3l-4.5 4.2 1.1 6.1L12 16.8 6.4 19.6l1.1-6.1L3 9.3l6.4-.7L12 3z" />,
    heart:   <path d="M12 20s-7-4.5-9.2-9C1.3 8 2.8 4.7 6 4.7c2 0 3.2 1.3 4 2.5.8-1.2 2-2.5 4-2.5 3.2 0 4.7 3.3 3.2 6.3C19 15.5 12 20 12 20z" />,
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    filter:  <path d="M3 5h18M6 12h12M10 19h4" />,
    close:   <path d="M6 6l12 12M18 6L6 18" />,
    menu:    <path d="M3 6h18M3 12h18M3 18h18" />,
    upload:  <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
    bolt:    <path d="M13 2L4 14h6l-1 8 9-12h-6l1-8z" />,
    globe:   <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" /></>,
    plus:    <path d="M12 5v14M5 12h14" />,
    minus:   <path d="M5 12h14" />,
    eye:     <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
    layers:  <><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5" /></>,
    tag:     <><path d="M3 11l8-8 10 10-8 8L3 11z" /><circle cx="8" cy="8" r="1.4" /></>,
  };
  return <svg {...p}>{paths[name] || null}</svg>;
};

// ---------- Fabric swatch (procedural weave) ----------
function FabricSwatch({ listing, className = '', style = {}, grain = true, sheen = true, children }) {
  const bg = fabricBg(listing.weave, listing.color);
  return (
    <div className={'fabric ' + className} style={{ position: 'relative', overflow: 'hidden', ...bg, ...style }}>
      {grain && <div className="fabric-grain" />}
      {sheen && <div className="fabric-sheen" />}
      <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 60px rgba(0,0,0,.13)' }} />
      {children}
    </div>
  );
}

// ---------- Scroll reveal hook ----------
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    return () => io.disconnect();
  });
}

// ---------- Wordmark ----------
const Wordmark = ({ onClick, light }) => (
  <a href="#/" onClick={onClick} className="wordmark" style={{ color: light ? 'var(--paper)' : 'var(--ink)' }}>
    <span className="wm-mark" aria-hidden="true">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 6h18M3 6l3 13h12l3-13M8 6l1 13M16 6l-1 13M12 6v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
    Selvedge
  </a>
);

// ---------- Nav ----------
function Nav({ route, go, light = false }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const solid = scrolled || !light;
  const links = [
    { label: 'Browse fabrics', to: '#/browse' },
    { label: 'How it works', to: '#/#how' },
    { label: 'For factories', to: '#/upload' },
    { label: 'Our story', to: '#/#why' },
  ];
  const nav = (to, e) => { if (e) e.preventDefault(); go(to); setOpen(false); };
  return (
    <header className={'nav ' + (solid ? 'nav-solid' : 'nav-clear') + (scrolled ? ' nav-scrolled' : '')}>
      <div className="nav-inner wrap">
        <Wordmark light={light && !scrolled} onClick={(e) => nav('#/', e)} />
        <nav className="nav-links">
          {links.map(l => (
            <a key={l.to} href={l.to} onClick={(e) => nav(l.to, e)}
               style={{ color: (light && !scrolled) ? 'rgba(242,238,228,.82)' : 'var(--ink-soft)' }}>{l.label}</a>
          ))}
        </nav>
        <div className="nav-cta">
          <a href="#/browse" onClick={(e) => nav('#/browse', e)} className="nav-signin"
             style={{ color: (light && !scrolled) ? 'rgba(242,238,228,.82)' : 'var(--ink-soft)' }}>Sign in</a>
          <button className="btn btn-primary btn-sm" onClick={() => nav('#/upload')}>List your inventory</button>
        </div>
        <button className="nav-burger" aria-label="Menu" onClick={() => setOpen(o => !o)}
          style={{ color: (light && !scrolled) ? 'var(--paper)' : 'var(--ink)' }}>
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
      {open && (
        <div className="nav-mobile">
          {links.map(l => <a key={l.to} href={l.to} onClick={(e) => nav(l.to, e)}>{l.label}</a>)}
          <button className="btn btn-primary" onClick={() => nav('#/upload')}>List your inventory</button>
        </div>
      )}
    </header>
  );
}

// ---------- Footer ----------
function Footer({ go }) {
  const nav = (to, e) => { if (e) e.preventDefault(); go(to); };
  const cols = [
    { h: 'Marketplace', items: [['Browse fabrics', '#/browse'], ['New arrivals', '#/browse'], ['By material', '#/browse'], ['By color', '#/browse']] },
    { h: 'For factories', items: [['List inventory', '#/upload'], ['How it works', '#/#how'], ['Pricing', '#/#why'], ['Logistics', '#/upload']] },
    { h: 'Company', items: [['Our story', '#/#why'], ['Sustainability', '#/#why'], ['Journal', '#/'], ['Contact', '#/']] },
  ];
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-top">
          <div className="footer-brand">
            <Wordmark light onClick={(e) => nav('#/', e)} />
            <p>Rescuing premium deadstock from the world&rsquo;s best mills — and routing it to the designers who&rsquo;ll actually use it.</p>
            <div className="footer-badges">
              <span className="tag" style={{ color: 'rgba(242,238,228,.7)', borderColor: 'rgba(242,238,228,.2)', background: 'transparent' }}><Icon name="leaf" size={13} /> Climate-positive shipping</span>
              <span className="tag" style={{ color: 'rgba(242,238,228,.7)', borderColor: 'rgba(242,238,228,.2)', background: 'transparent' }}>B-Corp pending</span>
            </div>
          </div>
          {cols.map(c => (
            <div key={c.h} className="footer-col">
              <h4>{c.h}</h4>
              {c.items.map(([t, to]) => <a key={t} href={to} onClick={(e) => nav(to, e)}>{t}</a>)}
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>&copy; 2026 Selvedge Textiles, Inc.</span>
          <span className="mono">Premium deadstock, by the yard.</span>
          <div className="footer-legal"><a href="#/">Privacy</a><a href="#/">Terms</a><a href="#/">Cookies</a></div>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Icon, FabricSwatch, useReveal, Nav, Footer, Wordmark });
