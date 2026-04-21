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
    'brand-discovery',
    'Brand discovery',
    'discovery',
    'draft_only',
    'draft_only',
    true,
    false,
    '0 4 * * 1',
    1,
    null,
    null,
    3,
    120,
    'none',
    '{
      "cron_paths": ["/api/admin/brand-discovery"]
    }'::jsonb
  ),
  (
    'release-monitor',
    'Release monitor',
    'releases',
    'approval_required',
    'approval_required',
    true,
    true,
    '15 4 * * 1',
    1,
    null,
    null,
    3,
    120,
    'manual_only',
    '{
      "cron_paths": ["/api/admin/release-monitor"]
    }'::jsonb
  )
ON CONFLICT (agent_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  risk_class = EXCLUDED.risk_class,
  autonomy_mode = EXCLUDED.autonomy_mode,
  is_enabled = EXCLUDED.is_enabled,
  requires_manual_approval = EXCLUDED.requires_manual_approval,
  schedule_cron = EXCLUDED.schedule_cron,
  daily_run_cap = EXCLUDED.daily_run_cap,
  daily_mutation_cap = EXCLUDED.daily_mutation_cap,
  daily_external_send_cap = EXCLUDED.daily_external_send_cap,
  max_consecutive_failures = EXCLUDED.max_consecutive_failures,
  alert_after_minutes = EXCLUDED.alert_after_minutes,
  rollback_strategy = EXCLUDED.rollback_strategy,
  config = EXCLUDED.config;

UPDATE automation_agents
SET
  name = 'Brand monitor (legacy)',
  is_enabled = false,
  schedule_cron = null,
  config = '{
    "deprecated": true,
    "replacement_agent_ids": ["brand-discovery", "release-monitor"]
  }'::jsonb
WHERE agent_id = 'brand-monitor';
