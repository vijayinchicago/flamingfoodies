-- Flip newsletter-digest-agent to fully autonomous external_send mode and
-- move the schedule to Friday 13:00 UTC (~8am ET) for the weekly Friday
-- broadcast. The cron handler dispatches to the autonomous path when the
-- agent is in external_send mode (no approval gate, content generated and
-- sent in one shot).

UPDATE automation_agents
SET
  autonomy_mode = 'external_send',
  requires_manual_approval = false,
  schedule_cron = '0 13 * * 5',
  config = '{
    "cron_paths": ["/api/admin/newsletter-digest?mode=autonomous_friday"],
    "schedule_windows": ["0 13 * * 5"]
  }'::jsonb
WHERE agent_id = 'newsletter-digest-agent';
