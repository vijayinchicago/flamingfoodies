# Niche Site Playbook — Session Kickoff + Phase Guide

Use this document to spin up a new automated, affiliate-revenue niche site from scratch.
Each phase is a standalone prompt you can paste into a fresh AI coding session.
Fill in `[NICHE]`, `[DOMAIN]`, and the bracketed placeholders before sending.

If your goal is to build a FlamingFoodies-style niche clone with the same operating model, start with [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md) first.
This playbook is the phased implementation companion, not the top-level architecture contract.

---

## Fresh Session Kickoff

Paste this first in a brand-new AI coding session and repo before you start the phase prompts:

```text
Read `docs/master-rebuild-spec.md` and `docs/niche-site-playbook.md`.

We are in a new project and the goal is to build a full niche site that follows the FlamingFoodies operating model:
- Next.js + TypeScript + Tailwind + Supabase + Vercel
- strong public editorial + commerce site
- real admin console
- automation control plane with agents, approvals, runs, and evaluations
- graceful degradation when optional providers are not configured yet

Use `docs/master-rebuild-spec.md` as the architecture contract and `docs/niche-site-playbook.md` as the phased implementation guide.
If `docs/master-rebuild-spec.md` is not present, use this playbook as the primary source of truth.

Important instructions:
- implement the code in the current repo, not just plans or summaries
- work through the phases in order unless the docs clearly justify combining steps
- make the site launchable even before external provider setup is complete
- when optional tools are missing, keep the UI and automation surfaces working with clear `needs_config` states
- preserve the bounded-autonomy model instead of building an unbounded AI autopilot
- add concise docs where future operators will need them

Project inputs:
- Site name: [SITE NAME]
- Domain: [DOMAIN]
- Tagline: [TAGLINE]
- Niche: [NICHE]
- Audience: [AUDIENCE]
- Core verticals: [VERTICALS]
- Core entities: [ENTITIES]
- Monetization plan: [MONETIZATION PLAN]
- Optional providers for phase 1: [LIST OR "none yet"]

Start with Phase 0 from `docs/niche-site-playbook.md`, generate the strategy, and then continue into implementation.
At the end of each major phase, summarize what is complete, what still needs configuration, and what should happen next.
```

---

## How to use this

1. Start a new AI coding session in an empty directory
2. Run Phase 0 first — it generates the strategy doc that informs every phase after
3. Run phases in order, pasting each prompt into your AI coding agent
4. Each phase builds on the previous one — don't skip phases
5. Commit after each phase before moving to the next
6. Deploy from a clean commit, tag, or release candidate snapshot instead of a dirty mixed workspace

If you are rebuilding after an outage, data loss, or provider wipe instead of creating a brand-new site, use the companion recovery manual too:

- [docs/disaster-recovery-rebuild-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/disaster-recovery-rebuild-playbook.md)

If you want a reusable package for creating other niche sites that follow this exact model, keep these together:

- [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md)
- [docs/niche-site-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/niche-site-playbook.md)
- [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md)
- [docs/editorial-style-guide.md](/Users/vijaysingh/apps/flamingfoodies/docs/editorial-style-guide.md)

---

## Phase 0 — Niche Strategy

> **Goal:** Lock in the content model, monetization hooks, and taxonomy before writing any code.

```
I want to build an automated niche content site focused on [NICHE].

The site should:
- Generate passive revenue through affiliate links and display ads
- Use a bounded autonomous system with cron-driven agents, approvals, and evaluator loops
- Rank in Google for long-tail niche search queries
- Need limited operator intervention after launch, mainly for approvals, rollback, and link upgrades

Please produce a strategy document covering:

1. **Site concept** — One-sentence positioning statement for [NICHE]. Who is the audience, what pain do they have, what does this site solve.

2. **Content types** — List 6–8 content verticals this site needs (e.g. for a hot sauce site: recipes, reviews, festivals, pepper encyclopedia, brand directory, how-to guides, seasonal content, community). For each vertical describe: what it contains, how it gets updated (manually seeded, agent-discovered, or user-generated), and its primary SEO purpose.

3. **Monetization hooks** — For each content vertical, identify the affiliate angle (Amazon product types to link, affiliate networks to join), ad placement opportunities, and any subscription/membership upsell.

4. **Taxonomy** — Define the core categories, tags, and filter dimensions that content will be organized by. These become the database schema enums and the navigation structure.

5. **Agent strategy** — List 6–10 automation lanes across draft-only discovery, bounded-live publishers/executors, external-send distribution, evaluator loops, and internal support syncs. For each: what it does, how often it runs, what table or write surface it touches, what guardrails bound it, and whether it stops at draft, approval, or live state.

6. **SEO keyword targets** — List 10 high-intent, low-competition keyword clusters this site should own in year one. Include the page type that would rank for each.

7. **Navigation structure** — Primary nav (max 6 items), footer columns, and the 3 most important landing pages beyond the homepage.

8. **Competitor differentiation** — What makes this site better than the top 3 Google results for [NICHE] searches.

Output this as a structured markdown document I can reference throughout the build.
```

---

## Phase 1 — Project Bootstrap

> **Goal:** Create the Next.js project with the design system, layout, and config files wired up.

```
I'm building a niche content site called [SITE NAME] at [DOMAIN], focused on [NICHE].

Here is the strategy doc from Phase 0:
[PASTE PHASE 0 OUTPUT HERE]

Bootstrap a Next.js 14 App Router project with the following:

**Tech stack:**
- Next.js 14 with App Router and TypeScript
- Tailwind CSS with a custom design system (dark theme preferred)
- Supabase for database and auth
- Vercel for hosting and cron jobs
- An AI provider SDK or adapter for agent workflows

**Design system:**
- Color palette suited to [NICHE] — propose primary, accent, and neutral colors with names (like `flame`, `ember`, `cream`, `charcoal`)
- Custom Tailwind config with those color names, a display font (Google Fonts), and body font
- Utility classes: `container-shell` (max-w with padding), `panel` (card background), `eyebrow` (small caps label), `font-display`
- Dark background with light text — charcoal/dark background, cream text, colored accent

**Files to create:**
- `tailwind.config.ts` with colors and fonts
- `app/globals.css` with base styles and utility classes
- `app/layout.tsx` with metadata, header, footer, GA4/AdSense placeholders
- `components/layout/header-client.tsx` — sticky header with mobile menu and the nav from the strategy doc
- `components/layout/footer.tsx` — 4-column footer with all nav sections from strategy doc
- `lib/env.ts` — type-safe env var wrapper for all env vars below
- `lib/utils.ts` — absoluteUrl(), formatDate(), cn(), slugify()
- `lib/seo.ts` — buildMetadata() with canonical, OG, Twitter card support
- `vercel.json` — empty crons array (we'll fill this in Phase 6)
- `middleware.ts` — basic auth protection for /admin routes
- `.env.example` — all env vars with descriptions. Include these exactly:

```bash
# ── Supabase ──────────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=          # Project URL from Supabase dashboard
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=  # Publishable/public key — safe to expose
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Optional legacy fallback if your starter still expects it
SUPABASE_SERVICE_ROLE_KEY=         # Service role key — server-only, never expose to client

# ── Site ──────────────────────────────────────────────────
NEXT_PUBLIC_SITE_URL=              # Full URL e.g. https://yoursite.com (no trailing slash)
                                   # Also used to build hero image URLs — required
NEXT_PUBLIC_SITE_NAME=             # Public site/brand name

# ── AI & Automation ───────────────────────────────────────
AI_PROVIDER_API_KEY=               # API key for your chosen AI provider
AI_PROVIDER_MODEL=                 # Primary model identifier for generation/evaluation lanes
CRON_SECRET=                       # Any random string — sent as Authorization: Bearer <CRON_SECRET> to cron routes

# ── Affiliate & Commerce ──────────────────────────────────
NEXT_PUBLIC_AMAZON_TAG=            # Amazon Associates tracking ID for affiliate links

# ── Audience & Email (optional) ───────────────────────────
CONVERTKIT_API_KEY=                # ConvertKit form subscribe key
CONVERTKIT_API_SECRET=             # ConvertKit broadcast/send key for approval-gated sends
CONVERTKIT_FORM_ID=                # ConvertKit signup form ID

# ── Social Distribution (optional) ────────────────────────
BUFFER_API_KEY=                    # Preferred Buffer API key
BUFFER_CHANNEL_IDS=                # e.g. pinterest:channel-id,instagram:channel-id
BUFFER_PINTEREST_BOARD_ID=         # Pinterest board service ID for live sends
BUFFER_ORGANIZATION_ID=            # Helpful for local inspection scripts
BUFFER_ACCESS_TOKEN=               # Optional legacy fallback
BUFFER_PROFILE_IDS=                # Optional legacy fallback

# ── Search Console (optional but recommended) ─────────────
GOOGLE_SEARCH_CONSOLE_PROPERTY=    # e.g. sc-domain:yoursite.com
GOOGLE_SEARCH_CONSOLE_CLIENT_ID=
GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=
GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=
GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN=

# ── Analytics & Ads ───────────────────────────────────────
NEXT_PUBLIC_GA4_ID=                # Google Analytics 4 measurement ID (optional)
NEXT_PUBLIC_CLARITY_ID=            # Microsoft Clarity project ID (optional)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=      # Plausible domain (optional)
NEXT_PUBLIC_ADSENSE_ID=            # Google AdSense publisher ID (optional, add after approval)
NEXT_PUBLIC_SHOW_ADS=              # "true" to enable ads in production

# ── Images: Body / inline photos (optional, add after launch) ─
UNSPLASH_ACCESS_KEY=               # Free at unsplash.com/developers — used for inline article photos
# PEXELS_API_KEY=                  # Alternative to Unsplash — free at pexels.com/api

# ── Images: AI-generated (optional, paid) ─────────────────
# IMAGE_MODEL_API_KEY=             # Optional API key for an AI image provider
# IMAGE_MODEL_NAME=                # Optional image model identifier
```

The site name is [SITE NAME]. The tagline is [TAGLINE]. Propose a logo mark using an emoji or simple CSS shape that fits [NICHE].
```

---

## Phase 2 — Content Model & Static Seed Data

> **Goal:** Define TypeScript types and seed data for the 2–3 most important content verticals. This gives you real content before the DB is wired up.

```
The site is [SITE NAME], focused on [NICHE].

Strategy doc:
[PASTE PHASE 0 OUTPUT]

For each of the following content verticals from our strategy, create a TypeScript lib file with:
1. The TypeScript interface/type definitions
2. A static array of 10–15 real seed entries (use real data — real names, real descriptions, not "Example Product 1")
3. Helper functions for filtering, sorting, and finding by slug
4. A DB layer section (stub functions that try to read from Supabase, fall back to static array on error)

**Content verticals to build:**
[LIST THE TOP 3 FROM YOUR PHASE 0 STRATEGY — e.g., "recipes", "product reviews", "brand directory"]

**For each lib file, the interface should include:**
- slug (string, kebab-case)
- All content fields
- SEO fields: description (meta description length), featured (boolean)
- Taxonomy fields: tags, category
- Affiliate fields: affiliateKeys array (for linking to Amazon products)
- status: "published" | "draft" (for the review workflow)

**For each vertical, also create:**
- `lib/services/[vertical]-discovery.ts` — stub for the AI agent that will populate this table (just the function signature and return type for now)

Make the seed data feel genuinely useful and editorial. This is the content that will be live when the site launches — make it good enough that a real visitor would be impressed.
```

---

## Phase 3 — Database Schema

> **Goal:** Create Supabase migration files that match the content model from Phase 2.

```
The site is [SITE NAME], focused on [NICHE].

Content model from Phase 2:
[PASTE THE INTERFACES FROM PHASE 2 LIB FILES]

Create Supabase migration files in `supabase/migrations/`:

For each content vertical, create a migration that:
1. Creates the table with columns matching the TypeScript interface (camelCase → snake_case)
2. Adds an index on `slug` (UNIQUE) and `status`
3. Enables Row Level Security
4. Adds a public read policy: `FOR SELECT USING (status = 'published')`
5. Creates an `updated_at` trigger using a shared `set_updated_at()` function
6. Seeds the table with the static seed data from Phase 2 using `INSERT ... ON CONFLICT (slug) DO NOTHING`

Also create:
- A migration for the `profiles` table (id, username, avatar_url, bio, created_at) with auth trigger
- A migration for the `page_views` table (path, referrer, created_at) for basic analytics
- `lib/supabase/client.ts` — browser Supabase client
- `lib/supabase/server.ts` — server Supabase client (for server components)
- `lib/supabase/admin.ts` — service role client (for cron agents)
- `lib/cron.ts` — requireCronAuthorization(request) using `Authorization: Bearer <CRON_SECRET>`

Name migration files with timestamp prefix: `20260101000000_create_[table]_table.sql`
```

---

## Phase 4 — Hero Images

> **Goal:** Every content page needs a hero image. Without this, the site looks broken and unfinished. Do this before building pages.

This is the most commonly skipped phase and the most visible failure. A site with no images looks like a scraper blog.

### How the image system works — read this before starting

There are three layers to images on a niche site. Understand all three before writing any code:

**Layer 1 — Hero / card images (required, zero cost, no API key)**
These are the large images at the top of every detail page and on every content card.
The approach: dynamic edge-rendered images using `next/og` (`ImageResponse` from `next/og`).
- `next/og` is **built into Next.js** — no install, no API key, no external service, no cost
- You create API routes (e.g. `app/api/recipe-hero/route.tsx`) that return a 1200×630 PNG rendered from JSX at the edge
- Images are generated on demand from content metadata (title, category, etc.) — nothing is stored
- The only env var needed: `NEXT_PUBLIC_SITE_URL` (already required for canonical URLs)
- **This covers 100% of what a site needs to not look broken at launch**

**Layer 2 — Body / inline images (optional, free tier available)**
These are photos embedded within article body text — a photo of a dish mid-recipe, a product shot inside a review.
- At launch, skip these — the AI agents don't generate them and the CSS hero images are enough
- When you want real photos: use the **Unsplash API** (free, no credit card) or **Pexels API** (free)
  - Unsplash: `https://api.unsplash.com/photos/random?query=[NICHE KEYWORD]&orientation=landscape` — requires `UNSPLASH_ACCESS_KEY` (free at unsplash.com/developers)
  - Pexels: similar endpoint — requires `PEXELS_API_KEY` (free at pexels.com/api)
  - Both allow commercial use with attribution
- An agent can auto-fetch a relevant photo when generating content and store the URL in the DB

**Layer 3 — AI-generated images (optional, paid)**
Custom AI images per article — looks premium but costs money per image.
- Use any managed or self-hosted image-generation provider that fits the budget and license needs
- Store provider credentials in generic image-generation env vars rather than hard-coding one vendor into the architecture
- Use sparingly — only for featured/hero content, not bulk generation
- Never required for launch; add later if budget allows

**Summary of API keys for images:**

| Layer | Service | Env Var | Cost |
|-------|---------|---------|------|
| Hero/card images | next/og (built-in) | none needed | free |
| Body photos | Unsplash API | `UNSPLASH_ACCESS_KEY` | free |
| Body photos | Pexels API | `PEXELS_API_KEY` | free |
| AI images | AI image provider | `IMAGE_MODEL_API_KEY`, `IMAGE_MODEL_NAME` | varies |

**For a new site: start with Layer 1 only. Add Layer 2 via Unsplash once the site is live.**

---

```
The site is [SITE NAME], focused on [NICHE].

Design system colors from Phase 1: [PRIMARY], [ACCENT], [BACKGROUND]
Content verticals from Phase 2: [LIST VERTICALS]

Build the Layer 1 hero image system using Next.js `ImageResponse` (from `next/og`) running on the edge runtime.
No additional packages need to be installed — `next/og` is built into Next.js 13.3+.

**For each content vertical, create a hero API route:**
`app/api/[vertical]-hero/route.tsx`

Each route:
- `export const runtime = "edge"`
- Accepts query params: `title`, `category`, `subtitle`, and any niche-specific params (e.g. `heat`, `wood`, `cuisine`, `rating`)
- Defines a `palettes` object — one color palette per category value (e.g. for BBQ: offset, pellet, kamado, kettle each gets different smoke-toned gradients)
- Picks the palette deterministically using a hash of the title slug (so the same item always gets the same palette)
- Renders a 1200×630 image using inline JSX styles only (no external CSS, no Tailwind — edge runtime restriction)
- Left side: eyebrow label, large title text, subtitle, site domain badge
- Right side: a CSS-drawn illustration representing the niche and category (pure divs with border-radius, gradients, absolute positioning — no <img> or SVG)
- Adds a radial gradient glow behind the illustration for depth

**CSS illustration ideas by niche:**
- BBQ/smoking: a smoker silhouette (cylinder body + stack), smoke rings floating up, wood log shapes at base
- Coffee: an espresso cup with steam wisps, crema gradient on top
- Aquarium: rectangular tank outline, plant shapes, fish ovals, bubble dots rising
- Bread: oval loaf shape, score lines on top, steam rising, cross-section showing crumb holes

**Also create a generic fallback:**
`app/api/og/route.tsx` — accepts `title`, `eyebrow`, `subtitle`, renders a simple on-brand gradient card

**For each content vertical, create a hero fields helper:**
`lib/[vertical]-hero.ts`

This file exports:
- `get[Vertical]HeroFields(item)` — returns `{ imageUrl, title, subtitle, category }` where `imageUrl` is the absolute URL to the hero API route with the correct query params built from the item's fields
- `isGenerated[Vertical]HeroImageUrl(url)` — returns true if the URL points to the generated hero route (used to decide whether to re-generate or use a stored URL)

**Wire hero images into pages:**
- Card components: use `get[Vertical]HeroFields(item).imageUrl` as the card image src
- Detail pages: use the same helper for the hero banner
- `generateMetadata`: pass the hero image URL to `buildMetadata({ images: [imageUrl] })` so OG shares show the correct image
- Use Next.js `<Image>` with `unoptimized` for API-route-generated images (they're already sized correctly)

**Palette design guidance:**
Make 4–6 palettes per content type. Each palette needs:
- `background`: a `linear-gradient` with 3 stops — dark base → mid tone → accent
- `glow`: the color of the radial bloom behind the illustration
- `surface`: the color of the illustration's main body/plate
- `accent`: highlight color for text and small details
- `garnish`: secondary illustration color (steam, leaves, bubbles, etc.)
Each palette should feel distinct but stay within the site's overall color family.
```

---

## Phase 5 — Public Pages

> **Goal:** Build the homepage and listing/detail pages for each content vertical. Phase 4 must be complete first so every page has images from day one.

```
The site is [SITE NAME], focused on [NICHE].

Design system: [DESCRIBE YOUR COLORS/FONTS FROM PHASE 1]
Content lib files are in lib/ from Phase 2.
Hero image helpers are in lib/[vertical]-hero.ts from Phase 4.

Build the following pages using Next.js App Router async server components:

**Homepage** (`app/(public)/page.tsx`):
- Hero section with headline, subhead, and 2 CTAs
- "Featured [PRIMARY VERTICAL]" section — 3 cards with hero images
- "Latest [SECONDARY VERTICAL]" section — 4 cards with hero images
- A niche-specific value proposition section (why this site exists)
- Newsletter signup strip
- Use real data from the DB layer functions (with static fallback)

**For each content vertical, build:**

1. **Listing page** (`app/(public)/[vertical]/page.tsx`):
   - `export const metadata` with buildMetadata()
   - Hero with count stats
   - Filter/sort controls (if relevant to the vertical)
   - Grid of cards using the card component — each card shows the generated hero image, title, key metadata, description excerpt, link
   - Featured items shown first

2. **Detail page** (`app/(public)/[vertical]/[slug]/page.tsx`):
   - `generateStaticParams` reading from DB with static fallback
   - `generateMetadata` with title, description, canonical URL, and **hero image URL from the helper**
   - Full editorial content layout with hero image banner at top
   - Affiliate product recommendations section (using `resolveAffiliateLink`)
   - Related items section (3–4 items from same category)
   - Breadcrumb component + BreadcrumbSchema JSON-LD
   - Appropriate JSON-LD schema type (Recipe, Review, HowTo, Event, WebPage, etc.)

**Card components** (`components/cards/`):
- One card component per vertical — dark panel style with:
  - Hero image at top (use Next.js `<Image unoptimized>` for generated hero URLs)
  - Accent-colored category badge overlay on image
  - Title, metadata row, description excerpt below

**Design rules:**
- Every page must have `export const metadata` or `generateMetadata`
- All DB calls wrapped in try/catch with static fallback
- Use `absoluteUrl()` for all canonical/OG URLs
- Affiliate links go through an `AffiliateLink` component that adds rel="sponsored nofollow"
- Never render a content card or detail page without an image — always fall back to the generated hero route
```

---

## Phase 6 — AI Automation Agents

> **Goal:** Build the cron-triggered agents that keep the site updated automatically.

```
The site is [SITE NAME], focused on [NICHE].

Agent strategy from Phase 0:
[PASTE AGENT STRATEGY SECTION]

Build a bounded automation system, not just a pile of loose cron jobs.

**First, create a shared control plane:**
- `automation_agents` (registry + per-lane policy)
- `automation_runs` and `automation_run_events` (run ledger and touched-entity evidence)
- `automation_approvals` (approval queue for higher-risk actions)
- `automation_evaluations` (keep / escalate / revert verdicts on prior runs)
- policy helpers for global pause, external-send pause, draft-creation pause, ET quiet hours, daily caps, and failure thresholds

**For each automation lane, build:**

1. **Service file** (`lib/services/[agent-name].ts`):
   - Uses an AI provider SDK or adapter where AI is actually required
   - Uses the cheaper model for routine draft generation/discovery and a stronger model only where quality really matters
   - For discovery or research lanes, use web search if needed, but keep those lanes `draft_only` or `approval_required`
   - Loads existing slugs/subject keys to avoid duplicates
   - Parses structured JSON responses instead of freeform prose
   - Returns a typed summary of `{ found, inserted, updated, skipped, blockedReason?, error? }`
   - Records enough touched-entity context that operators can tell exactly what the run changed

2. **Run-ledger integration**:
   - Every lane should write a start/success/failure/blocked row into `automation_runs`
   - Persist supporting events in `automation_run_events`
   - For bounded-live mutations, capture snapshot or rollback context where practical
   - For evaluator lanes, write verdicts into `automation_evaluations`, not public site state
   - If the lane introduces a new optional column, enum value, or provider payload field, keep the code backward-compatible across at least one deploy so a lagging production schema does not crash the route

3. **Route or manual entry point**:
   - Cron-triggered routes should call `requireCronAuthorization(request)`
   - Higher-risk manual runs can be exposed through server actions or admin routes
   - Call `revalidatePath()` only when a write actually happened
   - Use a realistic `maxDuration` for heavier lanes like generation or evaluator passes instead of assuming `60` seconds is enough

4. **Add the lane to `vercel.json` crons** with an appropriate schedule

**Standard autonomy classes to model:**
- `draft_only` — discovery or generation lanes that stop in draft
- `bounded_live` — publishers/executors that can mutate live state inside a narrow write surface
- `approval_required` — proposals that must stop in `automation_approvals`
- `external_send` — Buffer/newsletter style lanes that send to third-party audiences
- `internal_support` — syncs and evaluators that strengthen the system without touching the public site directly

**Recommended automation lane types to build:**
- **Draft discovery lane**: searches for new [NICHE] entities or topics and writes drafts only
- **Editorial generation lane**: generates articles/guides/reviews into draft state
- **Prepublish QA support worker**: rechecks scheduled editorial drafts shortly before publish and moves failing rows to `needs_review` with `qa_issues`
- **Editorial autopublisher / bounded executor**: promotes eligible drafts or approved changes into live state after QA gates
- **External-send distributor**: pushes live content to social or email, but only inside caps, pauses, and provider guardrails
- **Growth loop promoter**: re-queues proven winners instead of relying only on brand-new content
- **Evaluator lane**: reviews mature prior runs after a delay and records keep / escalate / revert verdicts
- **Support sync**: logs internal signals like content-to-shop matches, exact-link gaps, or commerce relevance without acting as a publisher

**QA and publish rules:**
- Discovery and generation lanes write drafts only
- Scheduled editorial drafts must pass dedicated prepublish QA before auto-publish
- Failing scheduled rows should move to `needs_review` and persist `qa_issues` instead of silently staying in the publish queue
- Live publishers/executors should only mutate after automated QA, policy checks, any delayed publish windows, and an inline publish-path fail-safe pass
- Release/newsletter/high-risk outbound actions should write to `automation_approvals`
- Evaluator lanes should judge prior runs after enough time has passed to observe real outcomes
- Do not start with a catch-all visual QA agent unless you have a proven gap; prefer embedding QA in the publish path and adding a support QA lane later if needed

**Admin/operator surfaces to build:**
- `/admin/automation/trigger`
- `/admin/automation/agents`
- `/admin/automation/approvals`
- `/admin/automation/runs`
- `/admin/content/[vertical]` draft review pages where manual review is still part of the workflow

**Cron surface to expect in `vercel.json`:**
- generation
- draft reevaluation
- prepublish QA shortly before scheduled publishing
- scheduled publishing
- social distribution
- growth-loop promotion
- evaluator passes
- shop refresh
- newsletter drafting / due-send checks
- search insight sync and search execution
- discovery lanes for under-covered entities
```

---

## Phase 7 — SEO Layer

> **Goal:** Add the full SEO stack — sitemap, structured data, OG images.

```
The site is [SITE NAME], focused on [NICHE].

Pages built in Phase 5:
[LIST YOUR PAGES AND THEIR CONTENT TYPES]

Build the complete SEO layer:

**Sitemap** (`app/sitemap.ts`):
- All static paths (homepage, listing pages, category pages)
- Dynamic paths for every content vertical — load from DB with .catch(() => []) fallback
- `lastModified` using publishedAt or updatedAt where available

**Robots.txt** (`app/robots.ts`):
- Allow all crawlers on public pages
- Disallow /admin/, /api/ (except /api/og), /profile/*/edit
- Sitemap URL

**JSON-LD structured data components** (`components/schema/`):
- `BreadcrumbSchema` — for all detail pages
- `WebPageSchema` — generic fallback for content pages
- Appropriate type-specific schemas for each vertical:
  - If recipes exist → `RecipeSchema` (full schema.org/Recipe with ingredients, steps, time, rating)
  - If reviews exist → `ReviewSchema` (schema.org/Review with rating, itemReviewed)
  - If guides/tutorials exist → `HowToSchema` (schema.org/HowTo with steps)
  - If events/festivals exist → `EventSchema` (schema.org/Event with location, dates)
  - If articles/blog exist → `ArticleSchema` (schema.org/BlogPosting)
- `FaqSchema` — for any page that has an FAQ section
- `ItemListSchema` — for "best of" / listicle pages

**OG Image API** (`app/api/og/route.tsx`):
- Uses @vercel/og
- Accepts `title`, `eyebrow`, `subtitle` query params
- Renders on-brand dark background with site colors, display font, and logo mark

**Wire schemas into pages:**
- Add the appropriate schema component to every detail page
- Add FaqSchema to any listing page that has a FAQ section
- Add ItemListSchema to any "best of" listing page

**`lib/seo.ts` updates:**
- buildMetadata() should accept an `images` array for custom OG images
- Default OG image should use the /api/og route with the site name
```

---

## Phase 8 — Monetization

> **Goal:** Wire up all revenue streams — affiliate links, display ads, subscriptions.

```
The site is [SITE NAME], focused on [NICHE].

Content verticals from Phase 2:
[LIST VERTICALS]

Build the monetization layer:

**Affiliate system** (`lib/affiliates.ts`):
- `AFFILIATE_LINKS` record — a catalog of every product we link to, keyed by a short slug
- Each entry should look more like the current production model: `{ partner, product, url, amazonOnlyUrl?, category, badge, description, bestFor, priceLabel, searchTerms[] }`
- `resolveAffiliateLink(key, { sourcePage, position })` — returns the tracked redirect URL and knows whether the destination is an exact Amazon product page, an Amazon search fallback, or a merchant page
- `getAffiliateDestinationKind()` or an equivalent helper should exist so the UI and admin tools can reason about link quality
- `AffiliateLink` component (`components/content/affiliate-link.tsx`) — renders an <a> with rel="sponsored nofollow" and data attributes for click tracking
- `AffiliateDisclosure` component — small "contains affiliate links" notice
- Populate the catalog with 20–30 real [NICHE]-relevant products and partners
- For the highest-intent products, prefer exact product URLs where you know the SKU/ASIN. Search-result fallbacks are acceptable for long-tail coverage, but they should be treated as a leak to improve later, not the ideal state.
- If you add dynamic catalog growth, keep it scoped to safe search-fallback coverage by default. Do not auto-create exact product URLs unless you have a trusted product identifier source or an approval step.

**Display ads** (`components/ads/ad-slot.tsx`):
- Wrapper component that renders an AdSense ad unit when NEXT_PUBLIC_ADSENSE_ID is set
- Accepts `slot` and `format` props
- Renders nothing in development
- Strategic placement: after intro on detail pages, between sections on listing pages

**Inline affiliate links** (`lib/inline-affiliate-links.ts`):
- `injectInlineAffiliateLinks(content, terms)` — scans markdown/HTML content for product name mentions and wraps them in AffiliateLink components
- Use this to auto-monetize AI-generated content

**Affiliate registry health** (`app/admin/settings/affiliates/page.tsx` or equivalent):
- Show exact-product coverage, search-fallback risk, clicked search fallbacks, and top source pages
- Use this report to prioritize manual upgrades from search-result links to exact product links

**Commerce support loops:**
- Add a `content-shop-sync`-style service that matches content against the affiliate catalog, promotes strong matches into the shop, and logs gap terms
- Add a `shop-shelf-curator`-style lane that re-ranks or refreshes shop picks from real click signals instead of leaving the shelf static

**Shop page** (`app/(public)/shop/page.tsx`):
- Curated product grid organized by category
- Each item shows product name, description, price range badge, affiliate buy button
- Pull from AFFILIATE_LINKS catalog

**Subscriptions page** (`app/(public)/subscriptions/page.tsx`):
- If relevant to [NICHE]: curate 4–6 subscription box services
- For each: name, tagline, price, what's included, affiliate sign-up link
- Keep recurring subscriptions, one-time gifts, and merchant offers clearly distinguished instead of blurring them together

**Revenue tracking** (`lib/services/revenue-events.ts`):
- `trackAffiliateClick(key, sourcePage, position)` — write to a `affiliate_clicks` table
- `trackPageView(path, referrer)` — write to `page_views` table
- Keep it lightweight — fire and forget, no blocking
```

---

## Phase 9 — Community & Engagement

> **Goal:** Add user-generated content features to build return visitors and SEO long-tail depth.

```
The site is [SITE NAME], focused on [NICHE].

Add community features:

**User profiles:**
- Sign up / login with Supabase Auth (email + magic link)
- Public profile page: `app/(public)/profile/[username]/page.tsx`
- Edit profile page (protected)

**Community submissions** (`app/(public)/community/`):
- Submit form where users share their own [NICHE] content (photos, tips, mini-reviews)
- Submissions enter a moderation queue
- Admin moderation page: `app/admin/community/moderation/page.tsx`
- Published submissions appear in a community feed

**Ratings & saves:**
- Thumbs up / star rating on [PRIMARY VERTICAL] detail pages
- "Save" button — logged-in users can bookmark items
- Ratings stored in a `ratings` table, aggregate shown on content cards

**Comments:**
- Comment section on detail pages using a simple threaded model
- Comments require login
- Comment moderation queue in admin

**Leaderboard** (`app/(public)/leaderboard/page.tsx`):
- Top contributors by submission count
- Most-rated content
- Most active commenters
```

---

## Phase 10 — Launch Checklist

> **Goal:** Final checks before going live.

```
The site is [SITE NAME]. We're about to launch.

Run through this launch checklist and fix anything that's missing:

**Images (check this first — most common launch failure):**
□ Hero image API routes exist for every content vertical (`/api/[vertical]-hero`)
□ Generic OG route exists at `/api/og`
□ Card components render images — visually check the listing pages
□ Detail pages render a hero image banner at the top
□ `generateMetadata` passes the hero image URL to `buildMetadata({ images: [...] })`
□ Test OG image in social preview tool (opengraph.xyz or similar)
□ Publish-path QA has been exercised and there are no known blocking image/content issues

**SEO:**
□ Every page has unique title + description metadata
□ All detail pages have generateMetadata
□ sitemap.xml returns all public pages
□ robots.txt is correct — allows crawlers, blocks admin
□ BreadcrumbSchema on all detail pages
□ Content-type JSON-LD on all detail pages (Recipe, Review, HowTo, etc.)
□ FaqSchema on any page with a FAQ section
□ OG images work — test /api/og?title=Test
□ Canonical URLs are correct on all pages

**Performance:**
□ Images use Next.js <Image> with width/height
□ No layout shift on load
□ Core Web Vitals pass (run Lighthouse)

**Monetization:**
□ Affiliate links have rel="sponsored nofollow"
□ AffiliateDisclosure present on any page with affiliate links
□ AdSense ID set in env (or placeholder for post-approval)
□ Amazon Associates tracking ID in affiliate URLs
□ Highest-intent affiliate products have exact product URLs where known
□ Search-result fallback links have been reviewed in the affiliate registry report
□ Merchant-page links are labeled honestly and not presented as Amazon links

**Automation:**
□ All cron jobs listed in vercel.json
□ CRON_SECRET set in Vercel env vars
□ `automation_runs`, `automation_approvals`, and `automation_evaluations` tables exist
□ `/admin/automation/trigger`, `/admin/automation/agents`, and `/admin/automation/approvals` load correctly
□ Deploy was cut from a clean committed snapshot, not an unrelated dirty workspace
□ Global pause, external-send pause, draft-creation pause, and quiet-hours controls are wired
□ Every live lane records a run in the ledger when it executes
□ Approval-required lanes stop in the approval queue instead of mutating live state directly
□ Evaluator lanes can be manually smoke tested and write verdicts successfully
□ External-send lanes have at least one manual certification run recorded
□ At least one representative cron/manual automation route has a successful post-deploy production smoke check using the real auth convention
□ Dedicated prepublish QA can be run manually or on schedule and records a real run in the ledger
□ A deliberately bad scheduled editorial smoke row fails auto-publish, moves to `needs_review`, and stores `qa_issues`
□ Draft review workflow works end to end

**Security:**
□ /admin/* protected by middleware
□ Service role key only used server-side
□ No env vars exposed to client except NEXT_PUBLIC_*
□ Form inputs sanitized

**Infrastructure:**
□ Supabase migrations run
□ RLS enabled on all tables
□ Vercel project connected to GitHub
□ Custom domain configured
□ NEXT_PUBLIC_SITE_URL set to production domain

Report which items pass, which need fixes, and implement any fixes found.
```

---

## Reusable Patterns Across All Sites

These patterns appear in every site — internalize them so you don't need to re-explain each time.

### DB fallback pattern
Every DB function is wrapped in try/catch and falls back to static data:
```typescript
export async function getItemsFromDb(): Promise<Item[]> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("items")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error || !data) return ITEMS; // static fallback
    return data.map(rowToItem);
  } catch {
    return ITEMS;
  }
}
```

### Cron auth pattern
```typescript
// lib/cron.ts
export function requireCronAuthorization(request: Request) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
```

### Agent web search pattern
```typescript
const client = createAiClient({
  apiKey: process.env.AI_PROVIDER_API_KEY
});

const response = await client.generateStructured({
  model: process.env.AI_PROVIDER_MODEL,
  maxTokens: 4096,
  tools: supportsWebSearch ? [{ type: "web_search", name: "web_search" }] : [],
  prompt
});
```

If the chosen SDK does not support built-in web search, fetch sources with a separate retrieval helper before generation.

### Bounded autonomy pattern
- Every lane gets an autonomy class: `draft_only`, `bounded_live`, `approval_required`, `external_send`, or `internal_support`
- Every run writes to `automation_runs` before and after work happens
- Approval-required lanes write proposals to `automation_approvals`
- Evaluator lanes write keep / escalate / revert verdicts to `automation_evaluations`
- Global pauses, class pauses, quiet hours, and daily caps are checked before work starts

### Draft/publish workflow
- Discovery and generation lanes write `status: 'draft'` by default
- Admin reviews at `/admin/content/[vertical]` when the lane is not allowed to auto-promote
- Bounded-live publishers/executors can auto-promote only after QA and policy checks pass
- Approval-required lanes stop in `automation_approvals`
- RLS policy: `FOR SELECT USING (status = 'published')` keeps drafts off public pages

### Affiliate link quality policy
- Exact product links are preferred for the highest-intent affiliate opportunities
- Amazon search fallbacks are acceptable as temporary coverage, not the ideal end state
- Dynamic catalog expansion should default to search-fallback coverage only
- Use an affiliate registry report to prioritize which fallbacks deserve manual upgrade work

### Revenue-oriented internal linking
On every detail page, ask: what would someone buy next? Link it.
- Recipe page → link to the primary spice/ingredient on Amazon
- Review page → affiliate buy button above the fold
- How-to page → tools section with affiliate links
- Encyclopedia page → related products section

---

## Quick-Start Prompt (Single Message)

If you want to move fast and skip the phase-by-phase approach, use this single prompt to get a working skeleton in one shot:

```
I want to build an automated niche affiliate content site. Here are the details:

- **Niche:** [NICHE — be specific, e.g. "sourdough bread baking" not "baking"]
- **Site name:** [NAME]
- **Domain:** [DOMAIN]
- **Tagline:** [TAGLINE]
- **Primary color:** [HEX or color description]
- **Target audience:** [WHO]
- **Top 3 content types:** [e.g. "recipes, product reviews, technique guides"]
- **Primary affiliate category:** [e.g. "kitchen equipment, specialty flour, baking tools"]
- **Competitor to beat:** [Top Google result URL for main keyword]

Build a production-ready Next.js 14 App Router site with:
1. Dark design system using the color above, Tailwind, custom utility classes
2. TypeScript interfaces + 10 seed entries for each of the 3 content types
3. Homepage + listing + detail pages for each content type
4. Supabase migration files for all tables with RLS
5. A bounded automation stack with draft discovery, generation, autopublish/executor, evaluator, and approval-gated external-send lanes wired into `vercel.json`
6. Full SEO layer: sitemap, robots, JSON-LD schemas, OG image API
7. Affiliate catalog with 20 real products + AffiliateLink component
8. Admin dashboard with draft review queues plus automation trigger / runs / approvals views

Use these proven patterns throughout:
- DB functions always fall back to static arrays on error
- Draft-only lanes write drafts; live mutations go through QA and control-plane policy checks
- Cron auth via CRON_SECRET header
- Web search via your chosen AI provider's tool support or a separate retrieval helper
- Approval-required lanes write to `automation_approvals`; evaluator lanes write to `automation_evaluations`
- Every detail page gets BreadcrumbSchema + content-type JSON-LD
```

---

## Niche Validation Checklist

Before investing time in a niche, confirm:

- [ ] **Affiliate products exist** — Can you find 20+ products on Amazon relevant to this niche with reasonable commissions?
- [ ] **Search volume exists** — Do the top 5 keyword clusters get meaningful monthly searches?
- [ ] **Content is repeatable** — Can an AI generate 100+ unique, useful content pieces without obvious repetition?
- [ ] **Seasonality is manageable** — If the niche is highly seasonal, do you have an off-season content strategy?
- [ ] **Not too competitive** — Are the top Google results from small/medium sites (DA < 70) rather than Wikipedia, Amazon, and major media?
- [ ] **AI can discover new content** — Is there a steady stream of new things to cover (new products, events, people, techniques)?
- [ ] **Monetization is natural** — Do readers naturally want to buy things related to the content they're reading?

Good niches for this stack: cooking subcategories, hobby equipment, regional food/drink, outdoor activities, pet care subcategories, plant/garden verticals, fitness subcategories, DIY/maker topics.
