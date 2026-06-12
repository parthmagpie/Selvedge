/* ============================================================
   FABRICS — procedural CSS weave engine + marketplace data
   exported to window for cross-script use
   ============================================================ */

// ---- Color families (dominant + hi/lo for the weave) ----
const COLORS = {
  ecru:      { name: 'Ecru',        family: 'Neutral', base: '#D7CBB0', hi: '#E6DCC6', lo: '#BCAE8E', dot: '#CFC1A2' },
  oat:       { name: 'Oat',         family: 'Neutral', base: '#C7B48F', hi: '#D8C9A8', lo: '#A8946C', dot: '#C0AC85' },
  bone:      { name: 'Bone',        family: 'Neutral', base: '#E7DECB', hi: '#F2ECDD', lo: '#CBBFA5', dot: '#E2D8C2' },
  stone:     { name: 'Stone',       family: 'Grey',    base: '#9B968B', hi: '#B0AB9F', lo: '#7C786E', dot: '#97928700' },
  charcoal:  { name: 'Charcoal',    family: 'Grey',    base: '#3A372F', hi: '#4D4940', lo: '#26241E', dot: '#3A372F' },
  forest:    { name: 'Forest',      family: 'Green',   base: '#2F4034', hi: '#3E5444', lo: '#1F2C24', dot: '#2F4034' },
  sage:      { name: 'Sage',        family: 'Green',   base: '#8E9C83', hi: '#A4B099', lo: '#71805F', dot: '#8E9C83' },
  olive:     { name: 'Olive',       family: 'Green',   base: '#797649', hi: '#8E8B5C', lo: '#5C5A36', dot: '#797649' },
  indigo:    { name: 'Indigo',      family: 'Blue',    base: '#2D3A5C', hi: '#3D4D74', lo: '#1E2740', dot: '#2D3A5C' },
  denim:     { name: 'Washed Denim',family: 'Blue',    base: '#46618A', hi: '#5C79A4', lo: '#33496B', dot: '#46618A' },
  slate:     { name: 'Slate Teal',  family: 'Blue',    base: '#2C5552', hi: '#3C6C68', lo: '#1E3D3B', dot: '#2C5552' },
  clay:      { name: 'Clay',        family: 'Warm',    base: '#B5694A', hi: '#C9805F', lo: '#94503A', dot: '#B5694A' },
  rust:      { name: 'Rust',        family: 'Warm',    base: '#9A4D32', hi: '#B26143', lo: '#7A3A26', dot: '#9A4D32' },
  ochre:     { name: 'Ochre',       family: 'Warm',    base: '#C39A3F', hi: '#D6AE54', lo: '#9E7C2C', dot: '#C39A3F' },
  camel:     { name: 'Camel',       family: 'Warm',    base: '#B08A5B', hi: '#C29F72', lo: '#8F6F45', dot: '#B08A5B' },
  oxblood:   { name: 'Oxblood',     family: 'Red',     base: '#5E2A2C', hi: '#763A3C', lo: '#421C1E', dot: '#5E2A2C' },
  blush:     { name: 'Blush',       family: 'Pink',    base: '#D6A99F', hi: '#E4BEB4', lo: '#BB8B81', dot: '#D6A99F' },
  plum:      { name: 'Plum',        family: 'Purple',  base: '#5B3A52', hi: '#714C66', lo: '#412A3B', dot: '#5B3A52' },
};

// fix accidental alpha typo
COLORS.stone.dot = '#979287';

const COLOR_FAMILIES = ['Neutral','Grey','Green','Blue','Warm','Red','Pink','Purple'];

// ---- Weave renderers: return a React style object ----
function fabricBg(weave, key) {
  const c = COLORS[key] || COLORS.ecru;
  const { base, hi, lo } = c;
  let img, size, pos = '0 0';

  switch (weave) {
    case 'linen':
      img = `repeating-linear-gradient(90deg, ${lo}99 0 1px, transparent 1px 3px),
             repeating-linear-gradient(0deg, ${hi}aa 0 1px, transparent 1px 3px),
             repeating-linear-gradient(0deg, ${lo}55 0 1px, transparent 1px 6px)`;
      size = '3px 3px, 3px 3px, 6px 6px';
      break;
    case 'twill':
      img = `repeating-linear-gradient(48deg, ${lo}cc 0 2px, transparent 2px 5px),
             repeating-linear-gradient(48deg, ${hi}55 0 1px, transparent 1px 5px)`;
      size = '7px 7px, 7px 7px';
      break;
    case 'denim':
      img = `repeating-linear-gradient(45deg, ${hi}33 0 1px, transparent 1px 3px),
             repeating-linear-gradient(45deg, ${lo}aa 0 2px, transparent 2px 4px),
             repeating-linear-gradient(135deg, rgba(0,0,0,.10) 0 1px, transparent 1px 4px)`;
      size = '4px 4px, 5px 5px, 5px 5px';
      break;
    case 'herringbone':
      img = `repeating-linear-gradient(45deg, ${lo}aa 0 1.5px, transparent 1.5px 6px),
             repeating-linear-gradient(-45deg, ${lo}aa 0 1.5px, transparent 1.5px 6px),
             repeating-linear-gradient(45deg, ${hi}44 0 1px, transparent 1px 6px)`;
      size = '8px 8px, 8px 8px, 8px 8px';
      break;
    case 'rib':
      img = `repeating-linear-gradient(90deg, ${hi}88 0 2px, ${lo}66 2px 4px)`;
      size = '4px 4px';
      break;
    case 'corduroy':
      img = `repeating-linear-gradient(90deg, ${lo}cc 0 1px, ${hi}66 1px 4px, ${lo}aa 4px 6px, ${base} 6px 9px)`;
      size = '9px 9px';
      break;
    case 'boucle':
      img = `radial-gradient(circle at 50% 50%, ${hi}cc 0 24%, transparent 26%),
             radial-gradient(circle at 50% 50%, ${lo}cc 0 24%, transparent 26%),
             radial-gradient(circle at 50% 50%, ${hi}66 0 30%, transparent 32%)`;
      size = '6px 6px, 6px 6px, 9px 9px';
      pos = '0 0, 3px 3px, 1px 4px';
      break;
    case 'canvas':
      img = `repeating-linear-gradient(0deg, ${lo}aa 0 1.5px, transparent 1.5px 6px),
             repeating-linear-gradient(90deg, ${lo}aa 0 1.5px, transparent 1.5px 6px),
             repeating-linear-gradient(0deg, ${hi}55 0 1px, transparent 1px 6px)`;
      size = '6px 6px, 6px 6px, 6px 6px';
      break;
    case 'satin':
      img = `linear-gradient(120deg, ${hi}cc 0%, transparent 28%, ${lo}66 55%, transparent 78%, ${hi}99 100%),
             repeating-linear-gradient(0deg, ${lo}22 0 1px, transparent 1px 4px)`;
      size = '100% 100%, 4px 4px';
      break;
    case 'tweed':
      img = `radial-gradient(${hi} 14%, transparent 16%),
             radial-gradient(${lo} 14%, transparent 16%),
             radial-gradient(${base} 22%, transparent 24%),
             repeating-linear-gradient(48deg, ${lo}55 0 1px, transparent 1px 4px)`;
      size = '7px 7px, 7px 7px, 5px 5px, 6px 6px';
      pos = '0 0, 3.5px 3.5px, 2px 1px, 0 0';
      break;
    case 'flannel':
      img = `repeating-linear-gradient(0deg, ${lo}66 0 7px, transparent 7px 15px),
             repeating-linear-gradient(90deg, ${lo}66 0 7px, transparent 7px 15px),
             repeating-linear-gradient(0deg, ${hi}44 0 2px, transparent 2px 15px),
             repeating-linear-gradient(48deg, ${lo}33 0 1px, transparent 1px 4px)`;
      size = '15px 15px, 15px 15px, 15px 15px, 5px 5px';
      break;
    case 'velvet':
      img = `linear-gradient(105deg, rgba(255,255,255,.12) 0%, transparent 35%, rgba(0,0,0,.12) 75%),
             radial-gradient(130% 90% at 28% -10%, ${hi}88, transparent 55%),
             repeating-linear-gradient(90deg, ${lo}22 0 2px, transparent 2px 5px)`;
      size = '100% 100%, 100% 100%, 5px 5px';
      break;
    default:
      img = `repeating-linear-gradient(0deg, ${lo}55 0 1px, transparent 1px 4px)`;
      size = '4px 4px';
  }
  return { backgroundColor: base, backgroundImage: img, backgroundSize: size, backgroundPosition: pos };
}

// ---- Materials (drives the filter) ----
const MATERIALS = [
  'Linen', 'Cotton', 'Denim', 'Wool', 'Silk', 'Hemp', 'Velvet', 'Bouclé', 'Corduroy', 'Tweed',
];

// ---- Listings ----
const LISTINGS = [
  {
    id: 'belgian-linen-ecru', title: 'Belgian Heavy Linen', material: 'Linen', weave: 'linen',
    color: 'ecru', colorName: 'Ecru', yards: 42, width: 58, price: 14, weight: 245,
    factory: 'Maison Verdonck', location: 'Kortrijk, BE', composition: '100% European Flax',
    confidence: 96, addedDays: 2, badges: ['Mill-direct', 'OEKO-TEX'],
    story: 'End-of-run flax linen from a 1920s Flemish weaving house. Naturally slubbed, pre-washed for a soft drape.',
    care: 'Machine wash cold · Tumble low',
  },
  {
    id: 'selvedge-indigo', title: '14oz Selvedge Denim', material: 'Denim', weave: 'denim',
    color: 'indigo', colorName: 'Raw Indigo', yards: 28, width: 33, price: 19, weight: 475,
    factory: 'Okayama Loomworks', location: 'Okayama, JP', composition: '100% Cotton, rope-dyed',
    confidence: 94, addedDays: 1, badges: ['Selvedge ID', 'Shuttle-loomed'],
    story: 'Rope-dyed warp on vintage shuttle looms. The clean selvedge edge is intact across every yard.',
    care: 'Wash sparingly · Line dry',
  },
  {
    id: 'merino-forest', title: 'Brushed Merino Flannel', material: 'Wool', weave: 'flannel',
    color: 'forest', colorName: 'Forest', yards: 17, width: 60, price: 23, weight: 320,
    factory: 'Biella Fil Nobile', location: 'Biella, IT', composition: '90% Merino, 10% Cashmere',
    confidence: 91, addedDays: 4, badges: ['Traceable', 'Mulesing-free'],
    story: 'Overrun from an Italian tailoring contract. Soft brushed hand with a faint heathered check.',
    care: 'Dry clean only',
  },
  {
    id: 'silk-charmeuse-blush', title: 'Sandwashed Silk Charmeuse', material: 'Silk', weave: 'satin',
    color: 'blush', colorName: 'Blush', yards: 23, width: 45, price: 27, weight: 90,
    factory: 'Suzhou Mulberry Co.', location: 'Suzhou, CN', composition: '100% Mulberry Silk',
    confidence: 89, addedDays: 6, badges: ['Grade 6A', 'Low-impact dye'],
    story: 'A liquid, matte-faced charmeuse left over from a bridal capsule. Falls in a perfect bias drape.',
    care: 'Hand wash cold · Dry flat',
  },
  {
    id: 'organic-canvas-oat', title: 'Organic Cotton Canvas', material: 'Cotton', weave: 'canvas',
    color: 'oat', colorName: 'Oat', yards: 64, width: 56, price: 11, weight: 340,
    factory: 'Tiruppur Knit Collective', location: 'Tiruppur, IN', composition: '100% GOTS Organic Cotton',
    confidence: 97, addedDays: 3, badges: ['GOTS', 'Fair-trade'],
    story: 'Structured 10oz canvas from a tote-bag production surplus. Holds a crease, perfect for outerwear.',
    care: 'Machine wash warm',
  },
  {
    id: 'wool-boucle-stone', title: 'Chunky Wool Bouclé', material: 'Bouclé', weave: 'boucle',
    color: 'stone', colorName: 'Stone', yards: 12, width: 59, price: 31, weight: 410,
    factory: 'Prato Recycle Mill', location: 'Prato, IT', composition: '70% Recycled Wool, 30% Poly',
    confidence: 86, addedDays: 8, badges: ['Recycled', 'GRS'],
    story: 'Nubby looped bouclé spun from regenerated wool in Prato\u2019s historic recycling district.',
    care: 'Dry clean only',
  },
  {
    id: 'corduroy-rust', title: '8-Wale Cotton Corduroy', material: 'Corduroy', weave: 'corduroy',
    color: 'rust', colorName: 'Rust', yards: 31, width: 57, price: 13, weight: 360,
    factory: 'Tiruppur Knit Collective', location: 'Tiruppur, IN', composition: '98% Cotton, 2% Elastane',
    confidence: 93, addedDays: 5, badges: ['Stretch', 'Mill-direct'],
    story: 'A warm, mid-wale corduroy with a hint of stretch. Deadstock from a 70s-revival jacket run.',
    care: 'Machine wash cold · Iron pile-side down',
  },
  {
    id: 'herringbone-charcoal', title: 'Herringbone Suiting Wool', material: 'Wool', weave: 'herringbone',
    color: 'charcoal', colorName: 'Charcoal', yards: 19, width: 60, price: 21, weight: 290,
    factory: 'Biella Fil Nobile', location: 'Biella, IT', composition: '100% Virgin Wool',
    confidence: 90, addedDays: 7, badges: ['Traceable'],
    story: 'Classic 1cm herringbone in a deep charcoal. Tailoring-weight, with crisp recovery.',
    care: 'Dry clean only',
  },
  {
    id: 'hemp-twill-sage', title: 'Washed Hemp Twill', material: 'Hemp', weave: 'twill',
    color: 'sage', colorName: 'Sage', yards: 38, width: 55, price: 16, weight: 270,
    factory: 'Yunnan Bast Fibers', location: 'Kunming, CN', composition: '55% Hemp, 45% Organic Cotton',
    confidence: 92, addedDays: 9, badges: ['Low-water', 'Biodegradable'],
    story: 'A soft, broken-twill hemp blend that softens beautifully with every wash. Naturally antimicrobial.',
    care: 'Machine wash cold',
  },
  {
    id: 'velvet-plum', title: 'Cotton Pile Velvet', material: 'Velvet', weave: 'velvet',
    color: 'plum', colorName: 'Plum', yards: 14, width: 44, price: 24, weight: 310,
    factory: 'Lyon Soierie Atelier', location: 'Lyon, FR', composition: '100% Cotton pile',
    confidence: 87, addedDays: 11, badges: ['Mill-direct'],
    story: 'A deep, light-catching cotton velvet. Short dense pile, salvaged from a theatre-costume commission.',
    care: 'Dry clean · Steam only',
  },
  {
    id: 'poplin-slate', title: 'Crisp Cotton Poplin', material: 'Cotton', weave: 'rib',
    color: 'slate', colorName: 'Slate Teal', yards: 53, width: 57, price: 9, weight: 130,
    factory: 'Tiruppur Knit Collective', location: 'Tiruppur, IN', composition: '100% Combed Cotton',
    confidence: 95, addedDays: 3, badges: ['GOTS', 'Mill-direct'],
    story: 'A fine, cool-handed poplin with a subtle warp rib. Shirt-weight surplus, in a rare teal-slate.',
    care: 'Machine wash warm',
  },
  {
    id: 'tweed-olive', title: 'Donegal-Style Tweed', material: 'Tweed', weave: 'tweed',
    color: 'olive', colorName: 'Olive', yards: 16, width: 58, price: 26, weight: 380,
    factory: 'Galway Weft & Warp', location: 'Galway, IE', composition: '100% Lambswool',
    confidence: 85, addedDays: 13, badges: ['Traceable', 'Heritage loom'],
    story: 'Flecked lambswool tweed with neps of rust and cream. Woven on a heritage loom in the west of Ireland.',
    care: 'Dry clean only',
  },
  {
    id: 'linen-clay', title: 'Garment-Dyed Linen', material: 'Linen', weave: 'linen',
    color: 'clay', colorName: 'Clay', yards: 36, width: 56, price: 15, weight: 200,
    factory: 'Maison Verdonck', location: 'Kortrijk, BE', composition: '100% Washed Linen',
    confidence: 94, addedDays: 2, badges: ['OEKO-TEX', 'Garment-dyed'],
    story: 'Piece-dyed in small batches for a lived-in, sun-faded clay. A relaxed, breathable mid-weight.',
    care: 'Machine wash cold',
  },
  {
    id: 'denim-washed', title: '10oz Washed Chambray', material: 'Denim', weave: 'denim',
    color: 'denim', colorName: 'Washed Denim', yards: 44, width: 58, price: 12, weight: 300,
    factory: 'Okayama Loomworks', location: 'Okayama, JP', composition: '100% Cotton',
    confidence: 93, addedDays: 4, badges: ['Mill-direct'],
    story: 'A soft, stone-washed chambray with an airy hand. Lightweight enough for shirting and dresses.',
    care: 'Machine wash cold · Tumble low',
  },
  {
    id: 'wool-ochre', title: 'Felted Wool Melton', material: 'Wool', weave: 'flannel',
    color: 'ochre', colorName: 'Ochre', yards: 15, width: 60, price: 22, weight: 540,
    factory: 'Prato Recycle Mill', location: 'Prato, IT', composition: '80% Recycled Wool, 20% Nylon',
    confidence: 88, addedDays: 10, badges: ['Recycled', 'GRS'],
    story: 'A dense, felted melton with no fray and real warmth. Coating-weight surplus in a glowing ochre.',
    care: 'Dry clean only',
  },
  {
    id: 'silk-oxblood', title: 'Heavy Silk Satin', material: 'Silk', weave: 'satin',
    color: 'oxblood', colorName: 'Oxblood', yards: 21, width: 45, price: 29, weight: 140,
    factory: 'Lyon Soierie Atelier', location: 'Lyon, FR', composition: '100% Silk',
    confidence: 90, addedDays: 6, badges: ['Grade 6A', 'Mill-direct'],
    story: 'A weighty duchess-style satin with a deep luster. Salvaged from a couture eveningwear order.',
    care: 'Dry clean only',
  },
  {
    id: 'hemp-canvas-bone', title: 'Natural Hemp Canvas', material: 'Hemp', weave: 'canvas',
    color: 'bone', colorName: 'Bone', yards: 48, width: 54, price: 13, weight: 380,
    factory: 'Yunnan Bast Fibers', location: 'Kunming, CN', composition: '100% Hemp',
    confidence: 91, addedDays: 12, badges: ['Low-water', 'Biodegradable'],
    story: 'An undyed, rugged hemp canvas with visible texture. Stiff at first, it breaks in like fine leather.',
    care: 'Machine wash cold',
  },
  {
    id: 'cord-camel', title: 'Needlecord Velveteen', material: 'Corduroy', weave: 'corduroy',
    color: 'camel', colorName: 'Camel', yards: 27, width: 56, price: 14, weight: 280,
    factory: 'Lyon Soierie Atelier', location: 'Lyon, FR', composition: '100% Cotton',
    confidence: 92, addedDays: 8, badges: ['Mill-direct'],
    story: 'A fine 21-wale needlecord with a soft velveteen surface, in a warm vintage camel.',
    care: 'Machine wash cold · Iron pile-side down',
  },
];

// ---- Factories ----
const FACTORIES = {
  'Maison Verdonck':         { location: 'Kortrijk, Belgium', since: 1924, rolls: 38, rating: 4.9, certs: ['OEKO-TEX', 'European Flax'], blurb: 'A fourth-generation Flemish linen house weaving European flax since the 1920s.' },
  'Okayama Loomworks':       { location: 'Okayama, Japan',    since: 1968, rolls: 21, rating: 4.8, certs: ['Selvedge ID'],               blurb: 'Specialists in rope-dyed selvedge denim on restored vintage shuttle looms.' },
  'Biella Fil Nobile':       { location: 'Biella, Italy',     since: 1936, rolls: 44, rating: 4.9, certs: ['Traceable', 'Mulesing-free'],blurb: 'Fine worsted and woolen suitings from the historic mills of Biella.' },
  'Suzhou Mulberry Co.':     { location: 'Suzhou, China',     since: 1991, rolls: 17, rating: 4.7, certs: ['Grade 6A'],                  blurb: 'Mulberry silk weavers producing charmeuse, habotai and satin for luxury houses.' },
  'Tiruppur Knit Collective':{ location: 'Tiruppur, India',   since: 2009, rolls: 61, rating: 4.8, certs: ['GOTS', 'Fair-trade'],        blurb: 'A worker-owned collective of organic cotton mills in India\u2019s knit capital.' },
  'Prato Recycle Mill':      { location: 'Prato, Italy',      since: 1955, rolls: 29, rating: 4.6, certs: ['Recycled', 'GRS'],           blurb: 'Pioneers of regenerated wool in Prato\u2019s storied textile-recycling district.' },
  'Yunnan Bast Fibers':      { location: 'Kunming, China',    since: 2014, rolls: 33, rating: 4.7, certs: ['Low-water'],                 blurb: 'Hemp and bast-fibre growers turning low-impact crops into modern textiles.' },
  'Lyon Soierie Atelier':    { location: 'Lyon, France',      since: 1947, rolls: 24, rating: 4.8, certs: ['Mill-direct'],               blurb: 'A Lyonnais atelier of silk, velvet and fine pile fabrics for couture ateliers.' },
  'Galway Weft & Warp':      { location: 'Galway, Ireland',   since: 1972, rolls: 16, rating: 4.7, certs: ['Heritage loom'],             blurb: 'Heritage tweed weavers flecking lambswool on looms in the west of Ireland.' },
};

Object.assign(window, { COLORS, COLOR_FAMILIES, fabricBg, MATERIALS, LISTINGS, FACTORIES });
