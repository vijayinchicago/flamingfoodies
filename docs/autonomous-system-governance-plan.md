# Autonomous System Governance Plan

This document turns the current FlamingFoodies automation stack into an implementation plan for a safer, more fully autonomous system.

It is meant to sit next to [docs/autonomous-agents.md](/Users/vijaysingh/apps/flamingfoodies/docs/autonomous-agents.md) instead of replacing it.

`docs/autonomous-agents.md` explains the operating vision.

This file explains:

- which automations exist today
- which ones are low risk vs high risk
- which tables, flags, and wrappers to add
- how to roll the system out without breaking the current site

## Goals

1. Keep the current automation behavior working while adding stronger control and observability.
2. Give every autonomous lane an explicit policy, run ledger, kill switch, and mutation budget.
3. Separate low-risk draft-producing agents from live mutating agents and external-send agents.
4. Make it possible to pause, evaluate, and roll back each lane independently.

## Current System Map

These are the meaningful autonomous or cron-driven lanes already in the repo.

| Lane | Current trigger | Current write surface | Current guardrail | Target autonomy class |
| --- | --- | --- | --- | --- |
| `editorial-autopublisher` | `generate`, `reevaluate-ai-drafts`, `publish-scheduled` crons | `recipes`, `blog_posts`, `reviews`, `social_posts` | AI QA + delayed publish window | `bounded_live` |
| `pinterest-distributor` / social scheduler | daily cron | `social_posts`, Buffer publish | platform queue only, provider failure handling | `external_send` |
| `growth-loop-promoter` | daily cron | `social_posts` queue | max 2 candidates + 7-day dedupe | `bounded_live` |
| `shop-shelf-curator` | daily pick + nightly refresh | `merch_products`, generation jobs | bounded catalog writes, featured-slot logic | `bounded_live` |
| `newsletter-digest-agent` | weekly cron | `newsletter_campaigns`, ConvertKit broadcast sync | currently drafts by default unless explicit send mode | `external_send` |
| `search-insights-analyst` | weekly cron | `search_insight_runs`, `search_recommendations` | read-only Search Console sync + queue only | `draft_only` |
| `search-recommendation-executor` | daily cron | `search_recommendations`, `site_settings.search_runtime_optimizations` | approved-only bounded overlay registry | `bounded_live` |
| `festival-discovery` | nightly cron | `festivals` drafts | draft-only inserts | `draft_only` |
| `pepper-discovery` | weekly cron | pepper discovery tables | draft-oriented discovery flow | `draft_only` |
| `brand-monitor` | weekly cron | `brands` drafts, `releases` published rows | brands draft-only, releases auto-publish | split into `draft_only` + `approval_required` |
| `tutorial-generator` | weekly cron | `tutorials` drafts | draft-only insert | `draft_only` |
| `content-shop-sync` | daily cron | shop/content signal tables | internal signal sync | `internal_support` |

## Main Problems To Solve

### 1. No single control plane

The cron surface in [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json) is broader than the agent registry in [lib/autonomous-agents.ts](/Users/vijaysingh/apps/flamingfoodies/lib/autonomous-agents.ts).

That means:

- some jobs are live but not represented as first-class agents
- governance is split between service files, admin pages, and cron routes
- "what is autonomous" depends on where you look

### 2. Weak run-level observability

The current dashboard in [lib/services/agent-runs.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/agent-runs.ts) infers behavior from:

- generation jobs
- content status
- social rows
- newsletter rows
- audit log rows
- Search Console summaries

That is useful for reporting, but it is not a durable automation ledger.

We need explicit rows for:

- when each agent started
- what inputs it used
- what it changed
- what failed
- what should be rolled back

### 3. Uneven guardrails

The repo already has good patterns in some places:

- editorial auto-publish only happens after automated QA clears
- growth-loop re-promotion is capped and deduped
- Search Console execution is approval-gated and allowlisted
- festival and tutorial discovery write drafts instead of live content

But other places still need policy:

- social publishing touches external channels directly
- newsletter sending touches subscribers directly
- release monitoring currently auto-publishes AI-discovered release rows

### 4. No shared rollback model

The system can often rebuild state, but it does not yet record before/after snapshots in a shared way.

That is acceptable for low-risk draft lanes.

It is not acceptable for:

- live SEO runtime overlays
- social sends
- newsletter sends
- live release publishing
- shop shelf changes

## Risk Classes

Every agent should be assigned one of these classes.

### `draft_only`

The agent can create or update draft records, but it cannot publish or send anything externally.

Use for:

- `festival-discovery`
- `pepper-discovery`
- `tutorial-generator`
- `search-insights-analyst`
- `brand-discovery` after splitting brand monitor

### `bounded_live`

The agent can make live changes, but only inside a pre-modeled write surface with caps and rollback support.

Use for:

- `editorial-autopublisher`
- `growth-loop-promoter`
- `shop-shelf-curator`
- `search-recommendation-executor`

### `external_send`

The agent can send or publish externally to a third-party audience or platform.

Use for:

- `pinterest-distributor`
- `newsletter-digest-agent`

### `approval_required`

The agent may prepare live actions, but a human or explicit approval policy must clear them before execution.

Use for:

- `release-monitor`
- future high-risk social or email campaigns
- any future code-writing or infrastructure-mutating agent

### `internal_support`

The job is important operationally, but it is not a user-facing autonomous lane.

Use for:

- `content-shop-sync`

## Proposed Data Model

### 1. `automation_agents`

Purpose:
- one row per autonomous lane
- policy and schedule source of truth
- kill switches and budgets live here

Suggested columns:

```sql
create table automation_agents (
  agent_id text primary key,
  name text not null,
  category text not null,
  risk_class text not null,
  autonomy_mode text not null,
  is_enabled boolean not null default true,
  requires_manual_approval boolean not null default false,
  schedule_cron text null,
  owner text null,
  daily_run_cap integer null,
  daily_mutation_cap integer null,
  daily_external_send_cap integer null,
  quiet_hours_start_et smallint null,
  quiet_hours_end_et smallint null,
  max_consecutive_failures integer not null default 3,
  alert_after_minutes integer not null default 120,
  rollback_strategy text not null default 'none',
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended `autonomy_mode` values:

- `disabled`
- `draft_only`
- `approval_required`
- `bounded_live`
- `external_send`

Recommended `rollback_strategy` values:

- `none`
- `rebuild_from_source`
- `restore_snapshot`
- `manual_only`

### 2. `automation_runs`

Purpose:
- durable run ledger for every cron and manual trigger
- base table for dashboards, alerts, and failure handling

Suggested columns:

```sql
create table automation_runs (
  id bigserial primary key,
  agent_id text not null references automation_agents(agent_id),
  trigger_source text not null,
  trigger_reference text null,
  environment text not null default 'production',
  status text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  duration_ms integer null,
  summary text null,
  input_payload jsonb not null default '{}'::jsonb,
  result_payload jsonb not null default '{}'::jsonb,
  error_message text null,
  rows_created integer not null default 0,
  rows_updated integer not null default 0,
  rows_published integer not null default 0,
  rows_sent integer not null default 0,
  external_actions_count integer not null default 0,
  created_by_admin_id uuid null,
  rollback_run_id bigint null references automation_runs(id),
  created_at timestamptz not null default now()
);
```

Recommended `status` values:

- `started`
- `succeeded`
- `failed`
- `cancelled`
- `blocked`
- `rolled_back`

### 3. `automation_run_events`

Purpose:
- structured per-run log trail without dumping everything into one summary string

Suggested columns:

```sql
create table automation_run_events (
  id bigserial primary key,
  run_id bigint not null references automation_runs(id) on delete cascade,
  level text not null,
  code text not null,
  message text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

Recommended `level` values:

- `info`
- `warning`
- `error`

### 4. `automation_approvals`

Purpose:
- queue high-risk proposed actions before they become live
- shared approval primitive for SEO, release publishing, future newsletter sends, and future social campaigns

Suggested columns:

```sql
create table automation_approvals (
  id bigserial primary key,
  agent_id text not null references automation_agents(agent_id),
  subject_type text not null,
  subject_key text not null,
  proposed_action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  source_run_id bigint null references automation_runs(id),
  approved_by_admin_id uuid null,
  rejected_by_admin_id uuid null,
  decision_reason text null,
  approved_at timestamptz null,
  rejected_at timestamptz null,
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index automation_approvals_subject_idx
  on automation_approvals (agent_id, subject_type, subject_key, proposed_action);
```

Recommended `status` values:

- `pending`
- `approved`
- `rejected`
- `expired`
- `applied`

### 5. `automation_state_snapshots`

Purpose:
- save before/after payloads for live bounded lanes
- power rollback for SEO overlays, shop shelf state, and other deterministic state

Suggested columns:

```sql
create table automation_state_snapshots (
  id bigserial primary key,
  agent_id text not null references automation_agents(agent_id),
  run_id bigint not null references automation_runs(id) on delete cascade,
  scope text not null,
  subject_key text not null,
  before_payload jsonb not null default '{}'::jsonb,
  after_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

### 6. `automation_evaluations`

Purpose:
- record post-run outcome checks
- give the system a path from "do work" to "was that a good idea"

Suggested columns:

```sql
create table automation_evaluations (
  id bigserial primary key,
  agent_id text not null references automation_agents(agent_id),
  source_run_id bigint not null references automation_runs(id),
  subject_type text not null,
  subject_key text not null,
  evaluation_window_days integer not null,
  baseline_payload jsonb not null default '{}'::jsonb,
  observed_payload jsonb not null default '{}'::jsonb,
  verdict text not null,
  notes text null,
  created_at timestamptz not null default now()
);
```

Recommended `verdict` values:

- `keep`
- `revert`
- `escalate`

## New Shared Service Layer

Add a shared wrapper instead of letting each service invent its own policy and logging.

Suggested new file:

- `lib/services/automation-control.ts`

Core functions:

```ts
getAutomationAgent(agentId)
assertAgentExecutionAllowed(agentId, triggerSource)
beginAutomationRun(agentId, input)
appendAutomationRunEvent(runId, event)
completeAutomationRun(runId, result)
failAutomationRun(runId, error)
recordAutomationSnapshot(runId, snapshot)
createAutomationApproval(input)
applyApprovedAutomation(input)
pauseAutomationAgent(agentId)
resumeAutomationAgent(agentId)
```

Every cron route should call the wrapper before running the underlying service.

That means:

- enforce agent enable/disable state
- enforce daily caps
- enforce quiet hours
- enforce failure-streak blocking
- record explicit run rows

## Global Safety Switches

Keep these in `site_settings` because they are true site-wide overrides.

Suggested keys:

- `automation_global_pause`
- `automation_external_send_pause`
- `automation_draft_creation_pause`
- `automation_default_quiet_hours_start_et`
- `automation_default_quiet_hours_end_et`

Keep existing settings in place:

- `auto_publish_ai_content`
- `auto_publish_delay_hours`

Use them as editorial-lane policy inputs rather than replacing them immediately.

## Agent-Specific Policy Defaults

These should be the first values inserted into `automation_agents`.

### `editorial-autopublisher`

- `risk_class = bounded_live`
- `autonomy_mode = bounded_live`
- `daily_run_cap = 6`
- `daily_mutation_cap = 8`
- `rollback_strategy = manual_only`

Guardrails:

- keep existing QA gate
- cap auto-published items per day
- block if failure streak exceeds threshold

### `pinterest-distributor`

- `risk_class = external_send`
- `autonomy_mode = external_send`
- `daily_external_send_cap = 12`
- `rollback_strategy = none`

Guardrails:

- retain 7-day per-content dedupe
- add per-platform per-day cap
- add quiet hours

### `growth-loop-promoter`

- `risk_class = bounded_live`
- `autonomy_mode = bounded_live`
- `daily_mutation_cap = 2`
- `rollback_strategy = rebuild_from_source`

Guardrails:

- keep max-2 candidate limit
- add content-type and platform caps
- add minimum traffic/share threshold config

### `shop-shelf-curator`

- `risk_class = bounded_live`
- `autonomy_mode = bounded_live`
- `daily_run_cap = 2`
- `daily_mutation_cap = 12`
- `rollback_strategy = restore_snapshot`

Guardrails:

- never hard-delete automated shop rows
- preserve exact-link preference
- snapshot featured set before each refresh

### `newsletter-digest-agent`

- `risk_class = external_send`
- `autonomy_mode = draft_only` initially
- `daily_external_send_cap = 1`
- `requires_manual_approval = true` for live send mode
- `rollback_strategy = none`

Guardrails:

- drafting can stay autonomous
- sending should remain approval-gated until delivery quality is proven
- due-send logic should only process campaigns in `approved_to_send` or equivalent scheduled state

### `search-insights-analyst`

- `risk_class = draft_only`
- `autonomy_mode = draft_only`
- `daily_run_cap = 1`
- `rollback_strategy = none`

Guardrails:

- no live runtime writes
- no status mutation except queue refresh

### `search-recommendation-executor`

- `risk_class = bounded_live`
- `autonomy_mode = bounded_live`
- `daily_mutation_cap = 6`
- `rollback_strategy = restore_snapshot`

Guardrails:

- keep approved-only queue behavior
- keep allowlisted implementation registry
- snapshot `search_runtime_optimizations` before rebuild

### `festival-discovery`

- `risk_class = draft_only`
- `autonomy_mode = draft_only`

### `pepper-discovery`

- `risk_class = draft_only`
- `autonomy_mode = draft_only`

### `tutorial-generator`

- `risk_class = draft_only`
- `autonomy_mode = draft_only`

### `brand-discovery`

Split out of the current brand monitor service.

- `risk_class = draft_only`
- `autonomy_mode = draft_only`

### `release-monitor`

Split out of the current brand monitor service.

- `risk_class = approval_required`
- `autonomy_mode = approval_required`
- `requires_manual_approval = true`

Guardrail:

- stop auto-publishing AI-discovered release rows
- create draft or approval queue rows first

### `content-shop-sync`

- `risk_class = internal_support`
- `autonomy_mode = bounded_live`

Guardrail:

- keep it out of the public-facing autonomous-agent marketing copy
- still record it in the run ledger

## Required Refactors

### 1. Expand the agent registry

Update:

- [lib/autonomous-agents.ts](/Users/vijaysingh/apps/flamingfoodies/lib/autonomous-agents.ts)

Changes:

- include all currently scheduled lanes, not just the "headline" ones
- add `riskClass`, `autonomyMode`, `writesLiveState`, and `writesExternalState`
- separate first-class agents from support jobs in the UI

### 2. Wrap cron routes in the control layer

Update:

- `app/api/admin/generate/route.ts`
- `app/api/admin/reevaluate-ai-drafts/route.ts`
- `app/api/admin/publish-scheduled/route.ts`
- `app/api/admin/social-scheduler/route.ts`
- `app/api/admin/growth-loop/route.ts`
- `app/api/admin/newsletter-digest/route.ts`
- `app/api/admin/shop-refresh/route.ts`
- `app/api/admin/search-insights/route.ts`
- `app/api/admin/search-insights-executor/cron/route.ts`
- discovery/support cron routes under `app/api/admin/*`

Changes:

- call `assertAgentExecutionAllowed`
- create a run row at start
- write structured success/failure output at finish

### 3. Add snapshots for bounded live lanes

Update:

- [lib/services/search-insights.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/search-insights.ts)
- [lib/services/shop-automation.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/shop-automation.ts)
- [lib/services/automation.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/automation.ts)

Changes:

- snapshot runtime overlay before SEO executor rebuild
- snapshot featured shop state before refresh
- for editorial, record promoted/published entity lists even if rollback stays manual

### 4. Split high-risk mixed agents

Update:

- [lib/services/brand-monitor.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/brand-monitor.ts)

Changes:

- split into `runBrandDiscovery()` and `runReleaseMonitor()`
- stop publishing `releases` rows directly from AI web-search output
- write drafts or `automation_approvals` instead

### 5. Fix newsletter autonomy intentionally

Update:

- [app/api/admin/newsletter-digest/route.ts](/Users/vijaysingh/apps/flamingfoodies/app/api/admin/newsletter-digest/route.ts)
- [lib/services/newsletter.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/newsletter.ts)
- [vercel.json](/Users/vijaysingh/apps/flamingfoodies/vercel.json)

Changes:

- keep weekly digest drafting autonomous
- gate send behavior behind approval or a specific approved status
- if fully autonomous send is desired later, require separate rollout after deliverability review

### 6. Replace inferred reporting with run-ledger reporting

Update:

- [lib/services/agent-runs.ts](/Users/vijaysingh/apps/flamingfoodies/lib/services/agent-runs.ts)
- `app/admin/automation/agents/page.tsx`
- `app/admin/automation/trigger/page.tsx`

Changes:

- use `automation_runs` as the primary truth for "what ran"
- keep inferred content metrics as supporting health signals
- add failure streak, muted/paused state, and cap status

## Admin Surface Changes

### `/admin/automation/agents`

Add:

- enabled/paused state
- risk class
- autonomy mode
- last successful run
- last failed run
- consecutive failure count
- next scheduled run
- daily cap usage

Split into sections:

- Live bounded agents
- External send agents
- Draft-only agents
- Support jobs

### `/admin/automation/runs`

New page.

Show:

- run ledger
- filters by agent, status, and date
- drill-in view for input, result, and event log

### `/admin/automation/approvals`

New page.

Show:

- pending approvals for release monitor, newsletter send, SEO, and future high-risk actions

### `/admin/automation/trigger`

Add:

- pause/resume controls
- run-now controls wired through the same control-plane wrapper
- explicit note when a lane is draft-only vs send-capable

## Rollout Order

### Phase 0: Inventory and no-behavior-change scaffolding

Scope:

- create `automation_agents`
- seed all current lanes
- create `automation_runs` and `automation_run_events`
- add the shared control wrapper
- wrap cron routes without changing lane behavior

Success criteria:

- every cron/manual automation writes a run row
- current behavior remains unchanged

### Phase 1: Unified dashboard and kill switches

Scope:

- update `lib/autonomous-agents.ts`
- update `lib/services/agent-runs.ts`
- add paused/enabled controls
- expose support jobs in the admin UI

Success criteria:

- every scheduled job is visible in one place
- any lane can be paused without code deploy

### Phase 2: Risk policy enforcement

Scope:

- enforce caps, quiet hours, and failure streak blocks
- add snapshotting for SEO and shop
- formalize policy defaults per lane

Success criteria:

- high-risk lanes stop when caps or failure thresholds are exceeded
- bounded live lanes write rollback-capable snapshots

### Phase 3: Approval queue for high-risk output

Scope:

- create `automation_approvals`
- split `brand-monitor`
- gate newsletter sending and release publication

Success criteria:

- no AI-web-researched content goes live externally without either policy approval or explicit human approval

### Phase 4: Evaluator loops

Scope:

- create `automation_evaluations`
- add SEO evaluator
- add social click/fatigue evaluator
- add editorial post-publish evaluator
- add shop CTR evaluator

Success criteria:

- the system can say not only "what ran" but also "was it worth keeping"

### Phase 5: Rollback tooling

Scope:

- rollback actions in admin
- restore snapshots for SEO/shop
- mark reverted runs in `automation_runs`

Success criteria:

- we can reverse bounded live mutations without hand-editing data tables

## First Developer Tickets

These are the first tickets a developer agent should execute in order.

1. Add `automation_agents`, `automation_runs`, and `automation_run_events` migrations.
2. Seed all current cron-driven lanes into `automation_agents`.
3. Create `lib/services/automation-control.ts`.
4. Wrap all cron routes with `beginAutomationRun` / `completeAutomationRun` / `failAutomationRun`.
5. Update `/admin/automation/agents` to read from `automation_agents` plus `automation_runs`.
6. Add pause/resume server actions and UI controls.
7. Snapshot `search_runtime_optimizations` before executor rebuild.
8. Snapshot shop featured state before catalog refresh.
9. Split `brand-monitor` into draft-only brand discovery and approval-gated release monitoring.
10. Add `automation_approvals` and `/admin/automation/approvals`.

## Non-Goals For This Rollout

- letting agents write arbitrary code
- letting agents create new public routes or templates on their own
- removing the current editorial QA gates
- turning every draft-only research lane into an auto-publishing lane

## Decision Summary

The target system is not "more aggressive automation."

It is:

- more explicit policy
- better run tracking
- stronger separation between draft creation, bounded live mutation, and external send
- rollback and evaluation before autonomy gets pushed harder
