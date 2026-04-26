# FlamingFoodies Production Go-Live

This runbook assumes the Vercel project and custom domain already exist.

## 1. Create the Supabase project

1. Create a new Supabase project in the region you want to run production from.
2. Wait for the database to finish provisioning.
3. In the Supabase dashboard, open `Project Settings -> API`.
4. Copy these values:
   - Project URL
   - publishable key
   - secret key
5. If you prefer the legacy key names, the app still accepts:
   - `anon`
   - `service_role`

## 2. Apply the database schema

Run every SQL file in `supabase/migrations` in timestamp order using the Supabase SQL Editor.

The production schema is no longer just the initial three files. It now also depends on the later
automation, Search Console, and approval-queue migrations, including:

- `20260420140000_create_search_insights_tables.sql`
- `20260421150000_create_search_recommendations.sql`
- `20260421170000_create_automation_control_plane.sql`
- `20260421183000_create_automation_state_snapshots.sql`
- `20260421200000_seed_automation_policy_site_settings.sql`
- `20260421213000_create_automation_approvals.sql`
- `20260421214000_split_brand_monitor_agents.sql`
- `20260421223000_update_newsletter_digest_agent_schedule.sql`
- `20260422001500_create_automation_evaluations.sql`
- `20260422013000_add_search_performance_evaluator_agent.sql`

Recommended rule:

- treat `supabase/migrations/` as the source of truth and apply the full directory in order for a
  fresh production project
- if production is already live, at minimum make sure every migration after the last applied one
  has been run before expecting the current admin automation surfaces to work correctly

The first migration creates the expected storage buckets too:

- `avatars`
- `admin-media`
- `community-media`

## 3. Configure Auth URLs

In `Authentication -> URL Configuration`, set:

- Site URL: `https://flamingfoodies.com`
- Redirect URLs:
  - `https://flamingfoodies.com/auth/callback`
  - `https://www.flamingfoodies.com/auth/callback`
  - `http://localhost:3000/auth/callback`

If you want preview deploy logins later, add your Vercel preview callback URLs too.

## 4. Enable auth providers

The app supports:

- email magic links
- Google OAuth
- GitHub OAuth

For Google and GitHub:

1. Enable the provider in `Authentication -> Sign In / Providers`.
2. Copy the Supabase callback URL shown there.
3. Paste that callback URL into the Google Cloud Console or GitHub OAuth App settings.
4. Save the provider client ID and secret in Supabase.

## 5. Add production env vars in Vercel

Required:

- `NEXT_PUBLIC_SITE_URL=https://flamingfoodies.com`
- `NEXT_PUBLIC_SITE_NAME=FlamingFoodies`
- `NEXT_PUBLIC_SUPABASE_URL=<project-url>`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>` or `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
- `SUPABASE_SECRET_KEY=<secret-key>` or `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `CRON_SECRET=<long-random-secret>`
- `NEXT_PUBLIC_AMAZON_TAG=flamingfoodies-20`

Recommended:

- `CONVERTKIT_API_KEY`
- `CONVERTKIT_API_SECRET`
- `CONVERTKIT_FORM_ID`
- the AI provider key env defined in `.env.example`
- `UNSPLASH_ACCESS_KEY`
- `PEXELS_API_KEY`
- `BUFFER_API_KEY`
- `BUFFER_CHANNEL_IDS`
- `BUFFER_PINTEREST_BOARD_ID`
- `BUFFER_ORGANIZATION_ID` for local Buffer inspection scripts when needed
- `GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:flamingfoodies.com`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`
- `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=https://flamingfoodies.com/api/admin/google-search-console/callback`
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`

## 6. Redeploy production

After the env vars are saved, redeploy the production deployment so the app picks up the real Supabase config.

For Pinterest specifically:

1. Create a Buffer API key in Buffer Publish.
2. Run `node scripts/inspect-buffer-pinterest.mjs --env-file .vercel/live.env.production` or another env file that contains `BUFFER_API_KEY`.
3. Copy the Pinterest `channelId` into `BUFFER_CHANNEL_IDS` as `pinterest:<channel-id>`.
4. Copy the desired board `serviceId` into `BUFFER_PINTEREST_BOARD_ID`.
5. Redeploy again after those Buffer env values are added.

## 7. Create the first admin

1. Sign in to FlamingFoodies once so your `auth.users` and `profiles` rows exist.
2. Update the username in `supabase/seed.sql` if needed.
3. Run `supabase/seed.sql` in the Supabase SQL Editor.

## 8. Bootstrap the live catalog

1. Sign in as the admin user.
2. Open `/admin`.
3. Use the `Catalog bootstrap` buttons to import recipes, reviews, and merch into Supabase.

This moves the current fallback catalog into the real CMS tables.

## 9. Smoke test production

Verify:

- `/login` magic link flow
- Google and GitHub login if enabled
- `/onboarding` username claim
- `/admin` loads for the seeded admin
- catalog import succeeds
- `/recipes`, `/reviews`, and `/shop` render live content
- `/community/submit` creates a pending submission
- cron endpoints require `Authorization: Bearer <CRON_SECRET>`
- `/admin/automation/agents` shows the live agent registry and recent run ledger
- `/admin/automation/approvals` shows release and newsletter approval queues
- `/admin/newsletter/campaigns` can queue a campaign for approval instead of sending immediately
- `/admin/analytics/search-console` shows the Search Console queue and executor state once OAuth is connected
- `/api/admin/newsletter-digest?mode=send_due` processes only approved due campaigns
- `/api/admin/search-insights` refreshes Search Console recommendations
- `/api/admin/search-insights-executor/cron` rebuilds runtime overlays only from approved recommendations
- `/api/admin/search-performance-evaluator/cron` records delayed keep / escalate / revert verdicts for mature search executor runs
- `/admin/automation/agents` shows the Pinterest distributor as configured only after `BUFFER_API_KEY`, `BUFFER_CHANNEL_IDS`, and `BUFFER_PINTEREST_BOARD_ID` are all live

## 10. Nice-to-have right after cutover

- turn on Kit, the AI provider key, Buffer, and media provider keys
- complete the Google Search Console OAuth callback flow and save the refresh token
- create the first real merch products with live checkout URLs
- add analytics IDs
- replace sample imagery and copy with editorial content
