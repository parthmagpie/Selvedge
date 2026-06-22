"use client";

import { useEffect, useState, useCallback, KeyboardEvent } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { trackViewListing, trackAddToCart } from "@/lib/events";
import { useCart } from "@/lib/cart-context";
import type { FabricRow, FactoryRow } from "@/lib/types";
import {
  ArrowLeft,
  Heart,
  Share2,
  ZoomIn,
  ZoomOut,
  Minus,
  Plus,
  Sparkles,
  Check,
  ShoppingBag,
  MapPin,
  Scale,
  Ruler,
  Package,
} from "lucide-react";

// --- Demo fixtures (canonical fixture ownership per #1069) ---
// IDs must match browse page fixtures for cross-page consistency.
const SAMPLE_FABRICS: (FabricRow & { factory: FactoryRow })[] = [
  {
    id: "fab-001",
    title: "Japanese Selvedge Denim",
    material: "Cotton",
    weave_type: "Twill",
    color_family: "Indigo",
    price_per_yard: 48,
    yards_available: 12,
    width_inches: 34,
    weight_gsm: 380,
    factory_id: "kurabo-mills",
    image_url: "/images/feature-1.webp",
    ai_confidence: 94,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "kurabo-mills",
      name: "Kurabo Mills",
      location: "Osaka",
      country: "Japan",
      certifications: ["JIS", "ISO 9001"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-002",
    title: "Irish Linen Natural",
    material: "Linen",
    weave_type: "Plain",
    color_family: "Bone",
    price_per_yard: 62,
    yards_available: 8,
    width_inches: 58,
    weight_gsm: 180,
    factory_id: "thomas-ferguson",
    image_url: "/images/feature-2.webp",
    ai_confidence: 97,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "thomas-ferguson",
      name: "Thomas Ferguson",
      location: "Ulster",
      country: "Ireland",
      certifications: ["OEKO-TEX", "Masters of Linen"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-003",
    title: "Pendleton Wool Flannel",
    material: "Wool",
    weave_type: "Flannel",
    color_family: "Forest",
    price_per_yard: 78,
    yards_available: 6,
    width_inches: 60,
    weight_gsm: 420,
    factory_id: "pendleton-woolen",
    image_url: "/images/hero.webp",
    ai_confidence: 91,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "pendleton-woolen",
      name: "Pendleton Woolen Mills",
      location: "Oregon",
      country: "USA",
      certifications: ["Woolmark", "B Corp"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-004",
    title: "Burgundy Duchess Satin",
    material: "Silk",
    weave_type: "Satin",
    color_family: "Burgundy",
    price_per_yard: 95,
    yards_available: 4,
    width_inches: 45,
    weight_gsm: 95,
    factory_id: "como-silk",
    image_url: "/images/feature-3.webp",
    ai_confidence: 89,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "como-silk",
      name: "Como Silk",
      location: "Como",
      country: "Italy",
      certifications: ["GOTS", "OEKO-TEX"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-005",
    title: "Vintage Cotton Corduroy",
    material: "Cotton",
    weave_type: "Corduroy",
    color_family: "Rust",
    price_per_yard: 38,
    yards_available: 15,
    width_inches: 54,
    weight_gsm: 320,
    factory_id: "cone-mills",
    image_url: "/images/feature-1.webp",
    ai_confidence: 88,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "cone-mills",
      name: "Cone Mills Archive",
      location: "North Carolina",
      country: "USA",
      certifications: ["BCI", "WRAP"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-006",
    title: "Harris Tweed Herringbone",
    material: "Wool",
    weave_type: "Tweed",
    color_family: "Moss",
    price_per_yard: 110,
    yards_available: 3,
    width_inches: 60,
    weight_gsm: 450,
    factory_id: "harris-tweed",
    image_url: "/images/hero.webp",
    ai_confidence: 96,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "harris-tweed",
      name: "Harris Tweed Hebrides",
      location: "Isle of Lewis",
      country: "Scotland",
      certifications: ["Harris Tweed Authority", "Protected GI"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-007",
    title: "Belgian Flax Linen",
    material: "Linen",
    weave_type: "Plain",
    color_family: "Oatmeal",
    price_per_yard: 55,
    yards_available: 9,
    width_inches: 60,
    weight_gsm: 200,
    factory_id: "libeco-lagae",
    image_url: "/images/feature-2.webp",
    ai_confidence: 93,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "libeco-lagae",
      name: "Libeco Lagae",
      location: "Meulebeke",
      country: "Belgium",
      certifications: ["Masters of Linen", "OEKO-TEX"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
  {
    id: "fab-008",
    title: "Raw Selvedge Denim",
    material: "Cotton",
    weave_type: "Twill",
    color_family: "Indigo",
    price_per_yard: 42,
    yards_available: 18,
    width_inches: 32,
    weight_gsm: 340,
    factory_id: "white-oak",
    image_url: "/images/feature-1.webp",
    ai_confidence: 92,
    status: "active",
    created_at: new Date().toISOString(),
    factory: {
      id: "white-oak",
      name: "White Oak Remnants",
      location: "North Carolina",
      country: "USA",
      certifications: ["BCI", "Cone Denim"],
      logo_url: null,
      created_at: new Date().toISOString(),
    },
  },
];

// Zoom levels for the gallery
const ZOOM_LEVELS = [1, 1.5, 2, 3] as const;
type ZoomLevel = (typeof ZOOM_LEVELS)[number];

// AI Spec sheet field configuration
type AISpecField = {
  key: string;
  label: string;
  icon: typeof Package | typeof Sparkles | typeof Scale | typeof Ruler | null;
  suffix?: string;
};

const AI_SPEC_FIELDS: AISpecField[] = [
  { key: "material", label: "Material", icon: Package },
  { key: "composition", label: "Composition", icon: Sparkles },
  { key: "weave_type", label: "Weave", icon: Scale },
  { key: "color_family", label: "Color", icon: null },
  { key: "weight_gsm", label: "Weight", icon: Scale, suffix: " GSM" },
  { key: "width_inches", label: "Width", icon: Ruler, suffix: '"' },
];

function getComposition(material: string): string {
  const compositions: Record<string, string> = {
    Wool: "100% Virgin Wool",
    Cotton: "100% Organic Cotton",
    Linen: "100% European Flax",
    Silk: "100% Mulberry Silk",
    Cashmere: "100% Mongolian Cashmere",
    Blend: "Mixed Natural Fibers",
  };
  return compositions[material] ?? "Natural Fiber Blend";
}

// Roving tabIndex helper for custom radio clusters (#1380 accessibility)
function rovingTabIndex<T extends string | number>(
  values: ReadonlyArray<T>,
  current: T | null,
  index: number
): 0 | -1 {
  if (current === null) return index === 0 ? 0 : -1;
  return values[index] === current ? 0 : -1;
}

// Keyboard handler for custom radio clusters (#1380 accessibility)
function handleRadioGroupKey<T extends string | number>(
  event: KeyboardEvent<HTMLElement>,
  values: ReadonlyArray<T>,
  current: T | null,
  onChange: (v: T) => void
): void {
  const last = values.length - 1;
  if (last < 0) return;
  const currentIdx = current === null ? 0 : Math.max(0, values.indexOf(current));
  let nextIdx: number | null = null;
  switch (event.key) {
    case "ArrowRight":
    case "ArrowDown":
      nextIdx = currentIdx === last ? 0 : currentIdx + 1;
      break;
    case "ArrowLeft":
    case "ArrowUp":
      nextIdx = currentIdx === 0 ? last : currentIdx - 1;
      break;
    case "Home":
      nextIdx = 0;
      break;
    case "End":
      nextIdx = last;
      break;
    default:
      return;
  }
  if (nextIdx === null) return;
  event.preventDefault();
  onChange(values[nextIdx]);
  const container = (event.currentTarget as HTMLElement).parentElement;
  (container?.children[nextIdx] as HTMLElement | undefined)?.focus();
}

export default function ListingDetailPage() {
  const params = useParams();
  const id = params?.id as string | undefined;
  const { addToCart } = useCart();

  // State
  const [fabric, setFabric] = useState<(FabricRow & { factory: FactoryRow }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>(1);
  const [yards, setYards] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  // Load fabric data (demo mode uses fixtures)
  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Simulate loading
    const timer = setTimeout(() => {
      const found = SAMPLE_FABRICS.find((f) => f.id === id);
      setFabric(found ?? SAMPLE_FABRICS[0]);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [id]);

  // Fire view_listing event when fabric loads
  useEffect(() => {
    if (fabric && !loading) {
      trackViewListing({ listing_id: fabric.id, material: fabric.material });
    }
  }, [fabric, loading]);

  // Load favorites from localStorage
  useEffect(() => {
    if (!fabric) return;
    try {
      const favorites = JSON.parse(localStorage.getItem("selvedge_favorites") ?? "[]");
      setIsFavorited(favorites.includes(fabric.id));
    } catch {
      // localStorage unavailable
    }
  }, [fabric]);

  // Handlers
  const handleYardsChange = useCallback(
    (delta: number) => {
      if (!fabric) return;
      setYards((prev) => {
        const next = prev + delta;
        // Clamp to available stock
        return Math.max(0.5, Math.min(next, fabric.yards_available));
      });
    },
    [fabric]
  );

  const handleAddToCart = useCallback(() => {
    if (!fabric) return;
    // Add to cart context
    addToCart({
      id: fabric.id,
      title: fabric.title,
      material: fabric.material,
      pricePerYard: fabric.price_per_yard,
      yards,
      imageUrl: fabric.image_url,
      factoryName: fabric.factory.name,
    });
    // Track analytics
    trackAddToCart({
      listing_id: fabric.id,
      yards,
      price_per_yard: fabric.price_per_yard,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [fabric, yards, addToCart]);

  const handleToggleFavorite = useCallback(() => {
    if (!fabric) return;
    try {
      const favorites: string[] = JSON.parse(localStorage.getItem("selvedge_favorites") ?? "[]");
      if (isFavorited) {
        const filtered = favorites.filter((f) => f !== fabric.id);
        localStorage.setItem("selvedge_favorites", JSON.stringify(filtered));
      } else {
        favorites.push(fabric.id);
        localStorage.setItem("selvedge_favorites", JSON.stringify(favorites));
      }
      setIsFavorited(!isFavorited);
    } catch {
      // localStorage unavailable
    }
  }, [fabric, isFavorited]);

  const handleShare = useCallback(async () => {
    if (!fabric) return;
    try {
      await navigator.share({
        title: fabric.title,
        text: `Check out this fabric: ${fabric.title}`,
        url: window.location.href,
      });
    } catch {
      // Share not supported or cancelled
      await navigator.clipboard.writeText(window.location.href);
    }
  }, [fabric]);

  // Calculate total price
  const totalPrice = fabric ? (yards * fabric.price_per_yard).toFixed(2) : "0.00";

  if (loading) {
    return <ListingDetailSkeleton />;
  }

  if (!fabric) {
    return (
      <div className="min-h-screen bg-bone flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-ink">Fabric not found</h1>
          <Link href="/browse" className={buttonVariants({ variant: "default" })}>
            Browse fabrics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bone overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-bone/95 backdrop-blur-sm border-b border-line">
        <div className="wrap py-3 flex items-center justify-between">
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 text-soft hover:text-ink transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="font-mono text-xs uppercase tracking-wider">Back to browse</span>
          </Link>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleToggleFavorite}
                      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
                    >
                      <Heart
                        className={`h-5 w-5 transition-colors ${
                          isFavorited ? "fill-clay text-clay" : "text-soft"
                        }`}
                      />
                    </Button>
                  )}
                />
                <TooltipContent>{isFavorited ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger
                  render={(props) => (
                    <Button
                      {...props}
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={handleShare}
                      aria-label="Share listing"
                    >
                      <Share2 className="h-5 w-5 text-soft" />
                    </Button>
                  )}
                />
                <TooltipContent>Share</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </header>

      <main className="wrap py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Left: Gallery */}
          <section aria-label="Fabric gallery">
            <FabricGallery
              imageUrl={fabric.image_url}
              title={fabric.title}
              zoomLevel={zoomLevel}
              onZoomChange={setZoomLevel}
            />
          </section>

          {/* Right: Details & Purchase */}
          <section aria-label="Fabric details" className="space-y-8">
            {/* Title & Meta */}
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="eyebrow mb-2">{fabric.factory.name}</p>
                  <h1 className="text-3xl lg:text-4xl font-bold text-ink tracking-tight leading-tight">
                    {fabric.title}
                  </h1>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-field text-bone-text shrink-0"
                >
                  {fabric.ai_confidence}% AI Match
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-soft text-sm">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {fabric.factory.location}, {fabric.factory.country}
                </span>
                <span>{fabric.yards_available} yards available</span>
              </div>
            </div>

            <Separator className="bg-line" />

            {/* AI Spec Sheet */}
            <AISpecSheet fabric={fabric} />

            <Separator className="bg-line" />

            {/* Certifications */}
            {fabric.factory.certifications && fabric.factory.certifications.length > 0 && (
              <>
                <div className="space-y-3">
                  <h3 className="font-mono text-xs uppercase tracking-wider text-soft">
                    Certifications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {fabric.factory.certifications.map((cert) => (
                      <Badge key={cert} variant="outline" className="border-line text-soft">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Separator className="bg-line" />
              </>
            )}

            {/* Purchase Panel */}
            <PurchasePanel
              pricePerYard={fabric.price_per_yard}
              yardsAvailable={fabric.yards_available}
              yards={yards}
              totalPrice={totalPrice}
              addedToCart={addedToCart}
              onYardsChange={handleYardsChange}
              onAddToCart={handleAddToCart}
            />
          </section>
        </div>
      </main>
    </div>
  );
}

// --- Fabric Gallery Component ---
function FabricGallery({
  imageUrl,
  title,
  zoomLevel,
  onZoomChange,
}: {
  imageUrl: string;
  title: string;
  zoomLevel: ZoomLevel;
  onZoomChange: (level: ZoomLevel) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [startPosition, setStartPosition] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setStartPosition({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setPosition({
        x: e.clientX - startPosition.x,
        y: e.clientY - startPosition.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    const idx = ZOOM_LEVELS.indexOf(zoomLevel);
    if (idx < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[idx + 1]);
    }
  };

  const handleZoomOut = () => {
    const idx = ZOOM_LEVELS.indexOf(zoomLevel);
    if (idx > 0) {
      onZoomChange(ZOOM_LEVELS[idx - 1]);
      // Reset position when zooming out
      if (idx === 1) setPosition({ x: 0, y: 0 });
    }
  };

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-[4/3] bg-bone-2 rounded overflow-hidden cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        role="img"
        aria-label={`${title} at ${zoomLevel}x zoom`}
      >
        <div
          className="absolute inset-0 transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel}) translate(${position.x / zoomLevel}px, ${position.y / zoomLevel}px)`,
          }}
        >
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Zoom indicator */}
        <div className="absolute bottom-4 left-4 bg-field/90 text-bone-text px-3 py-1.5 rounded text-sm font-mono">
          {zoomLevel}x
        </div>

        {/* Drag hint */}
        {zoomLevel > 1 && (
          <div className="absolute top-4 left-4 bg-field/90 text-bone-text px-3 py-1.5 rounded text-xs font-mono">
            Drag to pan
          </div>
        )}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-line"
            onClick={handleZoomOut}
            disabled={zoomLevel === ZOOM_LEVELS[0]}
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 border-line"
            onClick={handleZoomIn}
            disabled={zoomLevel === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom level picker */}
        <div
          role="radiogroup"
          aria-label="Zoom level"
          className="flex items-center gap-1"
        >
          {ZOOM_LEVELS.map((level, index) => (
            <button
              key={level}
              role="radio"
              aria-checked={zoomLevel === level}
              tabIndex={rovingTabIndex(ZOOM_LEVELS, zoomLevel, index)}
              onClick={() => {
                onZoomChange(level);
                if (level === 1) setPosition({ x: 0, y: 0 });
              }}
              onKeyDown={(e) => handleRadioGroupKey(e, ZOOM_LEVELS, zoomLevel, (v) => {
                onZoomChange(v as ZoomLevel);
                if (v === 1) setPosition({ x: 0, y: 0 });
              })}
              className={`
                h-8 w-12 rounded text-sm font-mono transition-colors
                focus:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2
                ${
                  zoomLevel === level
                    ? "bg-field text-bone-text"
                    : "bg-bone-2 text-soft hover:text-ink"
                }
              `}
            >
              {level}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- AI Spec Sheet Component ---
function AISpecSheet({ fabric }: { fabric: FabricRow & { factory: FactoryRow } }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-clay" />
        <h2 className="font-mono text-xs uppercase tracking-wider text-soft">
          AI-Generated Specifications
        </h2>
      </div>

      <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {AI_SPEC_FIELDS.map(({ key, label, icon: Icon, suffix }) => {
          let value: string | number = "";
          if (key === "composition") {
            value = getComposition(fabric.material);
          } else {
            const rawValue = fabric[key as keyof FabricRow];
            value = rawValue != null ? String(rawValue) + (suffix ?? "") : "—";
          }

          return (
            <div
              key={key}
              className="group relative bg-bone-2/60 rounded p-4 border border-line hover:border-clay/30 transition-colors"
            >
              <dt className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-soft mb-2">
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </dt>
              <dd className="text-lg font-semibold text-ink">{value}</dd>
              {/* AI badge */}
              <div className="absolute top-2 right-2 flex items-center gap-1 text-clay opacity-60 group-hover:opacity-100 transition-opacity">
                <Sparkles className="h-3 w-3" />
                <span className="text-[10px] font-mono uppercase">AI</span>
              </div>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

// --- Purchase Panel Component ---
function PurchasePanel({
  pricePerYard,
  yardsAvailable,
  yards,
  totalPrice,
  addedToCart,
  onYardsChange,
  onAddToCart,
}: {
  pricePerYard: number;
  yardsAvailable: number;
  yards: number;
  totalPrice: string;
  addedToCart: boolean;
  onYardsChange: (delta: number) => void;
  onAddToCart: () => void;
}) {
  const isAtMin = yards <= 0.5;
  const isAtMax = yards >= yardsAvailable;

  return (
    <div className="bg-field rounded-sm p-6 space-y-6">
      {/* Price header */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-bone-text text-3xl font-bold tracking-tight">
            ${pricePerYard}
          </span>
          <span className="font-mono text-xs text-bone-text-muted ml-1">/yard</span>
        </div>
        <span className="font-mono text-xs text-bone-text-muted">
          {yardsAvailable} yards in stock
        </span>
      </div>

      {/* Yardage stepper */}
      <div className="space-y-3">
        <label className="font-mono text-xs uppercase tracking-wider text-bone-text-muted">
          Select yardage
        </label>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 bg-transparent border-bone-text-muted/30 text-bone-text hover:bg-bone-text/10 hover:border-bone-text/50"
            onClick={() => onYardsChange(-0.5)}
            disabled={isAtMin}
            aria-label="Decrease yardage"
          >
            <Minus className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-center">
            <span className="text-4xl font-bold text-bone-text tabular-nums">{yards}</span>
            <span className="font-mono text-sm text-bone-text-muted ml-2">
              {yards === 1 ? "yard" : "yards"}
            </span>
          </div>

          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 bg-transparent border-bone-text-muted/30 text-bone-text hover:bg-bone-text/10 hover:border-bone-text/50"
            onClick={() => onYardsChange(0.5)}
            disabled={isAtMax}
            aria-label="Increase yardage"
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Stock warning */}
        {isAtMax && (
          <p className="text-xs text-gold text-center font-mono">
            Maximum available stock reached
          </p>
        )}
      </div>

      <Separator className="bg-bone-text/10" />

      {/* Total & Add button */}
      <div className="space-y-4">
        <div className="flex items-baseline justify-between">
          <span className="font-mono text-xs uppercase tracking-wider text-bone-text-muted">
            Total
          </span>
          <div className="text-right">
            <span className="text-3xl font-bold text-gold">${totalPrice}</span>
          </div>
        </div>

        <Button
          onClick={onAddToCart}
          disabled={addedToCart}
          className={`
            w-full h-14 text-base font-bold uppercase tracking-wider transition-all
            ${
              addedToCart
                ? "bg-gold text-field hover:bg-gold"
                : "bg-clay text-bone hover:bg-clay-deep"
            }
          `}
        >
          {addedToCart ? (
            <>
              <Check className="h-5 w-5 mr-2" />
              Added to Order
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5 mr-2" />
              Add to Order — ${totalPrice}
            </>
          )}
        </Button>

        <p className="text-center text-xs text-bone-text-muted font-mono">
          Free shipping on orders over $150
        </p>
      </div>
    </div>
  );
}

// --- Skeleton Loading State ---
function ListingDetailSkeleton() {
  return (
    <div className="min-h-screen bg-bone">
      {/* Header skeleton */}
      <header className="sticky top-0 z-40 bg-bone/95 backdrop-blur-sm border-b border-line">
        <div className="wrap py-3 flex items-center justify-between">
          <div className="h-5 w-32 bg-bone-2 rounded animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 bg-bone-2 rounded animate-pulse" />
            <div className="h-9 w-9 bg-bone-2 rounded animate-pulse" />
          </div>
        </div>
      </header>

      <main className="wrap py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery skeleton */}
          <div className="space-y-4">
            <div className="aspect-[4/3] bg-bone-2 rounded animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-bone-2 rounded animate-pulse" />
                <div className="h-10 w-10 bg-bone-2 rounded animate-pulse" />
              </div>
              <div className="flex items-center gap-1">
                {ZOOM_LEVELS.map((level) => (
                  <div key={level} className="h-8 w-12 bg-bone-2 rounded animate-pulse" />
                ))}
              </div>
            </div>
          </div>

          {/* Details skeleton */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="h-4 w-24 bg-bone-2 rounded animate-pulse" />
              <div className="h-10 w-3/4 bg-bone-2 rounded animate-pulse" />
              <div className="flex items-center gap-4">
                <div className="h-4 w-32 bg-bone-2 rounded animate-pulse" />
                <div className="h-4 w-24 bg-bone-2 rounded animate-pulse" />
              </div>
            </div>

            <Separator className="bg-line" />

            {/* Spec sheet skeleton */}
            <div className="space-y-4">
              <div className="h-4 w-40 bg-bone-2 rounded animate-pulse" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-bone-2/60 rounded p-4 h-20 animate-pulse" />
                ))}
              </div>
            </div>

            <Separator className="bg-line" />

            {/* Purchase panel skeleton */}
            <div className="bg-field rounded-sm p-6 space-y-6">
              <div className="h-8 w-24 bg-bone-text/10 rounded animate-pulse" />
              <div className="h-12 w-full bg-bone-text/10 rounded animate-pulse" />
              <div className="h-14 w-full bg-bone-text/10 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
