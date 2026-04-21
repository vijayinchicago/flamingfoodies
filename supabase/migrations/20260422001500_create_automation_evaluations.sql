CREATE TABLE automation_evaluations (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES automation_agents(agent_id),
  source_run_id BIGINT NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  evaluation_window_days INTEGER NOT NULL DEFAULT 0 CHECK (evaluation_window_days >= 0),
  baseline_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  observed_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  verdict TEXT NOT NULL CHECK (
    verdict IN (
      'keep',
      'revert',
      'escalate'
    )
  ),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_evaluations_run_created_at
  ON automation_evaluations(source_run_id, created_at DESC);

CREATE INDEX idx_automation_evaluations_agent_created_at
  ON automation_evaluations(agent_id, created_at DESC);

ALTER TABLE automation_evaluations ENABLE ROW LEVEL SECURITY;
