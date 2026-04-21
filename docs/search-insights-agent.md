# Search Insights Agent Loop

This is the cleanest way to turn search logs into autonomous site improvements without letting an editing agent roam too widely.

## Goal

Create a search loop with bounded execution and post-run judgment:

1. A search-insights analyst reads Search Console data and produces structured recommendations.
2. A site-implementation agent picks up approved recommendations and applies bounded content or SEO changes.
3. A search evaluator checks mature applied recommendations later and records whether they look worth keeping.

## What is now in the repo

- `lib/search-performance.ts`
  - parses Search Console exports
  - builds a structured recommendation backlog from real query/page patterns
- `lib/services/search-insights.ts`
  - runs the live Search Console analyst sync
  - stores queue items in `search_recommendations`
  - runs the approved-only executor that rebuilds runtime overlays
  - runs the delayed search evaluator that records keep / escalate / revert verdicts
- `app/api/admin/search-insights/route.ts`
  - analyst cron and manual sync entry point
- `app/api/admin/search-insights-executor/cron/route.ts`
  - executor cron entry point
- `app/api/admin/search-performance-evaluator/cron/route.ts`
  - evaluator cron entry point
- `app/admin/analytics/search-console/page.tsx`
  - admin queue, approval, executor, and evaluator dashboard controls
- `docs/flamingfoodies.com-Performance-on-Search-2026-04-18/search-insights.md`
  - the manual review that seeded the first modeled recommendations

## Recommended architecture

### Agent 1: Search Insights Analyst

Input:

- weekly Search Console export or API pull
- query rows
- page rows
- device/country/search-appearance rows

Responsibilities:

- cluster rising queries
- detect when search demand is growing around an existing page
- detect when a new page deserves to exist
- detect technical issues like host splits or weak schema coverage
- write a machine-readable backlog

Output contract:

- `id`
- `priority`
- `action`
- `targetPath`
- `relatedPaths`
- `summary`
- `suggestedTitle`
- `suggestedChanges`
- `supportingQueries`

This is already modeled in `SearchRecommendation` inside `lib/search-performance.ts`.

### Agent 2: Search Recommendation Executor

Input:

- one or more approved `SearchRecommendation` items

Safe v1 auto-apply surfaces:

- metadata titles and descriptions
- FAQ additions
- intro/body-copy additions
- internal links
- static supporting pages built from existing templates
- sitemap updates
- canonical or host-normalization middleware

Unsafe or unsupported surfaces that stay manual for now:

- destructive content rewrites
- database migrations
- ranking claims or competitor claims pulled from weak evidence
- large IA restructures touching many routes at once

Responsibilities:

- read only approved recommendation queue rows
- map each supported recommendation through an allowlisted implementation registry
- rebuild runtime overlays from approved items only
- route unsupported or technical items to manual review with a reason

## How to operationalize it

### Phase 1: Manual export, autonomous recommendation

This is the fastest path.

- Drop the latest Search Console CSV export into `docs/<site>-Performance-on-Search-<date>/`
- Run the analyst logic over those CSVs
- Review the generated recommendations
- Feed selected recommendation IDs into the implementation agent

This phase required no Google API integration and was enough to prove the recommendation model.

### Phase 2: Replace manual CSV drops with Search Console API snapshots

Add a small ingestion job that:

- pulls query/page performance from Search Console weekly
- stores the raw snapshot in Supabase or object storage
- stores parsed recommendations as rows in a `search_recommendations` table or versioned JSON blobs

This phase is now implemented in the repo through the Search Console OAuth callback flow and the
weekly analyst cron.

### Phase 3: Close the loop with approval states

Recommended statuses:

- `new`
- `approved`
- `manual_review`
- `applied`
- `dismissed`

That gives the executor a clean queue and keeps it from reapplying the same suggestion or silently
auto-publishing unsupported technical recommendations.

## Practical first version

The repo now runs the practical first live version like this:

1. The weekly analyst sync pulls live Search Console data and refreshes `search_recommendations`.
2. Admin approves, dismisses, or sends items to manual review from `/admin/analytics/search-console`.
3. The daily executor rebuilds runtime overlays from approved supported items only.
4. The daily evaluator reviews mature executor decisions and records keep / escalate / revert verdicts in `automation_evaluations`.
5. Unsupported technical recommendations stay queued as `manual_review` instead of mutating live state.

That keeps the SEO loop autonomous where the write surface is bounded, while still separating
analysis, approval, execution, and post-run judgment.
