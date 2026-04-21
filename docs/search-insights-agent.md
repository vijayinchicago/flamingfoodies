# Search Insights Agent Loop

This is the cleanest way to turn search logs into autonomous site improvements without letting an editing agent roam too widely.

## Goal

Create a two-agent loop:

1. A search-insights analyst reads Search Console data and produces structured recommendations.
2. A site-implementation agent picks up approved recommendations and applies bounded content or SEO changes.

## What is now in the repo

- `lib/search-performance.ts`
  - parses Search Console CSV exports
  - builds a structured recommendation backlog from real query/page patterns
- `lib/search-content-optimizations.ts`
  - holds the public-site search upgrades that should apply even when content comes from Supabase rows
- `docs/flamingfoodies.com-Performance-on-Search-2026-04-18/search-insights.md`
  - the manual review from the current export

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

### Agent 2: Site Implementation Agent

Input:

- one or more approved `SearchRecommendation` items

Safe auto-apply surfaces:

- metadata titles and descriptions
- FAQ additions
- intro/body-copy additions
- internal links
- static supporting pages built from existing templates
- sitemap updates
- canonical or host-normalization middleware

Unsafe surfaces that should stay manual for now:

- destructive content rewrites
- database migrations
- ranking claims or competitor claims pulled from weak evidence
- large IA restructures touching many routes at once

Responsibilities:

- patch only the files implicated by the recommendation
- run tests and typecheck
- write a short change summary with references back to the recommendation IDs

## How to operationalize it

### Phase 1: Manual export, autonomous recommendation

This is the fastest path.

- Drop the latest Search Console CSV export into `docs/<site>-Performance-on-Search-<date>/`
- Run the analyst logic over those CSVs
- Review the generated recommendations
- Feed selected recommendation IDs into the implementation agent

This phase requires no Google API integration and is enough to keep improving the site weekly.

### Phase 2: Replace manual CSV drops with Search Console API snapshots

Add a small ingestion job that:

- pulls query/page performance from Search Console weekly
- stores the raw snapshot in Supabase or object storage
- stores parsed recommendations as rows in a `search_recommendations` table or versioned JSON blobs

At that point the analyst can run on cron instead of waiting for a CSV drop.

### Phase 3: Close the loop with approval states

Recommended statuses:

- `new`
- `approved`
- `in_progress`
- `applied`
- `dismissed`

That gives the implementation agent a clean queue and keeps it from reapplying the same suggestion.

## Practical first version

If we want the leanest useful system, build it like this:

1. Weekly Search Console export lands in `docs/`.
2. The analyst agent runs `lib/search-performance.ts` and writes a recommendation JSON file.
3. The implementation agent is allowed to act only on:
   - public page metadata
   - FAQ additions
   - internal links
   - new supporting landing pages
   - sitemap updates
4. A human reviews the diff before deploy.

That gets FlamingFoodies a real search-feedback loop quickly, with far less risk than letting an autonomous agent edit the whole codebase from raw logs.
