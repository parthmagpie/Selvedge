"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trackUploadStarted, trackListingPublished } from "@/lib/events";

// --- Types ---
type UploadState = "idle" | "analyzing" | "review" | "published";

interface AnalysisPhase {
  id: number;
  label: string;
  complete: boolean;
}

interface ListingData {
  title: string;
  material: string;
  texture: string;
  color: string;
  yardage: number;
  width: number;
  weight: number;
  price: number;
  confidence: number;
  imageUrl: string;
}

// --- Sample fabric images for demo ---
const SAMPLE_FABRICS = [
  {
    id: "linen-natural",
    name: "Natural Linen",
    preview: "/images/hero.webp",
    weaveClass: "weave-linen",
  },
  {
    id: "denim-indigo",
    name: "Indigo Denim",
    preview: "/images/feature-1.webp",
    weaveClass: "weave-denim",
  },
  {
    id: "flannel-forest",
    name: "Forest Flannel",
    preview: "/images/feature-2.webp",
    weaveClass: "weave-flannel",
  },
  {
    id: "satin-burgundy",
    name: "Burgundy Satin",
    preview: "/images/feature-3.webp",
    weaveClass: "weave-satin",
  },
];

// --- Analysis phases ---
const ANALYSIS_PHASES: Omit<AnalysisPhase, "complete">[] = [
  { id: 1, label: "Reading weave structure" },
  { id: 2, label: "Classifying fibre & material" },
  { id: 3, label: "Sampling colour family" },
  { id: 4, label: "Estimating roll yardage" },
  { id: 5, label: "Drafting your listing" },
];

// --- Mock AI analysis result ---
function generateMockAnalysis(imageUrl: string): ListingData {
  const materials = ["100% Cotton Canvas", "Linen Blend", "Wool Tweed", "Silk Charmeuse", "Cotton Denim"];
  const textures = ["Twill weave", "Plain weave", "Herringbone", "Satin weave", "Basket weave"];
  const colors = ["Ecru Natural", "Indigo Blue", "Forest Green", "Burgundy Wine", "Charcoal Grey"];

  const randomIndex = Math.floor(Math.random() * materials.length);
  const yardage = Math.floor(Math.random() * 40) + 12;
  const width = [45, 54, 58, 60][Math.floor(Math.random() * 4)];
  const weight = Math.floor(Math.random() * 200) + 150;
  const price = Math.floor(Math.random() * 30) + 15;
  const confidence = Math.floor(Math.random() * 15) + 85;

  return {
    title: `Premium ${materials[randomIndex]} - ${colors[randomIndex]}`,
    material: materials[randomIndex],
    texture: textures[randomIndex],
    color: colors[randomIndex],
    yardage,
    width,
    weight,
    price,
    confidence,
    imageUrl,
  };
}

// --- AI Badge Component ---
function AIBadge() {
  return (
    <Badge variant="secondary" className="ml-2 bg-field text-bone text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5">
      AI
    </Badge>
  );
}

// --- Field with AI badge ---
function AIField({
  label,
  value,
  onChange,
  type = "text",
  unit,
}: {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: "text" | "number";
  unit?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center">
        <Label className="font-mono text-xs uppercase tracking-wider text-soft">{label}</Label>
        <AIBadge />
      </div>
      <div className="relative">
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="text-base bg-bone border-line focus:border-clay focus:ring-clay"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-soft font-mono text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// --- Confidence Meter ---
function ConfidenceMeter({ confidence }: { confidence: number }) {
  const getConfidenceColor = (val: number) => {
    if (val >= 90) return "bg-[#2D5A3D]";
    if (val >= 75) return "bg-gold";
    return "bg-clay";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wider text-soft">AI Confidence</span>
        <span className="font-mono text-sm font-bold text-ink">{confidence}%</span>
      </div>
      <div className="h-2 bg-bone-2 rounded-sm overflow-hidden">
        <div
          className={`h-full transition-all duration-700 ${getConfidenceColor(confidence)}`}
          style={{ width: `${confidence}%` }}
        />
      </div>
      <p className="text-xs text-soft">
        {confidence >= 90
          ? "High confidence — ready to publish"
          : confidence >= 75
          ? "Good confidence — review suggested fields"
          : "Review recommended — some fields may need adjustment"}
      </p>
    </div>
  );
}

// --- Payout Calculator ---
function PayoutCalculator({ price, yardage }: { price: number; yardage: number }) {
  const totalValue = price * yardage;
  const payout = totalValue * 0.9;

  return (
    <Card className="bg-field text-bone border-0">
      <CardContent className="p-6 space-y-4">
        <h3 className="font-mono text-xs uppercase tracking-wider text-bone-text-muted">
          Estimated Payout
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-bone-text-muted">
            <span>${price}/yd x {yardage} yards</span>
            <span>${totalValue.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-bone-text-muted">
            <span>Selvedge fee (10%)</span>
            <span>-${(totalValue * 0.1).toFixed(2)}</span>
          </div>
          <div className="border-t border-dark-line pt-3 flex justify-between">
            <span className="font-semibold text-bone">Your payout</span>
            <span className="text-2xl font-bold text-gold">${payout.toFixed(2)}</span>
          </div>
        </div>
        <p className="text-xs text-bone-text-faint">
          90% of sale value. Paid within 48 hours of buyer confirmation.
        </p>
      </CardContent>
    </Card>
  );
}

// --- Analysis Animation ---
function AnalysisAnimation({
  phases,
  progress,
  imageUrl,
}: {
  phases: AnalysisPhase[];
  progress: number;
  imageUrl: string;
}) {
  return (
    <div className="grid md:grid-cols-2 gap-8 items-start">
      {/* Image with scan line */}
      <div className="relative aspect-square rounded-sm overflow-hidden bg-bone-2">
        <Image
          src={imageUrl}
          alt="Fabric being analyzed"
          fill
          className="object-cover"
        />
        <div className="scan-line" />
        <div className="absolute inset-0 bg-gradient-to-t from-field/30 to-transparent" />
      </div>

      {/* Progress phases */}
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="sec-title text-2xl">
            Analyzing <em>fabric</em>
          </h2>
          <p className="text-soft">
            Our AI is examining your fabric to generate a complete listing.
          </p>
        </div>

        <Progress value={progress} className="h-2 bg-bone-2" />

        <div className="space-y-3">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className={`flex items-center gap-3 transition-opacity duration-300 ${
                phase.complete ? "opacity-100" : "opacity-40"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  phase.complete
                    ? "bg-clay text-bone"
                    : "bg-bone-2 text-soft"
                }`}
              >
                {phase.complete ? (
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  phase.id
                )}
              </div>
              <span
                className={`font-mono text-sm ${
                  phase.complete ? "text-ink" : "text-soft"
                }`}
              >
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Published State ---
function PublishedState({
  listing,
  onListAnother,
}: {
  listing: ListingData;
  onListAnother: () => void;
}) {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2D5A3D] text-bone mb-4">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="sec-title text-3xl">
          <em>Published</em> successfully
        </h2>
        <p className="text-soft max-w-md mx-auto">
          Your fabric listing is now live on the Selvedge marketplace. Designers
          can discover and purchase it immediately.
        </p>
      </div>

      {/* Listing preview card */}
      <Card className="max-w-md mx-auto bg-bone border-line overflow-hidden">
        <div className="relative aspect-[4/3]">
          <Image
            src={listing.imageUrl}
            alt={listing.title}
            fill
            className="object-cover"
          />
          <Badge className="absolute top-3 left-3 bg-[#2D5A3D] text-bone font-mono text-xs uppercase tracking-wider animate-pulse">
            Live now
          </Badge>
        </div>
        <CardContent className="p-4 space-y-3">
          <h3 className="font-semibold text-lg text-ink">{listing.title}</h3>
          <div className="flex items-center gap-4 text-sm text-soft font-mono">
            <span>{listing.material}</span>
            <span className="text-line">|</span>
            <span>{listing.yardage} yards</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-ink">${listing.price}</span>
            <span className="text-soft font-mono text-sm">/yd</span>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={onListAnother}
          className="btn-selvedge btn-primary-clay"
        >
          List another roll
        </Button>
        <Link href="/browse">
          <Button variant="outline" className="btn-selvedge btn-secondary-outline w-full sm:w-auto">
            See it in marketplace
          </Button>
        </Link>
      </div>
    </div>
  );
}

// --- Main Upload Page ---
export default function UploadPage() {
  const [state, setState] = useState<UploadState>("idle");
  const [dragActive, setDragActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [phases, setPhases] = useState<AnalysisPhase[]>(
    ANALYSIS_PHASES.map((p) => ({ ...p, complete: false }))
  );
  const [progress, setProgress] = useState(0);
  const [listing, setListing] = useState<ListingData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Start analysis animation (plain function - stable)
  const startAnalysis = (imageUrl: string) => {
    setState("analyzing");
    setProgress(0);
    setPhases(ANALYSIS_PHASES.map((p) => ({ ...p, complete: false })));

    // Simulate analysis progress
    const phaseDelay = 880; // 4.4s total / 5 phases
    let currentPhase = 0;

    const interval = setInterval(() => {
      currentPhase++;
      setProgress((currentPhase / ANALYSIS_PHASES.length) * 100);
      setPhases((prev) =>
        prev.map((p, i) => ({
          ...p,
          complete: i < currentPhase,
        }))
      );

      if (currentPhase >= ANALYSIS_PHASES.length) {
        clearInterval(interval);
        // Generate mock analysis and move to review
        setTimeout(() => {
          const analysis = generateMockAnalysis(imageUrl);
          setListing(analysis);
          setState("review");
        }, 500);
      }
    }, phaseDelay);
  };

  // Handle file selection (plain function)
  const handleFileSelect = (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
    trackUploadStarted({ source: "file_upload" });
    startAnalysis(imageUrl);
  };

  // Handle sample selection (plain function)
  const handleSampleSelect = (sample: (typeof SAMPLE_FABRICS)[0]) => {
    setSelectedImage(sample.preview);
    trackUploadStarted({ source: "sample_selection" });
    startAnalysis(sample.preview);
  };

  // Handle drag events (plain function)
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    }
  };

  // Handle publish
  const handlePublish = () => {
    if (!listing) return;

    trackListingPublished({
      material: listing.material,
      color: listing.color,
      yards: listing.yardage,
      price: listing.price,
      ai_confidence: listing.confidence,
    });

    setState("published");
  };

  // Handle list another
  const handleListAnother = () => {
    setState("idle");
    setSelectedImage("");
    setListing(null);
    setProgress(0);
    setPhases(ANALYSIS_PHASES.map((p) => ({ ...p, complete: false })));
  };

  // Update listing field
  const updateListingField = (field: keyof ListingData, value: string | number) => {
    if (!listing) return;
    setListing({
      ...listing,
      [field]: typeof listing[field] === "number" ? Number(value) : value,
    });
  };

  return (
    <div className="min-h-screen bg-bone">
      {/* Header */}
      <header className="bg-field py-4 border-b-2 border-clay">
        <div className="wrap">
          <nav className="flex items-center justify-between" aria-label="Upload page navigation">
            <Link href="/" className="text-bone font-bold text-xl tracking-tight">
              SELVEDGE
            </Link>
            <div className="flex items-center gap-4">
              <span className="eyebrow eyebrow-gold">Factory Portal</span>
              <Link href="/browse">
                <Button variant="ghost" className="text-bone hover:text-gold hover:bg-transparent">
                  Browse fabrics
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      </header>

      <div className="wrap section-spacing">
        {/* Page title - always visible */}
        {state === "idle" && (
          <div className="text-center mb-12">
            <span className="eyebrow">AI-Powered Listing</span>
            <h1 className="hero-title text-4xl md:text-5xl lg:text-6xl mt-4">
              List your <em>deadstock</em>
            </h1>
            <p className="mt-4 text-soft max-w-lg mx-auto">
              Photograph your fabric roll and let our AI generate a complete
              listing in under 60 seconds. Zero data entry required.
            </p>
          </div>
        )}

        {/* Idle state: Drop zone + samples */}
        {state === "idle" && (
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-sm transition-all duration-300 ${
                dragActive
                  ? "border-clay bg-clay/5 scale-[1.01]"
                  : "border-line hover:border-clay/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
                aria-label="Upload fabric image"
              />
              <div className="p-12 md:p-20 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-bone-2 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-clay"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-ink mb-2">
                  Drop your fabric photo here
                </h2>
                <p className="text-soft mb-4">or click to browse your files</p>
                <p className="text-xs text-ink-faint">
                  JPG, PNG, HEIC up to 20MB
                </p>
              </div>
            </div>

            {/* Sample selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-line" />
                <span className="font-mono text-xs uppercase tracking-wider text-soft">
                  Or try a sample
                </span>
                <div className="h-px flex-1 bg-line" />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SAMPLE_FABRICS.map((sample) => (
                  <button
                    key={sample.id}
                    onClick={() => handleSampleSelect(sample)}
                    className="group relative aspect-square rounded-sm overflow-hidden border border-line hover:border-clay transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-clay focus-visible:ring-offset-2"
                  >
                    <div
                      className={`absolute inset-0 ${sample.weaveClass} group-hover:scale-110 transition-transform duration-500`}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 to-transparent" />
                    <span className="absolute bottom-2 left-2 right-2 font-mono text-xs text-bone truncate">
                      {sample.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analyzing state */}
        {state === "analyzing" && (
          <div className="max-w-3xl mx-auto">
            <AnalysisAnimation
              phases={phases}
              progress={progress}
              imageUrl={selectedImage}
            />
          </div>
        )}

        {/* Review state */}
        {state === "review" && listing && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <span className="eyebrow">Review Listing</span>
              <h1 className="sec-title text-3xl mt-2">
                Review your <em>listing</em>
              </h1>
              <p className="mt-2 text-soft">
                AI has filled in the details. Make any adjustments and publish when ready.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left: Image + Confidence */}
              <div className="space-y-6">
                <div className="relative aspect-square rounded-sm overflow-hidden bg-bone-2">
                  <Image
                    src={listing.imageUrl}
                    alt="Uploaded fabric"
                    fill
                    className="object-cover"
                  />
                </div>
                <ConfidenceMeter confidence={listing.confidence} />
              </div>

              {/* Right: Form fields */}
              <div className="space-y-6">
                <AIField
                  label="Title"
                  value={listing.title}
                  onChange={(val) => updateListingField("title", val)}
                />

                <div className="grid grid-cols-2 gap-4">
                  <AIField
                    label="Material"
                    value={listing.material}
                    onChange={(val) => updateListingField("material", val)}
                  />
                  <AIField
                    label="Texture"
                    value={listing.texture}
                    onChange={(val) => updateListingField("texture", val)}
                  />
                </div>

                <AIField
                  label="Color"
                  value={listing.color}
                  onChange={(val) => updateListingField("color", val)}
                />

                <div className="grid grid-cols-3 gap-4">
                  <AIField
                    label="Yardage"
                    value={listing.yardage}
                    onChange={(val) => updateListingField("yardage", val)}
                    type="number"
                    unit="yd"
                  />
                  <AIField
                    label="Width"
                    value={listing.width}
                    onChange={(val) => updateListingField("width", val)}
                    type="number"
                    unit="in"
                  />
                  <AIField
                    label="Weight"
                    value={listing.weight}
                    onChange={(val) => updateListingField("weight", val)}
                    type="number"
                    unit="gsm"
                  />
                </div>

                <AIField
                  label="Price per yard"
                  value={listing.price}
                  onChange={(val) => updateListingField("price", val)}
                  type="number"
                  unit="$"
                />

                <PayoutCalculator price={listing.price} yardage={listing.yardage} />

                <div className="flex gap-4 pt-4">
                  <Button
                    onClick={handlePublish}
                    className="btn-selvedge btn-primary-clay flex-1"
                  >
                    Publish listing
                  </Button>
                  <Button
                    onClick={handleListAnother}
                    variant="outline"
                    className="btn-selvedge btn-secondary-outline"
                  >
                    Start over
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Published state */}
        {state === "published" && listing && (
          <div className="max-w-2xl mx-auto">
            <PublishedState listing={listing} onListAnother={handleListAnother} />
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-field py-8 mt-auto">
        <div className="wrap">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-bone-text-muted text-sm">
              Have questions?{" "}
              <a href="mailto:support@selvedge.com" className="text-gold hover:underline">
                Contact support
              </a>
            </p>
            <p className="text-bone-text-faint text-xs font-mono">
              Payout processed within 48 hours via bank transfer
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
