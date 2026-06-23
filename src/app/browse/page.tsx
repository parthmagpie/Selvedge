"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, SlidersHorizontal, X, ArrowRight, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  trackBrowseStarted,
  trackFilterApplied,
  trackFabricSaved,
  trackViewListing,
} from "@/lib/events";

// --- Types ---
interface FabricListing {
  id: string;
  title: string;
  material: string;
  weaveType: string;
  colorFamily: string;
  pricePerYard: number;
  yardsAvailable: number;
  widthInches: number;
  weightGsm: number;
  factory: string;
  factoryLocation: string;
  aiConfidence: number;
  imageUrl: string;
  weaveClass: string;
}

// --- Mock Data (canonical fixture for downstream pages) ---
const MOCK_FABRICS: FabricListing[] = [
  {
    id: "fab-001",
    title: "Japanese Selvedge Denim",
    material: "Cotton",
    weaveType: "Twill",
    colorFamily: "Indigo",
    pricePerYard: 48,
    yardsAvailable: 12,
    widthInches: 34,
    weightGsm: 380,
    factory: "Kurabo Mills",
    factoryLocation: "Osaka, Japan",
    aiConfidence: 94,
    imageUrl: "",
    weaveClass: "weave-denim",
  },
  {
    id: "fab-002",
    title: "Irish Linen Natural",
    material: "Linen",
    weaveType: "Plain",
    colorFamily: "Bone",
    pricePerYard: 62,
    yardsAvailable: 8,
    widthInches: 58,
    weightGsm: 180,
    factory: "Thomas Ferguson",
    factoryLocation: "Ulster, Ireland",
    aiConfidence: 97,
    imageUrl: "",
    weaveClass: "weave-linen",
  },
  {
    id: "fab-003",
    title: "Pendleton Wool Flannel",
    material: "Wool",
    weaveType: "Flannel",
    colorFamily: "Forest",
    pricePerYard: 78,
    yardsAvailable: 6,
    widthInches: 60,
    weightGsm: 420,
    factory: "Pendleton Woolen Mills",
    factoryLocation: "Oregon, USA",
    aiConfidence: 91,
    imageUrl: "",
    weaveClass: "weave-flannel",
  },
  {
    id: "fab-004",
    title: "Burgundy Duchess Satin",
    material: "Silk",
    weaveType: "Satin",
    colorFamily: "Burgundy",
    pricePerYard: 95,
    yardsAvailable: 4,
    widthInches: 45,
    weightGsm: 95,
    factory: "Como Silk",
    factoryLocation: "Como, Italy",
    aiConfidence: 89,
    imageUrl: "",
    weaveClass: "weave-satin",
  },
  {
    id: "fab-005",
    title: "Vintage Cotton Corduroy",
    material: "Cotton",
    weaveType: "Corduroy",
    colorFamily: "Rust",
    pricePerYard: 38,
    yardsAvailable: 15,
    widthInches: 54,
    weightGsm: 320,
    factory: "Cone Mills Archive",
    factoryLocation: "North Carolina, USA",
    aiConfidence: 88,
    imageUrl: "",
    weaveClass: "weave-corduroy",
  },
  {
    id: "fab-006",
    title: "Harris Tweed Herringbone",
    material: "Wool",
    weaveType: "Tweed",
    colorFamily: "Moss",
    pricePerYard: 110,
    yardsAvailable: 3,
    widthInches: 60,
    weightGsm: 450,
    factory: "Harris Tweed Hebrides",
    factoryLocation: "Isle of Lewis, Scotland",
    aiConfidence: 96,
    imageUrl: "",
    weaveClass: "weave-tweed",
  },
  {
    id: "fab-007",
    title: "Belgian Flax Linen",
    material: "Linen",
    weaveType: "Plain",
    colorFamily: "Oatmeal",
    pricePerYard: 55,
    yardsAvailable: 9,
    widthInches: 60,
    weightGsm: 200,
    factory: "Libeco Lagae",
    factoryLocation: "Meulebeke, Belgium",
    aiConfidence: 93,
    imageUrl: "",
    weaveClass: "weave-linen",
  },
  {
    id: "fab-008",
    title: "Raw Selvedge Denim",
    material: "Cotton",
    weaveType: "Twill",
    colorFamily: "Indigo",
    pricePerYard: 42,
    yardsAvailable: 18,
    widthInches: 32,
    weightGsm: 340,
    factory: "White Oak Remnants",
    factoryLocation: "North Carolina, USA",
    aiConfidence: 92,
    imageUrl: "",
    weaveClass: "weave-denim",
  },
];

// --- Filter Constants ---
const MATERIALS = ["Cotton", "Linen", "Wool", "Silk"];

const COLOR_FAMILIES = [
  { name: "Indigo", hex: "#2D3A5C" },
  { name: "Bone", hex: "#F0EADD" },
  { name: "Forest", hex: "#2F4034" },
  { name: "Burgundy", hex: "#5E2A2C" },
  { name: "Rust", hex: "#9A4D32" },
  { name: "Moss", hex: "#797649" },
  { name: "Oatmeal", hex: "#D7CBB0" },
];

const PRICE_RANGE = { min: 0, max: 150 };
const YARDAGE_RANGE = { min: 0, max: 25 };

// --- Filter Panel Component ---
function FilterPanel({
  materials,
  onMaterialChange,
  colors,
  onColorChange,
  priceRange,
  onPriceChange,
  yardageRange,
  onYardageChange,
  materialCounts,
  onClearAll,
  hasActiveFilters,
}: {
  materials: string[];
  onMaterialChange: (material: string) => void;
  colors: string[];
  onColorChange: (color: string) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  yardageRange: [number, number];
  onYardageChange: (range: [number, number]) => void;
  materialCounts: Record<string, number>;
  onClearAll: () => void;
  hasActiveFilters: boolean;
}) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    material: true,
    color: true,
    price: true,
    yardage: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-soft">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-clay underline underline-offset-2 transition-colors hover:text-clay-deep focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Material Filter */}
      <div>
        <button
          onClick={() => toggleSection("material")}
          className="flex w-full items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          aria-expanded={expandedSections.material}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-ink">
            Material
          </span>
          {expandedSections.material ? (
            <ChevronUp className="h-4 w-4 text-soft" />
          ) : (
            <ChevronDown className="h-4 w-4 text-soft" />
          )}
        </button>
        {expandedSections.material && (
          <div className="mt-3 space-y-2">
            {MATERIALS.map((material) => {
              const count = materialCounts[material] || 0;
              const isActive = materials.includes(material);
              return (
                <label
                  key={material}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onMaterialChange(material)}
                    className="h-4 w-4 rounded border-line accent-clay focus:ring-clay"
                  />
                  <span
                    className={cn(
                      "text-sm transition-colors",
                      isActive ? "font-medium text-ink" : "text-soft"
                    )}
                  >
                    {material}
                  </span>
                  <span className="ml-auto font-mono text-xs text-soft">
                    ({count})
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="bg-line" />

      {/* Color Filter */}
      <div>
        <button
          onClick={() => toggleSection("color")}
          className="flex w-full items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          aria-expanded={expandedSections.color}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-ink">
            Color Family
          </span>
          {expandedSections.color ? (
            <ChevronUp className="h-4 w-4 text-soft" />
          ) : (
            <ChevronDown className="h-4 w-4 text-soft" />
          )}
        </button>
        {expandedSections.color && (
          <div className="mt-3 flex flex-wrap gap-2">
            {COLOR_FAMILIES.map(({ name, hex }) => {
              const isActive = colors.includes(name);
              return (
                <button
                  key={name}
                  onClick={() => onColorChange(name)}
                  title={name}
                  className={cn(
                    "group relative h-8 w-8 rounded-full border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2",
                    isActive
                      ? "border-clay ring-2 ring-clay ring-offset-1"
                      : "border-transparent hover:border-soft"
                  )}
                  style={{ backgroundColor: hex }}
                  aria-label={`${isActive ? "Remove" : "Add"} ${name} color filter`}
                  aria-pressed={isActive}
                >
                  {isActive && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor:
                            hex === "#F0EADD" ? "#1B1814" : "#F0EADD",
                        }}
                      />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Separator className="bg-line" />

      {/* Price Range */}
      <div>
        <button
          onClick={() => toggleSection("price")}
          className="flex w-full items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          aria-expanded={expandedSections.price}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-ink">
            Price / Yard
          </span>
          {expandedSections.price ? (
            <ChevronUp className="h-4 w-4 text-soft" />
          ) : (
            <ChevronDown className="h-4 w-4 text-soft" />
          )}
        </button>
        {expandedSections.price && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={PRICE_RANGE.min}
                max={PRICE_RANGE.max}
                value={priceRange[1]}
                onChange={(e) =>
                  onPriceChange([priceRange[0], Number(e.target.value)])
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-bone-2 accent-clay [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-clay"
                aria-label="Maximum price per yard"
              />
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-soft">
              <span>${priceRange[0]}</span>
              <span className="font-semibold text-ink">
                Up to ${priceRange[1]}
              </span>
            </div>
          </div>
        )}
      </div>

      <Separator className="bg-line" />

      {/* Yardage Range */}
      <div>
        <button
          onClick={() => toggleSection("yardage")}
          className="flex w-full items-center justify-between py-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
          aria-expanded={expandedSections.yardage}
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-ink">
            Min. Yardage
          </span>
          {expandedSections.yardage ? (
            <ChevronUp className="h-4 w-4 text-soft" />
          ) : (
            <ChevronDown className="h-4 w-4 text-soft" />
          )}
        </button>
        {expandedSections.yardage && (
          <div className="mt-3 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={YARDAGE_RANGE.min}
                max={YARDAGE_RANGE.max}
                value={yardageRange[0]}
                onChange={(e) =>
                  onYardageChange([Number(e.target.value), yardageRange[1]])
                }
                className="h-1 w-full cursor-pointer appearance-none rounded-full bg-bone-2 accent-clay [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-clay"
                aria-label="Minimum available yardage"
              />
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-soft">
              <span className="font-semibold text-ink">
                {yardageRange[0]}+ yards
              </span>
              <span>max {YARDAGE_RANGE.max}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Fabric Card Component ---
function FabricCard({
  fabric,
  isFavorite,
  onToggleFavorite,
  onViewListing,
}: {
  fabric: FabricListing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onViewListing: () => void;
}) {
  return (
    <Card className="group relative overflow-hidden border-0 bg-bone ring-1 ring-line transition-all duration-300 hover:ring-clay hover:shadow-selvedge-md">
      {/* Fabric Texture Preview */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 transition-transform duration-500 group-hover:scale-105",
            fabric.weaveClass
          )}
        />
        {/* AI Confidence Badge */}
        <div className="absolute right-3 top-3">
          <Badge
            variant="secondary"
            className="gap-1 bg-field/90 px-2 py-1 text-bone backdrop-blur-sm"
          >
            <Sparkles className="h-3 w-3" />
            <span className="font-mono text-xs">{fabric.aiConfidence}%</span>
          </Badge>
        </div>
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavorite();
          }}
          className={cn(
            "absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border bg-bone/90 backdrop-blur-sm transition-all hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay md:h-8 md:w-8",
            isFavorite
              ? "border-clay text-clay"
              : "border-line text-soft hover:text-clay"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all",
              isFavorite && "fill-clay"
            )}
          />
        </button>
      </div>

      {/* Card Content */}
      <CardContent className="space-y-3 p-4">
        {/* Factory & Location */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-soft">
            {fabric.factory}
          </span>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 font-semibold leading-tight text-ink">
          {fabric.title}
        </h3>

        {/* Specs */}
        <div className="flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border-line bg-bone-2/50 font-mono text-[10px] text-soft"
          >
            {fabric.material}
          </Badge>
          <Badge
            variant="outline"
            className="border-line bg-bone-2/50 font-mono text-[10px] text-soft"
          >
            {fabric.widthInches}&quot; W
          </Badge>
          <Badge
            variant="outline"
            className="border-line bg-bone-2/50 font-mono text-[10px] text-soft"
          >
            {fabric.weightGsm} gsm
          </Badge>
        </div>

        {/* Price & Availability */}
        <div className="flex items-end justify-between pt-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-ink">
                ${fabric.pricePerYard}
              </span>
              <span className="font-mono text-xs text-soft">/yd</span>
            </div>
            <p className="mt-1 font-mono text-xs text-soft">
              {fabric.yardsAvailable} yards available
            </p>
          </div>
          <Link
            href={`/listing/${fabric.id}`}
            onClick={onViewListing}
            className={cn(
              buttonVariants({ variant: "default", size: "sm" }),
              "gap-1.5 bg-clay text-bone hover:bg-clay-deep"
            )}
          >
            View
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Empty State Component ---
function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="relative mb-6">
        <Image
          src="/images/empty-state.webp"
          alt="No fabrics found"
          width={200}
          height={200}
          className="opacity-80"
        />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-ink">
        No fabrics match your filters
      </h3>
      <p className="mb-6 max-w-sm text-sm text-soft">
        Try adjusting your search criteria or clearing filters to see more
        options.
      </p>
      <Button
        onClick={onClearFilters}
        variant="outline"
        className="border-clay text-clay hover:bg-clay hover:text-bone"
      >
        Clear all filters
      </Button>
    </div>
  );
}

// --- Loading Skeleton ---
function FabricCardSkeleton() {
  return (
    <Card className="overflow-hidden border-0 bg-bone ring-1 ring-line">
      <div className="aspect-[4/3] animate-pulse bg-bone-2" />
      <CardContent className="space-y-3 p-4">
        <div className="h-3 w-24 animate-pulse rounded bg-bone-2" />
        <div className="h-5 w-full animate-pulse rounded bg-bone-2" />
        <div className="flex gap-2">
          <div className="h-5 w-16 animate-pulse rounded bg-bone-2" />
          <div className="h-5 w-12 animate-pulse rounded bg-bone-2" />
        </div>
        <div className="flex items-end justify-between pt-2">
          <div className="space-y-1">
            <div className="h-6 w-16 animate-pulse rounded bg-bone-2" />
            <div className="h-3 w-20 animate-pulse rounded bg-bone-2" />
          </div>
          <div className="h-8 w-16 animate-pulse rounded bg-bone-2" />
        </div>
      </CardContent>
    </Card>
  );
}

// --- Main Browse Page Component ---
export default function BrowsePage() {
  // Filter state
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([
    PRICE_RANGE.min,
    PRICE_RANGE.max,
  ]);
  const [yardageRange, setYardageRange] = useState<[number, number]>([
    YARDAGE_RANGE.min,
    YARDAGE_RANGE.max,
  ]);

  // Favorites state (persisted to localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoritesLoaded, setFavoritesLoaded] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [dbListings, setDbListings] = useState<FabricListing[]>([]);

  // Fetch listings from database and track browse_started on mount
  useEffect(() => {
    trackBrowseStarted({ entry_point: "nav" });

    const fetchListings = async () => {
      try {
        const response = await fetch("/api/listings");
        if (response.ok) {
          const data = await response.json();
          setDbListings(data.listings || []);
        }
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      }
      setIsLoading(false);
    };

    fetchListings();
  }, []);

  // Load favorites from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("selvedge_favorites");
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // localStorage unavailable
    }
    setFavoritesLoaded(true);
  }, []);

  // Persist favorites to localStorage
  useEffect(() => {
    if (favoritesLoaded) {
      try {
        localStorage.setItem("selvedge_favorites", JSON.stringify(favorites));
      } catch {
        // localStorage unavailable
      }
    }
  }, [favorites, favoritesLoaded]);

  // Filter handlers with analytics
  const handleMaterialChange = useCallback((material: string) => {
    setSelectedMaterials((prev) => {
      const isRemoving = prev.includes(material);
      if (!isRemoving) {
        trackFilterApplied({
          filter_type: "material",
          filter_value: material,
        });
      }
      return isRemoving
        ? prev.filter((m) => m !== material)
        : [...prev, material];
    });
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColors((prev) => {
      const isRemoving = prev.includes(color);
      if (!isRemoving) {
        trackFilterApplied({
          filter_type: "color",
          filter_value: color,
        });
      }
      return isRemoving
        ? prev.filter((c) => c !== color)
        : [...prev, color];
    });
  }, []);

  const handlePriceChange = useCallback((range: [number, number]) => {
    setPriceRange(range);
    trackFilterApplied({
      filter_type: "price",
      filter_value: `$${range[0]}-$${range[1]}`,
    });
  }, []);

  const handleYardageChange = useCallback((range: [number, number]) => {
    setYardageRange(range);
    trackFilterApplied({
      filter_type: "yardage",
      filter_value: `${range[0]}+ yards`,
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelectedMaterials([]);
    setSelectedColors([]);
    setPriceRange([PRICE_RANGE.min, PRICE_RANGE.max]);
    setYardageRange([YARDAGE_RANGE.min, YARDAGE_RANGE.max]);
  }, []);

  const handleToggleFavorite = useCallback(
    (fabricId: string) => {
      const isRemoving = favorites.includes(fabricId);
      if (!isRemoving) {
        trackFabricSaved({ listing_id: fabricId });
      }
      setFavorites((prev) =>
        isRemoving ? prev.filter((id) => id !== fabricId) : [...prev, fabricId]
      );
    },
    [favorites]
  );

  const handleViewListing = useCallback(
    (fabric: FabricListing) => {
      trackViewListing({
        listing_id: fabric.id,
        material: fabric.material,
      });
    },
    []
  );

  // Combine mock fabrics with database listings
  const allFabrics = useMemo(() => {
    return [...dbListings, ...MOCK_FABRICS];
  }, [dbListings]);

  // Filtered fabrics
  const filteredFabrics = useMemo(() => {
    return allFabrics.filter((fabric) => {
      // Material filter
      if (
        selectedMaterials.length > 0 &&
        !selectedMaterials.includes(fabric.material)
      ) {
        return false;
      }
      // Color filter
      if (
        selectedColors.length > 0 &&
        !selectedColors.includes(fabric.colorFamily)
      ) {
        return false;
      }
      // Price filter
      if (
        fabric.pricePerYard < priceRange[0] ||
        fabric.pricePerYard > priceRange[1]
      ) {
        return false;
      }
      // Yardage filter
      if (fabric.yardsAvailable < yardageRange[0]) {
        return false;
      }
      return true;
    });
  }, [allFabrics, selectedMaterials, selectedColors, priceRange, yardageRange]);

  // Material counts for filter badges
  const materialCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allFabrics.forEach((fabric) => {
      counts[fabric.material] = (counts[fabric.material] || 0) + 1;
    });
    return counts;
  }, [allFabrics]);

  // Check if any filters are active
  const hasActiveFilters =
    selectedMaterials.length > 0 ||
    selectedColors.length > 0 ||
    priceRange[0] > PRICE_RANGE.min ||
    priceRange[1] < PRICE_RANGE.max ||
    yardageRange[0] > YARDAGE_RANGE.min;

  return (
    <div className="min-h-screen bg-bone">
      {/* Page Header */}
      <header className="border-b border-line bg-bone">
        <div className="wrap py-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="eyebrow mb-2">
                <span aria-hidden="true">&#9670;</span> Premium Deadstock
              </p>
              <h1 className="sec-title text-ink">
                Browse <em>Fabrics</em>
              </h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Favorites Badge */}
              {favorites.length > 0 && (
                <div className="flex items-center gap-2 rounded-sm bg-bone-2 px-3 py-1.5">
                  <Heart className="h-4 w-4 fill-clay text-clay" />
                  <span className="font-mono text-xs font-semibold text-ink">
                    {favorites.length} saved
                  </span>
                </div>
              )}
              {/* Mobile Filter Toggle */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "gap-2 border-line md:hidden"
                  )}
                  aria-label="Open filters"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <Badge className="ml-1 h-5 w-5 rounded-full bg-clay p-0 text-[10px] text-bone">
                      {selectedMaterials.length +
                        selectedColors.length +
                        (priceRange[1] < PRICE_RANGE.max ? 1 : 0) +
                        (yardageRange[0] > YARDAGE_RANGE.min ? 1 : 0)}
                    </Badge>
                  )}
                </SheetTrigger>
                <SheetContent side="left" className="w-80 bg-bone">
                  <SheetTitle className="sr-only">Filter fabrics</SheetTitle>
                  <div className="pt-4">
                    <FilterPanel
                      materials={selectedMaterials}
                      onMaterialChange={handleMaterialChange}
                      colors={selectedColors}
                      onColorChange={handleColorChange}
                      priceRange={priceRange}
                      onPriceChange={handlePriceChange}
                      yardageRange={yardageRange}
                      onYardageChange={handleYardageChange}
                      materialCounts={materialCounts}
                      onClearAll={handleClearAll}
                      hasActiveFilters={hasActiveFilters}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="wrap py-8">
        <div className="flex gap-8">
          {/* Desktop Filter Sidebar */}
          <aside className="hidden w-64 shrink-0 md:block">
            <div className="sticky top-8">
              <FilterPanel
                materials={selectedMaterials}
                onMaterialChange={handleMaterialChange}
                colors={selectedColors}
                onColorChange={handleColorChange}
                priceRange={priceRange}
                onPriceChange={handlePriceChange}
                yardageRange={yardageRange}
                onYardageChange={handleYardageChange}
                materialCounts={materialCounts}
                onClearAll={handleClearAll}
                hasActiveFilters={hasActiveFilters}
              />
            </div>
          </aside>

          {/* Results Grid */}
          <div className="flex-1">
            {/* Results Header */}
            <div className="mb-6 flex items-center justify-between">
              <p className="text-sm text-soft">
                {isLoading ? (
                  <span className="animate-pulse">Loading fabrics...</span>
                ) : (
                  <>
                    <span className="font-semibold text-ink">
                      {filteredFabrics.length}
                    </span>{" "}
                    fabrics found
                  </>
                )}
              </p>
              {/* Active Filters Pills (Desktop) */}
              {hasActiveFilters && !isLoading && (
                <div className="hidden items-center gap-2 md:flex">
                  {selectedMaterials.map((m) => (
                    <button
                      key={m}
                      onClick={() => handleMaterialChange(m)}
                      className="flex items-center gap-1 rounded-sm bg-bone-2 px-2 py-1 text-xs text-soft transition-colors hover:bg-clay hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                    >
                      {m}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                  {selectedColors.map((c) => (
                    <button
                      key={c}
                      onClick={() => handleColorChange(c)}
                      className="flex items-center gap-1 rounded-sm bg-bone-2 px-2 py-1 text-xs text-soft transition-colors hover:bg-clay hover:text-bone focus:outline-none focus-visible:ring-2 focus-visible:ring-clay"
                    >
                      {c}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grid */}
            {isLoading ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <FabricCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredFabrics.length === 0 ? (
              <EmptyState onClearFilters={handleClearAll} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredFabrics.map((fabric) => (
                  <FabricCard
                    key={fabric.id}
                    fabric={fabric}
                    isFavorite={favorites.includes(fabric.id)}
                    onToggleFavorite={() => handleToggleFavorite(fabric.id)}
                    onViewListing={() => handleViewListing(fabric)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Live Region for Screen Readers */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {!isLoading &&
          (filteredFabrics.length === 0
            ? "No fabrics match your current filters"
            : `Showing ${filteredFabrics.length} fabrics`)}
      </div>
    </div>
  );
}
