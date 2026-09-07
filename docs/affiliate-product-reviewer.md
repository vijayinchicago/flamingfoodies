# Affiliate Product Reviewer

Admin entry point: `/admin/automation/affiliate-reviews` (also linked from Agent runs,
Trigger, Schedule and Content → Reviews).

## Initial operating policy

- Monday and Thursday, 08:00 UTC: one product per invocation.
- Two attempts and one drafted product per Eastern calendar day by default. Admin can
  raise these to six attempts / three products for extra manual runs.
- At most three attempts per product. Retries require an explicit admin action.
- Research drafts only. No publish action, rating, price, invented product image or
  writes to the public `reviews` table. Existing reevaluation/publish jobs cannot
  promote these drafts. Changing the site's auto-publish setting does not affect them.
- Uses the existing `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` configuration, falling
  back to the same Haiku 4.5 model as the existing generator. Web search must be enabled
  for the Claude organization; missing search access fails without inventing evidence.

The queue is intentionally separate from the legacy review editor, which requires a
star rating. Human feedback is saved as a review note. Publication and a future
research-assessment publishing format are follow-up work after the initial drafts
have been reviewed—not something this agent silently enables.

## Selection and evidence

The current affiliate registry and admin link overrides are the source of truth.
Only exact-product Amazon destinations are initially eligible; search-result links
must be corrected in Affiliate settings. Product name aliases, exact ASINs, existing
reviews of any status and queued products are excluded. A running legacy review job
also prevents selection. Category rotation precedes alphabetical selection.

Each attempt runs research, writing and QA. Research uses up to three web searches
and requires at least two native provider citation URLs. Writing is limited to the
saved evidence. QA checks product identity, evidence, attribution and unsupported
claims; deterministic checks also reject planning jargon, generation artifacts,
invented prices/ratings and URLs embedded in prose. These checks do not replace
human verification. Exact-product imagery and usage rights remain a manual gate.

The application, not the model, supplies the Miles Hart byline, research-method
statement, affiliate disclosure and existing `/go/{key}` tracked link.

## Reliability and visibility

`claim_affiliate_review` serializes claims with a transaction advisory lock. It
reserves daily attempts, deduplicates cron deliveries by UTC date, protects aliases
with unique constraints and allows only one active worker. A six-minute lease and
conditional stage updates prevent late workers from overwriting replacement work.
Each provider request has a 75-second timeout and no implicit SDK retries.

`affiliate_review_generations` saves a UUID and input before every call, then the raw
response and usage before parsing or validating it. Failed responses remain visible.
Unreported usage is null/unknown, not zero. Costs are estimates for the recognized
Haiku model; other models are intentionally shown as unpriced. Attempt history is
linked to the existing automation run ledger.

All three reviewer tables use RLS with no public/authenticated grants. Only the
service role can read/write them or execute the claim function. Admin page reads and
server actions require `requireAdmin`; cron requests require `CRON_SECRET`.

## Activation order

1. Sign into the Supabase CLI (`npx supabase login`), or use the project's SQL Editor
   after dashboard sign-in with GitHub. Dashboard sign-in does not authenticate the
   CLI. Do not put a token in chat or a tracked environment file.
2. Inspect remote migration history before applying
   `supabase/migrations/20260907190000_affiliate_product_reviewer.sql`. Apply this
   migration before deploying the application. It creates private tables and the
   agent, and disables only the legacy `generation_schedule` review row. Do not
   blindly push unrelated pending migrations.
3. Deploy the application. `vercel.json` replaces the old review cron rather than
   adding a second job. The old authorized cron URL delegates to the new reviewer;
   the old manual-generation API returns a pointer to the new admin queue.
4. Open Product reviewer, confirm the eligible catalog and controls, and generate one
   draft. Inspect all three stages, citations and QA. Confirm no public review was
   inserted and no publish timestamp exists. Leave automatic publishing disabled.

### Production migration record

On September 7, 2026, migration `20260907190000` was applied to project
`rwapyjwxibudjdruguqh` through its authenticated SQL Editor in a transaction, together
with its version/name entry in `supabase_migrations.schema_migrations`. Verification
confirmed RLS on all three tables, no anon/authenticated table or claim-function
access, service-role access, draft-only defaults, and the retired legacy review
schedule. No unrelated pending migrations were applied.

The first live run on September 7 completed all three provider calls in about
42 seconds, but its QA response included a fenced JSON object followed by prose.
QA parsing now accepts that explicit fenced object and treats any extra commentary
as an additional human-review blocker, never as an approval. Raw responses remain
unchanged. Regression tests cover commentary, retained findings and malformed JSON.

## Verification

Unit/service/authorization coverage:

```sh
npx vitest run test/affiliate-review.test.ts test/affiliate-review-service.test.ts test/affiliate-review-routes.test.ts
npx tsc --noEmit --incremental false
```

`test/affiliate-review-database.sql` is **only for a disposable empty PostgreSQL
database** with the migration mounted as `/migration.sql`. It tests table/function
privacy, legacy schedule retirement, duplicate deliveries, active-worker exclusion,
draft/attempt caps, ASIN aliases, existing reviews, lease expiry, retries and pause.
Never run its fixture setup on production. Simultaneous duplicate claims were also
tested in separate PostgreSQL sessions: one succeeded and one was skipped.
