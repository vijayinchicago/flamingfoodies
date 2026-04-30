ALTER TYPE post_status
ADD VALUE IF NOT EXISTS 'needs_review';

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS qa_notes TEXT;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS qa_report JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS qa_checked_at TIMESTAMPTZ;

ALTER TABLE blog_posts
ADD COLUMN IF NOT EXISTS qa_issues JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS qa_issues JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS qa_issues JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_blog_posts_prepublish_queue
  ON blog_posts (status, published_at);

CREATE INDEX IF NOT EXISTS idx_recipes_prepublish_queue
  ON recipes (status, published_at);

CREATE INDEX IF NOT EXISTS idx_reviews_prepublish_queue
  ON reviews (status, published_at);

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
  'prepublish-qa',
  'Prepublish QA',
  'editorial',
  'internal_support',
  'bounded_live',
  true,
  false,
  '55 17 * * *',
  6,
  24,
  null,
  3,
  120,
  'manual_only',
  '{
    "cron_paths": ["/api/admin/prepublish-qa"],
    "schedule_windows": ["55 17 * * *"],
    "managed_tables": ["recipes", "blog_posts", "reviews"]
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
