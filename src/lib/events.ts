import { track, identify } from "./analytics";

// --- Event funnel stage map (generated from experiment/EVENTS.yaml) ---

export const EVENT_FUNNEL_MAP: Record<string, string> = {
  visit_landing: "reach",
  cta_click: "demand",
  browse_started: "demand",
  view_listing: "demand",
  filter_applied: "activate",
  fabric_saved: "activate",
  add_to_cart: "activate",
  upload_started: "activate",
  listing_published: "activate",
  view_cart: "activate",
  checkout_started: "activate",
  signup_completed: "activate",
  login_completed: "activate",
  feedback_submitted: "activate",
} as const;

// --- Event wrappers (generated from experiment/EVENTS.yaml events map) ---

export function trackVisitLanding() {
  track("visit_landing", { funnel_stage: "reach" });
}

export function trackCtaClick(props: { cta_type: string }) {
  track("cta_click", { ...props, funnel_stage: "demand" });
}

export function trackBrowseStarted(props?: { entry_point?: string }) {
  track("browse_started", { ...props, funnel_stage: "demand" });
}

export function trackViewListing(props: { listing_id: string; material?: string }) {
  track("view_listing", { ...props, funnel_stage: "demand" });
}

export function trackFilterApplied(props: { filter_type: string; filter_value: string }) {
  track("filter_applied", { ...props, funnel_stage: "activate" });
}

export function trackFabricSaved(props: { listing_id: string }) {
  track("fabric_saved", { ...props, funnel_stage: "activate" });
}

export function trackAddToCart(props: { listing_id: string; yards: number; price_per_yard: number }) {
  track("add_to_cart", { ...props, funnel_stage: "activate" });
}

export function trackUploadStarted(props: { source: string }) {
  track("upload_started", { ...props, funnel_stage: "activate" });
}

export function trackListingPublished(props: { material: string; color: string; yards: number; price: number; ai_confidence: number }) {
  track("listing_published", { ...props, funnel_stage: "activate" });
}

export function trackViewCart(props: { item_count: number; total_value: number }) {
  track("view_cart", { ...props, funnel_stage: "activate" });
}

export function trackCheckoutStarted(props: { item_count: number; total_value: number }) {
  track("checkout_started", { ...props, funnel_stage: "activate" });
}

export function trackSignupCompleted(props: { method: string }, userId: string, userEmail?: string) {
  identify(userId, { email: userEmail });
  track("signup_completed", { ...props, funnel_stage: "activate" });
}

export function trackLoginCompleted(props: { method: string }) {
  track("login_completed", { ...props, funnel_stage: "activate" });
}

export function trackFeedbackSubmitted(props: { activation_action: string; source?: string; feedback?: string }) {
  track("feedback_submitted", { ...props, funnel_stage: "activate" });
}
