CREATE TABLE search_recommendations (
  id BIGSERIAL PRIMARY KEY,
  property TEXT NOT NULL,
  recommendation_key TEXT NOT NULL,
  source_run_id BIGINT REFERENCES search_insight_runs(id) ON DELETE SET NULL,
  last_seen_run_id BIGINT REFERENCES search_insight_runs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'new',
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority TEXT NOT NULL,
  action TEXT NOT NULL,
  target_path TEXT,
  related_paths TEXT[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  suggested_title TEXT,
  suggested_changes TEXT[] NOT NULL DEFAULT '{}',
  supporting_queries TEXT[] NOT NULL DEFAULT '{}',
  total_impressions BIGINT NOT NULL DEFAULT 0,
  avg_position DOUBLE PRECISION,
  implementation_strategy TEXT NOT NULL,
  implementation_payload JSONB NOT NULL DEFAULT '{"operations":[]}'::jsonb,
  decision_reason TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_search_recommendations_property_key
  ON search_recommendations(property, recommendation_key);

CREATE INDEX idx_search_recommendations_property_status
  ON search_recommendations(property, is_active, status);

ALTER TABLE search_recommendations ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER search_recommendations_updated_at
BEFORE UPDATE ON search_recommendations
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
