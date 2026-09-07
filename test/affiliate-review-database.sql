-- Run only in a disposable, empty PostgreSQL database. No production credentials.
\set ON_ERROR_STOP on
CREATE ROLE anon;
CREATE ROLE authenticated;
CREATE ROLE service_role;
CREATE TABLE profiles(id UUID PRIMARY KEY);
CREATE TABLE automation_runs(id BIGINT PRIMARY KEY);
CREATE TABLE automation_agents(
  agent_id TEXT PRIMARY KEY, name TEXT, category TEXT, risk_class TEXT, autonomy_mode TEXT,
  is_enabled BOOLEAN, requires_manual_approval BOOLEAN, schedule_cron TEXT,
  daily_run_cap INTEGER, daily_mutation_cap INTEGER, max_consecutive_failures INTEGER,
  alert_after_minutes INTEGER, rollback_strategy TEXT, config JSONB
);
CREATE TABLE reviews(id BIGSERIAL PRIMARY KEY, product_name TEXT, affiliate_url TEXT);
CREATE TABLE generation_schedule(job_type TEXT, is_active BOOLEAN);
INSERT INTO generation_schedule VALUES('review',true),('recipe',true);
\i /migration.sql

DO $$
DECLARE
  first_result JSONB;
  result JSONB;
  job_id UUID;
  product JSONB := '[{"key":"test-a","product":"Sauce A","category":"hot_sauce","identity":"asin:B012345678","normalizedName":"saucea","destinationUrl":"https://www.amazon.com/dp/B012345678","trackedUrl":"/go/test-a"}]';
BEGIN
  IF EXISTS(SELECT 1 FROM generation_schedule WHERE job_type='review' AND is_active) OR
    NOT EXISTS(SELECT 1 FROM generation_schedule WHERE job_type='recipe' AND is_active) THEN
    RAISE EXCEPTION 'Legacy schedule replacement affected the wrong jobs';
  END IF;
  IF has_table_privilege('anon','affiliate_review_jobs','SELECT') OR
     has_table_privilege('authenticated','affiliate_review_generations','SELECT') OR
     has_function_privilege('anon','claim_affiliate_review(jsonb,text,bigint,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Public access to private draft data';
  END IF;
  first_result := claim_affiliate_review(product,'cron:one',NULL,NULL);
  job_id := (first_result->'job'->>'id')::UUID;
  IF job_id IS NULL THEN RAISE EXCEPTION 'Initial claim failed'; END IF;
  result := claim_affiliate_review(product,'cron:one',NULL,NULL);
  IF result->>'skipped' NOT LIKE '%already claimed%' THEN RAISE EXCEPTION 'Duplicate delivery was not skipped'; END IF;
  result := claim_affiliate_review(product,'manual:two',NULL,NULL);
  IF result->>'skipped' NOT LIKE '%already running%' THEN RAISE EXCEPTION 'Concurrent worker was not blocked'; END IF;
  UPDATE affiliate_review_jobs SET status='awaiting_review',draft='{}',lease_token=NULL WHERE id=job_id;
  BEGIN
    PERFORM claim_affiliate_review(product,'manual:cap',NULL,NULL);
    RAISE EXCEPTION 'Draft cap failed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%daily draft cap reached%' THEN RAISE; END IF;
  END;
  UPDATE automation_agents SET daily_run_cap=6,daily_mutation_cap=3;
  result := claim_affiliate_review(product,'manual:duplicate-product',NULL,NULL);
  IF result->>'skipped' NOT LIKE '%No unreviewed%' THEN RAISE EXCEPTION 'Duplicate product was not excluded'; END IF;
  result := claim_affiliate_review('[{"key":"alias-a","product":"New display name","identity":"asin:B012345678","normalizedName":"newname","destinationUrl":"https://www.amazon.com/dp/B012345678"}]','manual:alias',NULL,NULL);
  IF result->>'skipped' NOT LIKE '%No unreviewed%' THEN RAISE EXCEPTION 'ASIN alias bypassed dedup'; END IF;
  INSERT INTO reviews(product_name,affiliate_url) VALUES('Sauce B','/go/test-b');
  result := claim_affiliate_review('[{"key":"test-b","product":"Sauce B","identity":"name:sauceb","normalizedName":"sauceb","destinationUrl":"https://shop.example/b"}]','manual:existing',NULL,NULL);
  IF result->>'skipped' NOT LIKE '%No unreviewed%' THEN RAISE EXCEPTION 'Existing review bypassed dedup'; END IF;
  INSERT INTO affiliate_review_generations(id,attempt_id,stage,model,status,input_payload)
    VALUES(gen_random_uuid(),(first_result->>'attemptId')::UUID,'research','test-model','started','{}');
  UPDATE affiliate_review_jobs SET status='researching',lease_token=(first_result->>'attemptId')::UUID,
    lease_expires_at=now()-interval '1 minute',draft=NULL WHERE id=job_id;
  result := claim_affiliate_review(product,'manual:retry',NULL,job_id);
  IF (result->'job'->>'attempt_count')::INTEGER <> 2 THEN RAISE EXCEPTION 'Timeout retry failed'; END IF;
  IF NOT EXISTS(SELECT 1 FROM affiliate_review_generations WHERE status='timed_out' AND input_tokens IS NULL) THEN
    RAISE EXCEPTION 'Lost worker usage was not preserved as unknown';
  END IF;
  UPDATE affiliate_review_jobs SET status='failed',lease_token=NULL WHERE id=job_id;
  result := claim_affiliate_review(product,'manual:retry-third',NULL,job_id);
  UPDATE affiliate_review_jobs SET status='failed',lease_token=NULL WHERE id=job_id;
  BEGIN
    PERFORM claim_affiliate_review(product,'manual:retry-fourth',NULL,job_id);
    RAISE EXCEPTION 'Retry limit failed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%below three attempts%' THEN RAISE; END IF;
  END;
  UPDATE automation_agents SET is_enabled=false;
  BEGIN
    PERFORM claim_affiliate_review(product,'manual:paused',NULL,NULL);
    RAISE EXCEPTION 'Pause failed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%not enabled%' THEN RAISE; END IF;
  END;
  UPDATE automation_agents SET is_enabled=true,daily_run_cap=3;
  BEGIN
    PERFORM claim_affiliate_review(product,'manual:attempt-cap',NULL,NULL);
    RAISE EXCEPTION 'Attempt cap failed';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM NOT LIKE '%daily attempt cap reached%' THEN RAISE; END IF;
  END;
END;
$$;
SELECT 'PASS: private grants, claim, duplicate delivery, active worker, draft cap, ASIN dedup, existing reviews, expired lease, retries, pause and attempt cap' AS result;
