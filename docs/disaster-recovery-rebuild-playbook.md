# FlamingFoodies Disaster Recovery Rebuild Playbook

This is the operator-grade companion to [docs/niche-site-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/niche-site-playbook.md).

Use it when the goal is not just "build a similar site," but "recover FlamingFoodies to its current bounded-autonomy operating state after a wipe, provider loss, or greenfield rebuild."

If the goal is a new niche-site clone rather than exact FlamingFoodies recovery, start with [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md) and then use this document only for restore-order and parity discipline.

## What This Guide Can And Cannot Recover

With this guide, the repo, and the required provider access, we can recover:

- the application code and design system
- the database schema, storage buckets, and RLS policies
- the bounded automation/control-plane architecture
- the Vercel cron surface
- the live provider integrations for Supabase Auth, Buffer/Pinterest, ConvertKit, Search Console, analytics, ads, and affiliate routing

This guide alone cannot recover exact live business state unless we also have current backups or exports for:

- Supabase database data
- Supabase storage objects
- Vercel production env vars
- provider-side credentials and account ownership

Without those backups, we can still restore a working production app, but not the exact current history, queue state, subscriber list, operator ledger, or dynamic site settings.

## Source Of Truth Map

| Area | Source of truth | Why it matters for recovery |
| --- | --- | --- |
| Portable build contract | [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md) | Recreates the FlamingFoodies operating model in a new repo before provider-specific restoration begins |
| App code and UI | Git repo + release tags | Restores the exact codebase and deployment target |
| DB schema and storage policies | `supabase/migrations/` | Recreates tables, indexes, RLS, storage buckets, and policy defaults |
| First admin bootstrap | [supabase/seed.sql](/Users/vijaysingh/apps/flamingfoodies/supabase/seed.sql) | Promotes the first signed-in profile to admin |
| Env contract | [.env.example](/Users/vijaysingh/apps/flamingfoodies/.env.example) and [lib/env.ts](/Users/vijaysingh/apps/flamingfoodies/lib/env.ts) | Defines the complete runtime configuration surface |
| Cron schedule | [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json) | Restores the live automation schedule |
| Agent registry | [lib/autonomous-agents.ts](/Users/vijaysingh/apps/flamingfoodies/lib/autonomous-agents.ts) | Declares the active automation lanes and status logic |
| Control-plane policy model | [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md) | Documents the current bounded-autonomy posture and operator guardrails |
| Production bootstrap | [docs/production-go-live.md](/Users/vijaysingh/apps/flamingfoodies/docs/production-go-live.md) | Captures cutover-time setup and smoke checks |
| Pinterest/Buffer setup | [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md) | Restores live Pinterest distribution |
| Search Console OAuth | [docs/google-cloud-search-console-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/google-cloud-search-console-setup.md) | Restores the search insight, executor, and evaluator loop |
| Auth branding and OAuth buttons | [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md) | Restores login UX, social auth toggles, and SMTP/template branding |
| Third-party ecosystem matrix | [docs/ecosystem-inventory-and-recovery-matrix.md](/Users/vijaysingh/apps/flamingfoodies/docs/ecosystem-inventory-and-recovery-matrix.md) | Restores provider-side setup beyond the core app/runtime docs |
| Live operational state | Supabase backups/exports and provider dashboards | Required for exact recovery instead of approximate rebuild |

## Minimum Backup Kit

To make this guide fully executable, keep these backups current:

1. A Git remote with release tags and the last known-good production commit.
2. A Vercel env export or a secure secret registry that mirrors all production env vars.
3. A recent Supabase database backup or table export.
4. A Supabase storage export for `avatars`, `admin-media`, and `community-media`.
5. A provider registry with:
   - Buffer org ownership
   - Pinterest account access
   - ConvertKit account access
   - Google Cloud/Search Console ownership
   - Supabase project ownership
   - domain registrar/DNS access
6. A note of the current production domain and callback URLs.

## Current-State Parity Pack

If the goal is "bring the site back exactly as it is now," backups alone are not enough.

Keep a dated parity pack beside the backup set so disaster recovery can be measured against a concrete baseline instead of memory.

The parity pack should include:

- [ ] the production release tag or exact commit hash that was live
- [ ] a sanitized env manifest showing every production variable and whether it was intentionally set, blank, or disabled
- [ ] the deployed cron inventory from Vercel, compared against [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json)
- [ ] for auth-protected cron routes, at least one successful authenticated smoke check recorded against the live deployment; env presence alone is not enough
- [ ] an export of the full `site_settings` table
- [ ] row counts for key tables:
  `profiles`, `blog_posts`, `recipes`, `reviews`, `merch_products`, `newsletter_subscribers`, `newsletter_campaigns`, `affiliate_clicks`, `social_posts`, `search_console_connections`, `search_insight_runs`, `search_recommendations`, `automation_runs`, `automation_approvals`, `automation_evaluations`
- [ ] storage object counts for `avatars`, `admin-media`, and `community-media`
- [ ] screenshots or exports of high-signal admin surfaces:
  `/admin`, `/admin/automation/agents`, `/admin/automation/runs`, `/admin/automation/approvals`, `/admin/settings/general`, `/admin/settings/affiliates`, `/admin/social/queue`, `/admin/newsletter/campaigns`, `/admin/analytics/search-console`
- [ ] provider identifiers that matter for parity:
  Buffer organization ID, Pinterest channel ID, Pinterest board service ID, Search Console property, OAuth client IDs, ConvertKit form ID, and any production-only callback URLs
- [ ] a few representative public URLs and screenshots:
  homepage, recipes index, reviews index, shop, blog, search, quiz, and one detail page from each major vertical

Use the newest parity pack that matches the restored backup timestamp.

If the latest DB backup is from April 23, 2026 at 08:00 ET, compare the restored system to the April 23, 2026 parity pack closest to that point in time, not to whatever the live site looked like later.

### Automated capture

Use the repo-side capture script to generate the parity-pack skeleton automatically:

```bash
pnpm parity-pack:capture -- --env-file .env.recovery.production --label production
```

What it creates:

- a sanitized env manifest
- git/release metadata
- cron inventory from `vercel.json`
- inferred agent readiness from the current env state
- page and admin route inventories
- a manual follow-up checklist for provider dashboards and screenshots

Default output location:

- `artifacts/parity-packs/<timestamp>-<label>/`

Recommended production flow:

1. Export or pull the production env file into a local recovery-safe path.
2. Run `pnpm parity-pack:capture -- --env-file <that-file> --label production`.
3. Supplement the env pull with any runtime-only or dashboard-only secrets if a pulled value appears blank or intentionally masked.
4. Complete the generated `manual-followups.md`, including a live cron-auth verification note.
5. Save the finished parity pack beside the matching DB/storage backup set.

## Recovery Order

### 1. Recover the codebase

1. Clone the repo into a fresh workspace.
2. Check out the most recent known-good release tag or production commit.
3. Confirm the recovery branch contains:
   - [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json)
   - `supabase/migrations/`
   - [docs/production-go-live.md](/Users/vijaysingh/apps/flamingfoodies/docs/production-go-live.md)
   - [docs/google-cloud-search-console-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/google-cloud-search-console-setup.md)
   - [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md)

### 2. Recreate infrastructure

Provision these first:

1. A new Supabase project.
2. A new or relinked Vercel project.
3. The production domain and DNS records.
4. Any required Google Cloud project and OAuth client for Search Console.

If the original provider accounts still exist, prefer reconnecting them over creating new identities.

### 3. Rebuild the database and storage layer

1. Apply every SQL file in `supabase/migrations/` in timestamp order.
2. Do not skip the later automation and Search Console migrations.
3. Confirm the storage buckets exist:
   - `avatars`
   - `admin-media`
   - `community-media`
4. Confirm RLS is enabled and the public-read policies for published content are active.

Important note:

- the later control-plane migrations are required for current admin automation surfaces, not optional enhancements
- treat the entire `supabase/migrations/` directory as the schema source of truth for a clean rebuild

### 4. Configure Supabase auth before first login

In Supabase Dashboard:

1. Set `Site URL` to `https://flamingfoodies.com`.
2. Add redirect URLs:
   - `https://flamingfoodies.com/auth/callback`
   - `https://www.flamingfoodies.com/auth/callback`
   - `http://localhost:3000/auth/callback`
3. If Google/GitHub social login should exist, enable those providers and wire their callback URLs in Supabase first.
4. Restore custom SMTP and branded auth templates if you were using them.

See [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md) for the branded auth-specific steps.

### 5. Restore the full env matrix in Vercel

Add the production env vars before the first real deploy.

#### Core app and infrastructure

| Variable | Restore level | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | required | Production canonical URL |
| `NEXT_PUBLIC_SITE_NAME` | required | Public brand name |
| `NEXT_PUBLIC_SUPABASE_URL` | required | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | required | Preferred public key |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | legacy fallback | Only if older scripts still expect it |
| `SUPABASE_SECRET_KEY` | required | Preferred admin/server key |
| `SUPABASE_SERVICE_ROLE_KEY` | legacy fallback | Use only if still needed |
| `CRON_SECRET` | required | Required by all cron routes |
| AI provider API key env | required for live automations | Needed for content/search/automation lanes; use the exact variable name defined in `.env.example` and `lib/env.ts` |
| AI model env | recommended | Defaults exist, but preserve the pinned production value if you have one |

#### Auth and safety flags

| Variable | Restore level | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | optional/live feature gate | Set `true` only after Google is enabled in Supabase |
| `NEXT_PUBLIC_ENABLE_GITHUB_AUTH` | optional/live feature gate | Set `true` only after GitHub is enabled in Supabase |
| `ALLOW_SAMPLE_FALLBACKS` | recommended | Use `true` only as a temporary recovery crutch; set `false` once real data is restored |
| `NEXT_PUBLIC_ALLOW_MOCK_ADMIN` | recommended | Keep `false` in production; this should not be left open after recovery |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | optional | Useful during staged recovery cutover |

#### Affiliate, commerce, and audience

| Variable | Restore level | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_AMAZON_TAG` | required for affiliate monetization | Required for affiliate redirects |
| `CONVERTKIT_API_KEY` | optional but recommended | Required for live form subscriptions |
| `CONVERTKIT_API_SECRET` | optional but recommended | Required for approved campaign sends |
| `CONVERTKIT_FORM_ID` | optional but recommended | Required for public signup capture |
| `NEXT_PUBLIC_SKIMLINKS_ID` | optional | Restores Skimlinks script injection if used |

#### Social distribution

| Variable | Restore level | Notes |
| --- | --- | --- |
| `BUFFER_API_KEY` | required for current Pinterest flow | Preferred Buffer GraphQL credential |
| `BUFFER_CHANNEL_IDS` | required for live social distribution | Use `pinterest:<channel-id>` format |
| `BUFFER_PINTEREST_BOARD_ID` | required for Pinterest sends | Must be the board `serviceId`, not the human-readable board name |
| `BUFFER_ORGANIZATION_ID` | recommended | Helpful for local inspection and multi-org Buffer accounts |
| `BUFFER_ACCESS_TOKEN` | legacy fallback | Older REST path only |
| `BUFFER_PROFILE_IDS` | legacy fallback | Older REST path only |

#### Search Console

| Variable | Restore level | Notes |
| --- | --- | --- |
| `GOOGLE_CLOUD_PROJECT_ID` | recommended | Helps keep the Search Console setup concrete and traceable |
| `GOOGLE_SEARCH_CONSOLE_PROPERTY` | required for the search loop | Prefer `sc-domain:flamingfoodies.com` |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_ID` | required for live auth | OAuth web client |
| `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET` | required for live auth | OAuth secret |
| `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI` | required for live auth | Use the production callback route |
| `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` | required for unattended sync | Without this the Search Console loop is not durable |

#### Analytics, ads, and telemetry

| Variable | Restore level | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_GA4_ID` | optional | GA4 measurement ID |
| `NEXT_PUBLIC_CLARITY_ID` | optional | Clarity project ID |
| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | optional | Plausible domain |
| `NEXT_PUBLIC_ADSENSE_ID` | optional | Required for AdSense serving |
| `NEXT_PUBLIC_SHOW_ADS` | optional | Must be `true` before ads render |
| `NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT` | optional | Blog ad slot |
| `NEXT_PUBLIC_ADSENSE_BLOG_ARCHIVE_SLOT` | optional | Blog archive ad slot |
| `NEXT_PUBLIC_ADSENSE_BLOG_IN_ARTICLE_SLOT` | optional | Blog in-article ad slot |
| `NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT` | optional | Review ad slot |
| `NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT` | optional | Review archive ad slot |
| `NEXT_PUBLIC_ADSENSE_REVIEW_IN_ARTICLE_SLOT` | optional | Review in-article ad slot |
| `NEXT_PUBLIC_ADSENSE_RECIPE_INLINE_SLOT` | optional | Recipe ad slot |
| `NEXT_PUBLIC_ADSENSE_RECIPE_IN_ARTICLE_SLOT` | optional | Recipe in-article ad slot |
| `ADS_TXT_EXTRA_LINES` | optional | Custom `ads.txt` lines |
| `KV_REST_API_URL` | optional | Upstash KV for likes telemetry |
| `KV_REST_API_TOKEN` | optional | Upstash KV bearer token |

#### Media providers

| Variable | Restore level | Notes |
| --- | --- | --- |
| `UNSPLASH_ACCESS_KEY` | optional | Inline article imagery |
| `PEXELS_API_KEY` | optional | Alternate inline article imagery |

### 6. Deploy once after env restore

Do an initial production deploy after envs are saved so the app can boot against the real Supabase project and provider keys.

### 7. Create the first admin

1. Sign in once so your `auth.users` and `profiles` rows exist.
2. Update [supabase/seed.sql](/Users/vijaysingh/apps/flamingfoodies/supabase/seed.sql) if the admin username should differ from `firekeeper`.
3. Run `supabase/seed.sql`.
4. Confirm `/admin` loads.

### 8. Bootstrap or restore the content catalog

If you have a database backup, restore that first.

If you do not have a database backup and need the fastest working recovery:

1. Sign in as the admin user.
2. Open `/admin`.
3. Use the `Catalog bootstrap` actions to import:
   - blogs
   - recipes
   - reviews
   - merch
4. Prefer `Import everything` for a clean empty environment.

This imports the fallback catalog into the live CMS tables through the same admin action used by the current site.

Important limitation:

- this restores the repo-backed fallback catalog, not every live draft, edit, generated record, or operator-created product that may have existed only in the database

## Provider Recovery Appendices

### Buffer and Pinterest

To restore the `pinterest-distributor` lane:

1. Reconnect the Pinterest account inside the correct Buffer Publish organization.
2. Restore `BUFFER_API_KEY`.
3. Discover the live `channelId` and board `serviceId`.
4. Save:
   - `BUFFER_CHANNEL_IDS=pinterest:<channel-id>`
   - `BUFFER_PINTEREST_BOARD_ID=<board-service-id>`
5. Redeploy.
6. Verify `/admin/automation/agents` shows `Pinterest distributor` as configured.

Use [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md) for the step-by-step discovery flow.

### Google Search Console

To restore the search loop:

1. Recreate or recover the Google Cloud project.
2. Enable the Search Console API.
3. Recreate the OAuth web client.
4. Add these redirect URIs:
   - `http://localhost:3000/api/admin/google-search-console/callback`
   - `https://flamingfoodies.com/api/admin/google-search-console/callback`
5. Confirm the Google account has access to `sc-domain:flamingfoodies.com`.
6. Complete the auth flow and save the refresh token into Vercel.

Use [docs/google-cloud-search-console-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/google-cloud-search-console-setup.md) for the full walkthrough.

### ConvertKit

To restore newsletter capture and approved sends:

1. Restore `CONVERTKIT_API_KEY`, `CONVERTKIT_API_SECRET`, and `CONVERTKIT_FORM_ID`.
2. Verify public signup works.
3. Verify `/admin/newsletter/campaigns` can create a draft or approval-gated campaign.
4. Verify `/api/admin/newsletter-digest?mode=send_due` can process only approved due campaigns.

### Supabase social auth and branded email

To restore login UX parity:

1. Re-enable Google/GitHub providers in Supabase if desired.
2. Only then set `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` and/or `NEXT_PUBLIC_ENABLE_GITHUB_AUTH=true`.
3. Restore custom SMTP if you were using branded mail.
4. Restore custom auth email templates.

Use [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md) for the exact provider and email-branding steps.

## What Can Be Recreated Versus What Must Be Restored

| State surface | Recreated from repo alone? | Recovery path |
| --- | --- | --- |
| Schema, indexes, RLS, storage policies | yes | Apply all migrations |
| `automation_agents` defaults | yes | Seeded by control-plane migration |
| baseline `site_settings` defaults | yes | Seeded by schema and automation migrations |
| `generation_schedule` defaults | yes | Seeded by initial schema |
| static fallback catalog content | yes | Use `/admin` catalog bootstrap |
| live `blog_posts`, `recipes`, `reviews`, `merch_products` beyond fallback seeds | no | Restore from DB backup if you need exact current content |
| `profiles`, saved items, ratings, comments, community submissions | no | Restore from DB backup |
| `newsletter_subscribers` | no | Restore from DB backup or export/import from ConvertKit if that is your durable source |
| `newsletter_campaigns` | no | Restore from DB backup |
| `affiliate_clicks` | no | Restore from DB backup if you need historical revenue analysis |
| `social_posts` queue/history | no | Restore from DB backup if you need exact queue state or history |
| `content_generation_jobs` and admin audit history | no | Restore from DB backup |
| `search_console_connections`, `search_insight_runs`, `search_recommendations` | partial | Fresh sync can rebuild the queue, but history and approval state are lost without backup |
| `automation_runs`, `automation_run_events`, `automation_state_snapshots`, `automation_approvals`, `automation_evaluations` | no | Restore from DB backup if you want continuity of the operator ledger |
| dynamic `site_settings` overlays | partial | Restore the whole `site_settings` table to keep runtime overlays and internal logs |
| Supabase storage objects | no | Restore from Supabase storage export |

### `site_settings` deserves special treatment

Do not treat `site_settings` as disposable. Beyond simple flags, it can hold:

- ad serving state like `show_ads`
- automation pause and quiet-hour policy
- search runtime overlays such as `search_runtime_optimizations`
- dynamic affiliate catalog entries such as `affiliate_dynamic_catalog`
- internal commerce gap logging such as `shop_gap_log`

For an exact recovery, back up and restore the full `site_settings` table.

## Restore Sequence For Dynamic Data

When you have backups, restore in this order:

1. Core content and merch tables.
2. Profiles and user-generated tables.
3. `site_settings`.
4. Search Console tables.
5. Social queue/history tables.
6. Newsletter tables.
7. Automation ledger and approval/evaluation tables.
8. Storage objects.

Why this order:

- it gets public pages and operator controls working first
- it restores runtime overlays before the automations start mutating live state again
- it restores queue and history tables only after the pages and providers they depend on exist

## Automation Recovery And Re-Enable Checklist

Before re-enabling live loops:

1. Confirm `/admin/automation/agents` loads.
2. Confirm the site-wide policy keys exist:
   - `automation_global_pause`
   - `automation_external_send_pause`
   - `automation_draft_creation_pause`
   - `automation_default_quiet_hours_start_et`
   - `automation_default_quiet_hours_end_et`
3. Start with `automation_external_send_pause=true` if you want to reconnect providers safely before audience-facing sends resume.
4. Confirm every cron route in [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json) is present in the deployed Vercel project.
5. Smoke test one manual run per live lane before trusting unattended cadence again.

Recommended re-enable order:

1. Draft-only discovery/generation lanes.
2. Internal-support and evaluator lanes.
3. Bounded-live publisher/executor lanes.
4. External-send lanes like Pinterest and newsletter send paths.

## Rebuild-To-Current-State Certification Checklist

Use this after the restore is complete.

Run this against the latest matching parity pack, not memory.

### Infrastructure

- [ ] Vercel project linked to the recovered repo
- [ ] Custom domain resolves and matches `NEXT_PUBLIC_SITE_URL`
- [ ] Supabase migrations applied through the latest file
- [ ] Storage buckets exist and are accessible under the correct policies
- [ ] `CRON_SECRET` is set in production
- [ ] deployed commit or tag matches the recovery target from the parity pack

### Environment And Feature-Flag Parity

- [ ] every required env in the parity pack is present in Vercel
- [ ] every optional env that was intentionally enabled in the parity pack is restored
- [ ] every optional env that was intentionally disabled in the parity pack is still disabled
- [ ] `ALLOW_SAMPLE_FALLBACKS` matches the intended recovery mode and is `false` once real data is restored
- [ ] `NEXT_PUBLIC_ALLOW_MOCK_ADMIN=false` in production
- [ ] Google/GitHub auth flags match the real provider state
- [ ] analytics, ads, KV, Buffer, Search Console, and ConvertKit envs match the parity pack
- [ ] at least one cron-protected route has been successfully invoked after deploy with the live auth secret; do not treat env pull output alone as proof

### Auth and admin

- [ ] `/login` works
- [ ] `/onboarding` works
- [ ] `/admin` loads for the seeded admin
- [ ] Google/GitHub buttons only show if the provider is truly enabled
- [ ] Supabase auth callback URLs match the parity pack
- [ ] branded SMTP/templates are restored if they were part of the pre-incident state

### Public Route Parity

- [ ] `/` loads and matches the expected brand shell
- [ ] `/recipes` loads
- [ ] `/reviews` loads
- [ ] `/shop` loads
- [ ] `/blog` loads
- [ ] `/hot-sauces` loads
- [ ] `/peppers` loads
- [ ] `/brands` loads
- [ ] `/festivals` loads
- [ ] `/new-releases` loads
- [ ] `/guides` or `/how-to` loads
- [ ] `/community` loads
- [ ] `/quiz` loads
- [ ] `/search` loads
- [ ] `/about` loads
- [ ] `/subscriptions` loads
- [ ] at least one representative detail page per major vertical loads without 404 or broken hero media
- [ ] `/sitemap.xml` loads
- [ ] `/robots.txt` loads
- [ ] `/ads.txt` loads if ads were enabled in the parity pack
- [ ] `/api/og?title=Recovery%20Test` renders a valid OG image

### Public content

- [ ] `/recipes`, `/reviews`, `/shop`, and the homepage render live data
- [ ] If recovering without a DB backup, catalog bootstrap has been run
- [ ] `ALLOW_SAMPLE_FALLBACKS=false` once real data is back
- [ ] representative public counts or listing density look consistent with the parity pack

### Admin Surface Parity

- [ ] `/admin`
- [ ] `/admin/automation/trigger`
- [ ] `/admin/automation/agents`
- [ ] `/admin/automation/approvals`
- [ ] `/admin/automation/runs`
- [ ] `/admin/automation/schedule`
- [ ] `/admin/automation/jobs`
- [ ] `/admin/content/blog`
- [ ] `/admin/content/recipes`
- [ ] `/admin/content/reviews`
- [ ] `/admin/content/merch`
- [ ] `/admin/social/queue`
- [ ] `/admin/social/history`
- [ ] `/admin/social/templates`
- [ ] `/admin/newsletter/campaigns`
- [ ] `/admin/newsletter/new`
- [ ] `/admin/newsletter/subscribers`
- [ ] `/admin/settings/general`
- [ ] `/admin/settings/affiliates`
- [ ] `/admin/settings/audit-log`
- [ ] `/admin/analytics/search-console`
- [ ] `/admin/analytics/affiliate`
- [ ] `/admin/analytics/traffic`
- [ ] `/admin/analytics/content`
- [ ] `/admin/community/moderation`
- [ ] `/admin/community/comments`
- [ ] `/admin/community/users`

### Cron Parity

- [ ] `/api/admin/generate?type=recipe&qty=3` exists in the deployed cron inventory
- [ ] `/api/admin/generate?type=recipe&qty=1&profile=hot_sauce_recipe` exists in the deployed cron inventory
- [ ] `/api/admin/generate?type=blog_post&qty=1` exists in the deployed cron inventory
- [ ] `/api/admin/generate?type=merch_product&qty=1` exists in the deployed cron inventory
- [ ] `/api/admin/shop-refresh` exists in the deployed cron inventory
- [ ] `/api/admin/generate?type=review&qty=1` exists in the deployed cron inventory
- [ ] `/api/admin/reevaluate-ai-drafts` exists in the deployed cron inventory
- [ ] `/api/admin/publish-scheduled` exists in the deployed cron inventory
- [ ] `/api/admin/editorial-performance-evaluator/cron` exists in the deployed cron inventory
- [ ] `/api/admin/growth-loop` exists in the deployed cron inventory
- [ ] `/api/admin/social-scheduler` exists in the deployed cron inventory
- [ ] `/api/admin/social-distribution-evaluator/cron` exists in the deployed cron inventory
- [ ] `/api/admin/shop-performance-evaluator/cron` exists in the deployed cron inventory
- [ ] `/api/admin/newsletter-digest` exists in the deployed cron inventory
- [ ] `/api/admin/newsletter-digest?mode=send_due` exists in the deployed cron inventory
- [ ] `/api/admin/search-insights` exists in the deployed cron inventory
- [ ] `/api/admin/search-insights-executor/cron` exists in the deployed cron inventory
- [ ] `/api/admin/search-performance-evaluator/cron` exists in the deployed cron inventory
- [ ] `/api/admin/content-shop-sync` exists in the deployed cron inventory
- [ ] `/api/admin/festival-discovery` exists in the deployed cron inventory
- [ ] `/api/admin/pepper-discovery` exists in the deployed cron inventory
- [ ] `/api/admin/brand-discovery` exists in the deployed cron inventory
- [ ] `/api/admin/release-monitor` exists in the deployed cron inventory
- [ ] `/api/admin/tutorial-generate` exists in the deployed cron inventory

### Agent Registry And Control-Plane Parity

- [ ] `editorial-autopublisher` appears on `/admin/automation/agents`
- [ ] `editorial-performance-evaluator` appears on `/admin/automation/agents`
- [ ] `pinterest-distributor` appears on `/admin/automation/agents`
- [ ] `growth-loop-promoter` appears on `/admin/automation/agents`
- [ ] `social-distribution-evaluator` appears on `/admin/automation/agents`
- [ ] `shop-shelf-curator` appears on `/admin/automation/agents`
- [ ] `shop-performance-evaluator` appears on `/admin/automation/agents`
- [ ] `newsletter-digest-agent` appears on `/admin/automation/agents`
- [ ] `search-insights-analyst` appears on `/admin/automation/agents`
- [ ] `search-recommendation-executor` appears on `/admin/automation/agents`
- [ ] `search-performance-evaluator` appears on `/admin/automation/agents`
- [ ] `festival-discovery` appears on `/admin/automation/agents`
- [ ] `pepper-discovery` appears on `/admin/automation/agents`
- [ ] `brand-discovery` appears on `/admin/automation/agents`
- [ ] `release-monitor` appears on `/admin/automation/agents`
- [ ] `tutorial-generator` appears on `/admin/automation/agents`
- [ ] `content-shop-sync` appears on `/admin/automation/agents`
- [ ] no lane that was live in the parity pack incorrectly shows `needs_config`
- [ ] the site-wide automation policy keys exist:
  `automation_global_pause`, `automation_external_send_pause`, `automation_draft_creation_pause`, `automation_default_quiet_hours_start_et`, `automation_default_quiet_hours_end_et`
- [ ] `/admin/automation/runs` shows restored or newly created run ledger entries
- [ ] `/admin/automation/approvals` shows restored approval items if they existed in the parity pack
- [ ] evaluator verdict history exists if it was present in the restored backup
- [ ] at least one manual certification run has been recorded for each lane expected to be live

### Automation control plane

- [ ] `/admin/automation/trigger` loads
- [ ] `/admin/automation/agents` loads
- [ ] `/admin/automation/approvals` loads
- [ ] `/admin/automation/runs` loads
- [ ] the safety switches on `/admin/automation/agents` match the intended recovered policy state
- [ ] manual trigger flows work without unexpected auth or cache issues

### Providers

- [ ] Pinterest distributor shows as configured
- [ ] A manual Pinterest publish creates a real Buffer/provider ID
- [ ] Search Console queue refresh works
- [ ] Search executor can apply an approved recommendation
- [ ] Search evaluator writes a verdict
- [ ] ConvertKit signup works
- [ ] Approved newsletter due-send processing works
- [ ] Buffer organization ID, channel mapping, and board ID match the parity pack or documented replacement values
- [ ] Search Console property and OAuth callback URIs match the parity pack or documented replacement values
- [ ] ConvertKit form ID and send credentials match the parity pack
- [ ] Supabase provider configuration matches the parity pack

### Data And State Parity

- [ ] row counts for key tables match the restored backup manifest closely enough to explain any intentional deltas
- [ ] the full `site_settings` table has been restored when exact parity matters
- [ ] `search_runtime_optimizations` exists if it existed in the parity pack
- [ ] `affiliate_dynamic_catalog` exists if it existed in the parity pack
- [ ] `shop_gap_log` exists if it existed in the parity pack
- [ ] `automation_runs`, `automation_approvals`, and `automation_evaluations` counts are consistent with the restored backup
- [ ] `social_posts` queue/history counts are consistent with the restored backup
- [ ] `newsletter_subscribers` and `newsletter_campaigns` counts are consistent with the restored backup
- [ ] storage object counts per bucket are consistent with the restored backup

### Monetization and telemetry

- [ ] Affiliate redirects include the correct tracking tag
- [ ] Merchant links remain labeled honestly
- [ ] `ads.txt` renders correctly if AdSense is enabled
- [ ] Ad slots only render when the matching envs are set
- [ ] Upstash-backed likes work if KV is configured
- [ ] affiliate/admin analytics pages show plausible restored data if historical data was recovered

## Practical Recovery Modes

### Fastest viable recovery

Use this when uptime matters more than historical continuity:

1. Restore code.
2. Provision Supabase and Vercel.
3. Apply migrations.
4. Restore core env vars.
5. Seed the first admin.
6. Import the fallback catalog.
7. Reconnect Buffer, Search Console, and ConvertKit.
8. Re-enable bounded-live and external-send lanes gradually.

This gets the site back online quickly, but not back to the exact pre-incident state.

### Exact-state recovery

Use this when the goal is to recover the site exactly as it was:

1. Restore code at the correct release tag.
2. Restore all production env vars.
3. Restore the full Supabase database backup.
4. Restore Supabase storage objects.
5. Reconnect provider accounts where tokens or OAuth callbacks changed.
6. Re-certify live automations with manual runs.

## Companion Documents

- [docs/niche-site-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/niche-site-playbook.md)
- [docs/production-go-live.md](/Users/vijaysingh/apps/flamingfoodies/docs/production-go-live.md)
- [docs/google-cloud-search-console-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/google-cloud-search-console-setup.md)
- [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md)
- [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md)
- [docs/ecosystem-inventory-and-recovery-matrix.md](/Users/vijaysingh/apps/flamingfoodies/docs/ecosystem-inventory-and-recovery-matrix.md)
- [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md)
