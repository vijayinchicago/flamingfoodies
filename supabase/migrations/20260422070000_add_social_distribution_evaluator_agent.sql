ALTER TABLE social_posts
ADD COLUMN IF NOT EXISTS automation_context JSONB;

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
) VALUES (
  'social-distribution-evaluator',
  'Social distribution evaluator',
  'distribution',
  'internal_support',
  'bounded_live',
  true,
  false,
  '45 20 * * *',
  2,
  60,
  null,
  3,
  120,
  'none',
  '{
    "cron_paths": ["/api/admin/social-distribution-evaluator/cron"],
    "schedule_windows": ["45 20 * * *"],
    "evaluation_window_days": 7,
    "source_agent_ids": ["pinterest-distributor", "growth-loop-promoter"]
  }'::jsonb
)
ON CONFLICT (agent_id) DO UPDATE
SET
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
  config = EXCLUDED.config,
  updated_at = NOW();
