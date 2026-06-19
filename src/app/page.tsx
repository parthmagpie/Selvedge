"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { trackVisitLanding, trackCtaClick } from "@/lib/events";
import { cn } from "@/lib/utils";

// ============================================================
// SELVEDGE LANDING PAGE
// Premium Deadstock Textile Marketplace
// Design Direction: Campaign (bold poster, color-blocked)
// ============================================================

// Sample fabric listings for the featured grid
const FEATURED_FABRICS = [
  {
    id: "silk-charmeuse-01",
    title: "Italian Silk Charmeuse",
    material: "100% Silk",
    color: "Champagne",
    yards: 47,
    price: 28,
    weaveClass: "weave-satin",
    mill: "Ratti, Como",
  },
  {
    id: "japanese-denim-02",
    title: "Japanese Selvedge Denim",
    material: "Cotton Twill",
    color: "Indigo",
    yards: 89,
    price: 18,
    weaveClass: "weave-denim",
    mill: "Kurabo, Osaka",
  },
  {
    id: "harris-tweed-03",
    title: "Harris Tweed",
    material: "100% Wool",
    color: "Heather",
    yards: 32,
    price: 45,
    weaveClass: "weave-tweed",
    mill: "Harris Tweed Authority",
  },
  {
    id: "belgian-linen-04",
    title: "Belgian Linen",
    material: "100% Linen",
    color: "Natural",
    yards: 156,
    price: 22,
    weaveClass: "weave-linen",
    mill: "Libeco, Meulebeke",
  },
  {
    id: "como-velvet-05",
    title: "Como Silk Velvet",
    material: "Silk Viscose",
    color: "Burgundy",
    yards: 24,
    price: 65,
    weaveClass: "weave-satin",
    mill: "Taroni, Como",
  },
  {
    id: "portuguese-corduroy-06",
    title: "Portuguese Corduroy",
    material: "Cotton",
    color: "Terracotta",
    yards: 78,
    price: 16,
    weaveClass: "weave-corduroy",
    mill: "TMG, Guimaraes",
  },
];

// How-it-works steps
const STEPS = [
  {
    number: "01",
    title: "SNAP",
    description: "Photograph your fabric roll. Any angle, any lighting.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="6" width="24" height="20" rx="2" />
        <circle cx="16" cy="16" r="5" />
        <circle cx="16" cy="16" r="2" />
        <rect x="20" y="9" width="4" height="2" rx="0.5" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI ANALYZES",
    description: "Vision AI identifies weave, material, color, and yardage in seconds.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M16 4v4M16 24v4M4 16h4M24 16h4" />
        <path d="M7.5 7.5l2.8 2.8M21.7 21.7l2.8 2.8M7.5 24.5l2.8-2.8M21.7 10.3l2.8-2.8" />
        <circle cx="16" cy="16" r="6" />
        <circle cx="16" cy="16" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "SELL",
    description: "Review, adjust if needed, and publish. 90% payout, paid weekly.",
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M6 8h20v18a2 2 0 01-2 2H8a2 2 0 01-2-2V8z" />
        <path d="M10 8V6a6 6 0 1112 0v2" />
        <path d="M12 16l4 4 6-8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

// Stats data
const STATS = [
  { value: "3.2M", label: "yards rescued", unit: "yards" },
  { value: "847", label: "factories worldwide", unit: "factories" },
  { value: "12K", label: "makers shopping", unit: "makers" },
];

// Marquee items
const MARQUEE_ITEMS = [
  "PREMIUM DEADSTOCK",
  "BY THE YARD",
  "ZERO WASTE",
  "MILL DIRECT",
  "RESCUED TEXTILES",
  "SUSTAINABLE FASHION",
];

export default function LandingPage() {
  const hasTrackedRef = useRef(false);

  // Fire visit_landing on mount (once)
  useEffect(() => {
    if (!hasTrackedRef.current) {
      trackVisitLanding();
      hasTrackedRef.current = true;
    }
  }, []);

  // Scroll reveal effect
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const revealElements = document.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    revealElements.forEach((el) => {
      // Handle above-the-fold elements
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight) {
        el.classList.add("in");
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ============================================================
          HERO SECTION — Dark field background
          ============================================================ */}
      <section className="bg-field relative min-h-[90vh] flex items-center">
        <div className="wrap w-full py-16 md:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left: Copy */}
            <div className="space-y-8">
              {/* Eyebrow */}
              <div className="eyebrow eyebrow-gold flex items-center gap-2">
                <span className="text-gold">&#9670;</span>
                <span>PREMIUM DEADSTOCK MARKETPLACE</span>
              </div>

              {/* Hero headline */}
              <h1 className="hero-title text-bone">
                RESCUE THE
                <br />
                <em className="font-display italic text-gold">cloth</em>
                <br />
                NOBODY COULD USE.
              </h1>

              {/* Subheadline */}
              <p className="text-bone-muted text-lg md:text-xl max-w-lg leading-relaxed">
                High-end factories dump billions of tonnes of pristine fabric yearly.
                We connect their surplus to indie designers and sustainable brands.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-4 pt-4">
                <Link
                  href="/browse"
                  onClick={() => trackCtaClick({ cta_type: "browse_fabrics" })}
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "btn-selvedge btn-on-dark"
                  )}
                >
                  BROWSE FABRICS
                </Link>
                <Link
                  href="/upload"
                  onClick={() => trackCtaClick({ cta_type: "list_inventory" })}
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "btn-selvedge border-2 border-bone text-bone hover:bg-bone hover:text-field"
                  )}
                >
                  LIST YOUR INVENTORY
                </Link>
              </div>
            </div>

            {/* Right: Hero image collage */}
            <div className="relative">
              {/* Main fabric image */}
              <div className="relative rounded-[3px] overflow-hidden shadow-selvedge-lg">
                <Image
                  src="/images/hero.webp"
                  alt="Premium fabric rolls in factory setting"
                  width={1920}
                  height={1088}
                  className="w-full h-auto object-cover"
                  priority
                />
              </div>

              {/* Floating AI spec card */}
              <div className="absolute -bottom-6 -left-4 md:-left-8 bg-bone rounded-[3px] p-4 shadow-selvedge-lg float-animation max-w-[200px]">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="pulse-dot" />
                    <span className="font-mono text-xs text-clay font-bold tracking-wider">
                      AI DETECTED
                    </span>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-soft">Material</span>
                      <span className="text-ink font-medium">Italian Silk</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-soft">Weave</span>
                      <span className="text-ink font-medium">Charmeuse</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-soft">Color</span>
                      <span className="text-ink font-medium">Champagne</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-soft">Yards</span>
                      <span className="text-ink font-medium">~47 yds</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rescued badge */}
              <div
                className="absolute -top-4 -right-4 md:-right-8 w-24 h-24 md:w-28 md:h-28 rounded-full bg-gold flex items-center justify-center text-center shadow-selvedge-md"
                style={{ transform: "rotate(-8deg)" }}
              >
                <div>
                  <div className="text-field font-bold text-lg md:text-xl leading-none">4,200</div>
                  <div className="text-field text-[10px] md:text-xs font-medium mt-1">
                    rolls<br />rescued
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom edge line */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-field-2" />
      </section>

      {/* ============================================================
          MARQUEE — Clay band
          ============================================================ */}
      <section className="bg-clay py-4 border-y-2 border-field overflow-hidden">
        <div className="marquee-track">
          {/* Duplicate items for seamless loop */}
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, idx) => (
            <div key={idx} className="flex items-center gap-14">
              <span className="text-bone font-bold text-xl md:text-2xl tracking-wide whitespace-nowrap">
                {item}
              </span>
              <span className="text-gold text-xl">&#9670;</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============================================================
          HOW IT WORKS — Bone background
          ============================================================ */}
      <section className="bg-bone section-spacing">
        <div className="wrap">
          {/* Section header */}
          <div className="text-center mb-16 reveal">
            <span className="eyebrow mb-4 block">HOW IT WORKS</span>
            <h2 className="sec-title text-ink">
              FROM PHOTO TO <em>LISTING</em>
              <br />
              IN 60 SECONDS
            </h2>
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, idx) => (
              <div
                key={step.number}
                className="reveal rule-top pt-6"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Step number */}
                <span className="font-mono text-clay text-sm font-bold tracking-wider">
                  {step.number}
                </span>

                {/* Icon */}
                <div className="w-14 h-14 rounded-full bg-field flex items-center justify-center mt-4 mb-4 text-bone">
                  {step.icon}
                </div>

                {/* Title */}
                <h3 className="text-ink font-bold text-xl md:text-2xl tracking-wide mb-3">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-soft leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURED FABRICS — Bone-2 background
          ============================================================ */}
      <section className="bg-bone-2 section-spacing">
        <div className="wrap">
          {/* Section header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12 reveal">
            <div>
              <span className="eyebrow mb-4 block">FEATURED ROLLS</span>
              <h2 className="sec-title text-ink">
                FRESH FROM <em>THE MILLS</em>
              </h2>
            </div>
            <Link
              href="/browse"
              onClick={() => trackCtaClick({ cta_type: "browse_fabrics" })}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "btn-selvedge btn-secondary-outline self-start md:self-auto"
              )}
            >
              VIEW ALL FABRICS
            </Link>
          </div>

          {/* Fabric cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURED_FABRICS.map((fabric, idx) => (
              <article
                key={fabric.id}
                className="group bg-bone rounded-[3px] border border-line overflow-hidden transition-all duration-500 ease-out hover:shadow-selvedge-md hover:-translate-y-1 reveal"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                {/* Fabric texture preview */}
                <div
                  className={cn(
                    "aspect-[4/3] relative overflow-hidden",
                    fabric.weaveClass
                  )}
                >
                  {/* Mill badge */}
                  <div className="absolute top-3 left-3 bg-bone/95 backdrop-blur-sm px-2 py-1 rounded-[2px]">
                    <span className="font-mono text-[10px] text-soft tracking-wider">
                      {fabric.mill}
                    </span>
                  </div>
                </div>

                {/* Card content */}
                <div className="p-4 border-t-[3px] border-ink">
                  <h3 className="font-bold text-ink text-lg mb-1">{fabric.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-soft mb-3">
                    <span>{fabric.material}</span>
                    <span className="text-line">|</span>
                    <span>{fabric.color}</span>
                  </div>

                  {/* Price and yards */}
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-ink font-bold text-xl">${fabric.price}</span>
                      <span className="font-mono text-soft text-xs ml-1">/yd</span>
                    </div>
                    <span className="font-mono text-soft text-xs">
                      {fabric.yards} yds available
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          STATS — Field-2 background
          ============================================================ */}
      <section className="bg-field-2 section-spacing">
        <div className="wrap">
          <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-dark-line">
            {STATS.map((stat, idx) => (
              <div
                key={stat.label}
                className="text-center py-8 md:py-0 md:px-8 reveal"
                style={{ transitionDelay: `${idx * 80}ms` }}
              >
                <div className="stat-num">{stat.value}</div>
                <div className="text-bone-muted text-sm md:text-base mt-2 tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          WHY NOW — Clay background
          ============================================================ */}
      <section className="bg-clay section-spacing">
        <div className="wrap">
          <div className="max-w-3xl mx-auto text-center reveal">
            <span className="eyebrow eyebrow-gold mb-6 block text-bone/70">
              THE MOMENT IS NOW
            </span>
            <h2 className="text-bone font-bold text-3xl md:text-4xl lg:text-5xl leading-tight mb-8">
              New EU textile regulations mean factories must reduce waste by 2026.
              <span className="block mt-4 font-display italic text-gold text-2xl md:text-3xl">
                Their surplus is your opportunity.
              </span>
            </h2>
            <p className="text-bone/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              92 million tonnes of textiles are discarded globally each year. Selvedge gives
              premium deadstock a second life — connecting factory surplus with makers who
              value quality and sustainability.
            </p>
            <Link
              href="/browse"
              onClick={() => trackCtaClick({ cta_type: "browse_fabrics" })}
              className={cn(
                buttonVariants({ variant: "default" }),
                "btn-selvedge btn-on-dark"
              )}
            >
              START BROWSING
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          AI TEASER — Bone background
          ============================================================ */}
      <section className="bg-bone section-spacing">
        <div className="wrap">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: AI preview mockup */}
            <div className="relative reveal">
              <div className="bg-field rounded-[3px] p-6 md:p-8 shadow-selvedge-lg">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="pulse-dot" />
                    <span className="font-mono text-xs text-clay-soft font-bold tracking-wider">
                      ANALYZING FABRIC...
                    </span>
                  </div>
                  <span className="font-mono text-bone-text-faint text-xs">87%</span>
                </div>

                {/* Fabric preview with scan line */}
                <div className="relative aspect-video bg-field-2 rounded-[2px] overflow-hidden mb-6">
                  <Image
                    src="/images/feature-1.webp"
                    alt="AI fabric scanning illustration"
                    width={800}
                    height={608}
                    className="w-full h-full object-cover opacity-90"
                  />
                  {/* Animated scan line */}
                  <div className="scan-line" />
                </div>

                {/* Analysis phases */}
                <div className="space-y-3">
                  {[
                    { label: "Reading weave structure", done: true },
                    { label: "Classifying fibre & material", done: true },
                    { label: "Sampling colour family", done: true },
                    { label: "Estimating roll yardage", done: false },
                    { label: "Drafting your listing", done: false },
                  ].map((phase, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-4 h-4 rounded-full border flex items-center justify-center",
                          phase.done
                            ? "bg-clay border-clay"
                            : "border-bone-text-faint"
                        )}
                      >
                        {phase.done && (
                          <svg
                            className="w-2.5 h-2.5 text-bone"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="3"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      <span
                        className={cn(
                          "font-mono text-xs",
                          phase.done ? "text-bone-text" : "text-bone-text-faint"
                        )}
                      >
                        {phase.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div className="reveal" style={{ transitionDelay: "100ms" }}>
              <span className="eyebrow mb-4 block">AI-POWERED LISTING</span>
              <h2 className="sec-title text-ink mb-6">
                ZERO DATA ENTRY.
                <br />
                <em>ALL INTELLIGENCE.</em>
              </h2>
              <p className="text-soft text-lg leading-relaxed mb-8">
                Factory workers are busy. Our vision AI turns a simple photo into
                a complete product listing — material, weave, color family,
                estimated yardage, and suggested price. Edit if needed, publish
                in one click.
              </p>
              <ul className="space-y-4 mb-10">
                {[
                  "Identifies 50+ fabric types automatically",
                  "Estimates yardage from roll dimensions",
                  "Suggests competitive pricing",
                  "90% of listings ship with zero edits",
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-clay mt-1">&#9670;</span>
                    <span className="text-ink">{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/upload"
                onClick={() => trackCtaClick({ cta_type: "list_inventory" })}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "btn-selvedge btn-primary-clay"
                )}
              >
                TRY THE AI UPLOADER
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FINAL CTA — Field background
          ============================================================ */}
      <section className="bg-field section-spacing">
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto reveal">
            <h2 className="hero-title text-bone mb-8">
              JOIN THE <em className="text-gold">RESCUE</em>.
            </h2>
            <p className="text-bone-muted text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Whether you are a designer seeking rare textiles or a factory with surplus inventory,
              Selvedge connects quality with purpose.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/browse"
                onClick={() => trackCtaClick({ cta_type: "browse_fabrics" })}
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "btn-selvedge btn-on-dark"
                )}
              >
                BROWSE FABRICS
              </Link>
              <Link
                href="/upload"
                onClick={() => trackCtaClick({ cta_type: "list_inventory" })}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "btn-selvedge border-2 border-bone text-bone hover:bg-bone hover:text-field"
                )}
              >
                LIST YOUR INVENTORY
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FOOTER — Field-2 background
          ============================================================ */}
      <footer className="bg-field-2 py-8">
        <div className="wrap">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-bone font-bold text-lg tracking-wide">SELVEDGE</span>
            </div>
            <div className="text-bone/80 text-sm">
              Premium deadstock, by the yard.
            </div>
            <div className="flex items-center gap-6 text-bone text-sm">
              <Link href="/browse" className="hover:text-gold transition-colors">
                Browse
              </Link>
              <Link href="/upload" className="hover:text-gold transition-colors">
                Sell
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
