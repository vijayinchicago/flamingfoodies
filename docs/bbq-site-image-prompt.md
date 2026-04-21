# BBQ Site — Add Hero Images & Visual QA Agent

Paste this prompt into your BBQ site's Claude Code session.

---

**Before you start — how images work and what API keys you need:**

There are three layers of images on a niche site. Here's exactly what's required for each:

**Layer 1 — Hero & card images (do this first, zero cost, no API key)**
All hero images use `next/og` (`ImageResponse`), which is **built into Next.js** — no install,
no API key, no external service, no cost. API routes at `app/api/[name]-hero/route.tsx` return
a 1200×630 PNG rendered from JSX at the edge, generated on demand from the content's title and
category. The only env var needed is `NEXT_PUBLIC_SITE_URL` (which you already have).
This is what this prompt builds. It covers 100% of what the site needs to not look broken.

**Layer 2 — Body / inline photos (optional, free)**
Real photos embedded inside article text. Not needed at launch — add after the site is live.
- Unsplash API: `UNSPLASH_ACCESS_KEY` — free at unsplash.com/developers
- Pexels API: `PEXELS_API_KEY` — free at pexels.com/api
An agent can fetch a relevant photo by keyword when generating content and store the URL in the DB.

**Layer 3 — AI-generated images (optional, paid)**
Custom AI images per article. Not needed at launch.
- OpenAI DALL-E 3: `OPENAI_API_KEY` — ~$0.04/image
- Replicate (Stable Diffusion): `REPLICATE_API_TOKEN` — ~$0.002/image

**Summary — image API keys for the BBQ site:**

| What | Service | Env var needed | Cost |
|------|---------|----------------|------|
| Hero & card images | next/og (built-in) | none | free |
| Body photos | Unsplash | `UNSPLASH_ACCESS_KEY` | free |
| Body photos | Pexels | `PEXELS_API_KEY` | free |
| AI article images | OpenAI DALL-E 3 | `OPENAI_API_KEY` | ~$0.04/img |
| AI article images | Replicate | `REPLICATE_API_TOKEN` | ~$0.002/img |

**For this session: only Layer 1 is being built. No new API keys needed.**
Add `.env` entries for Unsplash or DALL-E later when you want body images.

---

```
My BBQ niche site is built with Next.js 14 App Router, Tailwind CSS, Supabase, and Vercel.
The site has content pages for: [LIST YOUR CONTENT TYPES — e.g. recipes, smoker reviews, technique guides, competition calendar, wood/fuel guide, brand directory].
Currently none of the pages have images — every page is text-only.

The image approach for this session: Layer 1 only — `next/og` (ImageResponse) running on the
edge runtime, built into Next.js, no API key needed, no external service, zero cost. Each
content type gets its own hero API route that generates a 1200×630 branded image from the
content's metadata. No new packages need to be installed.

I need you to:
1. Build a hero image system using `next/og` ImageResponse at the edge
2. Wire images into every card and detail page
3. Build a visual QA agent to catch missing images automatically

---

## Step 1 — Confirm no install needed

Ensure `next` is at a version that includes `next/og` (Next 13.3+). No additional packages needed.

---

## Step 2 — Generic OG route

Create `app/api/og/route.tsx`:
- `export const runtime = "edge"`
- Query params: `title`, `eyebrow`, `subtitle`
- Renders 1200×630 image with this design:
  - Background: dark charcoal-to-amber gradient representing fire and smoke:
    `radial-gradient(circle at top left, rgba(251,146,60,0.3), transparent 40%), linear-gradient(135deg, #1a1208 0%, #2d1a0a 50%, #451f0a 100%)`
  - Top: `eyebrow` text — small, uppercase, amber color, letter-spacing
  - Middle: `title` text — large (80–90px), bold, cream/white
  - Bottom row: `subtitle` on left, site domain on right — smaller, muted
  - All inline JSX styles (no Tailwind, no external CSS — edge runtime restriction)

---

## Step 3 — BBQ recipe/technique hero route

Create `app/api/recipe-hero/route.tsx` (or rename to match your primary content type):
- `export const runtime = "edge"`
- Query params: `title`, `category`, `subtitle`, `method` (e.g. offset, pellet, kamado, kettle, charcoal, gas)
- Define a `palettes` object with one entry per `method` value:

```typescript
const palettes = {
  offset: {
    background: "linear-gradient(135deg, #140c06 0%, #3b1a08 45%, #7c3a12 100%)",
    glow: "#fb923c",
    smoke: "rgba(200,180,160,0.15)",
    metal: "#4a3728",
    fire: "#f97316",
    accent: "#fde68a"
  },
  pellet: {
    background: "linear-gradient(135deg, #0f1208 0%, #1f2e0a 45%, #3d5c12 100%)",
    glow: "#86efac",
    smoke: "rgba(180,200,160,0.12)",
    metal: "#2d3a20",
    fire: "#a3e635",
    accent: "#d9f99d"
  },
  kamado: {
    background: "linear-gradient(135deg, #160a0a 0%, #4a1010 45%, #7c1d12 100%)",
    glow: "#fb7185",
    smoke: "rgba(220,160,150,0.15)",
    metal: "#3d1a18",
    fire: "#ef4444",
    accent: "#fecaca"
  },
  kettle: {
    background: "linear-gradient(135deg, #101218 0%, #1f2030 45%, #3a3d5c 100%)",
    glow: "#93c5fd",
    smoke: "rgba(160,170,220,0.15)",
    metal: "#2a2d40",
    fire: "#60a5fa",
    accent: "#bfdbfe"
  },
  charcoal: {
    background: "linear-gradient(135deg, #0f0d0a 0%, #2a1f10 45%, #4a3018 100%)",
    glow: "#f59e0b",
    smoke: "rgba(200,185,160,0.15)",
    metal: "#3d2e1e",
    fire: "#f59e0b",
    accent: "#fde68a"
  },
  other: {
    background: "linear-gradient(135deg, #120d08 0%, #31180a 45%, #5c2e10 100%)",
    glow: "#fb923c",
    smoke: "rgba(210,180,150,0.15)",
    metal: "#3d2010",
    fire: "#ea580c",
    accent: "#fed7aa"
  }
} as const;
```

- Pick palette deterministically: hash the `title` string to an index (so the same title always gets the same palette — avoids visual flicker on re-render)
- Render a CSS-drawn smoker illustration on the right half of the image:
  - Main body: a tall rounded rectangle (the smoke chamber) in `palette.metal` color
  - Firebox: a smaller rectangle attached to the left of the chamber
  - Smoke stack: a thin tall rectangle rising from the right top of the chamber
  - Smoke rings: 3–4 ellipses above the stack, increasing in size as they rise, using `palette.smoke` color with varying opacity
  - Glow: a radial gradient bloom below the firebox in `palette.fire` color
  - Wood logs: 2–3 small rounded rectangles at the base in a brown tone
- Left half: eyebrow (category label), large title, subtitle, method badge pill, site domain

---

## Step 4 — Smoker review hero route

Create `app/api/review-hero/route.tsx`:
- Query params: `title`, `brand`, `rating` (1–5), `slug` (used for palette hash)
- 4 palettes based on the slug hash — use different amber/charcoal/slate/copper tones
- CSS illustration: a stylized hot sauce bottle is wrong here — draw instead:
  - A rectangular smoker unit (front-facing view)
  - Digital temperature display on the front panel (show "225°F" as text)
  - Rating stars rendered as small circles or star shapes using `▸` characters in the subtitle area
- Left half: brand name as eyebrow, product name as large title, rating as "★★★★☆ [rating]/5"

---

## Step 5 — Hero fields helper per content type

For each content type, create `lib/[content-type]-hero.ts`:

```typescript
import { absoluteUrl } from "@/lib/utils";

export function getRecipeHeroFields(recipe: {
  slug: string;
  title: string;
  description: string;
  category?: string;       // maps to `method` param
  cookMethod?: string;
}) {
  const params = new URLSearchParams({
    title: recipe.title,
    subtitle: recipe.description.slice(0, 80),
    category: recipe.category ?? "other",
    method: recipe.cookMethod ?? recipe.category ?? "other"
  });
  const imageUrl = absoluteUrl(`/api/recipe-hero?${params.toString()}`);
  return { imageUrl, title: recipe.title };
}

export function isGeneratedRecipeHeroImageUrl(url?: string | null) {
  return !!url?.includes("/api/recipe-hero?");
}
```

Create equivalent helpers for every content type, pointing to the appropriate hero API route.

---

## Step 6 — Wire images into card components

For each card component in `components/cards/`:

1. Import the hero fields helper: `import { get[Content]HeroFields } from "@/lib/[content]-hero"`
2. Call it inside the component: `const hero = get[Content]HeroFields(item)`
3. Render the image at the top of the card:
```tsx
<div className="relative aspect-[16/9] overflow-hidden rounded-t-[1.5rem]">
  <Image
    src={hero.imageUrl}
    alt={hero.title}
    fill
    unoptimized  // required for dynamic API route images
    className="object-cover"
  />
</div>
```
4. The card content (title, metadata, description) goes below the image

---

## Step 7 — Wire images into detail pages

For each detail page (`app/(public)/[content]/[slug]/page.tsx`):

1. Import the hero fields helper
2. Call it with the loaded item
3. Add a hero banner near the top of the page JSX:
```tsx
<div className="relative mt-8 aspect-[2.4/1] w-full overflow-hidden rounded-[2rem]">
  <Image
    src={hero.imageUrl}
    alt={hero.title}
    fill
    unoptimized
    className="object-cover"
    priority
  />
</div>
```
4. Pass the image URL into `generateMetadata`:
```typescript
export async function generateMetadata({ params }) {
  const item = await getItemFromDb(params.slug);
  const hero = getItemHeroFields(item);
  return buildMetadata({
    title: `${item.title} | [SITE NAME]`,
    description: item.description,
    path: `/[content]/${item.slug}`,
    images: [hero.imageUrl]  // ← this makes OG shares show the hero image
  });
}
```

---

## Step 8 — Visual QA agent

Create `lib/services/visual-qa.ts`:

```typescript
import { createAdminClient } from "@/lib/supabase/admin";
import { absoluteUrl } from "@/lib/utils";

type QaIssue = { table: string; slug: string; issues: string[] };

// Tables to audit — add every content table here
const CONTENT_TABLES = [
  "[your-first-table]",
  "[your-second-table]",
  // ...
];

async function checkImageUrl(url: string | null): Promise<string | null> {
  if (!url) return "imageUrl is missing";
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return `imageUrl returned HTTP ${res.status}`;
    return null;
  } catch {
    return "imageUrl fetch failed";
  }
}

export async function runVisualQa(): Promise<{
  checked: number;
  issues: QaIssue[];
  flagged: number;
}> {
  const supabase = createAdminClient();
  const allIssues: QaIssue[] = [];

  for (const table of CONTENT_TABLES) {
    const { data, error } = await supabase
      .from(table)
      .select("slug, title, description, image_url, status")
      .eq("status", "published");

    if (error || !data) continue;

    for (const row of data) {
      const issues: string[] = [];

      // Check image
      const imageIssue = await checkImageUrl(row.image_url);
      if (imageIssue) issues.push(imageIssue);

      // Check required text fields
      if (!row.title?.trim()) issues.push("title is empty");
      if (!row.description?.trim()) issues.push("description is empty");
      if (row.description?.length > 160)
        issues.push(`description too long (${row.description.length} chars — keep under 160 for SEO)`);
      if (!/^[a-z0-9-]+$/.test(row.slug))
        issues.push(`slug has invalid characters: "${row.slug}"`);

      if (issues.length > 0) {
        allIssues.push({ table, slug: row.slug, issues });

        // Flag back to DB for human review
        await supabase
          .from(table)
          .update({ status: "needs_review" })
          .eq("slug", row.slug);
      }
    }
  }

  return {
    checked: CONTENT_TABLES.length,
    issues: allIssues,
    flagged: allIssues.length
  };
}
```

Create `app/api/admin/visual-qa/route.ts`:
```typescript
import { requireCronAuthorization } from "@/lib/cron";
import { runVisualQa } from "@/lib/services/visual-qa";
import { jsonResponse } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function handleRequest(request: Request) {
  const unauthorized = requireCronAuthorization(request);
  if (unauthorized) return unauthorized;
  const result = await runVisualQa();
  return jsonResponse({ ok: true, ...result });
}

export async function GET(request: Request) { return handleRequest(request); }
export async function POST(request: Request) { return handleRequest(request); }
```

Add to `vercel.json` crons — schedule 30 minutes after your publish agent:
```json
{ "path": "/api/admin/visual-qa", "schedule": "30 18 * * *" }
```

---

## Step 9 — Admin QA dashboard

Add a "Needs Review" tab to the admin content pages. For items with `status = 'needs_review'`, display:
- The item title and slug
- The hero image rendered in a small preview (so you can see if it looks wrong)
- The list of QA issues flagged
- Approve button (sets status back to 'published') and Edit button

---

After implementing all of the above, do a visual check:
1. Open a listing page — every card should show a hero image
2. Open a detail page — hero image banner should appear above the title
3. Hit `/api/recipe-hero?title=Texas+Brisket&category=beef&method=offset` directly — you should see a rendered 1200×630 image
4. Hit `/api/og?title=Test&eyebrow=BBQ&subtitle=Turn+up+the+smoke` — should render the generic OG card
5. Inspect the HTML of a detail page — the `<meta property="og:image">` tag should contain the hero image URL
```
