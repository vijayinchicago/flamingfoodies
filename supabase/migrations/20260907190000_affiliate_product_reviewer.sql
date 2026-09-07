-- Private research drafts are deliberately separate from publishable reviews.
-- Neither the publisher nor draft reevaluator can see or promote these rows.
CREATE TABLE IF NOT EXISTS affiliate_review_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_key TEXT NOT NULL UNIQUE,
  product_identity TEXT NOT NULL UNIQUE,
  product_name_normalized TEXT NOT NULL UNIQUE,
  product JSONB NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('researching','writing','checking','awaiting_review','blocked','failed','timed_out','dismissed')),
  attempt_count INTEGER NOT NULL DEFAULT 1,
  lease_token UUID,
  lease_expires_at TIMESTAMPTZ,
  research JSONB,
  draft JSONB,
  qa JSONB,
  error_message TEXT,
  review_note TEXT,
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_review_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES affiliate_review_jobs(id),
  run_id BIGINT REFERENCES automation_runs(id),
  invocation_key TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS affiliate_review_generations (
  id UUID PRIMARY KEY,
  attempt_id UUID NOT NULL REFERENCES affiliate_review_attempts(id),
  stage TEXT NOT NULL CHECK (stage IN ('research','writing','qa')),
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started','completed','failed','timed_out')),
  input_payload JSONB NOT NULL,
  raw_response JSONB,
  input_tokens INTEGER,
  output_tokens INTEGER,
  search_requests INTEGER,
  estimated_cost_usd NUMERIC,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE affiliate_review_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_review_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_review_generations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON affiliate_review_jobs, affiliate_review_attempts, affiliate_review_generations FROM anon, authenticated;
GRANT ALL ON affiliate_review_jobs, affiliate_review_attempts, affiliate_review_generations TO service_role;

INSERT INTO automation_agents (agent_id,name,category,risk_class,autonomy_mode,is_enabled,
  requires_manual_approval,schedule_cron,daily_run_cap,daily_mutation_cap,
  max_consecutive_failures,alert_after_minutes,rollback_strategy,config)
VALUES ('affiliate-product-reviewer','Affiliate Product Reviewer','editorial','draft_only','draft_only',true,
  true,'0 8 * * 1,4',2,1,3,15,'manual_only',
  '{"cron_paths":["/api/admin/affiliate-reviews/cron"],"schedule_windows":["0 8 * * 1,4"],"draft_only":true,"quantity":1}'::jsonb)
ON CONFLICT (agent_id) DO NOTHING;

-- Retire the legacy review schedule; the independent agent now owns its cadence.
UPDATE generation_schedule SET is_active=false WHERE job_type='review';

CREATE INDEX IF NOT EXISTS affiliate_review_attempts_job_idx ON affiliate_review_attempts(job_id,started_at);
CREATE INDEX IF NOT EXISTS affiliate_review_generations_attempt_idx ON affiliate_review_generations(attempt_id,started_at);

CREATE OR REPLACE FUNCTION claim_affiliate_review(p_candidates JSONB, p_invocation_key TEXT,
  p_run_id BIGINT, p_retry_id UUID DEFAULT NULL)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  candidate JSONB;
  job affiliate_review_jobs%ROWTYPE;
  agent automation_agents%ROWTYPE;
  attempt UUID := gen_random_uuid();
  day_start TIMESTAMPTZ := date_trunc('day', now() AT TIME ZONE 'America/New_York') AT TIME ZONE 'America/New_York';
BEGIN
  -- Serializes manual + cron claims, duplicate deliveries and daily budget reservations.
  PERFORM pg_advisory_xact_lock(hashtext('affiliate-product-reviewer'));
  SELECT * INTO agent FROM automation_agents WHERE agent_id = 'affiliate-product-reviewer';
  IF NOT FOUND OR NOT agent.is_enabled OR agent.autonomy_mode = 'disabled' THEN
    RAISE EXCEPTION 'Affiliate Product Reviewer is not enabled';
  END IF;
  UPDATE affiliate_review_jobs SET status='timed_out', error_message='Worker lease expired. Inspect saved stages before retrying.',
    lease_token=NULL, updated_at=now()
    WHERE status IN ('researching','writing','checking') AND lease_expires_at < now();
  UPDATE affiliate_review_generations g SET status='timed_out',completed_at=now(),error_message='Worker lease expired; provider usage may be unknown.'
    FROM affiliate_review_attempts a, affiliate_review_jobs j
    WHERE g.attempt_id=a.id AND a.job_id=j.id AND j.status='timed_out' AND g.status='started';
  IF EXISTS (SELECT 1 FROM affiliate_review_attempts WHERE invocation_key=p_invocation_key) THEN
    RETURN jsonb_build_object('skipped','This request was already claimed.');
  END IF;
  IF EXISTS (SELECT 1 FROM affiliate_review_jobs WHERE status IN ('researching','writing','checking')) THEN
    RETURN jsonb_build_object('skipped','Another product review is already running.');
  END IF;
  IF (SELECT count(*) FROM affiliate_review_attempts WHERE started_at >= day_start) >= COALESCE(agent.daily_run_cap,2) THEN
    RAISE EXCEPTION 'Affiliate reviewer daily attempt cap reached';
  END IF;
  IF (SELECT count(DISTINCT j.id) FROM affiliate_review_jobs j JOIN affiliate_review_attempts a ON a.job_id=j.id
      WHERE a.started_at >= day_start AND j.draft IS NOT NULL) >= COALESCE(agent.daily_mutation_cap,1) THEN
    RAISE EXCEPTION 'Affiliate reviewer daily draft cap reached';
  END IF;
  IF p_retry_id IS NOT NULL THEN
    SELECT * INTO job FROM affiliate_review_jobs WHERE id=p_retry_id FOR UPDATE;
    IF NOT FOUND OR job.status NOT IN ('failed','timed_out','blocked') OR job.attempt_count >= 3 THEN
      RAISE EXCEPTION 'Only blocked, failed or timed-out jobs below three attempts can be retried';
    END IF;
    SELECT value INTO candidate FROM jsonb_array_elements(p_candidates) WHERE value->>'key'=job.affiliate_key
      AND value->>'identity'=job.product_identity;
    IF candidate IS NULL THEN RAISE EXCEPTION 'Product is no longer an eligible affiliate candidate'; END IF;
  ELSE
    FOR candidate IN SELECT value FROM jsonb_array_elements(p_candidates) LOOP
      IF EXISTS (SELECT 1 FROM affiliate_review_jobs WHERE affiliate_key=candidate->>'key'
        OR product_identity=candidate->>'identity' OR product_name_normalized=candidate->>'normalizedName') THEN CONTINUE; END IF;
      -- Check all review statuses, including pending and scheduled drafts.
      IF EXISTS (SELECT 1 FROM reviews WHERE
        regexp_replace(lower(product_name),'[^a-z0-9]','','g')=candidate->>'normalizedName'
        OR affiliate_url LIKE '%/go/' || (candidate->>'key') || '%'
        OR affiliate_url=candidate->>'destinationUrl') THEN CONTINUE; END IF;
      INSERT INTO affiliate_review_jobs(affiliate_key,product_identity,product_name_normalized,product,status)
        VALUES(candidate->>'key',candidate->>'identity',candidate->>'normalizedName',candidate,'researching') RETURNING * INTO job;
      EXIT;
    END LOOP;
    IF job.id IS NULL THEN RETURN jsonb_build_object('skipped','No unreviewed affiliate products are eligible.'); END IF;
  END IF;
  INSERT INTO affiliate_review_attempts(id,job_id,run_id,invocation_key) VALUES(attempt,job.id,p_run_id,p_invocation_key);
  UPDATE affiliate_review_jobs SET status='researching',product=candidate,lease_token=attempt,
    lease_expires_at=now()+interval '6 minutes',updated_at=now(),error_message=NULL,
    attempt_count=attempt_count+CASE WHEN p_retry_id IS NULL THEN 0 ELSE 1 END WHERE id=job.id RETURNING * INTO job;
  RETURN jsonb_build_object('job',to_jsonb(job),'attemptId',attempt);
END;
$$;
REVOKE ALL ON FUNCTION claim_affiliate_review(JSONB,TEXT,BIGINT,UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_affiliate_review(JSONB,TEXT,BIGINT,UUID) TO service_role;
