# Google Cloud Setup For Search Console Automation

This is the full setup for FlamingFoodies so we can stop exporting Search Console CSVs by hand and let the site pull performance data automatically.

The goal of this setup is:

1. Create a Google Cloud project for the Search Console integration.
2. Enable the Google Search Console API.
3. Create OAuth credentials that let FlamingFoodies read Search Console performance data.
4. Give the correct Google account access to the Search Console property.
5. Hand the final values back to the app so I can wire the callback route, store the refresh token, and automate the recommendation agent.

This now feeds a real two-agent loop in the repo:

- `search-insights-analyst` pulls Search Console data and refreshes the recommendation queue
- `search-recommendation-executor` applies only approved, supported runtime overlays

## The recommended auth model

Use an OAuth client tied to a real Google account that already has access to the Search Console property.

Why this is the best first version:

- it is the most clearly supported setup in Google’s documentation
- it avoids uncertainty around Search Console service-account behavior
- it works well for a small internal automation workflow
- it gives us a stable path to cron-based ingestion once we get a refresh token

## What you will create

You will end this process with:

- one Google Cloud project
- one enabled API: `Google Search Console API`
- one Google Auth Platform application
- one OAuth web client
- one Search Console property we can query
- one Google account authorized to that property

## Before you start

Have these ready:

- the Google account you want to use for Search Console automation
- access to Google Cloud Console
- access to Google Search Console
- control over the `flamingfoodies.com` DNS, if the Domain property is not already verified

Recommended Google account choice:

- the same Google account that already manages or can manage the `flamingfoodies.com` Search Console property

## Part 1: Create the Google Cloud project

1. Open Google Cloud Console:
   - `https://console.cloud.google.com/`
2. At the top, click the project selector.
3. Click `New Project`.
4. Use these values:
   - Project name: `FlamingFoodies Search Automation`
   - Project ID: something close to `flamingfoodies-search-automation`
5. Click `Create`.
6. Wait until the project is created, then switch into it.

Recommended rule:

- keep Search Console automation in its own project instead of mixing it with unrelated Google APIs

## Part 2: Enable the Google Search Console API

1. In the selected project, go to:
   - `APIs & Services` -> `Library`
2. Search for:
   - `Google Search Console API`
3. Open it.
4. Click `Enable`.

What success looks like:

- the API page shows as enabled for the selected project

## Part 3: Set up Google Auth Platform

1. In the left nav, go to:
   - `Google Auth Platform`
2. Click `Get started`
3. Fill in the app basics:
   - App name: `FlamingFoodies Search Automation`
   - User support email: your monitored email
4. Choose audience:
   - `External`

Use `External` unless all of the following are true:

- you have a Google Workspace organization
- the project belongs to that organization
- every person who will ever authorize the app is inside that organization

For most cases here, `External` is the right choice.

5. Leave publishing status in `Testing` for initial setup.
6. Add test users:
   - add the Google account you personally will use during the first auth flow
   - add any backup admin account you may want to use
7. Finish the setup.

Important note:

- Google says test-mode authorizations expire after 7 days.
- That means `Testing` is only for initial setup and proving the flow.
- Once we confirm the integration works, move the app to `In Production` so the refresh token can be relied on by cron jobs.

## Part 4: Create the OAuth client

1. Still inside the same project, go to:
   - `Google Auth Platform` -> `Clients`
2. Click `Create client`
3. Choose:
   - Application type: `Web application`
4. Enter a name:
   - `FlamingFoodies Search Console Worker`

5. Add authorized redirect URIs.

Use this local callback first:

- `http://localhost:3000/api/admin/google-search-console/callback`

Also add this production callback now so we do not need to come back later:

- `https://flamingfoodies.com/api/admin/google-search-console/callback`

If you also use Vercel preview auth testing later, we can add preview URLs separately, but do not add random temporary URLs yet.

6. Click `Create`.
7. Copy and save:
   - Client ID
   - Client secret

Security rule:

- save the client secret somewhere secure immediately
- Google may not show it to you again in the same easy way later

## Part 5: Confirm the Search Console property

The property we want is:

- `sc-domain:flamingfoodies.com`

This is preferred over a URL-prefix property because it covers:

- `https://flamingfoodies.com`
- `https://www.flamingfoodies.com`
- other subdomains if they ever exist

### If the property already exists

1. Open Search Console:
   - `https://search.google.com/search-console`
2. Open the property selector.
3. Confirm you can see a Domain property for:
   - `flamingfoodies.com`
4. Confirm the Google account you plan to use for OAuth can access that property.

### If the property does not exist yet

1. In Search Console, click `Add property`.
2. Choose `Domain`.
3. Enter:
   - `flamingfoodies.com`
4. Google will give you a DNS TXT verification record.
5. Go to your DNS provider.
6. Add the TXT record exactly as Google provided it.
7. Wait for DNS propagation.
8. Return to Search Console and click `Verify`.

What success looks like:

- the Google account you will use for OAuth can open the Domain property and view Performance data

## Part 6: Make sure the correct Google account has access

The Google account used during OAuth must have access to the Search Console property.

If the account does not already have access:

1. Open the property in Search Console.
2. Go to:
   - `Settings` -> `Users and permissions`
3. Click `Add user`
4. Add the Google account you plan to use for the OAuth flow
5. Grant at least:
   - `Full user`

Safer option:

- if this account will be the long-term automation owner, make it an owner-level account you control operationally

## Part 7: Decide when to move from Testing to Production

For the first pass:

- use `Testing` so we can create the client and prove the OAuth flow

After the first successful auth:

- switch the app to `In Production`

Why:

- testing-mode authorizations expire after 7 days
- cron-based automation needs a durable refresh token

Important nuance:

- for personal use, limited-user, or development apps, Google may not require full OAuth verification
- the exact requirement depends on how the requested scopes are classified in the Cloud console
- we are only requesting narrow read access, so this is much lighter than Gmail/Drive-style restricted scopes

## Part 7B: Durable production verification in Google Auth Platform

If Google shows `Access blocked: flamingfoodies.com has not completed the Google verification process`, do this inside the same Google Cloud project before expecting a durable refresh token.

### 1. Open the correct project and app

1. In Google Cloud Console, confirm the selected project is:
   - `autoseo-493713`
2. Go to:
   - `Google Auth Platform`
3. Open the existing app for FlamingFoodies Search automation.

### 2. Complete the Branding page

1. Open:
   - `Google Auth Platform` -> `Branding`
2. Set or confirm:
   - App name: `FlamingFoodies Search Automation`
   - User support email: your monitored email
3. In `App domain`, set:
   - Application home page: `https://flamingfoodies.com`
   - Privacy policy: `https://flamingfoodies.com/privacy`
   - Terms of service: `https://flamingfoodies.com/terms`
4. In `Authorized domains`, add:
   - `flamingfoodies.com`
5. In `Developer contact information`, add the email address where you want Google verification messages sent.
6. Save the page.

Important rule:

- Google requires the homepage, privacy policy, and terms URLs for external production apps.
- Those URLs must live on an authorized domain.

### 3. Make sure the domain is verified by the right Google account

Google's verification flow is strict here.

The Google account doing this step should be both:

- a `Project Owner` or `Project Editor` on the Google Cloud project
- a `Verified owner` of the Search Console property for `flamingfoodies.com`

To confirm that:

1. Open:
   - `https://search.google.com/search-console`
2. Select:
   - `sc-domain:flamingfoodies.com`
3. Go to:
   - `Settings` -> `Users and permissions`
4. Confirm the account you are using appears as a verified owner, not just a normal user.

If it is not a verified owner yet:

1. Add or verify ownership for `flamingfoodies.com` using the DNS TXT method in Search Console.
2. Wait until Search Console shows the account as a verified owner.

Why this matters:

- Google's OAuth verification requires an authorized domain to be verified through Search Console by a project owner/editor account.

### 4. Confirm the OAuth client still matches the app

1. Open:
   - `Google Auth Platform` -> `Clients`
2. Open the web client for FlamingFoodies.
3. Confirm the authorized redirect URI includes:
   - `https://flamingfoodies.com/api/admin/google-search-console/callback`
4. If missing, add it and save.

Optional local URI to keep:

- `http://localhost:3000/api/admin/google-search-console/callback`

### 5. Confirm the requested data scope

1. Open:
   - `Google Auth Platform` -> `Data Access`
2. Confirm the app is requesting exactly the Search Console read-only scope we use in code:
   - `https://www.googleapis.com/auth/webmasters.readonly`
3. Remove any broader or unrelated scopes if they were added by mistake.

Important rule:

- The scopes shown in Google Auth Platform should match what the app actually requests.
- Requesting extra scopes makes verification harder and can trigger rejection.

### 6. Publish the brand and move the app to production

1. Return to:
   - `Google Auth Platform` -> `Branding`
2. If Google shows a `Verify Branding` button, run that first.
3. If the branding result becomes `Ready to publish`, click:
   - `Publish branding`
4. Then go to:
   - `Google Auth Platform` -> `Audience`
5. Set publishing status to:
   - `In production`

Important nuance:

- Branding verification and data-access verification are related, but not identical.
- Google says branding must be published before you request verification for data access scopes.

### 7. Submit the app for data-access verification

1. Open:
   - `Google Auth Platform` -> `Verification Center`
2. Start the verification flow for the production app.
3. When Google asks for scope justification, explain that FlamingFoodies uses Search Console read-only access to:
   - pull site performance data for `flamingfoodies.com`
   - identify queries and pages losing clicks or impressions
   - generate internal SEO recommendations
   - apply only site-owned content improvements
4. Make clear that the app does not request write access and only uses:
   - `https://www.googleapis.com/auth/webmasters.readonly`

Recommended scope justification text:

- `FlamingFoodies uses Search Console read-only access to retrieve performance data for the verified property flamingfoodies.com. The application analyzes queries, pages, clicks, impressions, CTR, and average position to generate internal SEO recommendations and improve site-owned content. Write access is not needed, so the app requests only https://www.googleapis.com/auth/webmasters.readonly.`

### 8. Prepare the demo video before you submit

Google commonly asks for a demo video. Record one before submitting so you do not stall out later.

Your video should show:

1. the FlamingFoodies site
2. the action that starts the Google authorization flow
3. the full OAuth consent screen in English
4. the exact requested scope
5. the resulting admin workflow that uses Search Console data

For this project, show:

- opening `https://flamingfoodies.com/api/admin/google-search-console/auth` while logged in as an admin
- being redirected to Google's consent screen
- the consent screen showing Search Console read-only access
- returning to FlamingFoodies
- the app storing the connection and using Search Console data for automation

### 9. Expect review time and use Testing only as a temporary bridge

While Google reviews the production verification:

- you can keep the app in `Testing` with your Google account added as a test user if you need to keep moving
- but Google says test-user authorizations expire after 7 days
- so Testing is not the final autonomous setup

What success looks like:

- the app is in `In production`
- Branding is published
- Verification Center shows approved or in-progress verification for the requested scope
- the production OAuth flow stops showing the `Access blocked` verification message
- the callback can save a long-lived refresh token for the agent

## Part 8: Values this repo is ready to accept

I already added the placeholders for these in [.env.example](/Users/vijaysingh/apps/flamingfoodies/.env.example:46) and the env schema in [lib/env.ts](/Users/vijaysingh/apps/flamingfoodies/lib/env.ts:42).

These are the values we will eventually store in Vercel:

- `GOOGLE_CLOUD_PROJECT_ID`
- `GOOGLE_SEARCH_CONSOLE_PROPERTY`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET`
- `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI`
- `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN`

Use these values:

- `GOOGLE_CLOUD_PROJECT_ID=<your project id>`
- `GOOGLE_SEARCH_CONSOLE_PROPERTY=sc-domain:flamingfoodies.com`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_ID=<client id>`
- `GOOGLE_SEARCH_CONSOLE_CLIENT_SECRET=<client secret>`
- `GOOGLE_SEARCH_CONSOLE_REDIRECT_URI=http://localhost:3000/api/admin/google-search-console/callback`

Do not set `GOOGLE_SEARCH_CONSOLE_REFRESH_TOKEN` yet.
I will help you generate that after the project and OAuth client are ready.

## Exactly what I need from you after you finish the Google setup

Once you complete Parts 1 through 6, send me these answers:

1. The Google Cloud project ID
2. Whether the Search Console property is already `sc-domain:flamingfoodies.com`
3. The exact Google account email that will be used for OAuth
4. Confirmation that the OAuth web client was created
5. The redirect URI you added for local development

You do not need to paste the client secret into chat if you do not want to.
You can keep it local and I can tell you exactly where to place it.

## What success looks like in the app

Once the env vars are saved and the callback flow succeeds:

1. `/admin/analytics/search-console` shows the connected property `sc-domain:flamingfoodies.com`
2. the weekly analyst sync can populate `search_recommendations`
3. the admin queue can approve, dismiss, or move recommendations to manual review
4. the daily executor can rebuild runtime overlays only from approved supported recommendations

## What I will do after you send that back

After that, I will guide you through:

1. adding the env vars locally or in Vercel
2. running the one-time OAuth authorization flow
3. capturing the refresh token
4. storing the final credentials in Vercel
5. confirming the weekly analyst sync works
6. confirming the executor only applies approved recommendations

## Fast checklist

If you just want the short operational list:

1. Create project `FlamingFoodies Search Automation`
2. Enable `Google Search Console API`
3. In `Google Auth Platform`, create app `FlamingFoodies Search Automation`
4. Audience: `External`
5. Publishing status: `Testing`
6. Add yourself as a test user
7. Create OAuth client `Web application`
8. Add redirect URIs:
   - `http://localhost:3000/api/admin/google-search-console/callback`
   - `https://flamingfoodies.com/api/admin/google-search-console/callback`
9. Confirm the Search Console property is `sc-domain:flamingfoodies.com`
10. Confirm the OAuth Google account can access that property
11. Send me:
   - project ID
   - property status
   - OAuth account email
   - confirmation that the client was created

## References

- Google Cloud API/project setup:
  - https://docs.cloud.google.com/apis/docs/getting-started
- Search Console API overview:
  - https://developers.google.com/webmaster-tools/about
- Search Analytics API auth/scopes:
  - https://developers.google.com/webmaster-tools/v1/searchanalytics/query
- Search Console API pricing:
  - https://developers.google.com/webmaster-tools/pricing
- Search Console API limits:
  - https://developers.google.com/webmaster-tools/limits
- Search Console permissions:
  - https://support.google.com/webmasters/answer/7687615?hl=en
- Search Console domain verification:
  - https://support.google.com/webmasters/answer/9008080?hl=en
- Google Auth Platform setup:
  - https://support.google.com/cloud/answer/15544987?hl=en
- OAuth client creation:
  - https://support.google.com/cloud/answer/15549257?hl=en
- Testing vs production audience behavior:
  - https://support.google.com/cloud/answer/15549945?hl=en
- When verification is not needed:
  - https://support.google.com/cloud/answer/13464323?hl=en
