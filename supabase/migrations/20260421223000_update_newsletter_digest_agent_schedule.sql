UPDATE automation_agents
SET
  autonomy_mode = 'approval_required',
  requires_manual_approval = true,
  schedule_cron = null,
  config = '{
    "cron_paths": [
      "/api/admin/newsletter-digest",
      "/api/admin/newsletter-digest?mode=send_due"
    ],
    "schedule_windows": [
      "0 10 * * 0",
      "5 * * * *"
    ]
  }'::jsonb
WHERE agent_id = 'newsletter-digest-agent';
