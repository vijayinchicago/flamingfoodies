# Search Insights Review

Source export: `docs/flamingfoodies.com-Performance-on-Search-2026-04-18`
Window: last 3 months, web search

## What the export is actually saying

- Search visibility is still very early. The meaningful impressions are concentrated in just a few query families.
- The biggest current cluster is `Nashville hot chicken sandwich` and nearby `how to make` / `recipe` variants.
- The second clear cluster is `best hot sauce for wings` and `best hot sauce for fried chicken`.
- The best early green shoot is seafood intent. The page `/blog/how-to-choose-a-hot-sauce-for-seafood` is already around page 2 on average, and one long-tail seafood query is already near the top of page 1.
- There is a host consistency signal to verify: both `https://flamingfoodies.com/hot-sauces/best-for-wings` and `https://www.flamingfoodies.com/hot-sauces/best-for-wings` appear in the export.

## Query clusters worth building around

### 1. Nashville / hot chicken sandwich

Representative queries from `Queries.csv`:

- `hot chicken sandwich`
- `nashville chicken sandwich recipe`
- `nashville hot sandwich`
- `nashville hot chicken sandwich sauce`
- `how to make hot chicken sandwich`
- `nashville hot chicken sandwich recipe`

Current matching page:

- `/recipes/nashville-hot-chicken-sandwiches`

Recommendation:

- Keep the existing recipe page, but make it answer more of the surrounding intent directly.
- Add visible copy and FAQ coverage for:
  - `how to make a hot chicken sandwich`
  - `Nashville hot chicken sandwich sauce`
  - `old fashioned hot chicken sandwich recipe`
- Consider a supporting page specifically for sauce intent if we want a tighter match than the recipe can provide:
  - `/blog/nashville-hot-chicken-sandwich-sauce`
  - or `/guides/how-to-make-nashville-hot-chicken-sauce`

Why:

- The recipe is already the page Google is testing, but its current SEO framing is narrower than the query set.

## 2. Wings / fried chicken hot sauce

Representative queries from `Queries.csv`:

- `best hot sauce for fried chicken`
- `best hot sauce for wings`

Current matching page:

- `/hot-sauces/best-for-wings`

Recommendation:

- Expand the page so it targets `fried chicken` as a first-class intent, not just a side mention.
- Update the title, H1, intro, and FAQ so the page clearly covers:
  - wings
  - fried chicken
  - hot chicken sandwiches
- Strong candidate title direction:
  - `Best Hot Sauce for Wings and Fried Chicken | FlamingFoodies`
- Strong candidate supporting page if we want a tighter search match:
  - `/hot-sauces/best-for-fried-chicken`

Why:

- The current page already references fried chicken in body copy, but the strongest demand term is not present in the title.

## 3. Seafood / fish / ceviche hot sauce

Representative queries from `Queries.csv`:

- `hot sauce for fish`
- `best hot sauce for fish`
- `how to select a spicy sauce for seafood dishes and ceviche?`

Current matching pages:

- `/blog/how-to-choose-a-hot-sauce-for-seafood`
- `/hot-sauces/best-for-seafood`

Recommendation:

- This is the easiest near-term ranking win.
- Expand both pages so they speak more directly to:
  - fish
  - fish tacos
  - ceviche
  - shrimp
- Candidate title adjustments:
  - blog: `How to Choose the Best Hot Sauce for Seafood, Fish, and Ceviche`
  - guide page: `Best Hot Sauces for Seafood and Fish | FlamingFoodies`
- Add FAQ entries for:
  - best hot sauce for white fish
  - whether hot sauce works in ceviche
  - what to use on salmon vs shrimp

Why:

- This cluster is already much closer to competitive range than the chicken pages.

## Site changes I would prioritize first

1. Retune the existing `best-for-wings` page to explicitly cover fried chicken.
2. Retune the seafood guide and seafood blog to explicitly cover fish and ceviche.
3. Expand the Nashville recipe page with `how to make` and `sauce` intent sections.
4. Add one new page only after those upgrades:
   - either `best-for-fried-chicken`
   - or `nashville-hot-chicken-sandwich-sauce`

## Technical check to run

- Verify that `www` permanently redirects to the apex domain and that only one host is indexable.
- Canonical tags in code already point to the apex domain, but the Search Console export suggests Google has still seen both hosts for at least one page.

## Existing files to update

- `app/(public)/hot-sauces/best-for-wings/page.tsx`
- `app/(public)/hot-sauces/best-for-seafood/page.tsx`
- `lib/sample-data/index.ts`
- `app/(public)/recipes/[slug]/page.tsx`
- any host redirect or domain config outside the app if `www` is still resolving independently

## Recommendation in plain English

Do not spray content in every direction yet.

Build one tight chicken cluster and one tight seafood cluster:

- chicken cluster: Nashville recipe + fried chicken / wings buying page + sauce explainer
- seafood cluster: seafood buying page + seafood selection explainer + fish / ceviche FAQ coverage

That gives us the best chance of turning the first search impressions into actual page-1 movement and the first clicks.
