# FlamingFoodies Ecosystem Inventory And Recovery Matrix

This document is the full third-party ecosystem companion to:

- [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md)
- [docs/disaster-recovery-rebuild-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/disaster-recovery-rebuild-playbook.md)
- [docs/production-go-live.md](/Users/vijaysingh/apps/flamingfoodies/docs/production-go-live.md)

Use it when the goal is to restore not just the app and database, but the entire operating ecosystem around FlamingFoodies: platform, auth, AI, distribution, analytics, monetization, telemetry, and media providers.

Repo-side parity capture support now exists through:

```bash
pnpm parity-pack:capture -- --env-file .env.recovery.production --label production
```

That script does not replace provider dashboard exports, but it automates the repo/env/cadence portion of the baseline and generates a manual follow-up checklist for the dashboard-only pieces.

## Status Legend

- `core` means the service is required to restore the current production-grade stack
- `live_feature` means it is actively supported in the app and may be enabled in production
- `optional` means the site can run without it, but parity may require it
- `legacy` means the code still supports it, but it should not be the preferred restore path
- `destination_only` means the site depends on the third party as a commerce or sharing destination, not as an authenticated integration

## Ecosystem Matrix

| Service | Status | Why it exists | Keys / IDs / settings | Primary verification |
| --- | --- | --- | --- | --- |
| GitHub | `core` | Source control, release tags, Vercel Git integration | repo access, default branch, tags, deployable commit | repo can be cloned and Vercel points at the correct branch/commit |
| Vercel | `core` | Hosting, env vars, production deploys, cron execution | project link, production envs, custom domain, cron inventory | production deploy succeeds and crons match `vercel.json` |
| Domain registrar / DNS | `core` | apex + `www` routing, Search Console property verification, callback stability | registrar login, DNS zone, TXT/CNAME/A records | `flamingfoodies.com` resolves correctly and required TXT records exist |
| Supabase | `core` | database, storage, auth, site settings, control plane | project URL, publishable key, secret/service key, SQL migrations, storage buckets | `/admin` loads, tables exist, storage buckets exist, auth works |
| Supabase Google OAuth | `live_feature` | optional public Google sign-in | provider enabled in Supabase, Google client ID/secret, callback URL, `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH` | Google button only appears when provider really works |
| Supabase GitHub OAuth | `live_feature` | optional public GitHub sign-in | provider enabled in Supabase, GitHub client ID/secret, callback URL, `NEXT_PUBLIC_ENABLE_GITHUB_AUTH` | GitHub button only appears when provider really works |
| Supabase custom SMTP + templates | `optional` | branded auth email delivery | SMTP host/user/pass, sender identity, auth email templates | auth email comes from branded sender and matches templates |
| Primary AI provider | `core` for live automations | content generation, research, discovery, evaluator intelligence | provider-specific AI key and model envs defined in `.env.example` / `lib/env.ts` | admin generation and agent lanes stop failing for missing AI config |
| Buffer | `core` for social distribution | social publishing transport | `BUFFER_API_KEY`, optional `BUFFER_ORGANIZATION_ID` | Buffer inspection and publishing work |
| Pinterest inside Buffer | `core` if Pinterest is live | outbound Pinterest distribution target | connected Pinterest channel, board `serviceId`, `BUFFER_CHANNEL_IDS`, `BUFFER_PINTEREST_BOARD_ID` | `pinterest-distributor` shows configured and creates real provider IDs |
| ConvertKit / Kit | `live_feature` | newsletter signups and approval-gated sends | `CONVERTKIT_API_KEY`, `CONVERTKIT_API_SECRET`, `CONVERTKIT_FORM_ID`, account access | subscribe flow works and approved newsletter sends succeed |
| Google Cloud + Search Console | `core` for search loop | Search Console OAuth, analyst queue, executor and evaluator | Cloud project, OAuth client, Search Console property, redirect URIs, refresh token | `/admin/analytics/search-console` works and queue sync succeeds |
| Amazon Associates | `core` for affiliate parity | Amazon-tagged affiliate monetization | `NEXT_PUBLIC_AMAZON_TAG`, active Associates account | Amazon redirects include the correct tag |
| Skimlinks | `optional` | JS-based affiliate monetization overlay | `NEXT_PUBLIC_SKIMLINKS_ID`, Skimlinks publisher account | Skimlinks script loads when enabled |
| Google AdSense | `optional` | display ads and `ads.txt` | `NEXT_PUBLIC_ADSENSE_ID`, `NEXT_PUBLIC_SHOW_ADS`, slot IDs, `ADS_TXT_EXTRA_LINES` | ads render only when enabled and `/ads.txt` is valid |
| GA4 | `optional` | analytics and traffic attribution | `NEXT_PUBLIC_GA4_ID` | GA4 script loads and page views arrive |
| Microsoft Clarity | `optional` | session replay / UX telemetry | `NEXT_PUBLIC_CLARITY_ID` | Clarity script loads and recordings appear |
| Plausible | `optional` | privacy-friendly analytics | `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` | Plausible script loads and events appear |
| Upstash KV | `optional` | lightweight like-count storage | `KV_REST_API_URL`, `KV_REST_API_TOKEN` | like counts increment successfully |
| Unsplash | `optional` | image lookup for hero/content workflows | `UNSPLASH_ACCESS_KEY` | image fetch succeeds when requested |
| Pexels | `optional` | fallback image lookup when Unsplash is absent or fails | `PEXELS_API_KEY` | image fetch succeeds from Pexels fallback path |
| Direct merchant destinations | `destination_only` | non-Amazon commerce links in affiliate catalog | merchant URLs in `lib/affiliates.ts` | merchant redirects remain valid and honestly labeled |

## Service Details

### GitHub

Current role:

- canonical source control
- release tags and deploy checkpoints
- Vercel Git integration source

Required recovery assets:

- repo access
- default branch name
- release tags
- last known-good production commit hash

Checklist:

- [ ] repo can be cloned in a clean workspace
- [ ] the recovery target commit or tag still exists
- [ ] Vercel is linked to the correct repo and branch
- [ ] deployment permissions are intact for the operators who may need to restore the site

Backup artifacts:

- release tags
- protected branch settings if they matter operationally
- any repo-level secrets that are not mirrored elsewhere

### Vercel

Current role:

- production hosting
- environment variable storage
- cron scheduling from [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json)
- custom-domain routing

Required app settings:

- production project link
- domain alias for `https://flamingfoodies.com`
- all production env vars
- cron inventory matching the repo

Checklist:

- [ ] Vercel project exists and points to the correct repo
- [ ] production domain alias is correct
- [ ] all env vars from the recovery matrix are present
- [ ] deployed cron inventory matches [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json)
- [ ] production redeploy succeeds after env restore
- [ ] cron auth matches the app convention: `Authorization: Bearer <CRON_SECRET>`
- [ ] at least one live cron-protected route has been smoke tested after deploy; env pull output is not the only parity proof

Backup artifacts:

- exported env manifest
- production project ID / team
- cron inventory snapshot

### Domain Registrar And DNS

Current role:

- apex and `www` domain routing
- Search Console domain verification support
- callback and auth URL stability

Checklist:

- [ ] operator access to the registrar or DNS host exists
- [ ] apex DNS resolves to the current hosting target
- [ ] `www` redirects or aliases behave as intended
- [ ] Search Console TXT verification record can be restored if needed
- [ ] any provider-required TXT/CNAME records are documented

Backup artifacts:

- zone export
- registrar login owner
- list of required TXT/CNAME records

### Supabase

Current role:

- Postgres database
- storage buckets
- auth
- runtime `site_settings`
- automation control plane

Required settings:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`

Checklist:

- [ ] new or restored project exists in the intended region
- [ ] all migrations in `supabase/migrations/` are applied in timestamp order
- [ ] storage buckets `avatars`, `admin-media`, and `community-media` exist
- [ ] `supabase/seed.sql` has been run for the first admin
- [ ] `/admin` loads for the seeded admin
- [ ] real data or bootstrap content is present

Backup artifacts:

- database backup / table export
- storage export
- API keys
- `site_settings` export

### Supabase Google OAuth

Current role:

- optional Google sign-in for public users

Settings:

- Supabase provider enablement
- Google client ID/secret inside Supabase
- `NEXT_PUBLIC_ENABLE_GOOGLE_AUTH=true` only after the provider works

Checklist:

- [ ] Google provider is enabled in Supabase
- [ ] Google OAuth client includes the Supabase callback URL
- [ ] Google button appears only after end-to-end auth works

Backup artifacts:

- Google client ID
- note of the exact callback URI registered

See [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md).

### Supabase GitHub OAuth

Current role:

- optional GitHub sign-in for public users

Settings:

- Supabase provider enablement
- GitHub OAuth app client ID/secret inside Supabase
- `NEXT_PUBLIC_ENABLE_GITHUB_AUTH=true` only after the provider works

Checklist:

- [ ] GitHub provider is enabled in Supabase
- [ ] GitHub OAuth app includes the Supabase callback URL
- [ ] GitHub button appears only after end-to-end auth works

Backup artifacts:

- GitHub client ID
- note of the exact callback URI registered

See [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md).

### Supabase Custom SMTP And Auth Templates

Current role:

- branded auth email delivery

Provider-side settings:

- SMTP host/port/user/password
- sender name/address
- magic link and confirmation templates

Checklist:

- [ ] custom SMTP is configured if branded mail is required for parity
- [ ] auth templates have been restored
- [ ] `Site URL` in Supabase matches production
- [ ] a live auth email renders branded copy and sender identity

Backup artifacts:

- SMTP provider credentials
- template HTML/subjects

See [docs/supabase-auth-branding.md](/Users/vijaysingh/apps/flamingfoodies/docs/supabase-auth-branding.md).

### Primary AI Provider

Current role:

- content generation
- discovery/research lanes
- QA/evaluator support

Settings:

- the provider-specific AI API key env
- the provider-specific AI model env

Checklist:

- [ ] key is present in Vercel
- [ ] model value matches intended production behavior
- [ ] manual generation works from admin
- [ ] discovery and evaluator lanes do not fail for missing AI config

Backup artifacts:

- API key owner
- pinned model choice if intentionally overridden

### Buffer

Current role:

- publish transport for configured social destinations

Preferred settings:

- `BUFFER_API_KEY`
- `BUFFER_ORGANIZATION_ID`

Legacy fallback:

- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS`

Checklist:

- [ ] Buffer Publish account access exists
- [ ] GraphQL API key exists
- [ ] `BUFFER_API_KEY` is stored in Vercel
- [ ] optional organization ID is documented for multi-org accounts
- [ ] local inspection script works:
  `node scripts/inspect-buffer-pinterest.mjs --env-file <env-file>`

Backup artifacts:

- Buffer org ownership
- API key owner
- organization ID

### Pinterest Inside Buffer

Current role:

- active social destination for the `pinterest-distributor` lane
- public Pinterest save/share presence also exists through front-end share buttons, but that part needs no credential

Required settings:

- connected Pinterest account inside the correct Buffer org
- `BUFFER_CHANNEL_IDS=pinterest:<channel-id>`
- `BUFFER_PINTEREST_BOARD_ID=<board-service-id>`

Checklist:

- [ ] Pinterest account is connected inside Buffer
- [ ] the correct board exists and is chosen
- [ ] `BUFFER_CHANNEL_IDS` includes the Pinterest channel mapping
- [ ] `BUFFER_PINTEREST_BOARD_ID` matches the board `serviceId`
- [ ] `/admin/automation/agents` shows `Pinterest distributor` as configured
- [ ] a manual Pinterest publish creates a real provider post ID

Backup artifacts:

- Buffer organization ID
- Pinterest channel ID
- Pinterest board `serviceId`

See [docs/pinterest-buffer-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/pinterest-buffer-setup.md).

### ConvertKit / Kit

Current role:

- public email capture
- approval-gated campaign sending
- weekly digest and due-send processing

Required settings:

- `CONVERTKIT_API_KEY`
- `CONVERTKIT_API_SECRET`
- `CONVERTKIT_FORM_ID`

Current in-app segment taxonomy:

- `weekly-roundup`
- `recipe-club`
- `hot-sauce-shelf`
- `cook-shop`

Important note:

- the public subscribe endpoint also accepts arbitrary tags, so if production relies on extra ConvertKit automations or persona tags outside the four in-app segments, preserve that mapping in the parity pack

Checklist:

- [ ] ConvertKit account access exists
- [ ] the public form ID is still valid
- [ ] API key is present for subscriptions
- [ ] API secret is present for broadcast/send workflows
- [ ] `/api/subscribe` succeeds
- [ ] `/admin/newsletter/campaigns` can queue approval-gated sends
- [ ] `/api/admin/newsletter-digest?mode=send_due` processes only approved due campaigns

Backup artifacts:

- form ID
- API key
- API secret
- any account-side automation/tag mapping not represented in code

### Google Cloud And Search Console

Current role:

- Search Console OAuth and property access
- search-insights analyst sync
- search recommendation executor and evaluator

Required settings:

- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_SEARCH_CONSOLE_PROPERTY`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`
- `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI`
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`

Required URLs:

- `http://localhost:3000/api/admin/google-search-console/callback`
- `https://flamingfoodies.com/api/admin/google-search-console/callback`

Checklist:

- [ ] Google Cloud project exists
- [ ] Search Console API is enabled
- [ ] OAuth web client exists
- [ ] redirect URIs are correct
- [ ] the chosen Google account can access `sc-domain:flamingfoodies.com`
- [ ] refresh token has been generated and stored
- [ ] `/admin/analytics/search-console` shows a connected property
- [ ] analyst sync can populate `search_recommendations`
- [ ] executor only applies approved supported recommendations

Backup artifacts:

- project ID
- OAuth client ID
- redirect URIs
- property string
- refresh token owner

See [docs/google-cloud-search-console-setup.md](/Users/vijaysingh/apps/flamingfoodies/docs/google-cloud-search-console-setup.md).

### Amazon Associates

Current role:

- primary affiliate monetization path for Amazon destinations

Required setting:

- `NEXT_PUBLIC_AMAZON_TAG`

Checklist:

- [ ] Amazon Associates account is active
- [ ] the current tracking tag is known and stored in Vercel
- [ ] Amazon `/dp/` and `/s` links include the tag
- [ ] `/go/*` redirects still resolve correctly for affiliate entries
- [ ] affiliate destination labeling remains honest:
  exact product, Amazon search fallback, or merchant page

Backup artifacts:

- active tracking tag
- Associates account owner

### Skimlinks

Current role:

- optional JavaScript-based affiliate monetization layer

Required setting:

- `NEXT_PUBLIC_SKIMLINKS_ID`

Checklist:

- [ ] Skimlinks publisher account exists
- [ ] site is registered with Skimlinks if this revenue path is used
- [ ] publisher ID is stored in Vercel
- [ ] Skimlinks script loads in page source when enabled

Backup artifacts:

- publisher ID
- site approval status

### Google AdSense

Current role:

- optional display ads
- `ads.txt` generation

Required settings when enabled:

- `NEXT_PUBLIC_ADSENSE_ID`
- `NEXT_PUBLIC_SHOW_ADS=true`
- optional slot IDs:
  `NEXT_PUBLIC_ADSENSE_BLOG_INLINE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_BLOG_ARCHIVE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_BLOG_IN_ARTICLE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_REVIEW_INLINE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_REVIEW_ARCHIVE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_REVIEW_IN_ARTICLE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_RECIPE_INLINE_SLOT`,
  `NEXT_PUBLIC_ADSENSE_RECIPE_IN_ARTICLE_SLOT`
- optional `ADS_TXT_EXTRA_LINES`

Important runtime note:

- the env gate is not enough by itself; the `show_ads` site setting can still disable serving at runtime

Checklist:

- [ ] AdSense account is approved for the site
- [ ] publisher ID is stored in Vercel
- [ ] slot IDs are documented if manual slots are used
- [ ] `NEXT_PUBLIC_SHOW_ADS` matches intended state
- [ ] `site_settings.show_ads` matches intended state
- [ ] `/ads.txt` contains the correct publisher line
- [ ] ad slots render only when both env and runtime setting allow them

Backup artifacts:

- publisher ID
- slot IDs
- any custom `ads.txt` lines
- `show_ads` runtime setting in `site_settings`

### Google Analytics 4

Current role:

- traffic analytics via gtag

Required setting:

- `NEXT_PUBLIC_GA4_ID`

Checklist:

- [ ] GA4 property exists
- [ ] measurement ID is stored in Vercel
- [ ] `gtag.js` loads in production
- [ ] page views appear in GA4

Backup artifacts:

- GA4 property name
- measurement ID

### Microsoft Clarity

Current role:

- session replay / behavior analytics

Required setting:

- `NEXT_PUBLIC_CLARITY_ID`

Checklist:

- [ ] Clarity project exists
- [ ] project ID is stored in Vercel
- [ ] Clarity script loads in production
- [ ] sessions appear in the Clarity dashboard

Backup artifacts:

- Clarity project ID

### Plausible

Current role:

- optional lightweight analytics

Required setting:

- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`

Checklist:

- [ ] Plausible site entry exists
- [ ] domain is stored in Vercel
- [ ] Plausible script loads in production
- [ ] page views appear in Plausible

Backup artifacts:

- Plausible site domain entry

### Upstash KV

Current role:

- like counter storage for lightweight engagement actions

Required settings:

- `KV_REST_API_URL`
- `KV_REST_API_TOKEN`

Checklist:

- [ ] Upstash database exists
- [ ] REST URL and token are stored in Vercel
- [ ] like actions succeed without `Upstash request failed`
- [ ] counts persist across refreshes

Backup artifacts:

- REST URL
- REST token
- database name / region if tracked separately

### Unsplash

Current role:

- first-choice image lookup for hero/content workflows
- currently used in the blog hero image route and automation image fetch path

Required setting:

- `UNSPLASH_ACCESS_KEY`

Checklist:

- [ ] Unsplash developer app exists
- [ ] access key is stored in Vercel
- [ ] image lookup succeeds for a representative content query

Backup artifacts:

- access key owner
- app name

### Pexels

Current role:

- fallback image provider after Unsplash
- currently used in the same image-fetch flow as Unsplash in the blog hero route and automation image fetch path

Required setting:

- `PEXELS_API_KEY`

Checklist:

- [ ] Pexels API account exists
- [ ] API key is stored in Vercel
- [ ] image lookup succeeds when the Pexels fallback path is exercised

Good verification options:

- temporarily test without `UNSPLASH_ACCESS_KEY`, or
- inspect a successful image fetch from the Pexels branch during content generation / hero rendering

Backup artifacts:

- Pexels API key owner
- app/account identifier if tracked

### Direct Merchant Destinations

Current role:

- non-Amazon affiliate catalog destinations such as:
  Mike's Hot Honey, Heatonist, Fuego Box, and Pepper Joe's

Important note:

- these are currently destination URLs in the affiliate catalog, not separate authenticated API integrations
- if any of them later become tracked affiliate programs with dashboard credentials, add them to this matrix as first-class providers

Checklist:

- [ ] direct merchant URLs in `lib/affiliates.ts` still resolve
- [ ] merchant links are labeled as merchant destinations, not Amazon links
- [ ] any external affiliate agreement details are stored outside the repo if they exist

Backup artifacts:

- current merchant URLs
- any off-repo affiliate agreement notes

## Full Ecosystem Bring-Up Checklist

Use this after a disaster recovery or greenfield rebuild when the goal is to stand the whole ecosystem back up.

### Platform

- [ ] GitHub repo access restored
- [ ] Vercel project linked to the correct repo and branch
- [ ] production domain and DNS restored
- [ ] Vercel envs restored from the current parity pack
- [ ] production deploy succeeds

### Data And Auth

- [ ] Supabase project restored
- [ ] all migrations applied
- [ ] storage buckets restored
- [ ] first admin seeded
- [ ] Supabase auth URLs configured
- [ ] Google OAuth restored if intended
- [ ] GitHub OAuth restored if intended
- [ ] branded SMTP/templates restored if parity requires them

### AI And Automation

- [ ] AI provider key restored
- [ ] cron inventory matches `vercel.json`
- [ ] all 17 agents appear on `/admin/automation/agents`
- [ ] automation policy keys exist in `site_settings`

### Audience And Growth

- [ ] Buffer API key restored
- [ ] Pinterest channel and board restored
- [ ] ConvertKit API key, secret, and form ID restored
- [ ] Search Console Cloud project, OAuth, property, and refresh token restored
- [ ] public subscribe flow works
- [ ] Pinterest send works
- [ ] Search Console analyst sync works

### Monetization

- [ ] Amazon Associates tag restored
- [ ] Skimlinks ID restored if used
- [ ] AdSense publisher ID and slot IDs restored if used
- [ ] `show_ads` runtime state is correct
- [ ] merchant destinations still resolve and remain honestly labeled

### Analytics And Telemetry

- [ ] GA4 measurement ID restored if used
- [ ] Clarity project ID restored if used
- [ ] Plausible domain restored if used
- [ ] Upstash KV restored if used

### Media Providers

- [ ] Unsplash key restored if used
- [ ] Pexels key restored if used
- [ ] hero/content image lookup succeeds from at least one configured provider

## What Still Needs To Be Preserved Outside The Repo

Even with this matrix, exact parity still depends on preserving:

- current provider account ownership
- callback URLs and OAuth client settings
- exported env manifests
- DB backups
- storage exports
- any account-side automation not represented in code:
  ConvertKit sequences, AdSense slot inventory, Search Console consent-screen state, SMTP sender configuration, and similar dashboard-only state
