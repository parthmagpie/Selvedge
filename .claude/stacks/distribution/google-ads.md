---
assumes: []
packages:
  runtime: []
  dev: []
files: []
env:
  server: []
  client: []
ci_placeholders: {}
clean:
  files: []
  dirs: []
gitignore: []
---
<!-- coherence-allow: raw-golden_path (sequence-step) scope=["## Ad Format Constraints", "## Phase 1 Playbook"] — google-ads sitelinks are derived from golden_path step descriptions in funnel order (landing → value → retention) for click priority. Ad Format Constraints documents the derivation; Phase 1 Playbook's Sitelink Strategy subsection (### Sitelink Strategy) uses it. LIST semantics, not SET. -->

# Distribution: Google Ads
> Used when `/distribute` is run with channel `google-ads`
> Assumes: None — distribution stacks create no source code or packages; they generate config only

## Ad Format Constraints

**Responsive Search Ads (RSA):**
- Headlines: 3–30 characters each, minimum 5 per ad
- Descriptions: up to 90 characters each, minimum 2 per ad
- Minimum 2 ad variations per campaign
- Google assembles the best combination from your headlines and descriptions

**Sitelink Extensions:**
- Link text: up to 25 characters (the clickable blue text)
- Description line 1: up to 35 characters
- Description line 2: up to 35 characters
- Final URL: must be distinct from the main ad landing URL and from all other sitelink URLs
- Minimum 2 sitelinks per campaign (Google rarely shows just 1)
- Maximum 4 sitelinks for Phase 1 (balances coverage vs complexity at $140 budget)
- Each sitelink must point to a different destination page or anchor section
- Auto-generated from `golden_path` pages — see state-4-generate.md Step 4b.5

## Targeting Model

**Keyword-based targeting** — ads appear when users search for matching terms.

Match types:
- **Exact match** `[keyword]` — highest intent, most specific
- **Phrase match** `"keyword"` — moderate intent, word order matters
- **Broad match** `keyword` — widest reach, Google infers intent
- **Negative keywords** — exclude irrelevant searches

Minimum keyword counts:
- Exact: 3+
- Phrase: 2+
- Broad: 1+
- Negative: 2+

No demographic or audience targeting initially — let Google optimize.

## Click ID

**Parameter name:** `gclid` (Google Click ID)

Google auto-appends `gclid` to the landing URL when a user clicks an ad. Capture it on the landing page and include it in analytics events for offline conversion matching.

## Conversion Tracking

Offline conversion import (PostHog -> Google Ads) is a Phase 3 smart-bidding setup step only.

Phase 1 and Phase 2 use Manual CPC and compute GO/NO_GO from PostHog/DB plus Google Ads clicks (`signup` or `pay_intent` divided by paid clicks). They do not create Google Ads conversion actions and do not import conversions.

When you move to Phase 3 smart bidding, configure the analytics provider's Google Ads destination, map the target event to the Google Ads conversion action, and use the provider webhook -> Google Ads Offline Conversions import method.

## Policy Restrictions

**Restricted industries:**
- **DeFi protocols, ICOs, token sales** — **BANNED**. Google Ads prohibits advertising decentralized finance protocols, initial coin offerings, and token sale events.
- **Crypto exchanges/wallets** — **RESTRICTED**. Requires FinCEN MSB registration + state money transmitter licenses (US) or MiCA CASP authorization (EU). Must apply for Google Ads Financial Products certification.
- **Gambling, pharma, weapons** — various restrictions apply; check Google Ads policies.

**Compliance notes:**
- Landing page must include clear disclaimers if promoting financial products
- Ads cannot make misleading claims about returns or guarantees
- Review [Google Ads Financial Products and Services policy](https://support.google.com/adspolicy/answer/2464998) before launching

## Cost Model

**CPC (Cost Per Click)** — you pay when a user clicks your ad.

Use `manual_cpc` for the Phase 1 screen. Set max CPC to Keyword Planner "Top of page bid (low range)" for each keyword so spend stays controlled while learning which keywords convert.

Smart bidding (`maximize_conversions` / `target_cpa`) is a Phase 3 scaling concern and is not used in the Phase 1 screen.

- `guardrails.max_cpc_cents` sets a ceiling on individual bid amounts. Set initial value from Keyword Planner "Top of page bid (low range)".

Budget structure:
- `daily_budget_cents`: daily MAX spend cap (= `total_budget_cents / duration_days`)
- `total_budget_cents`: total MAX campaign cap (default 14000 / $140), not a spend target
- `duration_days`: 7-day screening time box

Goal = reach the click target (the `/iterate --cross` verdict floor, default ~100 paid clicks) for a trustworthy rate read. Stop early once clicks suffice. If the campaign hits the budget cap before the click target, CPC is too expensive; note that affordability signal and consider a NO_GO. `guardrails.max_cpc_cents` caps individual bids so one keyword cannot burn the cap.

## Config Schema

The `ads.yaml` file for Google Ads uses:

```yaml
channel: google-ads
campaign_name: {name}-search-v{N}
project_name: {name}
landing_url: {deployed_url}

keywords:
  exact: [...]
  phrase: [...]
  broad: [...]
  negative: [...]

ads:
  - headlines: [...]    # 5+ headlines, 3-30 chars each
    descriptions: [...]  # 2+ descriptions, up to 90 chars each

# When experiment.yaml has variants, use ad_groups instead of ads:
# ad_groups:
#   - variant: {slug}
#     landing_url: "{url}/v/{slug}?utm_source=google&utm_medium=cpc&utm_campaign={campaign}&utm_content={slug}"
#     ads:
#       - headlines: [...]
#         descriptions: [...]

sitelinks:
  - link_text: "..."            # up to 25 chars, imperative verb + noun
    description_1: "..."        # up to 35 chars, benefit statement
    description_2: "..."        # up to 35 chars, qualifier/differentiator
    final_url: "..."            # distinct URL with UTM params
# When <2 qualifying pages exist: sitelinks: []
# See state-4-generate.md Step 4b.5 for generation rules

budget:
  daily_budget_cents: ...
  total_budget_cents: ...
  duration_days: ...
  bidding_strategy: manual_cpc

targeting:
  locations: [US]
  languages: [en]

conversions:
  primary_action: signup_complete
  secondary_actions: [activate]
  import_method: posthog_webhook

# Phase 3 conversion-action reference only. Phase 1/2 do not import conversions.

guardrails:
  max_cpc_cents: ...
  min_daily_clicks: 3
  auto_pause_rules: [...]

thresholds:
  expected_clicks: ...
  expected_signups: ...
  expected_activations: ...
  go_signal: "..."
  no_go_signal: "..."
```

## Phase 1 Playbook

Step-by-step guide for the first 7 days of a Google Ads Search campaign. Follow this before adjusting any settings.

### Campaign Structure

| Setting | Value |
|---------|-------|
| Campaign type | Search |
| Network | Google Search only (disable Search Partners and Display Network) |
| Bidding | `manual_cpc` (Enhanced CPC OFF) |
| Max CPC | Keyword Planner "Top of page bid (low range)" per keyword |
| Daily budget | `total_budget_cents / duration_days` |
| Duration | 7 days (screening window) |
| Status | PAUSED (enable after pre-flight checklist passes) |

Goal & stopping rule: reach the click floor (`visitors_floor`, default ~100 paid clicks) under the MAX budget cap and 7-day time box. Stop early once clicks suffice; hitting the cap before the click target is an affordability signal.

### Ad Group Structure

- **1 STAG** (Single Theme Ad Group) per campaign
- **5-15 keywords** per ad group, all on the same theme
- **Match type**: Phrase Match for all keywords. If a keyword gets zero impressions after 48 hours, switch that keyword to Broad Match.
- **2 RSAs** (Responsive Search Ads) per ad group

### RSA Template

```
Headlines (8 slots):
  H1: [MVP Name] — PINNED to position 1
  H2: [Primary value proposition] — PINNED to position 2
  H3-H8: Unpinned — rotate variations of benefits, features, social proof, urgency

Descriptions (4 slots):
  D1: [What the product does + primary benefit] (up to 90 chars)
  D2: [How it works or what makes it different] (up to 90 chars)
  D3: [Social proof or credibility signal] (up to 90 chars)
  D4: [Call to action with urgency] (up to 90 chars)
```

Pin H1 and H2 to ensure the MVP name and value prop always appear. Leave H3-H8 unpinned so Google can test combinations.

### Negative Keywords (Universal)

Add these 50 universal negative keywords to every campaign. They exclude traffic that wastes budget on informational, career, enterprise, or unrelated searches.

```
free
how to
what is
tutorial
guide
example
template
sample
course
training
certification
degree
salary
job
jobs
career
careers
hiring
intern
internship
enterprise
corporate
fortune 500
government
federal
download
open source
github
stackoverflow
reddit
review
reviews
comparison
vs
versus
alternative
alternatives
cheap
cheapest
discount
coupon
promo
scam
complaint
lawsuit
wiki
wikipedia
definition
meaning
pdf
```

These are starting negatives. Add campaign-specific negatives based on the experiment domain (e.g., competitor names that draw irrelevant clicks).

### Sitelink Strategy

- **Auto-generate** sitelinks from experiment.yaml `golden_path` when the app has 2+ non-landing user-facing pages
- **Priority order**: real independent pages (signup, dashboard, etc.) > anchor sections on the landing page (`/#features`, `/#pricing`) > skip
- **Anchor fallback**: When independent pages < 2, scan the landing page component for section elements with `id` attributes (e.g., `id="features"`, `id="pricing"`) and generate anchor sitelinks
- **Combined threshold**: independent pages + anchor sections must total >= 2, otherwise skip sitelinks entirely
- **Phase 1 cap**: maximum 4 sitelinks
- **Copy rules**: follow messaging.md Section F for link_text, description_1, description_2 derivation
- **UTM tracking**: each sitelink URL includes `utm_content=sitelink_{route_slug}` (or `sitelink_anchor_{section_id}` for anchors)

### Pre-flight Checklist

Before enabling the campaign:

1. [ ] Campaign status is PAUSED
2. [ ] Landing page PageSpeed score >= 70 (mobile)
3. [ ] All ads approved by Google (check ad status — allow 48 hours for review)
4. [ ] Negative keywords added (50 universal + campaign-specific)
5. [ ] UTM parameters set correctly on all final URLs
6. [ ] Daily budget matches `total_budget_cents / duration_days`
7. [ ] `gclid` capture verified on landing page (click ad preview, check analytics for `gclid` property)

### Phase 1 Monitoring (Days 1-5)

| Metric | Check frequency | Action threshold |
|--------|----------------|-----------------|
| Impressions | Daily | < 50/day after day 2 → switch low-impression keywords to Broad Match |
| CTR | Daily | < 1% after 500 impressions → revise ad copy |
| Avg CPC | Daily | > 2x initial max CPC → lower bids or pause expensive keywords |
| Signups | Day 4+ | 0 signups after 50% budget spent → verify tracking, check landing page |
| Search terms report | Day 3, Day 7 | Add irrelevant terms to negative keywords |

## Phase 2 Playbook (Value Screen)

> **Sibling of the Phase 1 Playbook.** Phase 1 screened for **demand** (signup). Phase 2 screens for **value** (will they pay). Inherits everything not restated here (account structure, gclid capture, UTM scheme, RSA format, negative keywords). **Phase 2 is run manually — not via `/distribute`.**

### 0. What Phase 2 is — and is NOT
A screen, not a scale-up. It tests whether Phase 1 signups are real value or vanity, by measuring willingness to pay. Only **Phase 3** is the long-term commit. Phase 2's job: decide which winners earn a scarce Phase 3 slot. It measures one thing: **of the people we paid to bring, how many take a money-shaped action.**

### 1. Entry
Run on an MVP only when: Phase 1 verdict = **GO** (`/iterate --cross`), and Phase 1 tracking was healthy (no `MISSING_PROJECT_NAME`/`GA_NO_PH_TRACKING`/attribution flags).

### 2. The numbers you set (STANDARDIZED: θ₂, budget cap, duration · PER-MVP: reference price)
Reference price = each MVP's own real intended price (a simple tool and a complex product should not share one price). Only `θ₂` (the pay-intent rate gate), the Phase 2 daily MAX budget cap, and duration are standardized across MVPs. The budget cap protects against high CPC; duration is the time cap; the goal is to reach the click floor (~100 paid clicks), not to spend the cap.

### 3. Build the fake-door (per-MVP `/change` — see Appendix B brief)
User flow (uniform, signup-gated):
```
① Ad click → landing (/?gclid=…&utm_campaign=…) → capture gclid + utm_campaign (cookie/sessionStorage); fire visit_landing (reach)
② Sign up / log in  → fire signup_complete (demand); ★ persist gclid + utm_campaign onto the user record
③ Activate (use core feature once) → fire activate; ★ Upgrade CTA becomes visible only after this
④ Fake-door "Upgrade to Pro · $X/mo" (post-activation, logged-in; no real payment; $X is this MVP's real intended price)
⑤ Click → fire pay_intent (monetize){plan,price_cents,gclid,utm_campaign}; POST /api/pay-intent → row{user_id,distinct_id,gclid,utm_campaign,price_cents,created_at}; do NOT re-ask email
⑥ Honest confirmation: "You're on the Pro early-access list — we'll email you when it's live." (no charge → Google-Ads-safe)
```
Invariants: **gclid + utm_campaign relay** (landing→user→pay_intent event & row — both explicit, not the super-property); gate is **activate**, not login; reuse identity (never re-collect email).

Copy-paste `/change` brief:
```
/change Add a fake-door "Upgrade to Pro" value probe for Google Ads Phase 2. NO real payment.

Requirements (follow exactly — only the reference price differs per MVP; use this MVP's real intended price):
1. EVENTS.yaml: add event
     pay_intent:
       funnel_stage: monetize           # NOT requires:[payment] — fake door
       trigger: User clicks the fake-door Upgrade CTA (post-activation). No charge.
       properties:
         plan:         { type: string, required: true }
         price_cents:  { type: number, required: true }   # MVP's real intended price in cents, shown not charged
         gclid:        { type: string, required: false }
         utm_campaign: { type: string, required: true }   # REQUIRED — explicit phase attribution; required:true forces the wrapper signature + lets the static check assert the callsite passes it (R3/HIGH-3). Pass "" when no campaign.
   Add typed wrapper trackPayIntent({plan, price_cents, gclid, utm_campaign}) to events.ts.
2. DB: table `pay_intent` (id, user_id uuid REFERENCES auth.users(id), distinct_id, gclid, utm_campaign, price_cents, created_at) — follow the template's user-owned-table convention (Supabase: FK to `auth.users(id)`, NOT a `users` table; see `.claude/stacks/database/supabase.md`), RLS ENABLED, server-write only.
3. API POST /api/pay-intent: zod-validate, insert one row for the authenticated user incl. the gclid stored on their user record. Add a unit test.
4. UI: "Upgrade to Pro · $X/mo" CTA using this MVP's real intended price, visible only after login AND activation. On click: trackPayIntent({plan:"pro", price_cents:1900, gclid, utm_campaign}); POST /api/pay-intent; show "You're on the Pro early-access list — we'll email you when it's live." Do NOT open checkout, charge, or re-ask email. (1900 = $19 is only an example.)
5. Attribution relay (BOTH `gclid` AND `utm_campaign`): captured on landing → persisted on the user record at signup → read back onto the `pay_intent` event props AND DB row. Reuse the existing Phase-1 gclid capture path for `utm_campaign` too — do NOT rely on PostHog's `utm_campaign` super-property for the deep-funnel `pay_intent` event (it lacks gclid's hardened dual-capture; R2/HIGH-1).
Do not add Stripe or real payment. Do not change how the core feature is gated.
```

### 4. Pre-flight — `/ads-ready phase-2` must pass (STATIC config check)
`/ads-ready phase-2` is a **source-wiring** check, not a live behavioral test (the smoke harness has no authenticated-session driver). It statically verifies: `pay_intent` is defined in EVENTS.yaml (monetize, no `requires:[payment]`) with a called `trackPayIntent` wrapper; a `POST /api/pay-intent` route inserts a `pay_intent` row including `gclid` + `utm_campaign`; the migration references `auth.users(id)` with RLS; the Upgrade CTA is behind an activation render-guard; no payment-provider import is reachable from the fake-door path. It **cannot** prove runtime firing or catch a determined forgery — forgery-resistance comes from using the one canonical `/change` brief.

### 5. Create the Phase 2 campaign (manual — no MCP)
A **new, separate** campaign (do not reuse the Phase 1 campaign — mixing clicks pollutes the denominator). Steps: New campaign → Search; **name `{mvp}-search-phase2-v{N}`**; Google Search only; budget = the Phase 2 daily **MAX cap**; **Manual CPC** with a max-CPC ceiling so a pricey keyword cannot blow the cap before the click target; clone the Phase 1 ad group/keywords/RSAs/negatives; **set `utm_campaign` to the phase2 name** on all final URLs (this is what lets `/iterate --cross --phase2` isolate Phase 2); PAUSED → pre-flight → enable. **Skip offline conversion import** (manual CPC + PostHog/DB measurement — not needed; pause the Phase 1 campaign during Phase 2).

### 6. Read the verdict — `/iterate --cross --phase2`
`pay_intent_rate = pay_intent / clicks` (DB/PostHog numerator, Phase-2 GA-click denominator).
The click floor is the click target: `clicks < floor → INSUFFICIENT_DATA` · `rate ≥ θ₂ → GO` · `rate < θ₂ → NO_GO (vanity: used free, won't pay)`. Tracking-integrity verdicts take precedence (same as Phase 1). The report surfaces `revenue_intent_per_click` ($/click) next to the rate; θ₂ on the rate remains the GO gate.

### 7. Act
**GO** → eligible for Phase 3; rank GO MVPs by `revenue_intent_per_click` (= pay-intent rate x reference price), promote **top-N** as slots open; Phase 3's first step swaps the fake-door for real payment. A higher-priced MVP with a solid rate can outrank a cheap one; θ₂ stays the uniform GO gate because revenue/click is higher-variance on thin data and is the rank, not the gate. **NO_GO** → stop, document in `/retro`. **INSUFFICIENT** → keep running.

### 8. Pitfalls
Separate campaign (clean denominator) · phase2 token in campaign name **and** `utm_campaign` · no real charge / no Stripe · reuse logged-in identity (no double email) · CTA only post-activation · verify gclid relay via `/ads-ready phase-2` · set each MVP's real price; θ₂ (the pay-intent RATE) is the uniform GO gate, and ranking is value-weighted (revenue per click) so price differences stay comparable.

## UTM Parameters

- `utm_source=google`
- `utm_medium=cpc`
- `utm_campaign={campaign_name}`
- `utm_content={variant_slug}` (when using variants)
- `utm_content=sitelink_{route_slug}` (for sitelink traffic to independent pages)
- `utm_content=sitelink_anchor_{section_id}` (for sitelink traffic to anchor sections)

## Setup Instructions

### One-Time MCC Setup
1. **Create Google Ads MCC** (Manager Account) — see `.claude/procedures/google-ads-setup.md` for details

### Per-Member Setup (one-time per team member)
1. **Create a subaccount** — in the MCC, click "+ New Google Ads account" → name it `{member-name}-ads`. Billing is inherited from the MCC — do not add a separate payment method
2. **Complete Advertiser Verification** — Google will prompt verification for the new account. Complete it once — all future MVPs under this account skip verification
3. **Save Customer ID** — note the account's Customer ID (digits only, no dashes) and save it to `~/.google-ads/customer-id`

### Per-Campaign Setup (do this for each MVP)
1. **Switch to the member's subaccount** — click the subaccount name in the MCC account list to enter it
2. **Phase 1/2:** verify gclid capture and UTM attribution only; do not create or import Google Ads conversions
3. **Phase 3 smart-bidding prep only:** create conversion actions, configure the analytics destination, and map events — see `.claude/procedures/google-ads-setup.md` Steps 6-7 for details

### Dashboard Filter

Filter analytics dashboard by `utm_source = "google"` to see paid traffic performance.

## Chrome MCP Campaign Creation

Campaign creation uses Chrome MCP to interact with the Google Ads web UI directly. No API credentials needed — the user just needs to be logged into Google Ads in Chrome.

### Prerequisites

1. **Claude in Chrome extension** installed and connected (see `.claude/patterns/chrome-mcp-setup-guide.md`)
2. **Google Ads account** — user is logged into their sub-account in Chrome
3. **Chrome tab** with Google Ads open

If any prerequisite is missing, `/distribute` state-6 will detect it and show the setup guide automatically.

### Conversion Action Setup

This is optional Phase 3 smart-bidding prep. Phase 1 and Phase 2 Manual CPC screens do not require a Google Ads conversion action, and `/distribute` skips this by default.

| Setting | Value |
|---------|-------|
| Name | `MVP Signup` |
| Category | Lead → Sign-up |
| Source | Import (Other data sources or CRMs → Track conversions from clicks) |
| Count | One (one conversion per click) |
| Value | Don't use a value |
| Window | 30 days |

**Per sub-account, not per campaign.** Each team member has one sub-account. All their MVP campaigns share this `MVP Signup` action. Google Ads attributes conversions to the correct campaign automatically via the gclid.

**Idempotent.** If you choose to prepare Phase 3 conversion tracking, check the conversions list first. If `MVP Signup` already exists, skip creation.

### Campaign Creation Flow (via Chrome MCP)

`/distribute` state-6 performs these steps in the Google Ads UI:

1. Click "+ New campaign" → "Create a campaign without a goal's guidance" → Search
2. Set campaign name, uncheck Search Partners and Display Network
3. Set locations from `target_geo`, budget from ads.yaml, Manual CPC bidding
4. Create ad group with keywords (Phrase Match)
5. Create 2 RSAs from ads.yaml creative config
6. Add negative keywords at campaign level
7. Save campaign in PAUSED status
8. Record `campaign_id` and `campaign_url` in ads.yaml
9. Capture product screenshots and upload as Image Assets (user approves before upload)
10. Create sitelink extensions from ads.yaml `sitelinks` array (if non-empty)

### Image Assets

Google Search ads support optional Image Assets displayed alongside the text ad. `/distribute` state-6 Step 7.5 automates this by screenshotting the deployed MVP landing page.

| Spec | Dimensions | Content |
|------|-----------|---------|
| Landscape | 1200×628 | Hero section (headline + visual) |
| Square | 1200×1200 | Product UI / feature showcase |

**Process:** Chrome MCP opens the deployed URL → waits for full load → dismisses overlays → takes screenshots → crops to spec via imagemagick → shows to user for approval → uploads to Google Ads campaign Assets.

**Quality requirements:** Page must be fully loaded (no skeletons/spinners). No cookie banners, chat widgets, or popups visible. Use light mode if the page supports dark/light toggle.

**User approval gate:** Screenshots are shown to the user before upload. User can approve, request a different page section, or skip entirely.

### Error Handling

If Chrome MCP fails at any step, the skill:
1. Screenshots the error state
2. Reports which step failed
3. Retries up to 2 times, then asks user to resolve the issue and re-run `/distribute`
