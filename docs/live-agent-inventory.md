# Live Agent Inventory

This document is the technical inventory of the FlamingFoodies automation stack that is live today.

Use it when you want to answer:

- which agents are running
- what their technical names are
- which routes and schedules drive them
- how the lanes are orchestrated together

This complements:

- [docs/autonomous-agents.md](./autonomous-agents.md) for the operating vision
- [docs/autonomous-system-governance-plan.md](./autonomous-system-governance-plan.md) for policy, guardrails, approvals, and rollout

## Short Answer

As of May 9, 2026, FlamingFoodies has:

- 18 enabled first-class agents in the live `automation_agents` registry
- 3 additional cron-driven support jobs that exist in production but are not yet modeled as first-class live agents
- 1 disabled legacy registry entry: `brand-monitor`

The shared control plane is built around:

- `automation_agents`
- `automation_runs`
- `automation_approvals`
- `automation_evaluations`

Core orchestration inputs come from:

- `vercel.json` cron routes
- protected `/api/admin/*` automation routes
- admin manual triggers in `/admin/automation/trigger`

## Model Provider Context

The agent system and the model provider are not the same thing.

- The control plane, orchestration, approvals, QA gates, run ledger, and schedules are custom-built in this repo.
- Some lanes are AI-backed and currently use the Anthropic Claude API.
- Many other lanes are not meaningfully "Claude agents" at all. They are bounded cron workers, evaluators, policy gates, or deterministic support jobs.

### What Is Claude-Backed Today

In the current repo, Anthropic is the live model-provider layer used by several generation and research paths, including:

- editorial generation and AI draft reevaluation
- festival discovery
- pepper discovery
- brand discovery
- tutorial generation
- some newsletter digest drafting
- catalog / product classification helpers

At the repo level, the AI-backed dependency is represented by:

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `flags.hasAnthropic` in [lib/env.ts](/Users/vijaysingh/apps/flamingfoodies/lib/env.ts:1)

### What Is Not Claude-Dependent

These lanes are better described as custom automation workers than Claude agents:

- `prepublish-qa`
- `search-recommendation-executor`
- `growth-loop-promoter`
- `content-shop-sync`
- evaluator lanes such as editorial, social, shop, and search performance evaluators
- approval, cap, pause, rollback, and run-ledger behavior in the control plane

### If We Were Not Using Claude

The control plane could stay the same and the model-backed lanes could be swapped to:

- OpenAI models
- Google Gemini models
- Meta / open-weight models such as Llama
- Mistral or another API model provider
- deterministic code or heuristics for lanes that do not truly need an LLM

The correct mental model is:

- `agent` = workflow + tools + policy + state + triggers
- `model` = one component used inside some of those workflows

## First-Class Live Agents

| Agent ID | Human Name | Class | Main Trigger / Route | Cadence |
| --- | --- | --- | --- | --- |
| `editorial-autopublisher` | Editorial autopublisher | `bounded_live` | composite lane: `/api/admin/generate`, `/api/admin/reevaluate-ai-drafts`, `/api/admin/publish-scheduled` | generation windows + daily publish checks |
| `prepublish-qa` | Prepublish QA | `internal_support` | `/api/admin/prepublish-qa` | daily before publish |
| `editorial-performance-evaluator` | Editorial performance evaluator | `internal_support` | `/api/admin/editorial-performance-evaluator/cron` | daily |
| `pinterest-distributor` | Pinterest distributor | `external_send` | `/api/admin/social-scheduler` | daily |
| `growth-loop-promoter` | Growth loop promoter | `bounded_live` | `/api/admin/growth-loop` | daily |
| `social-distribution-evaluator` | Social distribution evaluator | `internal_support` | `/api/admin/social-distribution-evaluator/cron` | daily |
| `shop-shelf-curator` | Shop shelf curator | `bounded_live` | composite lane: merch generation + `/api/admin/shop-refresh` | daily new pick + nightly refresh |
| `shop-performance-evaluator` | Shop performance evaluator | `internal_support` | `/api/admin/shop-performance-evaluator/cron` | daily |
| `newsletter-digest-agent` | Newsletter digest agent | `external_send` | `/api/admin/newsletter-digest?mode=autonomous_friday` | weekly digest + daily due-send checks |
| `search-insights-analyst` | Search insights analyst | `draft_only` | `/api/admin/search-insights` | weekly |
| `search-recommendation-executor` | Search recommendation executor | `bounded_live` | `/api/admin/search-insights-executor/cron` | daily |
| `search-performance-evaluator` | Search performance evaluator | `internal_support` | `/api/admin/search-performance-evaluator/cron` | daily |
| `festival-discovery` | Festival discovery | `draft_only` | `/api/admin/festival-discovery` | nightly |
| `pepper-discovery` | Pepper discovery | `draft_only` | `/api/admin/pepper-discovery` | weekly |
| `brand-discovery` | Brand discovery | `draft_only` | `/api/admin/brand-discovery` | weekly |
| `release-monitor` | Release monitor | `approval_required` | `/api/admin/release-monitor` | weekly |
| `tutorial-generator` | Tutorial generator | `draft_only` | `/api/admin/tutorial-generate` | weekly |
| `content-shop-sync` | Content shop sync | `internal_support` | `/api/admin/content-shop-sync` | daily |

## Additional Live Cron Jobs Not Yet Registered As First-Class Agents

These are real production jobs, but they are not yet seeded as first-class rows in the live `automation_agents` registry.

| Job | Route | Cadence | Notes |
| --- | --- | --- | --- |
| `mailerlite-stats-collector` | `/api/admin/mailerlite-stats` | daily | newsletter reporting support |
| `subscriber-sync-reconciler` | `/api/admin/subscriber-reconcile` | weekly | subscriber sync support |
| `referral-attribution-evaluator` | `/api/admin/referral-evaluator` | weekly | referral loop evaluation support |

## Disabled Legacy Registry Entry

| Agent ID | Name | Status | Notes |
| --- | --- | --- | --- |
| `brand-monitor` | Brand monitor (legacy) | disabled | legacy approval-required lane, not part of the active stack |

## Current Cron Inventory

These are the production schedules currently declared in `vercel.json`.

### Editorial

- `/api/admin/generate?type=recipe&qty=3` — `0 6 * * *`
- `/api/admin/generate?type=blog_post&qty=1` — `0 7 * * *`
- `/api/admin/generate?type=review&qty=1` — `0 8 * * 1,4`
- `/api/admin/generate?type=recipe&qty=1&profile=hot_sauce_recipe` — `0 9 * * 1`
- `/api/admin/reevaluate-ai-drafts` — `45 17 * * *`
- `/api/admin/prepublish-qa` — `55 17 * * *`
- `/api/admin/publish-scheduled` — `0 18 * * *`
- `/api/admin/editorial-performance-evaluator/cron` — `45 18 * * *`

### Social And Growth

- `/api/admin/growth-loop` — `30 18 * * *`
- `/api/admin/social-scheduler` — `15 19 * * *`
- `/api/admin/social-distribution-evaluator/cron` — `45 20 * * *`

### Shop And Commerce

- `/api/admin/generate?type=merch_product&qty=1` — `0 11 * * *`
- `/api/admin/content-shop-sync` — `0 12 * * *`
- `/api/admin/shop-refresh` — `30 23 * * *`
- `/api/admin/shop-performance-evaluator/cron` — `30 0 * * *`

### Newsletter And Audience

- `/api/admin/newsletter-digest?mode=autonomous_friday` — `0 13 * * 5`
- `/api/admin/mailerlite-stats` — `0 14 * * *`
- `/api/admin/subscriber-reconcile` — `0 11 * * 0`
- `/api/admin/referral-evaluator` — `0 12 * * 1`

### Search / SEO

- `/api/admin/search-insights` — `30 12 * * 1`
- `/api/admin/search-insights-executor/cron` — `0 13 * * *`
- `/api/admin/search-performance-evaluator/cron` — `30 13 * * *`

### Discovery / Backlog Growth

- `/api/admin/festival-discovery` — `0 2 * * *`
- `/api/admin/pepper-discovery` — `0 3 * * 1`
- `/api/admin/brand-discovery` — `0 4 * * 1`
- `/api/admin/release-monitor` — `15 4 * * 1`
- `/api/admin/tutorial-generate` — `0 5 * * 3`

## Orchestration By Lane

### 1. Editorial Lane

Flow:

1. discovery and generation create drafts or scheduled content
2. `/api/admin/reevaluate-ai-drafts` revisits AI drafts that may now pass
3. `prepublish-qa` rechecks scheduled rows shortly before publish
4. `/api/admin/publish-scheduled` reruns the same QA inline as a hard fail-safe
5. passing items publish
6. `editorial-performance-evaluator` judges prior publish decisions later

Important rule:

- post-publish evaluators are support loops
- they are not substitutes for the prepublish gate

### 2. Social And Growth Lane

Flow:

1. published pages create or qualify for social posts
2. `growth-loop-promoter` finds winner pages and re-queues them
3. `pinterest-distributor` sends through Buffer via `/api/admin/social-scheduler`
4. `social-distribution-evaluator` judges those sends later

### 3. Shop / Commerce Lane

Flow:

1. merch generation and catalog refresh keep inventory moving
2. `content-shop-sync` refreshes internal content-to-product signals
3. `shop-shelf-curator` keeps the shelf fresh and ranked
4. `shop-performance-evaluator` judges prior shelf decisions from click data

### 4. Search / SEO Lane

Flow:

1. `search-insights-analyst` syncs Search Console data and writes recommendations
2. approvals and bounded recommendation states determine what is actionable
3. `search-recommendation-executor` applies only supported bounded changes
4. `search-performance-evaluator` records keep / escalate / revert verdicts later

### 5. Discovery / Backlog Lane

Flow:

1. `festival-discovery`, `pepper-discovery`, `brand-discovery`, and `tutorial-generator` create draft-only backlog inventory
2. `release-monitor` is stricter and stops in approval instead of publishing live
3. editorial review and later publish systems decide what becomes public

## Control Plane And Operator Surfaces

The system is operated through:

- `/admin/automation/agents`
- `/admin/automation/runs`
- `/admin/automation/approvals`
- `/admin/automation/trigger`
- `/admin/automation/schedule`

The most important internal tables are:

- `automation_agents`
- `automation_runs`
- `automation_approvals`
- `automation_evaluations`

## How To Answer "Which Agents Are You Using?"

### Short Business Answer

"We run a bounded multi-agent content and growth system. The main live agents are editorial autopublishing, prepublish QA, Pinterest distribution, growth-loop promotion, shop curation, newsletter digesting, Search Console analysis and execution, plus evaluator loops that judge editorial, social, shop, and SEO outcomes after the fact."

### Short Technical Answer

"We use a custom Next.js + Supabase control plane with cron-driven support agents. The agents are registered in an `automation_agents` table, run through protected `/api/admin/*` routes, log into `automation_runs`, and are orchestrated by Vercel cron plus admin-triggered manual runs. The main technical agent IDs are `editorial-autopublisher`, `prepublish-qa`, `pinterest-distributor`, `growth-loop-promoter`, `shop-shelf-curator`, `newsletter-digest-agent`, `search-insights-analyst`, `search-recommendation-executor`, and their evaluator/support lanes."

### More Detailed Technology-Stack Answer

"The agent system is not an off-the-shelf agent framework. It is a custom bounded automation stack built in Next.js App Router on Vercel, with Supabase as the control-plane database. Orchestration comes from Vercel cron routes, protected admin APIs, and manual operator triggers. Each lane has a technical agent ID, a risk class, an autonomy mode, caps and pause controls, a run ledger, and in some cases approvals and evaluator loops. External-send lanes integrate with Buffer, Pinterest, MailerLite, and newsletter delivery tooling; research and generation lanes use AI-backed draft creation; search lanes use Google Search Console data."

## One Honest Caveat

If someone asks whether this is a "fully autonomous website," the honest answer is no.

It is better described as:

- a bounded autonomous publishing and growth system
- with real live agent loops
- explicit guardrails
- approval gates for higher-risk lanes
- evaluator loops for delayed judgment

That is more accurate than claiming a fully unattended self-governing system.
