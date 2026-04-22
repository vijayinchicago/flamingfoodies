UPDATE automation_agents
SET
  daily_run_cap = 2,
  updated_at = NOW()
WHERE agent_id = 'search-performance-evaluator';
