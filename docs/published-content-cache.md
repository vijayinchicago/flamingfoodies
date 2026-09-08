# Published-content caching

## Goal and implementation

Reduce Supabase egress from repeated public recipe, article, and product-review
reads without hiding new publications or leaving removed content online.

The public reader uses Next.js 14 `unstable_cache` (shared Data Cache), plus
React's request-level deduplication. It is not a process-local Map or a browser
cache: warm requests and prerendered pages can reuse the same database results.

| Data | Retention / refresh | Invalidation |
| --- | --- | --- |
| Published recipes, blogs, reviews | 30 days | Content-type tag after successful editorial writes |
| Views, likes, recipe ratings/saves | 5 minutes, stale-while-revalidate | Also cleared when that content type changes |
| Public search optimization settings | 30 days | After saving/restoring runtime optimizations or updating that setting in admin |
| Admin records, drafts, private/member data | Not routed through this cache | Existing live readers |

Catalogs are cached in deterministic 10-record pages, ordered newest first with
an ID tie-breaker. No aggregate catalog is stored as one cache entry. Detail
pages query a single published slug. Both the missing-slug result and existing
details share the content-type tag, so publishing and renaming invalidate both.

Queries explicitly select public fields, retaining prose and recipe ingredients
used by search, commerce matching, and cross-links. Internal QA reports and
generation metadata are not read by these public queries. Statistics are fetched
in separate 250-record pages without bodies. Catalog iteration is not limited to
Supabase's default 1,000-row response limit.

Cache entries are capped at 750 KB before the Next JSON envelope (below its 2 MB
limit). A database error or oversized entry throws rather than caching an empty
result for 30 days. Next retains stale data if a time-based background refresh
fails. An explicit unpublish invalidates old content: a subsequent origin failure
fails closed rather than serving a known-removed article.

The Supabase fetch inside each cached loader uses `no-store`, so there is no
second, independently stale fetch cache underneath the tagged data entry.

## Mutation coverage

- Admin create/edit/publish/archive/feature/unfeature for all three content types:
  invalidate immediately after the database succeeds, before audit/social work.
- Catalog imports: invalidate each successfully imported type, including partial
  success before a later import fails.
- Scheduled editorial publisher and the generated-content insertion helper:
  invalidate after a successful public write, regardless of which route invoked it.
- Clearing the pending recipe review queue also invalidates recipes.
- Engagement writes do not evict article bodies; statistics refresh independently.
- Admin settings and search-optimization executor/rollback invalidate the public
  search-settings tag. The executor's own settings reads remain uncached.

Homepage selection is **not** cached for 30 days: the existing daily rotation
and weekday/weekend selection operate on the cached catalog. The homepage keeps
its existing refresh policy. Dependent pages are invalidated through their Data
Cache tags; existing route revalidation remains in place.

## Direct database edits and maintenance scripts

Direct SQL, external scripts, and dashboard edits do **not** call Next's
invalidation API automatically. After those changes, use:

1. **Admin → Settings → General → Refresh published content cache**, protected by
   the existing admin authorization; or
2. `POST /api/admin/content-cache` with `Authorization: Bearer <existing CRON_SECRET>`.
   Maintenance scripts must call this only after a successful write and fail if
   the purge does not return HTTP 200. Do not expose the credential in a browser,
   shell history, script source, or logs. GET is not implemented; anonymous POST
   is rejected.

No new credential, database migration, billing change, or cache vendor is needed.
Do not disable admin authentication to refresh the cache.

## Verification and limits

- Unit tests cover warm reads, direct slug queries, TTLs, separate statistics,
  publish/unpublish/rename/delete, failed reads, settings refresh, protected purge,
  and a catalog larger than 1,000 rows / 2 MB.
- Integration tests use the installed Next 14 cache and response lifecycle to
  verify cross-request reuse, real stale-while-revalidate, tag eviction, and
  retention of last-good data after a background refresh failure.
- Existing homepage rotation tests cover weekday/weekend selection and rotation
  beyond the old eight-recipe pool.

This change targets the largest editorial reads. Merchandise pricing/availability,
affiliate overrides, community data, peppers, brands, and festival loaders are
not given a 30-day TTL. Image delivery, crawler requests, admin queries, background
agents, and other database reads can still contribute egress. Already-consumed
Supabase quota is not refunded by caching. Concurrent cold misses may still fetch
the same entry, and cache eviction/region boundaries can cause additional reads.

After release, compare Supabase egress and query-call **deltas** over the same time
window; lifetime query counters are not a billing-cycle reconciliation. Check
production build/runtime logs for missing columns and oversized-cache warnings.
