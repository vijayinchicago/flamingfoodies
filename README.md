# FlamingFoodies

FlamingFoodies is a Next.js 14 App Router project backed by Supabase for auth, content, community, admin workflows, and scheduled automation.

## Local Run

1. Copy `.env.example` to `.env.local`.
2. For a mock-content local run, leave the optional integrations blank.
3. For a real local run, set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
4. Install dependencies with `pnpm install`.
5. Run `pnpm env:check`.
6. Start the app with `pnpm dev`.

## Local Supabase Notes

- Apply the migrations in `supabase/migrations`.
- Run the admin seed in `supabase/seed.sql` after your first profile exists.
- Storage buckets expected by the app are created in the SQL migration:
  - `avatars`
  - `admin-media`
  - `community-media`

## Production Env

Required for a production deploy:
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`

Recommended for the full platform:
- `CONVERTKIT_API_KEY`
- `CONVERTKIT_API_SECRET`
- `CONVERTKIT_FORM_ID`
- `ANTHROPIC_API_KEY`
- `UNSPLASH_ACCESS_KEY`
- `PEXELS_API_KEY`
- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS`

`BUFFER_PROFILE_IDS` uses comma-separated `platform:id` entries, for example:

```env
BUFFER_PROFILE_IDS=instagram:abc123,pinterest:def456,facebook:ghi789
```

## Deploy To Vercel

1. Create the Supabase project.
2. Run the SQL migration and seed the initial admin role.
3. Add all required env vars to Vercel.
4. Run `pnpm env:check:prod` locally against the same env set you plan to use in Vercel.
5. Deploy the app to Vercel.
6. Confirm the cron jobs in `vercel.json` are enabled.
7. Verify these flows in production:
   - login and onboarding
   - admin content publish
   - community submission
   - newsletter signup
   - `/api/admin/publish-scheduled`
   - `/api/admin/social-scheduler`
   - `/api/admin/newsletter-digest`

For the exact production cutover checklist, see `docs/production-go-live.md`.

## Verification Commands

```bash
pnpm typecheck
pnpm test
pnpm build
```

## Current Gaps

- External provider behavior still needs full live-account validation.
- Integration and E2E coverage are still lighter than the original build plan.
- Node 20+ should replace Node 18 before production rollout.
