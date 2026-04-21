# Autonomous Agents

FlamingFoodies can run as a small coordinated set of autonomous agents instead of a manual editorial queue.

Implementation follow-up:

- For the concrete control-plane, approvals, run-ledger, and rollout plan, see [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md).

## 1. Editorial Autopublisher

What it does:
- watches generated recipes, blog posts, and hot sauce reviews
- runs automated QA already built into the generation pipeline
- auto-schedules eligible content for publish without manual approval

Why it matters:
- keeps daily inventory moving live
- turns generation into real search-facing output
- removes the "I forgot to review and publish" bottleneck

Dependencies:
- `auto_publish_ai_content = true`
- working image providers so recipes, blogs, and reviews can clear image QA

## 2. Pinterest Distributor

What it does:
- creates Pinterest social posts for published recipes, blog posts, and reviews
- sends them through Buffer using the Pinterest profile mapping
- gives every new page a second discovery path outside Google

Why it matters:
- Pinterest behaves like a visual search engine for recipes and kitchen ideas
- strong pins can keep sending traffic long after the publish day

Dependencies:
- `BUFFER_ACCESS_TOKEN`
- `BUFFER_PROFILE_IDS` with a `pinterest:<profile_id>` entry or `all:<profile_id>`

## 3. Growth Loop Promoter

What it does:
- reads live traffic, share, and affiliate signals
- identifies winner pages
- re-queues proven pages for social promotion

Why it matters:
- doubles down on what is already working
- makes traffic generation compounding instead of one-shot

Dependencies:
- working telemetry
- Buffer configured for live distribution

## 4. Shop Shelf Curator

What it does:
- adds a fresh daily shop pick
- refreshes the shelf nightly using real affiliate click data
- surfaces the strongest products and exact-link gaps

Why it matters:
- keeps the shop current
- protects affiliate revenue by favoring products people actually click

Dependencies:
- affiliate catalog entries
- exact Amazon product links for the most important products

## 5. Newsletter Digest Agent

What it does:
- builds weekly digest campaigns from published content
- processes scheduled sends when the send window opens

Why it matters:
- turns one-time visitors into repeat readers
- gives winner content a second traffic channel

Dependencies:
- ConvertKit configuration for live sends

## 6. Search Insights Analyst

What it does:
- reads Search Console exports or API snapshots
- clusters rising queries and underperforming page intents
- turns those signals into structured recommendations for page upgrades or new supporting pages

Why it matters:
- keeps the site aligned with the exact searches Google is already testing us on
- turns early impressions into a repeatable SEO backlog instead of one-off guesswork

Dependencies:
- Search Console data feed or a weekly CSV export drop
- a bounded implementation agent that only applies approved recommendation types

## Current cadence note

On the current Vercel Hobby plan, cron jobs are limited to daily schedules.

That means:
- content generation can still run on its normal daily schedule
- stuck AI drafts get a daily reevaluation pass before scheduled publishing
- scheduled publishing runs once per day
- social queueing and Pinterest distribution run once per day

If you later move to Vercel Pro, these agents can be tightened into higher-frequency loops.

## Recommended Operating Model

For a lean launch, the best autonomous stack is:

1. Editorial Autopublisher
2. Pinterest Distributor
3. Growth Loop Promoter
4. Shop Shelf Curator
5. Newsletter Digest Agent
6. Search Insights Analyst

That gives FlamingFoodies a closed loop:

1. Generate high-intent content.
2. Publish it automatically.
3. Push it to Pinterest and social.
4. Watch what wins.
5. Re-promote winners.
6. Read search demand and capture rising topics or weak search matches.
7. Feed the strongest traffic and search signals back into the next content cycle.
