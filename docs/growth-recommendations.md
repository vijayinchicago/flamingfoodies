# FlamingFoodies — Growth Recommendation Plan

**Synthesized from 7 persona audits | Generated 2026-04-18**

---

## Executive Summary

Five changes will unlock the majority of growth available right now:

- **Fix the ReviewSchema** (`components/schema/review-schema.tsx`). Missing `worstRating` and `offers` fields mean every review page is invisible to Google's rich result renderer. Star ratings in SERPs are the single biggest CTR driver for an affiliate review site, and they cost zero ad spend. This is a 15-minute fix.
- **Add affiliate buy links to the two highest-intent pages** (`/hot-sauces/best/` and all `best-for-*` pages). Users who arrive on "best hot sauces" pages are buyers, not researchers. There is currently no way to convert them. No CTA = no commission.
- **Fix two data integrity errors** in `lib/brands.ts` (Tabasco `pepperSlug: "cayenne"` and Fly By Jing `pepperSlug: "gochugaru"`) and `lib/peppers.ts` (gochugaru `origin: "southeast-asia"`). Knowledgeable readers in a niche hot-sauce audience will catch these immediately. Trust lost to a single factual error is disproportionately hard to recover.
- **Add "Reviews" to the main navigation** (`components/layout/header-client.tsx`). Reviews are the primary conversion surface for an affiliate site. The nav currently lists Festivals and Shop but omits Reviews entirely.
- **Inject ad slots into recipe pages and `/hot-sauces/best/`**. Recipe pages generate the most time-on-page of any content type and currently earn $0 in ad revenue. This is money left on the table every day.

---

## Tier 1 — Do This Week

*High revenue impact or critical trust damage, small-to-medium effort. Each item is one developer-day or less.*

---

### T1-1: Fix ReviewSchema — Add `worstRating` and `offers` fields

**Personas:** SEO Auditor (P2) — critical flag

**What to change:**
The `ReviewSchema` component emits a `reviewRating` object with `ratingValue` and `bestRating` but is missing `worstRating: 1`. Without `worstRating`, Google's structured data validator cannot confirm the rating scale is 1–5 and will not render star snippets in SERPs. Additionally, the `itemReviewed` Product node has no `offers` object — Google requires a price signal (even a placeholder `Offer` with `availability`) to surface rich product results.

**File:** `/Users/vijaysingh/apps/flamingfoodies/components/schema/review-schema.tsx`

Add `worstRating: 1` to the `reviewRating` node. Add an `offers` node to `itemReviewed`:
```json
"offers": {
  "@type": "Offer",
  "url": "<affiliate URL from review>",
  "availability": "https://schema.org/InStock",
  "priceCurrency": "USD"
}
```
The `review.affiliateUrl` field is already available in the component's data context via the review detail page.

**Why it matters:** Star ratings in SERPs increase CTR by 15–30% on average. Every review page is a dead SERP listing without this fix. This is a 15-minute code change with the highest SEO ROI on the site.

---

### T1-2: Fix data error — Tabasco `pepperSlug`

**Personas:** Power User / Niche Enthusiast (P7) — critical data error

**What to change:**
`BRANDS` array entry for `tabasco` has `pepperSlug: "cayenne"`. Tabasco sauce is made from *Capsicum frutescens* (tabasco pepper), not cayenne. The cross-link sends users to the wrong pepper encyclopedia page.

**File:** `/Users/vijaysingh/apps/flamingfoodies/lib/brands.ts`, line 49

Change `pepperSlug: "cayenne"` to `pepperSlug: "tabasco-pepper"` (or remove the field if no tabasco-pepper slug exists in the encyclopedia yet). Do not silently point to a wrong pepper — a missing link is better than a wrong one for a niche audience.

**Why it matters:** The core differentiator of a niche site is accuracy. A knowledgeable hot-sauce reader — the site's target audience — will catch this on first visit and lose trust in all subsequent editorial. One data error signals the rest of the content may be unreliable.

---

### T1-3: Fix data error — Fly By Jing `pepperSlug`

**Personas:** Power User / Niche Enthusiast (P7) — critical data error

**What to change:**
`BRANDS` entry for `fly-by-jing` has `pepperSlug: "gochugaru"` (line 136). Fly By Jing is a Sichuan brand built around facing heaven chilis (`Capsicum annuum`) and Sichuan peppercorn — not gochugaru, which is Korean. This cross-link is factually wrong and directionally misleading.

**File:** `/Users/vijaysingh/apps/flamingfoodies/lib/brands.ts`, line 136

Change to the correct pepper slug if facing-heaven chili or Sichuan chili exists in the encyclopedia, or remove `pepperSlug` until a correct entry exists.

**Why it matters:** Same trust risk as T1-2. Fly By Jing's audience specifically knows the brand's Sichuan provenance.

---

### T1-4: Fix data error — Gochugaru `origin: "southeast-asia"`

**Personas:** Power User / Niche Enthusiast (P7) — critical data error

**What to change:**
`lib/peppers.ts` line 431 sets `origin: "southeast-asia"` for gochugaru. Korea is East Asia, not Southeast Asia. The `PepperOrigin` type (line 11) needs to include `"east-asia"` as a valid value.

**Files:**
- `/Users/vijaysingh/apps/flamingfoodies/lib/peppers.ts` — add `"east-asia"` to the `PepperOrigin` union type (line 11), change gochugaru origin from `"southeast-asia"` to `"east-asia"` (line 431)
- Any filter UI or label map that maps `PepperOrigin` values to display strings will need `"east-asia"` added

**Why it matters:** Korean food culture is central to gochugaru's identity. Mislabeling it as Southeast Asian is exactly the kind of error that gets screenshotted and shared negatively in food communities.

---

### T1-5: Add "Reviews" to main navigation

**Personas:** First-Time Visitor (P1)

**What to change:**
The `nav` array in the header (`components/layout/header-client.tsx`, line 8–15) lists: Recipes, Hot Sauces, Peppers, Festivals, Shop, Blog. Reviews are absent. For an affiliate-led site, the review index is the primary conversion surface.

**File:** `/Users/vijaysingh/apps/flamingfoodies/components/layout/header-client.tsx`

Add `{ href: "/reviews", label: "Reviews" }` to the `nav` array. Consider placing it second, between Recipes and Hot Sauces, since it is the highest-intent page type.

**Why it matters:** Navigation is the primary discovery mechanism for first-time visitors. A review-led site that hides its reviews from the nav loses the primary monetization surface immediately.

---

### T1-6: Add affiliate buy links to `/hot-sauces/best/` page

**Personas:** Affiliate Revenue Optimizer (P3) — critical flag, First-Time Visitor (P1)

**What to change:**
`/hot-sauces/best/page.tsx` renders `ReviewCard` components for the top picks but has zero `AffiliateLink` components. Users who search "best hot sauce" and land on this page have clear buying intent and no way to purchase.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best/page.tsx`

Import `AffiliateLink` and `resolveAffiliateLink` (already available in the project). For each card in the primary picks grid, render an inline `AffiliateLink` CTA below the review summary. Use action-oriented copy (see T1-7 below). The `review.affiliateUrl` and `review.affiliateKey` fields are available in the `Review` type.

**Why it matters:** This is the highest-intent page on the site. Missing affiliate links here is the equivalent of a store with no cash register. Every day without links is lost commission.

---

### T1-7: Replace generic "View on Amazon" CTA copy across all affiliate links

**Personas:** Affiliate Revenue Optimizer (P3), First-Time Visitor (P1)

**What to change:**
Every CTA currently says "View on Amazon" — generic, low-urgency, no price signal. Action-oriented copy with specificity converts at 2–5x the rate of generic CTAs.

**Files:**
- `/Users/vijaysingh/apps/flamingfoodies/components/content/affiliate-link.tsx` — audit the default label prop
- `/Users/vijaysingh/apps/flamingfoodies/lib/affiliates.ts` — check if a label field exists per affiliate entry
- Individual page files where `AffiliateLink` is rendered with hardcoded label strings

Replace with copy like: "Check price on Amazon", "Buy for $X.XX", "Add to cart", "See today's price". If price is not available dynamically, use "Check price" as the fallback — it implies live pricing and outperforms static copy.

**Why it matters:** CTA copy is one of the highest-leverage, lowest-effort levers in affiliate conversion. No code architecture change needed — just label copy.

---

## Tier 2 — Do This Month

*High impact but requires a half-day to two days of work, or medium impact with easy execution.*

---

### T2-1: Add affiliate buy links to all `best-for-*` hub pages

**Personas:** Affiliate Revenue Optimizer (P3) — critical flag

**What to change:**
All best-for pages (`best-for-seafood`, `best-for-wings`, `best-for-fried-chicken`, `best-for-pizza`, `best-for-eggs`, `best-for-tacos`) render comparison tables and review cards with zero affiliate CTAs. The `HotSauceComparisonTable` component (`components/hot-sauces/hot-sauce-comparison-table.tsx`) should include a buy column or inline CTA per row.

**Files:**
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-seafood/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-wings/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-fried-chicken/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-pizza/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-eggs/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best-for-tacos/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/components/hot-sauces/hot-sauce-comparison-table.tsx`

**Why it matters:** These pages capture bottom-of-funnel search traffic ("best hot sauce for wings"). Users are comparing to buy. No CTA = no conversion.

---

### T2-2: Add ad slots to recipe pages

**Personas:** Ad Revenue Optimizer (P4) — critical flag

**What to change:**
Recipe pages (`/recipes/[slug]/page.tsx`) have zero `AdSlot` components. Recipes are the highest time-on-page content type — users follow along while cooking, often keeping the page open for 10–20 minutes. This makes them premium ad real estate generating $0 currently.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/recipes/[slug]/page.tsx`

Insert ad slots at:
1. After the hero/intro, before the ingredient list (high viewability)
2. Between method step groups (mid-article, reader is engaged)
3. After the last step, before the ShareBar (exit-intent position)

Reference the existing ad slot pattern from blog or review pages. Import `AdSlot` and `getAdRuntimeConfig` — both are already used elsewhere in the project.

**Why it matters:** Recipe pages may be the site's highest-traffic content type (based on the broad keyword surface they cover). They currently generate zero ad revenue. This is addressable in one day.

---

### T2-3: Add ad slot to `/hot-sauces/best/`

**Personas:** Ad Revenue Optimizer (P4)

**What to change:**
The `/hot-sauces/best/` page has no `AdSlot` components despite being the highest-intent money page. Even one mid-page slot (after the primary picks grid, before the comparison table) adds revenue without disrupting conversion flow.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/hot-sauces/best/page.tsx`

**Why it matters:** Hub pages with high affiliate intent also attract display ad revenue. One slot between content sections is non-disruptive and additive.

---

### T2-4: Add ShareBar to `/hot-sauces/best/` and all `best-for-*` pages

**Personas:** Social Sharer (P6) — critical flag

**What to change:**
`ShareBar` exists in `components/content/share-bar.tsx` and is already used on blog, recipe, and review detail pages. It is absent from all hub/list pages — the pages most likely to be bookmarked and shared.

**Files:** All best-for pages and `/hot-sauces/best/page.tsx`

Add `<ShareBar>` at the bottom of each hub page, after the FAQ section. The component accepts `title`, `url`, `contentType`, `contentId`, `contentSlug` props — populate from the page's metadata.

**Why it matters:** List pages ("best hot sauces for wings") are the most shareable format on food/niche sites. They get linked in Reddit threads, Discord servers, and Substack newsletters. Each link is a free SEO backlink. The component already exists — this is a copy/paste integration.

---

### T2-5: Fix `sitemap.ts` — stop using `new Date()` for static pages

**Personas:** SEO Auditor (P2)

**What to change:**
`app/sitemap.ts` emits `lastModified: new Date()` for all static routes (homepage, hub pages, festivals, peppers, brands, tutorials). This means every time Googlebot hits the sitemap, every page appears to have been updated today. Googlebot's crawl scheduler deprioritizes pages that constantly claim to be updated without actually changing — it learns to distrust the signal.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/sitemap.ts`

For truly static routes (privacy, terms, about, contact), set a fixed date string matching when they were last meaningfully changed. For dynamic routes without a `publishedAt` field (peppers, brands, festivals, tutorials), either add an `updatedAt` field to those data sources or use a hardcoded date from the last meaningful content update. The per-record dates for blog, recipe, and review pages (lines 62–70) are already correct — only the fallback `new Date()` calls need replacing.

**Why it matters:** Crawl budget efficiency directly affects how quickly new content gets indexed. For a site that publishes regularly, correct `lastModified` signals help Google prioritize fresh content over stale.

---

### T2-6: Fix H1 tags on best-for pages to match primary keywords

**Personas:** SEO Auditor (P2)

**What to change:**
Best-for pages use editorial H1 copy ("The bottles that wake up shrimp, fish, and ceviche without flattening them.") while the `<title>` and metadata target "Best Hot Sauces for Seafood and Fish". The H1 is the second-strongest on-page keyword signal after the title tag. When the H1 and title diverge significantly, the page sends mixed relevance signals.

**Files:** All best-for page files — check H1 in `SectionHeading` component's `title` prop

The fix is to lead the H1 with the primary keyword phrase and follow with editorial copy. Example: "Best Hot Sauces for Seafood — The bottles that wake up shrimp, fish, and ceviche." The `eyebrow` prop above the H1 can carry the pure editorial tone while the `title` prop satisfies keyword alignment.

**Why it matters:** H1 alignment with the target keyword is a confirmed on-page SEO factor. Low effort, measurable ranking impact.

---

### T2-7: Add Reddit and TikTok to ShareBar platform list

**Personas:** Social Sharer (P6)

**What to change:**
`ShareBar` includes Pinterest, Facebook, X, WhatsApp but omits Reddit and TikTok. Reddit is the primary community platform for food enthusiasts and hot sauce culture. TikTok is the primary discovery surface for younger audiences entering the niche.

**Files:**
- `/Users/vijaysingh/apps/flamingfoodies/components/content/share-bar.tsx` — add Reddit and TikTok to `shareOptions` array
- `/Users/vijaysingh/apps/flamingfoodies/lib/share.ts` — add Reddit (`https://reddit.com/submit?url=...&title=...`) and TikTok deep link to `buildShareUrls`

**Why it matters:** Reddit shares drive meaningful referral traffic spikes for niche content. A single link in r/spicy or r/hotsauce can send thousands of visitors. TikTok share URLs extend reach to a discovery-mode audience.

---

### T2-8: Add author byline to review and recipe pages

**Personas:** First-Time Visitor (P1), Power User (P7)

**What to change:**
Review detail pages and recipe pages display content without a visible author name, photo, or bio. The `review.authorName` field exists in the `Review` type and is used in the `ReviewSchema` component's author node — but it is not rendered in the UI. Same for recipes (`recipe.authorName`).

**Files:**
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/reviews/[slug]/page.tsx`
- `/Users/vijaysingh/apps/flamingfoodies/app/(public)/recipes/[slug]/page.tsx`

Add a byline component below the hero (e.g., "By [Author Name] · Reviewed [date]") on review pages and "By [Author Name]" on recipe pages. This matches what already exists in the schema — it just needs to be surfaced in the UI.

**Why it matters:** Author attribution is a trust signal for both human readers and Google's EEAT (Experience, Expertise, Authoritativeness, Trustworthiness) guidelines. For a site competing on review credibility, anonymous content undercuts its core value proposition.

---

### T2-9: Add sticky buy bar on review detail pages (mobile + desktop)

**Personas:** Affiliate Revenue Optimizer (P3), Mobile UX Reviewer (P5), First-Time Visitor (P1) — three personas flagged this

**What to change:**
The primary affiliate CTA on review pages (`/reviews/[slug]/page.tsx`) is located in a sidebar that appears below the fold on most screens. On mobile, the sidebar stacks below all content — meaning the CTA is not visible until after the user has finished reading the entire review.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/reviews/[slug]/page.tsx`

Add a sticky bottom bar on mobile (position fixed, bottom 0, full width) containing the product name and a primary CTA button. On desktop, make the sidebar `sticky top-24 self-start` (same pattern as the recipe page's ingredient/step rail at `xl:` — but applied at `lg:` for the review sidebar). The sticky bar should be a new client component to handle scroll-position visibility.

**Why it matters:** Three separate personas flagged this. The primary revenue action on a review page — the buy click — is currently buried. Sticky CTAs consistently outperform static ones in affiliate content because they remain in view throughout the reading session.

---

## Tier 3 — Next Quarter

*High impact but requires significant architecture or content work (3+ days), or medium impact requiring sustained effort.*

---

### T3-1: Fix recipe ingredient/step rail sticky breakpoint for mobile

**Personas:** Mobile UX Reviewer (P5) — critical flag

**What to change:**
The ingredient/step sidebar in `/recipes/[slug]/page.tsx` (line 604) uses `xl:sticky xl:top-24 xl:self-start` — sticky only above 1280px. On every phone, tablet, and most laptops, it scrolls away. For a cooking recipe site, the step rail staying visible while cooking is core UX.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/recipes/[slug]/page.tsx`

Lower the sticky breakpoint from `xl:` to `lg:` (1024px). For mobile and tablet (below `lg:`), add a sticky step indicator at the top of the viewport — a minimal fixed bar showing "Step 3 of 8" with prev/next arrows — as a new client component. This requires a new component but the data is already available.

**Why it matters:** Recipe UX quality directly correlates with session depth, return visits, and social sharing. If users cannot follow the recipe on mobile without losing their place, they leave. Recipe pages should be the stickiest content on a food site.

---

### T3-2: Fix mobile grid layouts — add `sm:grid-cols-2` intermediate step

**Personas:** Mobile UX Reviewer (P5)

**What to change:**
Most grid layouts jump from `grid-cols-1` to `lg:grid-cols-2` or `lg:grid-cols-3` with no intermediate breakpoint. On tablet (768px–1023px), this means either one full-width card per row or cards that don't exist at that screen width.

**Files:** All best-for pages, `/hot-sauces/best/page.tsx`, review and recipe list pages

Add `sm:grid-cols-2` between `grid-cols-1` and `lg:grid-cols-3` in all grid containers. For 3-column grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`. For 2-column grids: `grid-cols-1 sm:grid-cols-2`.

**Why it matters:** Tablet traffic accounts for 10–20% of total sessions on food content sites. Ragged layouts on tablet increase bounce rate and reduce session depth.

---

### T3-3: Add internal links from review detail pages to hub pages

**Personas:** SEO Auditor (P2)

**What to change:**
Review detail pages are SEO dead ends — they receive link equity from SERPs but pass none back to hub pages like `/hot-sauces/best/` or `/hot-sauces/best-for-wings/`. Internal links from leaf pages to hub pages are one of the most effective ways to concentrate PageRank on money pages.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/reviews/[slug]/page.tsx`

Add a "Related picks" or "See more like this" section at the bottom of each review, linking to the relevant hub pages. If a review covers a wing sauce, link to `/hot-sauces/best-for-wings/`. This can be driven by the review's `tags` or `category` fields already in the data model.

**Why it matters:** Hub pages rank for "best X" queries — the highest-revenue keyword class. Review pages that flow equity back to hubs directly support hub page rankings.

---

### T3-4: Build email capture / newsletter signup

**Personas:** First-Time Visitor (P1)

**What to change:**
There is no email capture on the site. Email lists are the only owned channel that is algorithm-independent. A hot sauce niche list converts well for new release announcements, seasonal guides, and affiliate promotions.

**Files:** New component + homepage, review pages, recipe pages

Build a `NewsletterSignup` component with a single email input. Place it: (1) in the homepage below the hero, (2) at the bottom of review pages above the ShareBar, (3) at the bottom of recipe pages. Connect to the existing `lib/newsletter-segments.ts` which suggests this infrastructure was planned.

**Why it matters:** Email subscribers convert at 3–5x the rate of one-time visitors. For an affiliate site, a 2,000-person email list can generate consistent monthly revenue from direct link promotions and new release roundups.

---

### T3-5: Build Scoville comparison tool / pepper substitution guide

**Personas:** Power User / Niche Enthusiast (P7), SEO Auditor (P2)

**What to change:**
The pepper encyclopedia currently has 15 entries with thin coverage of extreme-tier peppers (missing 7 Pot Douglah, Fatalii, datil). A Scoville comparison tool and pepper substitution guide are high-engagement, high-shareability content formats that rank for a large keyword cluster ("what can I substitute for habanero", "how hot is scotch bonnet vs habanero").

**Files:**
- Expand `/lib/peppers.ts` with 10–15 additional pepper entries
- New page: `/peppers/scoville-chart` — interactive heat comparison
- New page: `/peppers/substitution-guide` — "if you have X, use Y" format

**Why it matters:** Tools and comparison pages earn links naturally. A Scoville chart is a link magnet for food blogs. The substitution guide targets high-volume long-tail queries. Both are content that enthusiasts bookmark and share.

---

### T3-6: Improve OG images with product-specific visuals

**Personas:** Social Sharer (P6)

**What to change:**
Current OG images are generic dark-gradient + text, generated by `/api/og`. There is no visual differentiation between a recipe share, a pepper share, and a review share. Social platforms favor images with product shots or strong visual content — they generate higher click rates in feeds.

**Files:**
- `/app/api/og/route.tsx` or equivalent OG image generation route
- Review pages: pass `hero.imageUrl` as the OG image (it likely already exists but may not be wired into the OG tag)

Add product image as the dominant visual in the OG template. For reviews, use the product shot. For peppers, use the pepper photo. For recipes, use the dish photo. The `eyebrow` text can carry the Scoville number or heat level as a visual differentiator.

**Why it matters:** OG image quality directly affects link preview CTR in social feeds, messaging apps, and email. Better social previews increase the value of every share.

---

### T3-7: Add blog post breadcrumb schema back to /blog hub

**Personas:** SEO Auditor (P2)

**What to change:**
Blog posts have `buildArticleStructuredData` (which is correct) but no breadcrumb schema linking the post back to the `/blog` hub. The `BreadcrumbSchema` component exists in `components/schema/breadcrumb-schema.tsx`.

**File:** `/Users/vijaysingh/apps/flamingfoodies/app/(public)/blog/[slug]/page.tsx`

Add `<BreadcrumbSchema>` to each blog post page with breadcrumbs: Home > Blog > [Post Title].

**Why it matters:** Breadcrumb schema enables Google to show the breadcrumb trail in SERPs, which increases result snippet size and reinforces site hierarchy for crawlers.

---

## Tier 4 — Backlog

*Nice-to-have, low immediate revenue impact, or dependencies on larger content investments.*

---

### T4-1: Add batch/vintage field to review data model

**Personas:** Power User / Niche Enthusiast (P7)

Hot sauce formulas change across production batches. Enthusiasts know this and look for it. Add an optional `batchNote` or `vintageYear` field to the `Review` type and render it in the review detail page as a small metadata note. This is low-traffic but high-trust for the core audience.

**File:** `/Users/vijaysingh/apps/flamingfoodies/lib/types.ts`

---

### T4-2: Add price comparison across multiple retailers

**Personas:** Affiliate Revenue Optimizer (P3)

Showing Amazon vs. TheHotSauce.com vs. Heatonist pricing on review and best-for pages adds value for comparison shoppers and allows multiple affiliate links per product. This requires either a price API integration or a manual price management system — significant ongoing maintenance.

---

### T4-3: No-follow / lazy-load ad infrastructure improvements

**Personas:** Ad Revenue Optimizer (P4)

Add lazy-loading to ad slots and consider a sticky desktop ad rail for long-form content. This requires an ad operations decision about network (Google AdSense vs. a premium network like Mediavine) and is dependent on traffic thresholds.

---

### T4-4: Add TikTok video-challenge entry format

**Personas:** Social Sharer (P6)

The competition system exists but has no TikTok video submission format. Building video upload + challenge entry UX is a larger product investment. Revisit when TikTok referral traffic is measurable in analytics.

---

### T4-5: Add interactive Scoville comparison widget to pepper pages

**Personas:** Power User (P7)

An interactive side-by-side Scoville slider or chart on individual pepper pages (not just a static chart page) would increase time-on-page. This is a React component build on top of the static data that already exists in `lib/peppers.ts`. Lower priority than the static comparison page (T3-5).

---

### T4-6: Add "bundle" / value pack CTAs on gift set pages

**Personas:** Affiliate Revenue Optimizer (P3)

`/hot-sauces/best-gift-sets/` and `/hot-sauces/gifts-under-50/` could surface "buy 3 together" bundle CTAs. This depends on whether the affiliate program supports bundle deep links — check Amazon Associates product linking options first.

---

## File Index

Quick reference of all files mentioned in this plan:

| File | Tiers |
|------|-------|
| `components/schema/review-schema.tsx` | T1-1 |
| `lib/brands.ts` | T1-2, T1-3 |
| `lib/peppers.ts` | T1-4 |
| `components/layout/header-client.tsx` | T1-5 |
| `app/(public)/hot-sauces/best/page.tsx` | T1-6, T2-3 |
| `components/content/affiliate-link.tsx` | T1-7 |
| `lib/affiliates.ts` | T1-7 |
| `app/(public)/hot-sauces/best-for-seafood/page.tsx` | T2-1 |
| `app/(public)/hot-sauces/best-for-wings/page.tsx` | T2-1 |
| `app/(public)/hot-sauces/best-for-fried-chicken/page.tsx` | T2-1 |
| `app/(public)/hot-sauces/best-for-pizza/page.tsx` | T2-1 |
| `app/(public)/hot-sauces/best-for-eggs/page.tsx` | T2-1 |
| `app/(public)/hot-sauces/best-for-tacos/page.tsx` | T2-1 |
| `components/hot-sauces/hot-sauce-comparison-table.tsx` | T2-1 |
| `app/(public)/recipes/[slug]/page.tsx` | T2-2, T3-1 |
| `app/sitemap.ts` | T2-5 |
| `components/content/share-bar.tsx` | T2-4, T2-7 |
| `lib/share.ts` | T2-7 |
| `app/(public)/reviews/[slug]/page.tsx` | T2-8, T2-9, T3-3 |
| `app/(public)/blog/[slug]/page.tsx` | T3-7 |
| `lib/types.ts` | T4-1 |

---

## Execution Order for a Solo Developer

**Day 1:** T1-1 (ReviewSchema fix — 15 min), T1-2 + T1-3 + T1-4 (data errors — 30 min), T1-5 (nav — 5 min)
**Day 2:** T1-6 + T1-7 (affiliate links + CTA copy on best page)
**Day 3:** T2-1 (affiliate links on all best-for pages)
**Day 4:** T2-2 (ad slots on recipe pages)
**Day 5:** T2-5 (sitemap fix) + T2-6 (H1 keyword alignment) + T2-3 (ad slot on best page)
**Day 6:** T2-4 (ShareBar on hub pages) + T2-7 (Reddit/TikTok share options)
**Day 7:** T2-8 (author bylines) + T2-9 (sticky buy bar — sticky component build)
**Week 3–4:** T3-1 (recipe mobile sticky), T3-2 (grid layout breakpoints), T3-3 (internal links)
**Month 2:** T3-4 (email capture), T3-5 (Scoville tool), T3-6 (OG images), T3-7 (blog breadcrumbs)
**Backlog:** T4-* items after traffic and revenue baselines are established
