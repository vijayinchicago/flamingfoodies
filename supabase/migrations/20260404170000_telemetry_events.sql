CREATE TABLE telemetry_events (
  id           BIGSERIAL PRIMARY KEY,
  event_name   TEXT NOT NULL,
  anonymous_id TEXT,
  session_id   TEXT,
  user_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  path         TEXT,
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  content_type TEXT,
  content_id   BIGINT,
  content_slug TEXT,
  value        NUMERIC,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_telemetry_events_occurred_at ON telemetry_events(occurred_at DESC);
CREATE INDEX idx_telemetry_events_event_name ON telemetry_events(event_name);
CREATE INDEX idx_telemetry_events_path ON telemetry_events(path);
CREATE INDEX idx_telemetry_events_session_id ON telemetry_events(session_id);
CREATE INDEX idx_telemetry_events_anonymous_id ON telemetry_events(anonymous_id);
CREATE INDEX idx_telemetry_events_user_id ON telemetry_events(user_id);

ALTER TABLE telemetry_events ENABLE ROW LEVEL SECURITY;
