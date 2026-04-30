# Master Rebuild Spec

Use this as the canonical handoff file when the goal is:

- build a new niche site that follows the FlamingFoodies operating model
- reproduce the same bounded-autonomy architecture in a different niche
- hand a fresh repo to an AI coding agent and have it build a production-grade site, even before optional third-party tools are configured

This is not the same as exact disaster recovery for FlamingFoodies itself.

- For exact same-site recovery, also use [docs/disaster-recovery-rebuild-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/disaster-recovery-rebuild-playbook.md).
- For provider-by-provider setup, also use [docs/ecosystem-inventory-and-recovery-matrix.md](/Users/vijaysingh/apps/flamingfoodies/docs/ecosystem-inventory-and-recovery-matrix.md).
- For the phased prompt-driven build flow, also use [docs/niche-site-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/niche-site-playbook.md).

## What "Fully Up And Running" Means

For a brand-new niche clone, "fully up and running" means:

- the public site is complete, coherent, and navigable
- the admin console exists and the core workflows are usable
- the database schema, seed data, and automation control plane are live
- cron routes and automation lanes exist and run safely
- schema changes and automation code can survive a one-deploy migration lag without hard-crashing core lanes
- optional external integrations degrade gracefully when not configured
- missing providers show `needs_config` states instead of breaking pages or jobs
- the site can launch with core infrastructure only, then layer on providers later

It does not mean the package can magically recreate:

- live provider credentials
- account ownership in external dashboards
- production env secrets
- historical database rows from another project
- storage objects from another project

## Minimum Inputs For A New Clone

Before using this spec in a new repo, define:

| Input | Why it matters |
| --- | --- |
| `site_name` | Public brand, metadata, footer, auth branding |
| `domain` | Canonical URLs, auth callbacks, Search Console property |
| `tagline` | Hero copy and metadata support |
| `niche` | Determines content model, taxonomy, and discovery lanes |
| `audience` | Shapes tone, onboarding, quiz framing, and product guidance |
| `primary_verticals` | Usually 5-8 content families |
| `core_entities` | The evergreen nouns in the niche: brands, ingredients, categories, tools, events, etc. |
| `monetization_plan` | Amazon, merchant pages, affiliate networks, ads, newsletter |
| `optional_integrations` | Search Console, Buffer, Pinterest, ConvertKit, AdSense, Unsplash, Pexels, etc. |

## Portable Package Contents

If you want the strongest possible handoff, copy this file plus these companions into the new repo:

| File | Role |
| --- | --- |
| [docs/master-rebuild-spec.md](/Users/vijaysingh/apps/flamingfoodies/docs/master-rebuild-spec.md) | Canonical architecture and acceptance criteria |
| [docs/niche-site-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/niche-site-playbook.md) | Stepwise build prompts and implementation pacing |
| [docs/autonomous-system-governance-plan.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-system-governance-plan.md) | Autonomy model, agent topology, and guardrails |
| [docs/editorial-style-guide.md](/Users/vijaysingh/apps/flamingfoodies/docs/editorial-style-guide.md) | Tone, trust, and content quality expectations |
| [docs/disaster-recovery-rebuild-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/disaster-recovery-rebuild-playbook.md) | Restore order and parity mindset |
| [docs/ecosystem-inventory-and-recovery-matrix.md](/Users/vijaysingh/apps/flamingfoodies/docs/ecosystem-inventory-and-recovery-matrix.md) | External provider inventory and setup checklist |

If you can only copy one file, copy this one. It is the most self-contained.

## Non-Negotiable Architecture

### 1. Stack

Build with the same architectural shape:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase for database, auth, and storage
- Vercel for hosting and cron execution
- AI-provider-backed automation and generation lanes

The exact framework minor versions may move over time, but the architecture should stay API-compatible with this shape.

### 2. Public Site Model

Every clone should have:

- a strong homepage with editorial positioning, fast search, and shopper entry points
- evergreen editorial content
- commercial review content
- evergreen entity hubs
- comparison and gift-intent landing pages
- a search page
- a quiz or guided onboarding path
- a shop shelf
- trust pages: `about`, `contact`, `affiliate-disclosure`, `privacy`, `terms`

In FlamingFoodies, these appear as routes such as:

- `/`
- `/recipes`
- `/reviews`
- `/blog`
- `/shop`
- `/search`
- `/quiz`
- `/brands`
- `/peppers`
- `/festivals`
- `/guides`
- `/how-to`
- `/seasonal`
- `/new-releases`
- `/hot-sauces/compare`

For another niche, preserve the route pattern even if the nouns change.

### 3. Admin Surface

Every clone should ship with a real operator console, not just hidden cron routes.

Required admin areas:

- `/admin`
- `/admin/content/*`
- `/admin/automation/agents`
- `/admin/automation/runs`
- `/admin/automation/approvals`
- `/admin/automation/trigger`
- `/admin/social/queue`
- `/admin/social/history`
- `/admin/newsletter/campaigns`
- `/admin/settings/general`
- `/admin/settings/affiliates`
- `/admin/analytics/*`

If a feature is disabled because a provider is absent, the page should still render and explain the missing config.

### 4. Database And Control Plane

The system must include:

- content tables for each vertical
- `profiles`
- `page_views`
- `site_settings`
- affiliate click tracking
- social queue/history tables
- newsletter subscriber/campaign tables
- search insights/recommendation tables
- automation run ledger
- automation approvals
- automation evaluations

The control plane is a first-class requirement, not a nice-to-have. Every meaningful agent action must be inspectable later.

### 5. Bounded Autonomy Model

Do not build an unbounded "AI autopilot."

Every lane should be classified into one of these modes:

- `draft_only`
- `approval_required`
- `bounded_live`
- `external_send`
- `internal_support`

Every lane should also carry a risk class and a clear operator-visible purpose.

The system should support:

- pause controls
- approval queues
- delayed evaluator verdicts
- audit visibility
- graceful rollback/escalation paths

### 6. Automation Lane Pattern

The FlamingFoodies operating model currently uses 17 lanes. New clones should preserve the pattern even if names change:

| Lane archetype | Role |
| --- | --- |
| Editorial autopublisher | Publishes approved/generated draft content into live inventory |
| Editorial performance evaluator | Judges live editorial decisions after a delay |
| Social distributor | Pushes selected content to social destinations through a provider like Buffer |
| Growth loop promoter | Requeues proven winners for additional promotion |
| Social distribution evaluator | Judges the outcomes of prior social sends |
| Shop shelf curator | Refreshes and re-ranks affiliate inventory |
| Shop performance evaluator | Judges prior shelf decisions using click data |
| Newsletter digest agent | Builds newsletters and stops at approval or send windows |
| Search insights analyst | Pulls search data and creates a structured backlog |
| Search recommendation executor | Applies only approved bounded SEO changes |
| Search performance evaluator | Judges prior search changes |
| Discovery lane 1 | Finds niche-specific entities/events/topics as drafts |
| Discovery lane 2 | Finds a second evergreen entity class as drafts |
| Brand discovery | Expands the commercial/entity graph as drafts |
| Release monitor | Detects launches or news and queues approval proposals |
| Tutorial generator | Creates draft tutorial/how-to inventory |
| Prepublish QA support worker | Rechecks scheduled editorial drafts and blocks weak items before live publish |
| Content-shop sync | Feeds internal commerce signals from editorial coverage |

For a non-food niche, adapt the nouns while keeping the loop structure.

### 7. Cron Surface

The live architecture should include scheduled entry points for:

- content generation
- prepublish QA checks shortly before any scheduled publish lane
- publish-scheduled checks
- evaluator passes
- social queueing and distribution
- shop refresh
- newsletter digest creation and due-send checks
- search insights sync and executor pass
- discovery scans
- release monitoring
- tutorial generation

The exact times may change per niche, but the cadence categories should remain.

### 8. Monetization Model

The site should support:

- affiliate commerce via Amazon tag and merchant links
- exact product links when known
- search-result fallback links when exact resolution is not safe
- honest merchant-aware CTA labeling
- display ads as an optional feature gate
- newsletter capture and later monetization loops

Do not pretend every commerce destination is Amazon if it is not.

### 9. Trust And Editorial Standards

Every clone should:

- present a real methodology and editorial workflow
- clearly label affiliate relationships
- prefer brand/editorial bylines over personal names unless explicitly requested
- avoid fake personal authority claims
- show related reading and recirculation on detail pages
- make beginner-safe paths visible, not just expert paths

### 10. Prepublish Editorial QA

Scheduled editorial content must pass a dedicated prepublish QA gate before it can go live.

Required behavior:

- generation and discovery lanes can create drafts or scheduled drafts
- a prepublish QA stage must validate scheduled recipes, articles, reviews, or equivalent editorial rows before auto-publish
- failing rows must move to `needs_review`
- failing rows must persist `qa_issues` so operators can see why the row was blocked
- the live publish lane must rerun or enforce the same QA gate inline as a fail-safe even if the standalone prepublish worker did not run first
- post-publish loops such as visual QA or performance evaluators are support systems, not substitutes for the prepublish gate

### 11. Graceful Degradation Rules

The site must remain stable when optional providers are missing.

If these are absent, the system should degrade without breaking:

- Buffer / Pinterest
- ConvertKit
- Search Console
- AdSense
- GA4 / Clarity / Plausible
- Unsplash / Pexels
- Skimlinks
- Upstash

Expected behavior when absent:

- env validation still passes for a minimal-core launch profile
- admin pages explain missing config
- agents show `needs_config`
- no cron route crashes because a provider secret is missing
- no critical lane assumes a brand-new optional column or enum is already present at runtime without a compatibility fallback or an explicit deploy-order note
- public pages still render correctly

## Build Order

When using this file to create a new site, build in this order:

1. Define the niche strategy, taxonomy, and monetization model.
2. Set up the Next.js/Tailwind/Supabase/Vercel foundation.
3. Create the core public IA and design system.
4. Create content types, seed data, and Supabase migrations.
5. Build detail/index pages for the main verticals.
6. Build the admin console and settings surfaces.
7. Build the automation control plane tables, registry, and status logic.
8. Add cron routes and the first safe automation lanes.
9. Add monetization surfaces, shop shelf logic, and affiliate reporting.
10. Add evaluator loops and approval flows.
11. Add optional provider integrations behind graceful feature detection.
12. Add parity capture and smoke-check tooling.

## Definition Of Done

Treat the build as complete only when all of these are true:

- `pnpm build` succeeds
- the homepage and core public hubs render
- at least 3 major content verticals have real seed inventory
- the shop shelf is populated
- the quiz or guided onboarding flow works
- the admin dashboard loads
- automation agents are listed with accurate readiness states
- cron routes exist and are authorization-protected
- scheduled editorial drafts must fail safely into `needs_review` with persisted `qa_issues` instead of bypassing QA and publishing live
- optional providers are absent without causing runtime failures
- the release candidate is deployed from a clean committed snapshot, not an unrelated dirty worktree
- at least one representative automation route is smoke-tested after deploy with real production auth
- affiliate disclosure and trust pages exist
- a parity-pack capture can be generated for the new site

## What To Exclude From The Portable Package

Do not bake these into the reusable package:

- production secrets
- provider refresh tokens
- live Buffer org IDs from another property
- live Pinterest board IDs from another property
- Search Console refresh tokens from another property
- ConvertKit audience data from another property
- Supabase database exports from another property

Those belong in environment storage and provider dashboards, not in the reusable build spec.

## New-Project Kickoff Prompt

Paste this into a new AI coding session after copying this file into the new repo:

```text
Read `docs/master-rebuild-spec.md` and use it as the primary source of truth.

We are building a new niche site that follows the FlamingFoodies operating model:
- bounded-autonomy content system
- Next.js + TypeScript + Tailwind + Supabase + Vercel architecture
- strong public editorial + commerce site
- real admin console
- automation control plane with run ledger, approvals, and evaluations
- graceful degradation when optional providers are not configured

Inputs for this new project:
- Site name: [SITE NAME]
- Domain: [DOMAIN]
- Tagline: [TAGLINE]
- Niche: [NICHE]
- Audience: [AUDIENCE]
- Core verticals: [VERTICALS]
- Core entities: [ENTITIES]
- Monetization plan: [MONETIZATION PLAN]
- Optional providers for phase 1: [LIST OR "none yet"]

Build the site end to end in the current repo.

Requirements:
- Do not stop at architecture notes; implement the code.
- Create the public site, admin surfaces, schema, seeds, routes, automation registry, cron surface, and env contract.
- Preserve the bounded-autonomy model from the spec.
- Make the site usable even before optional third-party tools are configured.
- Where the niche requires renaming FlamingFoodies-specific concepts, preserve the same structural role with niche-appropriate naming.
- Add concise docs where future operators will need them.
- Finish with build verification and a short readiness summary.
```

## How To Use This With Exact Disaster Recovery

If the future goal is to restore one specific site exactly, not just clone the model:

1. Use this file for architectural reconstruction.
2. Use [docs/disaster-recovery-rebuild-playbook.md](/Users/vijaysingh/apps/flamingfoodies/docs/disaster-recovery-rebuild-playbook.md) for restore order.
3. Use [docs/ecosystem-inventory-and-recovery-matrix.md](/Users/vijaysingh/apps/flamingfoodies/docs/ecosystem-inventory-and-recovery-matrix.md) for provider setup.
4. Use the captured parity pack and backups for exact state recovery.

That combination is what gets you from "same operating model" to "same site."
