CREATE TABLE automation_state_snapshots (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES automation_agents(agent_id),
  run_id BIGINT NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  before_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_automation_state_snapshots_agent_created_at
  ON automation_state_snapshots(agent_id, created_at DESC);

CREATE INDEX idx_automation_state_snapshots_run_id
  ON automation_state_snapshots(run_id);

ALTER TABLE automation_state_snapshots ENABLE ROW LEVEL SECURITY;
