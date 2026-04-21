CREATE TABLE automation_agents (
  agent_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  risk_class TEXT NOT NULL CHECK (
    risk_class IN (
      'draft_only',
      'bounded_live',
      'external_send',
      'approval_required',
      'internal_support'
    )
  ),
  autonomy_mode TEXT NOT NULL CHECK (
    autonomy_mode IN (
      'disabled',
      'draft_only',
      'approval_required',
      'bounded_live',
      'external_send'
    )
  ),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  requires_manual_approval BOOLEAN NOT NULL DEFAULT false,
  schedule_cron TEXT,
  owner TEXT,
  daily_run_cap INTEGER,
  daily_mutation_cap INTEGER,
  daily_external_send_cap INTEGER,
  quiet_hours_start_et SMALLINT,
  quiet_hours_end_et SMALLINT,
  max_consecutive_failures INTEGER NOT NULL DEFAULT 3,
  alert_after_minutes INTEGER NOT NULL DEFAULT 120,
  rollback_strategy TEXT NOT NULL DEFAULT 'none' CHECK (
    rollback_strategy IN (
      'none',
      'rebuild_from_source',
      'restore_snapshot',
      'manual_only'
    )
  ),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE automation_runs (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES automation_agents(agent_id),
  trigger_source TEXT NOT NULL CHECK (
    trigger_source IN (
      'cron',
      'manual',
      'admin_action',
      'callback',
      'system'
    )
  ),
  trigger_reference TEXT,
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL CHECK (
    status IN (
      'started',
      'succeeded',
      'failed',
      'cancelled',
      'blocked',
      'rolled_back'
    )
  ),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  summary TEXT,
  input_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  result_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  rows_created INTEGER NOT NULL DEFAULT 0,
  rows_updated INTEGER NOT NULL DEFAULT 0,
  rows_published INTEGER NOT NULL DEFAULT 0,
  rows_sent INTEGER NOT NULL DEFAULT 0,
  external_actions_count INTEGER NOT NULL DEFAULT 0,
  created_by_admin_id UUID,
  rollback_run_id BIGINT REFERENCES automation_runs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE automation_run_events (
  id BIGSERIAL PRIMARY KEY,
  run_id BIGINT NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (
    level IN (
      'info',
      'warning',
      'error'
    )
  ),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_agents_enabled
  ON automation_agents(is_enabled);

CREATE INDEX idx_automation_runs_agent_started_at
  ON automation_runs(agent_id, started_at DESC);

CREATE INDEX idx_automation_runs_status_started_at
  ON automation_runs(status, started_at DESC);

CREATE INDEX idx_automation_runs_trigger_source_started_at
  ON automation_runs(trigger_source, started_at DESC);

CREATE INDEX idx_automation_run_events_run_id_created_at
  ON automation_run_events(run_id, created_at ASC);

ALTER TABLE automation_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_run_events ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER automation_agents_updated_at
BEFORE UPDATE ON automation_agents
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO automation_agents (
  agent_id,
  name,
  category,
  risk_class,
  autonomy_mode,
  is_enabled,
  requires_manual_approval,
  schedule_cron,
  daily_run_cap,
  daily_mutation_cap,
  daily_external_send_cap,
  max_consecutive_failures,
  alert_after_minutes,
  rollback_strategy,
  config
) VALUES
  (
    'editorial-autopublisher',
    'Editorial autopublisher',
    'editorial',
    'bounded_live',
    'bounded_live',
    true,
    false,
    null,
    6,
    8,
    null,
    3,
    120,
    'manual_only',
    '{
      "cron_paths": [
        "/api/admin/generate?type=recipe&qty=3",
        "/api/admin/generate?type=recipe&qty=1&profile=hot_sauce_recipe",
        "/api/admin/generate?type=blog_post&qty=1",
        "/api/admin/generate?type=review&qty=1",
        "/api/admin/reevaluate-ai-drafts",
        "/api/admin/publish-scheduled"
      ],
      "schedule_windows": [
        "0 6 * * *",
        "0 9 * * 1",
        "0 7 * * *",
        "0 8 * * 1,4",
        "45 17 * * *",
        "0 18 * * *"
      ]
    }'::jsonb
  ),
  (
    'pinterest-distributor',
    'Pinterest distributor',
    'distribution',
    'external_send',
    'external_send',
    true,
    false,
    '15 19 * * *',
    null,
    null,
    12,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/social-scheduler"]
    }'::jsonb
  ),
  (
    'growth-loop-promoter',
    'Growth loop promoter',
    'growth',
    'bounded_live',
    'bounded_live',
    true,
    false,
    '30 18 * * *',
    1,
    2,
    null,
    3,
    120,
    'rebuild_from_source',
    '{
      "cron_paths": ["/api/admin/growth-loop"]
    }'::jsonb
  ),
  (
    'shop-shelf-curator',
    'Shop shelf curator',
    'commerce',
    'bounded_live',
    'bounded_live',
    true,
    false,
    null,
    2,
    12,
    null,
    3,
    120,
    'restore_snapshot',
    '{
      "cron_paths": [
        "/api/admin/generate?type=merch_product&qty=1",
        "/api/admin/shop-refresh"
      ],
      "schedule_windows": [
        "0 11 * * *",
        "30 23 * * *"
      ]
    }'::jsonb
  ),
  (
    'newsletter-digest-agent',
    'Newsletter digest agent',
    'email',
    'external_send',
    'draft_only',
    true,
    true,
    '0 10 * * 0',
    1,
    null,
    1,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/newsletter-digest"]
    }'::jsonb
  ),
  (
    'search-insights-analyst',
    'Search insights analyst',
    'seo',
    'draft_only',
    'draft_only',
    true,
    false,
    '30 12 * * 1',
    1,
    null,
    null,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/search-insights"]
    }'::jsonb
  ),
  (
    'search-recommendation-executor',
    'Search recommendation executor',
    'seo',
    'bounded_live',
    'bounded_live',
    true,
    false,
    '0 13 * * *',
    1,
    6,
    null,
    3,
    120,
    'restore_snapshot',
    '{
      "cron_paths": ["/api/admin/search-insights-executor/cron"]
    }'::jsonb
  ),
  (
    'festival-discovery',
    'Festival discovery',
    'discovery',
    'draft_only',
    'draft_only',
    true,
    false,
    '0 2 * * *',
    1,
    null,
    null,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/festival-discovery"]
    }'::jsonb
  ),
  (
    'pepper-discovery',
    'Pepper discovery',
    'discovery',
    'draft_only',
    'draft_only',
    true,
    false,
    '0 3 * * 1',
    1,
    null,
    null,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/pepper-discovery"]
    }'::jsonb
  ),
  (
    'brand-monitor',
    'Brand monitor',
    'discovery',
    'approval_required',
    'approval_required',
    true,
    true,
    '0 4 * * 1',
    1,
    null,
    null,
    3,
    120,
    'manual_only',
    '{
      "cron_paths": ["/api/admin/brand-monitor"]
    }'::jsonb
  ),
  (
    'tutorial-generator',
    'Tutorial generator',
    'discovery',
    'draft_only',
    'draft_only',
    true,
    false,
    '0 5 * * 3',
    1,
    null,
    null,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/tutorial-generate"]
    }'::jsonb
  ),
  (
    'content-shop-sync',
    'Content shop sync',
    'support',
    'internal_support',
    'bounded_live',
    true,
    false,
    '0 12 * * *',
    1,
    null,
    null,
    3,
    120,
    'rebuild_from_source',
    '{
      "cron_paths": ["/api/admin/content-shop-sync"]
    }'::jsonb
  );
