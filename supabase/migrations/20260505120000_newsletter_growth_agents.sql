-- Newsletter growth-loop infrastructure:
--   1. unsubscribe_count column on newsletter_campaigns (filled by stats agent)
--   2. subscriber_heat_votes table (filled by /api/welcome/heat-vote endpoint)
--   3. referral_insights table (filled by referral-attribution agent)
--   4. mailerlite-stats-collector agent
--   5. subscriber-sync-reconciler agent
--   6. referral-attribution-evaluator agent

-- 1. campaign engagement column ----------------------------------------------
ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS unsubscribe_count INTEGER NOT NULL DEFAULT 0;

-- 2. heat-poll vote tracking -------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriber_heat_votes (
  id            BIGSERIAL PRIMARY KEY,
  email         TEXT NOT NULL,
  heat_level    TEXT NOT NULL CHECK (heat_level IN ('mild', 'medium', 'hot', 'inferno')),
  source        TEXT,
  voted_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (email, heat_level)
);

CREATE INDEX IF NOT EXISTS idx_subscriber_heat_votes_email
  ON subscriber_heat_votes(email);

-- 3. referral insights -------------------------------------------------------
CREATE TABLE IF NOT EXISTS referral_insights (
  id              BIGSERIAL PRIMARY KEY,
  insight_kind    TEXT NOT NULL,           -- e.g. 'top_source_page', 'top_referrer', 'tier_distribution'
  insight_key     TEXT NOT NULL,           -- e.g. a slug, an email, a tier number
  metric_value    NUMERIC NOT NULL,
  metric_label    TEXT,                    -- human-readable label
  evaluation_window_days INTEGER NOT NULL DEFAULT 30,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  evaluated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (insight_kind, insight_key, evaluation_window_days, evaluated_at)
);

CREATE INDEX IF NOT EXISTS idx_referral_insights_kind_evaluated
  ON referral_insights(insight_kind, evaluated_at DESC);

-- 4. mailerlite-stats-collector agent ---------------------------------------
INSERT INTO automation_agents (
  agent_id, name, category, risk_class, autonomy_mode,
  is_enabled, requires_manual_approval, schedule_cron,
  daily_run_cap, daily_mutation_cap, daily_external_send_cap,
  max_consecutive_failures, alert_after_minutes, rollback_strategy, config
) VALUES (
  'mailerlite-stats-collector',
  'MailerLite stats collector',
  'newsletter',
  'internal_support',
  'bounded_live',
  true,
  false,
  '0 14 * * *',
  4, null, 0, 3, 240, 'none',
  '{"cron_paths": ["/api/admin/mailerlite-stats"]}'::jsonb
)
ON CONFLICT (agent_id) DO NOTHING;

-- 5. subscriber-sync-reconciler agent ---------------------------------------
INSERT INTO automation_agents (
  agent_id, name, category, risk_class, autonomy_mode,
  is_enabled, requires_manual_approval, schedule_cron,
  daily_run_cap, daily_mutation_cap, daily_external_send_cap,
  max_consecutive_failures, alert_after_minutes, rollback_strategy, config
) VALUES (
  'subscriber-sync-reconciler',
  'Subscriber sync reconciler',
  'newsletter',
  'internal_support',
  'bounded_live',
  true,
  false,
  '0 11 * * 0',
  1, 200, 0, 3, 360, 'none',
  '{"cron_paths": ["/api/admin/subscriber-reconcile"]}'::jsonb
)
ON CONFLICT (agent_id) DO NOTHING;

-- 6. referral-attribution-evaluator agent -----------------------------------
INSERT INTO automation_agents (
  agent_id, name, category, risk_class, autonomy_mode,
  is_enabled, requires_manual_approval, schedule_cron,
  daily_run_cap, daily_mutation_cap, daily_external_send_cap,
  max_consecutive_failures, alert_after_minutes, rollback_strategy, config
) VALUES (
  'referral-attribution-evaluator',
  'Referral attribution evaluator',
  'newsletter',
  'internal_support',
  'bounded_live',
  true,
  false,
  '0 12 * * 1',
  1, null, 0, 3, 360, 'none',
  '{"cron_paths": ["/api/admin/referral-evaluator"]}'::jsonb
)
ON CONFLICT (agent_id) DO NOTHING;
