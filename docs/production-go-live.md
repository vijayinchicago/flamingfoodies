# FlamingFoodies Production Go-Live

This runbook assumes the Vercel project and custom domain already exist.

## 1. Create the Supabase project

1. Create a new Supabase project in the region you want to run production from.
2. Wait for the database to finish provisioning.
3. In the Supabase dashboard, open `Project Settings -> API`.
4. Copy these three values:
   - Project URL
   - `anon` / publishable key
   - `service_role` secret key

## 2. Apply the database schema

Run the SQL files in `supabase/migrations` in this order using the Supabase SQL Editor:

1. `20260403150000_initial_schema.sql`
2. `20260403170000_newsletter_provider_fields.sql`
3. `20260403183000_merch_products.sql`

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
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>`
- `SUPABASE_SERVICE_ROLE_KEY=<service-role-key>`
- `CRON_SECRET=<long-random-secret>`
- `NEXT_PUBLIC_AMAZON_TAG=flamingfoodies-20`

Recommended:

- `CONVERTKIT_API_KEY`
- `CONVERTKIT_API_SECRET`
- `CONVERTKIT_FORM_ID`
- `ANTHROPIC_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `PEXELS_API_KEY`
- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS`

## 6. Redeploy production

After the env vars are saved, redeploy the production deployment so the app picks up the real Supabase config.

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

## 10. Nice-to-have right after cutover

- turn on Kit, Anthropic, Buffer, and media provider keys
- create the first real merch products with live checkout URLs
- add analytics IDs
- replace sample imagery and copy with editorial content
