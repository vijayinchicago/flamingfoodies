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
- queues send approvals instead of sending directly
- processes only approved due campaigns when the send window opens

Why it matters:
- turns one-time visitors into repeat readers
- gives winner content a second traffic channel

Dependencies:
- ConvertKit configuration for live sends

## 6. Search Insights Analyst

What it does:
- reads live Search Console API data
- clusters rising queries and underperforming page intents
- refreshes a durable recommendation queue instead of publishing SEO changes directly

Why it matters:
- keeps the site aligned with the exact searches Google is already testing us on
- turns early impressions into a repeatable SEO backlog instead of one-off guesswork

Dependencies:
- Search Console OAuth connection
- a bounded implementation agent that only applies approved recommendation types

## 7. Search Recommendation Executor

What it does:
- reads only approved and active Search Console recommendations
- applies supported recommendation types through the runtime overlay layer
- routes technical or unsupported items into manual review instead of mutating the site blindly

Why it matters:
- separates search analysis from live mutation
- keeps SEO execution inside a bounded, reversible write surface

Dependencies:
- live Search Console queue data
- runtime overlay targets already modeled in the codebase

## 8. Search Performance Evaluator

What it does:
- reviews prior search executor decisions after a delay
- compares baseline recommendation metrics with the latest Search Console queue
- records keep, escalate, or revert verdicts without rolling anything back automatically

Why it matters:
- closes the loop between "we applied this" and "did it help"
- keeps search autonomy from becoming a one-way write pipeline

Dependencies:
- live Search Console queue data
- automation run ledger entries from the executor

## Current cadence note

The deployed automation stack is no longer just a daily batch.

That means:
- newsletter digest drafting runs weekly
- newsletter due-send checks run hourly
- Search Console analyst sync runs weekly
- Search recommendation execution runs daily
- Search evaluation runs daily
- content publishing, social queueing, growth-loop promotion, and shop refreshes run on their own scheduled cadences in `vercel.json`

## Recommended Operating Model

For a lean launch, the best autonomous stack is:

1. Editorial Autopublisher
2. Pinterest Distributor
3. Growth Loop Promoter
4. Shop Shelf Curator
5. Newsletter Digest Agent
6. Search Insights Analyst
7. Search Recommendation Executor
8. Search Performance Evaluator

That gives FlamingFoodies a closed loop:

1. Generate high-intent content.
2. Publish it automatically.
3. Push it to Pinterest and social.
4. Watch what wins.
5. Re-promote winners.
6. Read search demand and capture rising topics or weak search matches.
7. Feed the strongest traffic and search signals back into the next content cycle.
