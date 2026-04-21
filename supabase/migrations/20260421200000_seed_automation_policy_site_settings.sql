INSERT INTO site_settings (key, value)
VALUES
  ('automation_global_pause', 'false'::jsonb),
  ('automation_external_send_pause', 'false'::jsonb),
  ('automation_draft_creation_pause', 'false'::jsonb),
  ('automation_default_quiet_hours_start_et', 'null'::jsonb),
  ('automation_default_quiet_hours_end_et', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;
