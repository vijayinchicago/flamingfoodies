CREATE TABLE automation_approvals (
  id BIGSERIAL PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES automation_agents(agent_id),
  subject_type TEXT NOT NULL,
  subject_key TEXT NOT NULL,
  proposed_action TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN (
      'pending',
      'approved',
      'rejected',
      'expired',
      'applied'
    )
  ),
  source_run_id BIGINT REFERENCES automation_runs(id),
  approved_by_admin_id UUID,
  rejected_by_admin_id UUID,
  decision_reason TEXT,
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX automation_approvals_subject_idx
  ON automation_approvals (agent_id, subject_type, subject_key, proposed_action);

CREATE INDEX idx_automation_approvals_status_created_at
  ON automation_approvals(status, created_at DESC);

CREATE INDEX idx_automation_approvals_agent_status_created_at
  ON automation_approvals(agent_id, status, created_at DESC);

ALTER TABLE automation_approvals ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER automation_approvals_updated_at
BEFORE UPDATE ON automation_approvals
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
