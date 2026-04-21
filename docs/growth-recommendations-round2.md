# FlamingFoodies — Growth Recommendation Plan (Round 2)

**Synthesized from 4 persona audits: CRO, Email/Retention, Gift Buyer, E-E-A-T | Generated 2026-04-18**

---

## Round 2 Summary

This round closes conversion leaks on pages that already get traffic: review detail pages where desktop users see zero buy button, gift pages that never link to products, and a quiz result page that exposes internal debug copy to all visitors. The fastest wins are pure deletions or direct copy-pastes of patterns that already exist elsewhere in the codebase — no new infrastructure required. Three items were flagged by three or more personas independently; those are treated as P0 regardless of individual-persona priority.

---

## Cross-Persona Signal Table

Items flagged by two or more personas are automatically elevated in priority. A single-persona flag can still be P0 if the severity is high (e.g., FTC compliance, live debug output).

| Issue | Personas | Elevated Priority |
|---|---|---|
| Quiz result page: exposed debug copy, broken affiliate mapping, no email capture | CRO + Email + Gift Buyer (3 of 4) | **P0** |
| No buy button above fold on review pages (desktop) | CRO + Gift Buyer | **P0** |
| ReviewCard has no affiliate link on hub/gift pages | CRO + Gift Buyer | **P0** |
| No price shown on ReviewCard | CRO + Gift Buyer | **P1** |
| About page has no named human author | E-E-A-T (single persona, site-wide HCU risk) | **P1** |
| ReviewSchema author typed as Organization not Person | E-E-A-T (single persona, SERP impact) | **P1** |
| Scoville range and flavor notes not rendered on review pages | E-E-A-T (single persona, highest E-E-A-T leverage) | **P0** |
| Affiliate disclosure appears after first buy link on shop page | E-E-A-T / FTC (single persona, compliance) | **P0** |

---

## Tier 1 — Do This Week

*P0 items: high impact, low effort, no new infrastructure. Most are deletions or copy-pastes of existing patterns.*

---

### T1-1: Delete exposed debug copy on quiz result page

**Personas:** CRO (P1 — flagged as "do today")

**File:** `app/(public)/quiz/results/[type]/page.tsx`, lines 91–93

**What to change:** Lines 91–93 render a `<code>` block showing internal copy such as `"Suggested email tag: quiz-heat-hunter"` to all end users. Delete those three lines. This is a one-line-range deletion — no replacement needed.

**Expected impact:** Eliminates an embarrassing trust signal for any user who notices it, and removes a data-leak that reveals internal segmentation logic. Zero user-visible benefit to keeping it.

---

### T1-2: Move AffiliateDisclosure above first buy link on shop page (FTC compliance)

**Personas:** E-E-A-T / Google Quality Rater (P0)

**File:** `app/(public)/shop/page.tsx`, line 420

**What to change:** `<AffiliateDisclosure>` currently appears at line 420, after multiple `<AffiliateLink>` components earlier in the page. FTC guidelines require disclosure before or adjacent to the first affiliate link, not after. Move the `<AffiliateDisclosure>` component to the top of the page content, before the first `<AffiliateLink>` render.

**Expected impact:** FTC compliance. Also a direct E-E-A-T signal — Google Quality Raters are trained to look for disclosure placement. A rater who finds a post-link disclosure will flag the page as low-trust.

---

### T1-3: Render Scoville range and flavor notes on review detail pages

**Personas:** E-E-A-T / Google Quality Rater (P0 — highest single E-E-A-T leverage on the site)

**File:** `app/(public)/reviews/[slug]/page.tsx`, lines 124–145 (above-fold metadata block)

**What to change:** `review.scovilleMin`, `review.scovilleMax`, and `review.flavorNotes` are present in the DB schema (`lib/types.ts` lines 139–149) and in the `Review` type but are never rendered anywhere on the review detail page. `review.heatLevel` (a string like "hot") appears, but that is editorial shorthand, not factual data.

Add a metadata row in the above-fold section showing:
- Scoville range: render as `{review.scovilleMin?.toLocaleString()}–{review.scovilleMax?.toLocaleString()} SHU` when both values are present. Fall back to a single value if only one is set. Omit the row entirely if neither is set.
- Flavor notes: render as a comma-separated tag list or a short inline sentence directly below the Scoville row.

**Expected impact:** Scoville numbers are the clearest signal of genuine product knowledge to both readers and Google Quality Raters. AI-generated content rarely surfaces accurate numeric Scoville data. This differentiates the review from thin affiliate pages and directly supports E-E-A-T scoring. It also gives gift buyers factual context ("498,000 SHU" is more useful than "hot").

---

### T1-4: Make ReviewStickyBuyBar visible on desktop (not only mobile)

**Personas:** CRO (P0), Gift Buyer (P0)

**File:** `app/(public)/reviews/[slug]/page.tsx` (and/or the `ReviewStickyBuyBar` component itself — locate the `lg:hidden` class)

**What to change:** The `ReviewStickyBuyBar` component has a `lg:hidden` Tailwind class, which hides it on screens ≥1024px wide. Desktop users — who represent the majority of affiliate click-through revenue — see zero buy CTA until scrolling roughly 800px. Two options:

- **Option A (recommended):** Remove `lg:hidden` from the sticky bar. Confirm the bar does not visually conflict with desktop layout at full width.
- **Option B:** Add an inline `<AffiliateLink>` buy button directly after the hero image in `app/(public)/reviews/[slug]/page.tsx` around line 169, visible on all breakpoints. This is additive rather than a change to the sticky bar behavior.

**Expected impact:** Desktop users are typically higher-converting than mobile for affiliate clicks. This is zero-click revenue lost every day. Option A is a single class removal.

---

### T1-5: Add AffiliateLink CTAs directly on gift pages

**Personas:** Gift Buyer (P0), CRO (P1 via hub-page pattern)

**Files:**
- `app/(public)/hot-sauces/best-gift-sets/page.tsx`
- `app/(public)/hot-sauces/gifts-under-50/page.tsx`

**What to change:** Neither file imports `AffiliateLink`. The current user path is: gift page → `/reviews/[slug]` → buy link — two clicks minimum before a purchase is possible. Gift buyers often know what they want and will abandon on a second click.

Import `AffiliateLink` (pattern already live in `app/(public)/subscriptions/page.tsx`). Add inline CTAs for:
- `amazon-hot-sauce-gift-box` ($25–45): "Buy on Amazon — from $25"
- `heatonist-gift-set` ($30+): "Shop at Heatonist — from $30"
- `heatonist-hot-ones-season-22` ($35+): "Shop Hot Ones Season 22 — $35+"

Place the CTA directly below each product's description or image, not at the bottom of the page.

**Expected impact:** Eliminating one click from the buy path typically increases conversion 20–40% on gift-category pages, where intent is high but patience is low.

---

### T1-6: Fix affiliate mapping on quiz result page — 4 types, 4 named products

**Personas:** CRO (P1), Gift Buyer (partial — quiz cross-link)

**File:** `app/(public)/quiz/results/[type]/page.tsx`

**What to change:** The current mapping collapses 4 result types to 2 products, and the CTA reads "See Amazon picks" with no product name or price. Give each of the 4 quiz result types a distinct named affiliate product:

| Result type | Suggested product | CTA copy |
|---|---|---|
| `heat-hunter` | Heartbreaking Dawns 1841 Habanero | "Buy Heartbreaking Dawns on Amazon" |
| `flavor-first` | Fly By Jing Sichuan Chili Crisp | "Buy Fly By Jing on Amazon" |
| `mild-curious` | Cholula Original | "Buy Cholula on Amazon" |
| `gift-giver` | Heatonist Hot Ones Season 22 Gift Set | "Shop at Heatonist" |

Use the existing `AffiliateLink` component pattern. Display the product name in a `<strong>` tag before the CTA so the user knows what they are clicking to.

**Expected impact:** Named products convert 2–4x better than generic category CTAs. The quiz is a high-intent, personalized moment — the weakest possible CTA is wasted there.

---

## Tier 2 — Do This Month

*P1 items: meaningful lift, contained scope. Each item is one to three developer-days.*

---

### T2-1: Add EmailCapture to quiz result page (wired to result.tag)

**Personas:** Email/Retention (P1), CRO (P2)

**File:** `app/(public)/quiz/results/[type]/page.tsx`

**What to change:** The `result.tag` field (e.g., `quiz-heat-hunter`) is already defined in the file. The `<EmailCapture>` component and the API route it calls already exist — no new infrastructure needed.

Add `<EmailCapture>` below the affiliate CTA with:
```tsx
<EmailCapture
  source="quiz-result"
  tag={result.tag}
  defaultSegments={["recipe-club"]}
  heading={`Get ${result.title} recipes every week.`}
/>
```

**Expected impact:** Quiz completers are the most engaged visitors on the site. Email capture here seeds the highest-quality segment. The `result.tag` enables per-persona sequences downstream (see T3-2).

---

### T2-2: Add EmailCapture to recipe detail pages

**Personas:** Email/Retention (P1)

**File:** `app/(public)/recipes/[slug]/page.tsx`

**What to change:** Recipe pages are the primary SEO entry point but have zero email capture. Add `<EmailCapture>` after the recipe content (after ingredients/instructions), before related recipes:
```tsx
<EmailCapture
  source="recipe-page"
  defaultSegments={["recipe-club"]}
  tag={recipe.cuisineType}
  heading="Get more recipes like this."
/>
```

**Expected impact:** Recipe pages attract high volumes of top-of-funnel traffic. Even a 1–2% email capture rate on recipe pages will compound quickly as the recipe library grows via the autonomous publish pipeline.

---

### T2-3: Add EmailCapture to hot-sauce hub and sub-pages

**Personas:** Email/Retention (P1)

**Files:**
- `app/(public)/hot-sauces/page.tsx`
- `app/(public)/hot-sauces/best/page.tsx`
- `app/(public)/hot-sauces/best-for-seafood/page.tsx` (and other `best-for-*` sub-pages)

**What to change:** Add `<EmailCapture>` with `defaultSegments={["hot-sauce-shelf"]}` after the primary content grid on each page. Suggested heading: `"New hot sauces reviewed every week. Join the shelf."` Use `source="hot-sauce-hub"` or `source="hot-sauce-best"` to track placement.

**Expected impact:** Hot-sauce hub visitors are brand-loyal return-visitors in the making. Capturing them to the `hot-sauce-shelf` segment enables direct monetization via the release-triggered blast in T3-3.

---

### T2-4: Add EmailCapture to pepper detail pages

**Personas:** Email/Retention (P1)

**File:** `app/(public)/peppers/[slug]/page.tsx`

**What to change:** Pepper pages have affiliate links but no email capture. Add `<EmailCapture>` after the pepper description, before the brand/sauce cross-links:
```tsx
<EmailCapture
  source="pepper-page"
  defaultSegments={["recipe-club"]}
  tag={pepper.slug}
  heading="Get recipes featuring this pepper."
/>
```

**Expected impact:** Pepper page visitors are knowledge-seeking — they are looking up a specific ingredient. Email capture here catches a curious, educated audience likely to engage with recipe content.

---

### T2-5: Change ReviewSchema author from Organization to Person

**Personas:** E-E-A-T / Google Quality Rater (P1)

**File:** `components/schema/review-schema.tsx`, line 30

**What to change:** The `author`/`reviewer` node is typed as `"@type": "Organization"`. Google's structured data documentation for `Review` expects the reviewer to be a `Person` when the review reflects individual experience and expertise. Change:
```json
{ "@type": "Organization", "name": "FlamingFoodies" }
```
to:
```json
{ "@type": "Person", "name": "Mara Santiago", "url": "https://flamingfoodies.com/authors/mara-santiago" }
```

This can be a hardcoded name in the short term; if per-review authorship data is available, use that field instead.

**Expected impact:** Google suppresses author credibility signals when the reviewer is typed as `Organization`. Switching to `Person` (especially with an `url` pointing to an author page) re-enables those signals and is a prerequisite for the author-page work in T2-6.

---

### T2-6: Add a named human to the About page

**Personas:** E-E-A-T / Google Quality Rater (P1)

**File:** `app/(public)/about/page.tsx`

**What to change:** The page currently has zero personal identity — no name, no photo, no origin story. "Mara Santiago" (Founder) exists in sample data but is never surfaced publicly. A Google Quality Rater following the "Who is responsible for this content?" question finds no accountable person, which is a direct HCU risk.

Add a section to the About page with:
- Founder name: Mara Santiago
- A 2–3 sentence origin story (e.g., how and why FlamingFoodies was started)
- A photo or illustrated avatar placeholder
- A link to `/authors/mara-santiago` (can be a stub page for now; see T3-1)

**Expected impact:** About page identity is one of the first things Quality Raters check. This is a 30-minute content edit with site-wide trust implications. The HCU de-ranking risk from a fully anonymous site is real.

---

### T2-7: Add quiz cross-link from gift pages

**Personas:** Gift Buyer (P1)

**Files:**
- `app/(public)/hot-sauces/best-gift-sets/page.tsx`
- `app/(public)/hot-sauces/gifts-under-50/page.tsx`

**What to change:** Gift buyers purchasing for someone else do not know the recipient's heat tolerance. Add a callout block near the top of both gift pages (before the product grid):

```
Not sure how spicy they like it?
→ Take the 2-minute heat tolerance quiz
```

Link the callout to `/quiz`. This is a 5-line JSX addition.

**Expected impact:** The quiz converts a stuck "I don't know what to buy" visitor into a segmented, personalized product recommendation — and into an email subscriber (after T2-1 is live). It also reduces buyer's remorse returns or regifting.

---

### T2-8: Show price on ReviewCard

**Personas:** Gift Buyer (P0 — needed for budget confirmation), CRO (P2 — implied by affiliate mapping work)

**Files:**
- `components/cards/review-card.tsx` (73 lines, never renders `priceUsd`)
- `lib/types.ts` line 143 (`Review.priceUsd` is defined as optional)

**What to change:** Add a price display to the ReviewCard component. When `review.priceUsd` is set, render it as:
```tsx
{review.priceUsd && (
  <span className="text-sm text-muted-foreground">${review.priceUsd}</span>
)}
```

Place it adjacent to the rating or below the product name — not in the footer of the card where it is easy to miss. Gift buyers scan cards looking for "$25" or "$45" before they read anything else.

**Expected impact:** On gift pages, a missing price means the user must click into the review to confirm budget fit. Many will not. Price on the card reduces the "does this fit my budget?" friction that causes gift-buyer abandonment.

---

### T2-9: Add buy CTA to compare page winner banner

**Personas:** CRO (P1)

**File:** `app/(public)/hot-sauces/compare/page.tsx`, lines 339–358

**What to change:** The winner banner shows "Our pick: [Product]" with explanatory copy but no `AffiliateLink`. A user who has just read a comparison and seen a winner declared is at peak purchase intent. Add an `AffiliateLink` immediately inside the winner banner, using copy like `"Buy [Product Name] on Amazon"` or `"Check price on Amazon"`.

**Expected impact:** Comparison pages are high-intent entry points (users search "X vs Y hot sauce"). The moment a winner is declared is the highest-conversion moment on the page. A missing CTA there is a direct revenue miss.

---

### T2-10: Add AffiliateLink to ReviewCard sections on the hot-sauce hub page

**Personas:** CRO (P1), Gift Buyer (implied)

**File:** `app/(public)/hot-sauces/page.tsx`, lines 116–120

**What to change:** The hub page shows ReviewCards with zero buy links. The pattern for inline affiliate links on ReviewCards already exists on `app/(public)/hot-sauces/best/page.tsx`. Copy that pattern to the hub page's card rendering block.

**Expected impact:** The `/hot-sauces/` hub is a high-traffic landing page for the "hot sauces" keyword cluster. Zero affiliate links on a page full of product cards is a complete monetization miss.

---

## Tier 3 — Bigger Bets

*P2/P3 items: higher effort or editorial decisions. Worth planning now, executing over the next 1–2 months.*

---

### T3-1: Create `/authors/[slug]` pages

**Personas:** E-E-A-T / Google Quality Rater (P2)

**Files:** New route `app/(public)/authors/[slug]/page.tsx` (new file)

**What to change:** Create author profile pages. Minimum viable version:
- Author name, photo/avatar, bio paragraph
- List of reviews and recipes attributed to this author
- Link from review bylines ("By Mara Santiago") to the author page

This is a prerequisite for the ReviewSchema `Person` author URL in T2-5 to resolve to a real page.

**Expected impact:** Author pages with content attribution are a Helpful Content Update signal. They also allow Google to build an entity graph connecting the author to the site's topical expertise. Medium effort (new route + data model), but long-term E-E-A-T payoff.

---

### T3-2: Wire quiz result tags into per-persona ConvertKit email sequences

**Personas:** Email/Retention (P2)

**File:** `lib/services/newsletter.ts` (`syncCampaignToKit()` already exists)

**What to change:** After T2-1 is live (quiz captures emails with `result.tag`), create 4 ConvertKit automation sequences — one per quiz persona type (`heat-hunter`, `flavor-first`, `mild-curious`, `gift-giver`). Each sequence delivers 3–5 emails over 2 weeks with content and affiliate links matching the persona.

The ConvertKit tag is already being sent via `result.tag`. The sequences need to be built in ConvertKit and linked to those tag triggers.

**Expected impact:** Per-persona email sequences routinely outperform broadcast newsletters by 2–5x on open rate and click-through. This is the highest-leverage email move once the capture is in place.

---

### T3-3: Release-triggered email blast to hot-sauce-shelf segment

**Personas:** Email/Retention (P3)

**File:** `lib/services/newsletter.ts` (`syncCampaignToKit()` exists), `lib/services/automation.ts`

**What to change:** When a new hot sauce review publishes (via the autonomous publish pipeline), trigger a mini email to the `hot-sauce-shelf` segment: subject line `"New review: [Product Name]"`, body with rating, 1-sentence summary, and AffiliateLink CTA. Wire this into the publish pipeline's post-publish hook.

**Expected impact:** Hot-sauce enthusiasts on the `hot-sauce-shelf` segment are the most likely buyers. A timely "new review just dropped" email captures peak freshness interest. This is the email channel's highest-converting send type for affiliate sites.

---

### T3-4: Segment-branched weekly digest

**Personas:** Email/Retention (P4)

**File:** `lib/services/automation.ts` — `createWeeklyDigest()` function

**What to change:** Modify `createWeeklyDigest()` to generate two variants:
- `recipe-club` segment: recipe-heavy digest (3 recipes, 1 sauce, 1 tip)
- `hot-sauce-shelf` segment: sauce-heavy digest (3 sauces/reviews, 1 recipe pairing, 1 deal)

If ConvertKit supports dynamic content blocks by segment, use that. Otherwise, generate two separate campaigns and send each to its respective segment.

**Expected impact:** Segmented digests improve open rates 15–25% over single-segment broadcasts. The lift compounds weekly.

---

### T3-5: Add "next review" / related product panel at end of review detail pages

**Personas:** CRO (P2)

**File:** `app/(public)/reviews/[slug]/page.tsx`, after `CommentSection` at line 317

**What to change:** Add a "You might also like" panel with 2–3 related reviews (matched by `heatLevel`, `flavorProfile`, or `brandId`). Each card in the panel should have an inline `AffiliateLink`. This is the equivalent of Amazon's "customers also bought" section — it captures users who are done with the current review but still in a buying mindset.

**Expected impact:** End-of-page related panels typically add 8–15% additional affiliate clicks per review page session. Medium effort (requires a recommendation query in the data layer).

---

### T3-6: Reorder review page above-fold elements

**Personas:** CRO (P2)

**File:** `app/(public)/reviews/[slug]/page.tsx`, lines 124–145

**Current order:** title → description → plain rating (`4.2/5` text) → ShareBar → AffiliateDisclosure → hero image

**Recommended order:** title → description → **star rating (rendered stars, not plain text)** → hero image → AffiliateDisclosure → buy CTA

**What to change:**
1. Move the hero image above the disclosure.
2. Render the rating as visual stars (SVG or a component), not as `4.2/5` plain text.
3. Move `<AffiliateDisclosure>` to sit directly above the buy CTA, not between the description and the hero image.

**Expected impact:** Star rating rendered as visual stars converts better than numeric text (the eye registers it faster). Moving the hero image up increases time-on-page as users engage with the product photo before reading the disclosure. Medium effort — primarily JSX reordering plus a star-render component.

---

### T3-7: Add "Beginner-safe" / "For enthusiasts" badges on gift page cards

**Personas:** Gift Buyer (P1)

**Files:**
- `app/(public)/hot-sauces/best-gift-sets/page.tsx`
- `app/(public)/hot-sauces/gifts-under-50/page.tsx`
- `components/cards/review-card.tsx`

**What to change:** Add a `giftAudience` prop to ReviewCard (`"beginner-safe"` | `"enthusiast"` | `"adventurous"`), rendered as a small badge on the card image or below the product name. Gift pages would pass this prop explicitly for each product they feature.

**Expected impact:** Gift buyers are buying for someone else and are terrified of getting the heat level wrong. A visible badge that says "Beginner-safe" answers their primary anxiety without requiring a click. This is a meaningful UX improvement for the gift-buyer persona specifically.

---

## Suggested Day-by-Day Execution Order (Solo Developer)

*Assumes 2–4 hours of focused dev time per day. Items are ordered: compliance first, then revenue leaks, then growth.*

| Day | Item | Est. Time | Why This Order |
|---|---|---|---|
| **Day 1 (Monday)** | T1-1: Delete quiz debug lines | 5 min | Compliance + embarrassment fix, deploy immediately |
| **Day 1 (Monday)** | T1-2: Move AffiliateDisclosure on shop page | 15 min | FTC compliance, same deploy |
| **Day 1 (Monday)** | T1-4: Remove `lg:hidden` from ReviewStickyBuyBar | 20 min | Highest revenue-per-minute fix on the site |
| **Day 2 (Tuesday)** | T1-3: Render Scoville + flavor notes on review pages | 2–3 hrs | Highest E-E-A-T leverage; needs template work |
| **Day 3 (Wednesday)** | T1-5: Add AffiliateLink to both gift pages | 2 hrs | P0 for Gift Buyer persona; clear pattern to follow |
| **Day 3 (Wednesday)** | T1-6: Fix quiz affiliate mapping (4 products) | 1 hr | Same file; batch with quiz work |
| **Day 4 (Thursday)** | T2-1: Add EmailCapture to quiz result page | 1 hr | Immediate email list growth from quiz completers |
| **Day 4 (Thursday)** | T2-7: Add quiz cross-link from gift pages | 30 min | 5-line JSX; batch with gift page session |
| **Day 5 (Friday)** | T2-8: Show price on ReviewCard | 1.5 hrs | Affects all card grids; test across breakpoints |
| **Day 5 (Friday)** | T2-9: Add CTA to compare page winner banner | 30 min | One-liner AffiliateLink addition |
| **Day 6 (Monday)** | T2-2: EmailCapture on recipe pages | 1.5 hrs | Highest-traffic SEO pages; compound email growth |
| **Day 6 (Monday)** | T2-3: EmailCapture on hot-sauce hub pages | 1 hr | Batch with recipe capture work |
| **Day 7 (Tuesday)** | T2-4: EmailCapture on pepper pages | 1 hr | Same component, new placement |
| **Day 7 (Tuesday)** | T2-10: AffiliateLink on hub page ReviewCards | 1 hr | Copy pattern from `/hot-sauces/best/` |
| **Day 8 (Wednesday)** | T2-5: Fix ReviewSchema author type | 30 min | One-line JSON change; deploy |
| **Day 8 (Wednesday)** | T2-6: Add Mara Santiago to About page | 2 hrs | Mostly content writing; no code complexity |
| **Day 9 (Thursday)** | T3-6: Reorder review page above-fold | 2–3 hrs | JSX reorder + star renderer component |
| **Day 10 (Friday)** | T3-1: Create `/authors/[slug]` pages (stub) | 3–4 hrs | New route; minimum viable author page |
| **Week 3** | T3-2: ConvertKit sequences for quiz personas | 3–4 hrs + ConvertKit setup | Requires email volume from T2-1 to be meaningful |
| **Week 3** | T3-7: Gift audience badges on cards | 2 hrs | Lower urgency; schema work |
| **Week 4** | T3-3: Release-triggered email blast | 3 hrs | Requires hot-sauce-shelf list to have subscribers |
| **Week 4** | T3-5: Related review panel at end of review pages | 3–4 hrs | Requires recommendation query; plan data model first |
| **Month 2** | T3-4: Segment-branched weekly digest | 4–6 hrs | Build after segments have real subscriber counts |

---

*Next audit round should check: (1) quiz result page affiliate click-through rate after T1-6, (2) email capture rate on recipe pages after T2-2, (3) Google Search Console structured data report after T2-5, (4) gift page bounce rate after T1-5.*
