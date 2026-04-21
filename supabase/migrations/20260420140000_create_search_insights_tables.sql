CREATE TABLE search_console_connections (
  id BIGSERIAL PRIMARY KEY,
  property TEXT NOT NULL UNIQUE,
  refresh_token TEXT NOT NULL,
  scope TEXT,
  token_type TEXT,
  connected_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE search_insight_runs (
  id BIGSERIAL PRIMARY KEY,
  property TEXT NOT NULL,
  search_type TEXT NOT NULL DEFAULT 'web',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  latest_available_date DATE NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
  applied_runtime JSONB NOT NULL DEFAULT '{}'::jsonb,
  applied_recommendation_ids TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_insight_runs_created_at
  ON search_insight_runs(created_at DESC);

CREATE INDEX idx_search_insight_runs_property_created_at
  ON search_insight_runs(property, created_at DESC);

ALTER TABLE search_console_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_insight_runs ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER search_console_connections_updated_at
BEFORE UPDATE ON search_console_connections
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER search_insight_runs_updated_at
BEFORE UPDATE ON search_insight_runs
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
