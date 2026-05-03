# Flame Club — MailerLite Setup (step by step)

Follow this top to bottom. The codebase already syncs subscribers to
MailerLite the moment you set the env vars in step 9 — until then, signups
land in Supabase only. The behavioral loop (welcome → tier rewards) only
fires once steps 6–11 are complete.

This doc replaces the older Kit setup doc; you can delete
`flame-club-kit-setup.md` once MailerLite is live.

---

## Step 1 — Create your MailerLite account

1. Go to https://www.mailerlite.com and click **Sign up free**
2. Use a real business email (not Gmail), e.g. `hello@flamingfoodies.com` — this becomes harder to change later
3. Fill in:
   - Company name: `FlamingFoodies`
   - Website: `https://flamingfoodies.com`
   - Industry: Food & Beverage
   - List size: `0–1,000`
4. Confirm the account verification email MailerLite sends you

**Why this matters:** MailerLite manually reviews new accounts (usually within 24 hours) before you can send any email. Sign up *now* even if you're not ready to launch — start the review clock.

---

## Step 2 — Approve the account (the gotcha most people miss)

After signup, MailerLite shows a **"Account approval"** banner. Click it.

You'll fill out:
- What kind of content you'll send (recipes, hot sauce reviews, weekly newsletter)
- Where your subscribers come from (organic site signups, paid Google Ads)
- How you collect emails (single opt-in via website form)

Submit and wait 24 hours. Until approved, **no emails will send** — not even tests. This is MailerLite's anti-spam gate. Don't skip it.

---

## Step 3 — Set sender info, single opt-in, and physical address

Once approved, configure these:

**Account → Profile → Domains**
- Add `flamingfoodies.com`
- Click **Authenticate** → MailerLite gives you DNS records (DKIM + SPF + Return-Path)
- Add the records to your domain DNS (Cloudflare, Vercel DNS, wherever)
- Wait ~1 hour, then click **Verify** in MailerLite. All three should turn green.

**Why:** unauthenticated sends will land in spam. This is non-negotiable for paid traffic.

**Account → Profile → Account info**
- Sender name: `FlamingFoodies` (or `Vijay at FlamingFoodies` for warmer cold-traffic feel)
- From email: must use your authenticated domain, e.g. `vijay@flamingfoodies.com`
- Reply-to: a real, monitored inbox
- Physical address: required by CAN-SPAM. Real address or PO Box. MailerLite injects this into every email footer automatically.

**Subscribers → Settings → Double opt-in**
- Toggle **OFF**. Confirm the warning popup.
- This makes it single opt-in. Required so paid-ad signups don't have to click a confirmation.

---

## Step 4 — Create the Groups

In MailerLite, **Groups** = Kit's "Tags." Each subscriber can belong to many groups. Our system uses 7 groups.

**Subscribers → Groups → Create new group** — create each of these. Spelling and casing matter — the codebase writes these names verbatim and they're keyed in your env var (step 9).

Segmentation groups (the four newsletter lanes already used by the existing signup forms across the site):

| Group name | Internal key |
| --- | --- |
| `Flame Club — Weekly Roundup` | `weekly-roundup` | 186408219744142951
| `Flame Club — Recipe Club` | `recipe-club` | 186408230235145839
| `Flame Club — Hot Sauce Shelf` | `hot-sauce-shelf` | 186408240792208520
| `Flame Club — Cook / Shop` | `cook-shop` | 186408251815888443

Referral milestone groups (joined automatically by our app when a subscriber hits the threshold):

| Group name | Internal key |
| --- | --- |
| `Flame Club — Referrer Tier 1` | `referrer-tier-1` | 186408269770655585
| `Flame Club — Referrer Tier 2` | `referrer-tier-2` | 186408274718885253
| `Flame Club — Referrer Tier 3` | `referrer-tier-3` | 186408279286482593

After each group is created, **copy the Group ID from the URL** (it's the long number in the URL when you open the group's page). You'll paste these into the env var in step 9.

---

## Step 5 — Add the custom field for referral_token

Subscribers → Fields → **+ Create field**

- Name: `Referral token`
- Type: `Text`
- Field key (alias): `referral_token` ← **must be exactly this string**

This field receives each subscriber's unique share-link token from our app. The welcome email and reward emails reference it as `{$referral_token}` to build the share URL.

---

## Step 6 — Generate your API key

Integrations → MailerLite API → **Generate new token**

- Token name: `flamingfoodies-production`
- Permissions: leave default (full access)
- Copy the token now — MailerLite shows it once, then masks it forever. If you lose it, you generate a new one (no harm).

---

## Step 7 — Create the Welcome Automation

Automation → **Create automation** → **Build from scratch**

- Name: `Welcome — Flame Club`
- **Trigger:** `When a subscriber joins a group`
- **Group:** select `Flame Club — Weekly Roundup` (this is the default group every signup joins)
- **Steps:**
  1. **Email** — paste Email #1 from [`flame-club-welcome-sequence.md`](./flame-club-welcome-sequence.md). Subject + content as documented. Send: **immediately** (no delay).
  2. **Delay** — `3 days`
  3. **Email** — paste Email #2 from the same doc.
  4. **Delay** — `4 days` (so total time from signup is 7 days)
  5. **Email** — paste Email #3 from the same doc.
- Workflow settings:
  - Allow re-entry: **No** (a subscriber should not get the welcome series twice)
- Save → **Start** the automation (it stays in Draft until you start it — automations in Draft do not fire)

---

## Step 8 — Create the three Reward Automations

Repeat for each tier. Same pattern — single email triggered by joining a group.

**Reward — Tier 1 (Pepper Dossier)**
- Trigger: `Subscriber joins a group` → `Flame Club — Referrer Tier 1`
- Step 1 — Email: paste Tier 1 email from [`flame-club-referral-rewards.md`](./flame-club-referral-rewards.md)
- Allow re-entry: **No**
- **Start** the automation

**Reward — Tier 2 (Ten-Bottle Shelf)**
- Trigger: `Subscriber joins a group` → `Flame Club — Referrer Tier 2`
- Step 1 — Email: paste Tier 2 email from the same doc
- Allow re-entry: **No**
- **Start**

**Reward — Tier 3 (Festival Planner + VIP)**
- Trigger: `Subscriber joins a group` → `Flame Club — Referrer Tier 3`
- Step 1 — Email: paste Tier 3 email from the same doc
- Allow re-entry: **No**
- **Start**

> Each one must show **status: Running** in the Automation list. If it says Draft, no emails fire.

---

## Step 9 — Set environment variables in Vercel

In Vercel → Project → Settings → Environment Variables, add for **Production** (and Preview if you want to test there):

```
MAILERLITE_API_KEY=ml_xxxxxxxxxxxxxxxxxxxxxx
MAILERLITE_GROUPS={"weekly-roundup":"123456","recipe-club":"123457","hot-sauce-shelf":"123458","cook-shop":"123459","referrer-tier-1":"123460","referrer-tier-2":"123461","referrer-tier-3":"123462"}
```

Replace each `123456` placeholder with the real Group ID from step 4.
**The JSON keys must match the internal keys exactly** (the right-hand column in step 4's table).

After saving both vars, **redeploy** so the new env values are picked up. The
flag `flags.hasMailerLite` in [lib/env.ts:88](../lib/env.ts#L88) flips on once
`MAILERLITE_API_KEY` is set.

You can leave the old `CONVERTKIT_*` vars in place or delete them — the code
prefers MailerLite when both are configured ([lib/services/newsletter.ts:443](../lib/services/newsletter.ts#L443)).

---

## Step 10 — Run the Supabase migration

If not already applied, run against production:

```
20260502120000_newsletter_referrals.sql
```

This adds `referral_token`, `referrer_token`, `referral_count`, `referral_tier` columns and creates the `newsletter_referrals` audit table.

---

## Step 11 — End-to-end smoke test

Do this **before** spending any ad dollars.

1. From an incognito window, visit `https://flamingfoodies.com/flame-club`
2. Sign up with a real email you control (`you+test1@gmail.com`)
3. Verify the redirect lands on `/flame-club/thanks?token=...` and shows the share link
4. Open MailerLite → Subscribers — confirm `you+test1@gmail.com` appears with the `Flame Club — Weekly Roundup` group attached and the `referral_token` custom field populated
5. Confirm welcome email #1 arrives within 2 minutes
6. From a second incognito window, click the share link from step 3 — verify it sets `?ref=TOKEN` on `/flame-club`
7. Sign up that second window with another real email (`you+test2@gmail.com`)
8. In Supabase, query `newsletter_subscribers` — verify `referral_count = 1` on test1 and `referrer_token` is set on test2
9. Repeat with two more test emails (`you+test3` and `you+test4`). After the 3rd referee, test1 should:
   - Have `referral_tier = 1` and `referrer-tier-1` in their `tags` column (Supabase)
   - Be added to the `Flame Club — Referrer Tier 1` group in MailerLite
   - Receive the Pepper Dossier reward email within 2 minutes

If anything fails:

| Symptom | Most likely cause |
| --- | --- |
| Subscriber shows in Supabase but not MailerLite | `MAILERLITE_API_KEY` not deployed, or account not yet approved (step 2) |
| Subscriber in MailerLite but not in any group | `MAILERLITE_GROUPS` JSON malformed, or group keys don't match |
| Welcome email never arrives | Welcome Automation in Draft (not Running), or domain not authenticated (step 3) |
| Reward email never fires | Tier Automation in Draft, or wrong group selected as trigger |
| Subscriber stuck in spam | DKIM/SPF not green in step 3 |

---

## Step 12 — Produce the three reward downloads

Each reward email links to a downloadable. You need:

- **Tier 1 — The Pepper Dossier** (40-page printable cheat sheet)
- **Tier 2 — The Ten-Bottle Starter Shelf** (curated bottle list with affiliate links)
- **Tier 3 — VIP Festival Planner** (US festival guide)

Host them at unguessable URLs (Vercel Blob with a long random path is easiest, or a private Notion page with public-share-link). Paste the URLs into the matching `{{ TIER X REWARD URL }}` slots in [`flame-club-referral-rewards.md`](./flame-club-referral-rewards.md) before publishing those automations.

Until the PDFs exist: change the link text in each reward email to *"Coming this week — I'll email it the moment it's live"* and ship them on a deadline. Do not let people earn a reward and then silently drop it; that kills trust faster than any other newsletter mistake.

---

## Step 13 — Optional: turn off MailerLite branding

On the free plan, MailerLite injects a small "Powered by MailerLite" link into every email footer. You can't remove this on free — but you can move past it once you upgrade later. For now, ignore it. It does not hurt deliverability or signups in any meaningful way.

---

## What you can ignore in MailerLite's onboarding

MailerLite's checklist will nag you about:

- **Create a landing page** — skip; we have `/flame-club` on our own domain
- **Embed a form on your site** — skip; we use the API directly
- **Send your first campaign (Broadcast)** — skip for now; the welcome Automation is your first real send. Broadcasts are for future weekly digest sends if/when you wire that up.
- **Connect your store** — skip; not relevant
- **Connect Facebook Lead Ads** — skip
